const express = require('express');
const router = express.Router();
const mpesaService = require('../services/mpesaService');
const mpesaRegisterUrlsService = require('../services/mpesaRegisterUrlsService');

// Initiate M-Pesa payment
router.post('/initiate', async (req, res) => {
  try {
    const { amount, phoneNumber, packageId, packageName } = req.body;

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

    // Validate phone number
    const phoneRegex = /^(?:254|\+254|0)?([7-9]{1}[0-9]{8})$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format'
      });
    }

    const result = await mpesaService.initiateSTKPush(phoneNumber, amount, packageId, packageName);
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
router.get('/status/:packageId', async (req, res) => {
  try {
    const { packageId } = req.params;
    const { timestamp } = req.query;

    if (!timestamp) {
      return res.status(400).json({
        success: false,
        message: 'Timestamp is required'
      });
    }

    // Get the checkout request ID from the database
    const db = require('../models/db');
    const payment = await db.query(
      'SELECT checkout_request_id FROM mpesa_payments WHERE package_id = $1 AND timestamp = $2 AND status = $3',
      [packageId, timestamp, 'pending']
    );

    if (!payment || payment.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment request not found'
      });
    }

    const result = await mpesaService.checkPaymentStatus(payment[0].checkout_request_id);
    res.json(result);
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to check payment status'
    });
  }
});

// M-Pesa callback URL
router.post('/callback', async (req, res) => {
  console.log('[MPESA][CALLBACK] Callback URL hit! Body:', JSON.stringify(req.body, null, 2));
  try {
    const result = await mpesaService.handleCallback(req.body);
    res.json(result);
  } catch (error) {
    console.error('Callback error:', error);
    // Still return 200 to acknowledge receipt of callback
    res.json({ success: false, message: error.message });
  }
});

// Register C2B URLs
router.post('/register-c2b-urls', async (req, res) => {
  try {
    const result = await mpesaRegisterUrlsService.registerC2BUrls();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 