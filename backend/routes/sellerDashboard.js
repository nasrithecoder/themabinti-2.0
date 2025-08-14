const express = require('express');
const jwt = require('jsonwebtoken');
const PostgresModels = require('../models/PostgresModels');
const router = express.Router();

// Authentication middleware
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    const user = await PostgresModels.getUserById(decoded.userId);
    
    if (!user || user.account_type !== 'seller') {
      return res.status(403).json({ message: 'Seller access required' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Seller auth error:', err);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Get seller dashboard analytics
router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get basic analytics
    const analytics = await PostgresModels.getSellerAnalytics(userId);
    
    // Get detailed service performance
    const servicePerformance = await PostgresModels.query(`
      SELECT 
        s.id,
        s.name,
        s.view_count,
        s.booking_count,
        s.created_at,
        COUNT(a.id) as appointment_count,
        COUNT(CASE WHEN a.status = 'confirmed' THEN 1 END) as confirmed_appointments,
        COALESCE(SUM(sb.booking_amount), 0) as total_earnings
      FROM services s
      LEFT JOIN appointments a ON s.id = a.service_id
      LEFT JOIN service_bookings sb ON s.id = sb.service_id AND sb.status = 'completed'
      WHERE s.user_id = $1
      GROUP BY s.id, s.name, s.view_count, s.booking_count, s.created_at
      ORDER BY s.created_at DESC
    `, [userId]);

    // Get monthly performance data
    const monthlyData = await PostgresModels.query(`
      SELECT 
        DATE_TRUNC('month', sv.viewed_at) as month,
        COUNT(sv.id) as views,
        COUNT(DISTINCT sv.service_id) as services_viewed
      FROM service_views sv
      JOIN services s ON sv.service_id = s.id
      WHERE s.user_id = $1 AND sv.viewed_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', sv.viewed_at)
      ORDER BY month DESC
    `, [userId]);

    // Get recent appointments
    const recentAppointments = await PostgresModels.query(`
      SELECT 
        a.*,
        s.name as service_name
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      WHERE s.user_id = $1
      ORDER BY a.created_at DESC
      LIMIT 10
    `, [userId]);

    res.json({
      analytics,
      servicePerformance,
      monthlyData,
      recentAppointments
    });
  } catch (err) {
    console.error('[SELLER] Analytics error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get seller services with detailed stats
router.get('/services', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const baseQuery = `
      SELECT 
        s.*,
        COUNT(a.id) as appointment_count,
        COUNT(CASE WHEN a.status = 'confirmed' THEN 1 END) as confirmed_appointments,
        COALESCE(SUM(sb.booking_amount), 0) as total_earnings
      FROM services s
      LEFT JOIN appointments a ON s.id = a.service_id
      LEFT JOIN service_bookings sb ON s.id = sb.service_id AND sb.status = 'completed'
      WHERE s.user_id = $1
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `;
    const countQuery = 'SELECT COUNT(*) as count FROM services WHERE user_id = $1';
    
    const result = await PostgresModels.getPaginatedResults(baseQuery, countQuery, [userId], page, limit);
    
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
      appointmentCount: parseInt(service.appointment_count),
      confirmedAppointments: parseInt(service.confirmed_appointments),
      totalEarnings: parseFloat(service.total_earnings),
      createdAt: service.created_at
    }));

    res.json({
      services: formattedServices,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages
    });
  } catch (err) {
    console.error('[SELLER] Get services error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get seller appointments
router.get('/appointments', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const baseQuery = `
      SELECT 
        a.*,
        s.name as service_name,
        s.location as service_location
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      WHERE s.user_id = $1
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `;
    const countQuery = `
      SELECT COUNT(*) as count 
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      WHERE s.user_id = $1
    `;
    
    const result = await PostgresModels.getPaginatedResults(baseQuery, countQuery, [userId], page, limit);
    
    res.json({
      appointments: result.data,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages
    });
  } catch (err) {
    console.error('[SELLER] Get appointments error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get seller earnings
router.get('/earnings', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get total earnings
    const totalEarnings = await PostgresModels.query(`
      SELECT 
        COALESCE(SUM(sb.booking_amount), 0) as total_earnings,
        COALESCE(SUM(sb.commission_amount), 0) as total_commission,
        COUNT(sb.id) as total_bookings
      FROM service_bookings sb
      JOIN services s ON sb.service_id = s.id
      WHERE s.user_id = $1 AND sb.status = 'completed'
    `, [userId]);

    // Get monthly earnings
    const monthlyEarnings = await PostgresModels.query(`
      SELECT 
        DATE_TRUNC('month', sb.created_at) as month,
        COALESCE(SUM(sb.booking_amount), 0) as earnings,
        COALESCE(SUM(sb.commission_amount), 0) as commission,
        COUNT(sb.id) as bookings
      FROM service_bookings sb
      JOIN services s ON sb.service_id = s.id
      WHERE s.user_id = $1 AND sb.status = 'completed' AND sb.created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', sb.created_at)
      ORDER BY month DESC
    `, [userId]);

    // Get earnings by service
    const serviceEarnings = await PostgresModels.query(`
      SELECT 
        s.id,
        s.name,
        COALESCE(SUM(sb.booking_amount), 0) as earnings,
        COUNT(sb.id) as bookings
      FROM services s
      LEFT JOIN service_bookings sb ON s.id = sb.service_id AND sb.status = 'completed'
      WHERE s.user_id = $1
      GROUP BY s.id, s.name
      ORDER BY earnings DESC
    `, [userId]);

    res.json({
      totalEarnings: totalEarnings[0],
      monthlyEarnings,
      serviceEarnings
    });
  } catch (err) {
    console.error('[SELLER] Get earnings error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update appointment status (seller can update their service appointments)
router.patch('/appointments/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Check if seller owns the service for this appointment
    const appointment = await PostgresModels.query(`
      SELECT a.*, s.user_id as service_owner_id
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      WHERE a.id = $1 AND s.user_id = $2
    `, [id, userId]);

    if (!appointment[0]) {
      return res.status(404).json({ message: 'Appointment not found or unauthorized' });
    }

    await PostgresModels.query(
      'UPDATE appointments SET status = $1, updated_at = now() WHERE id = $2',
      [status, id]
    );

    res.json({ message: 'Appointment status updated successfully' });
  } catch (err) {
    console.error('[SELLER] Update appointment status error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;