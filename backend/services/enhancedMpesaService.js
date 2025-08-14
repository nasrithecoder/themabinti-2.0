const axios = require('axios');
const crypto = require('crypto');
const PostgresModels = require('../models/PostgresModels');

class EnhancedMpesaService {
  constructor() {
    this.consumerKey = process.env.MPESA_CONSUMER_KEY;
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    this.passkey = process.env.MPESA_PASSKEY;
    this.shortcode = process.env.MPESA_SHORTCODE;
    this.env = process.env.NODE_ENV === 'production' ? 'production' : 'sandbox';
    this.baseUrl = this.env === 'production' 
      ? 'https://api.safaricom.co.ke' 
      : 'https://sandbox.safaricom.co.ke';

    // Token cache
    this._accessToken = null;
    this._accessTokenExpiry = null;

    console.log('[MPESA] Enhanced M-Pesa Service initialized');
    console.log(`[MPESA] Environment: ${this.env}`);
    console.log(`[MPESA] Base URL: ${this.baseUrl}`);
  }

  // Generate access token with caching
  async getAccessToken() {
    const now = Date.now();
    if (this._accessToken && this._accessTokenExpiry && now < this._accessTokenExpiry) {
      return this._accessToken;
    }

    try {
      const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
      const response = await axios.get(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        headers: { Authorization: `Basic ${auth}` }
      });

      this._accessToken = response.data.access_token;
      this._accessTokenExpiry = now + 3600 * 1000; // 1 hour
      
      console.log('[MPESA] New access token generated');
      return this._accessToken;
    } catch (error) {
      console.error('[MPESA] Error getting access token:', error.response?.data || error.message);
      throw new Error('Failed to get M-Pesa access token');
    }
  }

  // Format phone number to 254XXXXXXXXX
  formatPhoneNumber(phoneNumber) {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Handle different formats
    if (cleaned.startsWith('254')) {
      return cleaned;
    } else if (cleaned.startsWith('0')) {
      return '254' + cleaned.substring(1);
    } else if (cleaned.length === 9) {
      return '254' + cleaned;
    } else {
      throw new Error('Invalid phone number format');
    }
  }

  // Validate phone number
  validatePhoneNumber(phoneNumber) {
    const formatted = this.formatPhoneNumber(phoneNumber);
    const phoneRegex = /^254[7-9]\d{8}$/;
    
    if (!phoneRegex.test(formatted)) {
      throw new Error('Invalid Kenyan phone number');
    }
    
    return formatted;
  }

  // Generate timestamp
  getTimestamp() {
    const date = new Date();
    return date.getFullYear() +
           String(date.getMonth() + 1).padStart(2, '0') +
           String(date.getDate()).padStart(2, '0') +
           String(date.getHours()).padStart(2, '0') +
           String(date.getMinutes()).padStart(2, '0') +
           String(date.getSeconds()).padStart(2, '0');
  }

  // Generate password
  generatePassword() {
    const timestamp = this.getTimestamp();
    const str = this.shortcode + this.passkey + timestamp;
    return Buffer.from(str).toString('base64');
  }

  // Initiate STK Push for seller registration/upgrade
  async initiateSellerPayment(phoneNumber, amount, packageId, packageName, userId = null) {
    console.log(`[MPESA] Initiating seller payment: ${amount} for ${packageName}`);
    
    try {
      const accessToken = await this.getAccessToken();
      const formattedPhone = this.validatePhoneNumber(phoneNumber);
      const timestamp = this.getTimestamp();
      const password = this.generatePassword();

      const payload = {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerBuyGoodsOnline",
        Amount: amount,
        PartyA: formattedPhone,
        PartyB: this.shortcode,
        PhoneNumber: formattedPhone,
        CallBackURL: `${process.env.BASE_URL}/api/mpesa/callback`,
        AccountReference: `PKG-${packageId}`,
        TransactionDesc: `Payment for ${packageName} package`
      };

      console.log('[MPESA] STK Push payload:', JSON.stringify(payload, null, 2));

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const checkoutRequestId = response.data.CheckoutRequestID;
      
      if (checkoutRequestId) {
        // Store payment record
        await PostgresModels.createPayment({
          checkoutRequestId,
          userId,
          paymentType: userId ? 'package_upgrade' : 'seller_registration',
          packageId,
          amount,
          phoneNumber: formattedPhone,
          timestamp
        });

        console.log(`[MPESA] Payment record created with ID: ${checkoutRequestId}`);
      }

      return {
        success: true,
        checkoutRequestId,
        message: 'STK Push initiated successfully'
      };
    } catch (error) {
      console.error('[MPESA] STK Push error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.errorMessage || 'Failed to initiate payment');
    }
  }

  // Initiate STK Push for service booking
  async initiateServiceBooking(phoneNumber, amount, serviceId, appointmentId, userId = null) {
    console.log(`[MPESA] Initiating service booking payment: ${amount} for service ${serviceId}`);
    
    try {
      const accessToken = await this.getAccessToken();
      const formattedPhone = this.validatePhoneNumber(phoneNumber);
      const timestamp = this.getTimestamp();
      const password = this.generatePassword();

      const payload = {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerBuyGoodsOnline",
        Amount: amount,
        PartyA: formattedPhone,
        PartyB: this.shortcode,
        PhoneNumber: formattedPhone,
        CallBackURL: `${process.env.BASE_URL}/api/mpesa/callback`,
        AccountReference: `SVC-${serviceId}`,
        TransactionDesc: `Service booking payment`
      };

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const checkoutRequestId = response.data.CheckoutRequestID;
      
      if (checkoutRequestId) {
        // Store payment record
        await PostgresModels.createPayment({
          checkoutRequestId,
          userId,
          appointmentId,
          paymentType: 'service_booking',
          packageId: serviceId,
          amount,
          phoneNumber: formattedPhone,
          timestamp
        });
      }

      return {
        success: true,
        checkoutRequestId,
        message: 'Service booking payment initiated'
      };
    } catch (error) {
      console.error('[MPESA] Service booking payment error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.errorMessage || 'Failed to initiate service booking payment');
    }
  }

  // Enhanced callback handler
  async handleCallback(callbackData) {
    console.log('[MPESA] Processing callback:', JSON.stringify(callbackData, null, 2));
    
    try {
      const { Body: { stkCallback } } = callbackData;
      const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

      console.log(`[MPESA] Callback - CheckoutRequestID: ${CheckoutRequestID}, ResultCode: ${ResultCode}`);

      let status = 'failed';
      let transactionData = {};

      if (ResultCode === 0 && CallbackMetadata) {
        status = 'success';
        
        // Extract transaction details
        const metadata = CallbackMetadata.Item;
        transactionData = {
          mpesaReceiptNumber: metadata.find(item => item.Name === 'MpesaReceiptNumber')?.Value,
          transactionDate: metadata.find(item => item.Name === 'TransactionDate')?.Value,
          amount: metadata.find(item => item.Name === 'Amount')?.Value,
          phoneNumber: metadata.find(item => item.Name === 'PhoneNumber')?.Value
        };

        console.log('[MPESA] Transaction successful:', transactionData);
      } else {
        console.log(`[MPESA] Transaction failed - ResultCode: ${ResultCode}, ResultDesc: ${ResultDesc}`);
      }

      // Update payment status
      const payment = await PostgresModels.updatePaymentStatus(CheckoutRequestID, status, transactionData);
      
      if (payment && status === 'success') {
        // Handle successful payment based on type
        await this.handleSuccessfulPayment(payment);
      }

      return { success: true, status };
    } catch (error) {
      console.error('[MPESA] Callback processing error:', error);
      throw new Error('Failed to process callback');
    }
  }

  // Handle successful payment actions
  async handleSuccessfulPayment(payment) {
    try {
      if (payment.payment_type === 'seller_registration') {
        console.log('[MPESA] Processing seller registration payment');
        // Registration completion is handled in the auth route
      } else if (payment.payment_type === 'package_upgrade') {
        console.log('[MPESA] Processing package upgrade payment');
        // Package upgrade completion is handled in the auth route
      } else if (payment.payment_type === 'service_booking') {
        console.log('[MPESA] Processing service booking payment');
        
        // Update appointment payment status
        if (payment.appointment_id) {
          await PostgresModels.query(
            'UPDATE appointments SET payment_status = $1 WHERE id = $2',
            ['paid', payment.appointment_id]
          );
        }

        // Create service booking record
        const serviceBooking = {
          serviceId: payment.package_id, // package_id stores service_id for bookings
          userId: payment.user_id,
          appointmentId: payment.appointment_id,
          paymentId: payment.id,
          bookingAmount: payment.amount,
          status: 'confirmed'
        };

        await PostgresModels.query(`
          INSERT INTO service_bookings (service_id, user_id, appointment_id, payment_id, booking_amount, status)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          serviceBooking.serviceId,
          serviceBooking.userId,
          serviceBooking.appointmentId,
          serviceBooking.paymentId,
          serviceBooking.bookingAmount,
          serviceBooking.status
        ]);
      }
    } catch (error) {
      console.error('[MPESA] Error handling successful payment:', error);
    }
  }

  // Check payment status
  async checkPaymentStatus(checkoutRequestId) {
    try {
      const accessToken = await this.getAccessToken();
      const timestamp = this.getTimestamp();
      const password = this.generatePassword();

      const payload = {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId
      };

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpushquery/v1/query`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const resultCode = response.data.ResultCode;
      let status = 'pending';

      if (resultCode === 0) {
        status = 'success';
      } else if (resultCode === 1032) {
        status = 'failed';
      }

      // Update local payment status
      await PostgresModels.updatePaymentStatus(checkoutRequestId, status);

      return { status, resultCode };
    } catch (error) {
      console.error('[MPESA] Payment status check error:', error.response?.data || error.message);
      throw new Error('Failed to check payment status');
    }
  }

  // Get payment by checkout request ID
  async getPaymentByCheckoutId(checkoutRequestId) {
    return await PostgresModels.getPaymentByCheckoutId(checkoutRequestId);
  }

  // Get all payments with pagination
  async getAllPayments(page = 1, limit = 20) {
    const baseQuery = 'SELECT * FROM payments ORDER BY created_at DESC';
    const countQuery = 'SELECT COUNT(*) as count FROM payments';
    
    return await PostgresModels.getPaginatedResults(baseQuery, countQuery, [], page, limit);
  }

  // Get user payments
  async getUserPayments(userId, page = 1, limit = 20) {
    const baseQuery = 'SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC';
    const countQuery = 'SELECT COUNT(*) as count FROM payments WHERE user_id = $1';
    
    return await PostgresModels.getPaginatedResults(baseQuery, countQuery, [userId], page, limit);
  }

  // Get revenue analytics
  async getRevenueAnalytics(startDate = null, endDate = null) {
    let query = `
      SELECT 
        DATE_TRUNC('day', created_at) as date,
        COUNT(*) as transaction_count,
        SUM(amount) as total_amount,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_count,
        SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END) as successful_amount
      FROM payments
    `;
    
    const params = [];
    if (startDate && endDate) {
      query += ' WHERE created_at BETWEEN $1 AND $2';
      params.push(startDate, endDate);
    }
    
    query += ' GROUP BY DATE_TRUNC(\'day\', created_at) ORDER BY date DESC';
    
    const result = await PostgresModels.query(query, params);
    return result;
  }
}

module.exports = new EnhancedMpesaService();