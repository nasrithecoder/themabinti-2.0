const express = require('express');
const enhancedMpesaService = require('../services/enhancedMpesaService');
const router = express.Router();

// Initiate M-Pesa payment
router.post('/initiate', async (req, res) => {
  try {
    const { amount, phoneNumber, packageId, packageName, paymentType = 'seller_registration' } = req.body;

    // Validate required fields
    if (!amount || !phoneNumber || !packageId || !packageName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate amount
    if (amount < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    let result;
    if (paymentType === 'service_booking') {
      const { serviceId, appointmentId, userId } = req.body;
      result = await enhancedMpesaService.initiateServiceBooking(
        phoneNumber, 
        amount, 
        serviceId, 
        appointmentId, 
        userId
      );
    } else {
      result = await enhancedMpesaService.initiateSellerPayment(
        phoneNumber, 
        amount, 
        packageId, 
        packageName
      );
    }

    res.json(result);
  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to initiate payment'
    });
  }
});

// Check payment status
router.get('/status/:checkoutRequestId', async (req, res) => {
  try {
    const { checkoutRequestId } = req.params;
    const payment = await enhancedMpesaService.getPaymentByCheckoutId(checkoutRequestId);
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json({
      status: payment.status,
      amount: payment.amount,
      packageId: payment.package_id,
      paymentType: payment.payment_type,
      createdAt: payment.created_at
    });
  } catch (err) {
    console.error('Payment status error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// M-Pesa callback URL
router.post('/callback', async (req, res) => {
  console.log('[MPESA] Callback received:', JSON.stringify(req.body, null, 2));
  
  try {
    const result = await enhancedMpesaService.handleCallback(req.body);
    res.json(result);
  } catch (error) {
    console.error('[MPESA] Callback error:', error);
    // Still return 200 to acknowledge receipt
    res.json({ success: false, message: error.message });
  }
});

// Get payment history
router.get('/payments/history', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const userId = req.query.userId;

    let result;
    if (userId) {
      result = await enhancedMpesaService.getUserPayments(userId, page, limit);
    } else {
      result = await enhancedMpesaService.getAllPayments(page, limit);
    }

    res.json(result);
  } catch (error) {
    console.error('Payment history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get revenue analytics
router.get('/analytics/revenue', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const analytics = await enhancedMpesaService.getRevenueAnalytics(startDate, endDate);
    res.json(analytics);
  } catch (error) {
    console.error('Revenue analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;