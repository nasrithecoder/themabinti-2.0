const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Service = require('../models/Service');
const Appointment = require('../models/Appointment');
const Contact = require('../models/Contact');
const mpesaService = require('../services/mpesaService');
const router = express.Router();

// Admin authentication middleware
const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    const admin = await Admin.findById(decoded.adminId);
    
    if (!admin) {
      return res.status(401).json({ message: 'Admin not found' });
    }

    req.admin = admin;
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
    // Check if admin exists
    let admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate JWT
    const token = jwt.sign(
      { adminId: admin._id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '8h' }
    );

    res.json({
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        role: admin.role,
        lastLogin: admin.lastLogin
      }
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create initial admin (run once)
router.post('/create-initial', async (req, res) => {
  try {
    const adminCount = await Admin.countDocuments();
    if (adminCount > 0) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const admin = new Admin({
      email,
      password: hashedPassword,
      role: 'super_admin'
    });

    await admin.save();
    res.status(201).json({ message: 'Initial admin created successfully' });
  } catch (err) {
    console.error('Create admin error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Dashboard stats
router.get('/dashboard/stats', adminAuth, async (req, res) => {
  try {
    const [
      totalUsers,
      totalSellers,
      totalServices,
      totalAppointments,
      pendingAppointments,
      totalContacts,
      paymentsData
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ accountType: 'seller' }),
      Service.countDocuments(),
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: 'pending' }),
      Contact.countDocuments(),
      mpesaService.getAllPayments(1, 1000) // Get all payments for stats
    ]);

    const totalPayments = paymentsData.total;
    const successfulPayments = paymentsData.payments.filter(p => p.status === 'success').length;
    const totalRevenue = paymentsData.payments
      .filter(p => p.status === 'success')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    res.json({
      totalUsers,
      totalSellers,
      totalServices,
      totalAppointments,
      pendingAppointments,
      totalContacts,
      totalPayments,
      successfulPayments,
      totalRevenue
    });
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
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments();

    res.json({
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit)
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
    const skip = (page - 1) * limit;

    const services = await Service.find()
      .populate('userId', 'userName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Service.countDocuments();

    res.json({
      services,
      total,
      page,
      totalPages: Math.ceil(total / limit)
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
    const skip = (page - 1) * limit;

    const appointments = await Appointment.find()
      .populate('serviceId', 'name')
      .populate('userId', 'userName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Appointment.countDocuments();

    res.json({
      appointments,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error('Get appointments error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all payments
router.get('/payments', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const paymentsData = await mpesaService.getAllPayments(page, limit);
    res.json(paymentsData);
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
    const skip = (page - 1) * limit;

    const contacts = await Contact.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Contact.countDocuments();

    res.json({
      contacts,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error('Get contacts error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update appointment status
router.patch('/appointments/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('serviceId', 'name').populate('userId', 'userName email');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json(appointment);
  } catch (err) {
    console.error('Update appointment error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete service
router.delete('/services/:id', adminAuth, async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.json({ message: 'Service deleted successfully' });
  } catch (err) {
    console.error('Delete service error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Also delete user's services
    await Service.deleteMany({ userId: req.params.id });
    
    res.json({ message: 'User and associated services deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;