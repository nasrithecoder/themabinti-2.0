const express = require('express');
const PostgresModels = require('../models/PostgresModels');
const enhancedMpesaService = require('../services/enhancedMpesaService');
const router = express.Router();

// Authentication middleware
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    const user = await PostgresModels.getUserById(decoded.userId);
    req.user = user;
    next();
  } catch (err) {
    req.user = null;
    next();
  }
};

// Create appointment
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { 
      serviceId, 
      name, 
      email, 
      phone,
      date, 
      time, 
      message,
      paymentRequired = false,
      paymentAmount = 0
    } = req.body;

    // Validate required fields
    if (!name || !email || !date || !time) {
      return res.status(400).json({ message: 'Name, email, date, and time are required' });
    }

    // If serviceId is provided, validate service exists
    if (serviceId) {
      const service = await PostgresModels.getServiceById(serviceId);
      if (!service) {
        return res.status(404).json({ message: 'Service not found' });
      }
    }

    const appointmentData = {
      serviceId: serviceId || null,
      userId: req.user?.id || null,
      bookingType: serviceId ? 'service' : 'general',
      clientName: name,
      clientEmail: email,
      clientPhone: phone,
      appointmentDate: date,
      appointmentTime: time,
      message: message || null,
      paymentRequired,
      paymentAmount: paymentRequired ? paymentAmount : null
    };

    const appointment = await PostgresModels.createAppointment(appointmentData);

    // If payment is required, initiate M-Pesa payment
    if (paymentRequired && paymentAmount > 0) {
      try {
        const paymentResult = await enhancedMpesaService.initiateServiceBooking(
          phone,
          paymentAmount,
          serviceId,
          appointment.id,
          req.user?.id
        );

        return res.status(202).json({
          message: 'Appointment created. Please complete payment to confirm.',
          appointment,
          paymentInitiated: true,
          checkoutRequestId: paymentResult.checkoutRequestId
        });
      } catch (paymentError) {
        console.error('[APPOINTMENTS] Payment initiation error:', paymentError);
        return res.status(400).json({ 
          message: 'Appointment created but payment initiation failed',
          appointment
        });
      }
    }

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment
    });
  } catch (error) {
    console.error('[APPOINTMENTS] Create appointment error:', error);
    res.status(500).json({ message: 'Error booking appointment', error: error.message });
  }
});

// Get user appointments
router.get('/my-appointments', authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const appointments = await PostgresModels.getUserAppointments(req.user.id);
    res.json(appointments);
  } catch (error) {
    console.error('[APPOINTMENTS] Get user appointments error:', error);
    res.status(500).json({ message: 'Error fetching appointments', error: error.message });
  }
});

// Get service appointments (for service owners)
router.get('/service/:serviceId', authMiddleware, async (req, res) => {
  try {
    const { serviceId } = req.params;
    
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Check if user owns the service
    const service = await PostgresModels.getServiceById(serviceId);
    if (!service || service.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to view these appointments' });
    }

    const appointments = await PostgresModels.getServiceAppointments(serviceId);
    res.json(appointments);
  } catch (error) {
    console.error('[APPOINTMENTS] Get service appointments error:', error);
    res.status(500).json({ message: 'Error fetching appointments', error: error.message });
  }
});

// Update appointment status
router.patch('/:appointmentId/status', authMiddleware, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status } = req.body;
    
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Get appointment and check authorization
    const appointment = await PostgresModels.query(
      'SELECT a.*, s.user_id as service_owner_id FROM appointments a LEFT JOIN services s ON a.service_id = s.id WHERE a.id = $1',
      [appointmentId]
    );

    if (!appointment[0]) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const apt = appointment[0];
    
    // Check if user can update this appointment
    const canUpdate = apt.user_id === req.user.id || // appointment owner
                     apt.service_owner_id === req.user.id; // service owner

    if (!canUpdate) {
      return res.status(403).json({ message: 'Unauthorized to update this appointment' });
    }

    await PostgresModels.query(
      'UPDATE appointments SET status = $1, updated_at = now() WHERE id = $2',
      [status, appointmentId]
    );

    res.json({ message: 'Appointment status updated successfully' });
  } catch (error) {
    console.error('[APPOINTMENTS] Update status error:', error);
    res.status(500).json({ message: 'Error updating appointment', error: error.message });
  }
});

// Complete appointment payment
router.post('/complete-payment', authMiddleware, async (req, res) => {
  try {
    const { appointmentId, checkoutRequestId } = req.body;
    
    // Check payment status
    const payment = await PostgresModels.getPaymentByCheckoutId(checkoutRequestId);
    if (!payment || payment.status !== 'success') {
      return res.status(400).json({ message: 'Payment not completed or failed' });
    }

    // Update appointment status
    await PostgresModels.query(
      'UPDATE appointments SET status = $1, payment_status = $2, updated_at = now() WHERE id = $3',
      ['confirmed', 'paid', appointmentId]
    );

    res.json({ message: 'Appointment payment completed successfully' });
  } catch (error) {
    console.error('[APPOINTMENTS] Complete payment error:', error);
    res.status(500).json({ message: 'Error completing payment', error: error.message });
  }
});

module.exports = router;