const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const PostgresModels = require('../models/PostgresModels');
const router = express.Router();

// Admin authentication middleware
const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    const admin = await PostgresModels.query(
      'SELECT * FROM admins WHERE id = $1 AND is_active = true',
      [decoded.adminId]
    );
    
    if (!admin[0]) {
      return res.status(401).json({ message: 'Admin not found' });
    }

    req.admin = admin[0];
    next();
  } catch (err) {
    console.error('Admin auth error:', err);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Admin login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await PostgresModels.query(
      'SELECT * FROM admins WHERE email = $1 AND is_active = true',
      [email]
    );

    if (!admin[0]) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Update last login
    await PostgresModels.query(
      'UPDATE admins SET last_login = now() WHERE id = $1',
      [admin[0].id]
    );

    // Generate JWT
    const token = jwt.sign(
      { adminId: admin[0].id, email: admin[0].email, role: admin[0].role },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '8h' }
    );

    res.json({
      token,
      admin: {
        id: admin[0].id,
        email: admin[0].email,
        role: admin[0].role,
        lastLogin: admin[0].last_login
      }
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create initial admin
router.post('/create-initial', async (req, res) => {
  try {
    const adminCount = await PostgresModels.query('SELECT COUNT(*) as count FROM admins');
    if (parseInt(adminCount[0].count) > 0) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await PostgresModels.query(
      'INSERT INTO admins (email, password_hash, role) VALUES ($1, $2, $3)',
      [email, hashedPassword, 'super_admin']
    );

    res.status(201).json({ message: 'Initial admin created successfully' });
  } catch (err) {
    console.error('Create admin error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Dashboard stats
router.get('/dashboard/stats', adminAuth, async (req, res) => {
  try {
    const stats = await PostgresModels.getDashboardStats();
    res.json(stats);
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users with pagination
router.get('/users', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const baseQuery = 'SELECT * FROM users ORDER BY created_at DESC';
    const countQuery = 'SELECT COUNT(*) as count FROM users';
    
    const result = await PostgresModels.getPaginatedResults(baseQuery, countQuery, [], page, limit);
    
    // Format users for frontend
    const formattedUsers = result.data.map(user => ({
      _id: user.id,
      userName: user.user_name,
      email: user.email,
      phoneNumber: user.phone_number,
      accountType: user.account_type,
      sellerPackage: user.account_type === 'seller' ? {
        packageId: user.seller_package_id,
        photoUploads: user.photo_uploads_limit,
        videoUploads: user.video_uploads_limit,
        expiresAt: user.package_expires_at
      } : null,
      isActive: user.is_active,
      createdAt: user.created_at
    }));

    res.json({
      users: formattedUsers,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages
    });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all services with pagination
router.get('/services', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const baseQuery = `
      SELECT s.*, u.user_name as provider_name, u.email as provider_email
      FROM services s 
      JOIN users u ON s.user_id = u.id 
      ORDER BY s.created_at DESC
    `;
    const countQuery = 'SELECT COUNT(*) as count FROM services';
    
    const result = await PostgresModels.getPaginatedResults(baseQuery, countQuery, [], page, limit);
    
    // Format services for frontend
    const formattedServices = result.data.map(service => ({
      _id: service.id,
      name: service.name,
      description: service.description,
      minPrice: parseFloat(service.min_price),
      maxPrice: parseFloat(service.max_price),
      location: service.location,
      phoneNumber: service.phone_number,
      category: service.category,
      subcategory: service.subcategory,
      media: JSON.parse(service.media || '[]'),
      viewCount: service.view_count,
      bookingCount: service.booking_count,
      isActive: service.is_active,
      userId: {
        userName: service.provider_name,
        email: service.provider_email
      },
      createdAt: service.created_at
    }));

    res.json({
      services: formattedServices,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages
    });
  } catch (err) {
    console.error('Get services error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all appointments with pagination
router.get('/appointments', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const baseQuery = `
      SELECT a.*, s.name as service_name, u.user_name as client_name
      FROM appointments a
      LEFT JOIN services s ON a.service_id = s.id
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
    `;
    const countQuery = 'SELECT COUNT(*) as count FROM appointments';
    
    const result = await PostgresModels.getPaginatedResults(baseQuery, countQuery, [], page, limit);
    
    // Format appointments for frontend
    const formattedAppointments = result.data.map(appointment => ({
      _id: appointment.id,
      serviceId: appointment.service_id,
      userId: appointment.user_id,
      bookingType: appointment.booking_type,
      name: appointment.client_name,
      email: appointment.client_email,
      phone: appointment.client_phone,
      date: appointment.appointment_date,
      time: appointment.appointment_time,
      message: appointment.message,
      status: appointment.status,
      paymentRequired: appointment.payment_required,
      paymentAmount: appointment.payment_amount,
      paymentStatus: appointment.payment_status,
      serviceName: appointment.service_name,
      clientName: appointment.client_name,
      createdAt: appointment.created_at
    }));

    res.json({
      appointments: formattedAppointments,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages
    });
  } catch (err) {
    console.error('Get appointments error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all payments with pagination
router.get('/payments', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await enhancedMpesaService.getAllPayments(page, limit);
    res.json(result);
  } catch (err) {
    console.error('Get payments error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all contacts with pagination
router.get('/contacts', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const baseQuery = 'SELECT * FROM contacts ORDER BY created_at DESC';
    const countQuery = 'SELECT COUNT(*) as count FROM contacts';
    
    const result = await PostgresModels.getPaginatedResults(baseQuery, countQuery, [], page, limit);
    
    // Format contacts for frontend
    const formattedContacts = result.data.map(contact => ({
      _id: contact.id,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      subject: contact.subject,
      message: contact.message,
      status: contact.status,
      createdAt: contact.created_at
    }));

    res.json({
      contacts: formattedContacts,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages
    });
  } catch (err) {
    console.error('Get contacts error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Revenue analytics
router.get('/analytics/revenue', adminAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const analytics = await enhancedMpesaService.getRevenueAnalytics(startDate, endDate);
    res.json(analytics);
  } catch (err) {
    console.error('Revenue analytics error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update appointment status
router.patch('/appointments/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    
    await PostgresModels.query(
      'UPDATE appointments SET status = $1, updated_at = now() WHERE id = $2',
      [status, req.params.id]
    );

    res.json({ message: 'Appointment status updated successfully' });
  } catch (err) {
    console.error('Update appointment error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete service
router.delete('/services/:id', adminAuth, async (req, res) => {
  try {
    await PostgresModels.query('DELETE FROM services WHERE id = $1', [req.params.id]);
    res.json({ message: 'Service deleted successfully' });
  } catch (err) {
    console.error('Delete service error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    // Delete user (services will be deleted due to CASCADE)
    await PostgresModels.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ message: 'User and associated services deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;