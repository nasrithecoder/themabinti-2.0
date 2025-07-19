const axios = require('axios');
const crypto = require('crypto');
const db = require('../models/db');

class MpesaService {
  constructor() {
    this.consumerKey = process.env.MPESA_CONSUMER_KEY;
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    this.passkey = process.env.MPESA_PASSKEY;
    this.shortcode = process.env.MPESA_SHORTCODE;
    this.env = process.env.NODE_ENV === 'production' ? 'production' : 'sandbox';
    this.baseUrl = this.env === 'production' 
      ? 'https://api.safaricom.co.ke' 
      : 'https://sandbox.safaricom.co.ke';
    // --- SANDBOX TESTING: In-memory token cache (resets on server restart) ---
    this._accessToken = null;
    this._accessTokenExpiry = null;
  }

  // Generate access token (with in-memory caching for 1 hour)
  async getAccessToken() {
    const now = Date.now();
    if (this._accessToken && this._accessTokenExpiry && now < this._accessTokenExpiry) {
      // Return cached token
      return this._accessToken;
    }
    try {
      const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
      const response = await axios.get(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        headers: {
          Authorization: `Basic ${auth}`
        }
      });
      const token = response.data.access_token;
      // Debug: Log the token value in sandbox only
      if (this.env === 'sandbox') {
        if (token) {
          console.log('[MPESA][SANDBOX] Received access token:', token);
        } else {
          console.log('[MPESA][SANDBOX] No access token received! Raw response:', response.data);
        }
      }
      // Cache token for 1 hour (3600 seconds)
      this._accessToken = token;
      this._accessTokenExpiry = now + 3600 * 1000;
      return token;
    } catch (error) {
      // Improved error logging
      if (error.response) {
        console.error('Error getting access token:', error.response.status, error.response.data);
      } else {
        console.error('Error getting access token:', error.message || error);
      }
      throw new Error('Failed to get M-Pesa access token');
    }
  }

  // Generate timestamp
  getTimestamp() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hour}${minute}${second}`;
  }

  // Generate password
  generatePassword() {
    const timestamp = this.getTimestamp();
    const str = this.shortcode + this.passkey + timestamp;
    return Buffer.from(str).toString('base64');
  }

  // Initiate STK Push
  async initiateSTKPush(phoneNumber, amount, packageId, packageName) {
    try {
      const accessToken = await this.getAccessToken();
      const timestamp = this.getTimestamp();
      const password = this.generatePassword();

      // Format phone number (ensure it starts with 254)
      const formattedPhone = phoneNumber.startsWith('254') ? phoneNumber : `254${phoneNumber.replace(/^0/, '')}`;

      const payload = {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: formattedPhone,
        PartyB: this.shortcode,
        PhoneNumber: formattedPhone,
        CallBackURL: `${process.env.BASE_URL}/api/mpesa/callback`,
        AccountReference: `PKG-${packageId}`,
        TransactionDesc: `Payment for ${packageName} package`
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

      // Store the checkout request ID for status checking
      const checkoutRequestId = response.data.CheckoutRequestID;
      await this.storePaymentRequest(checkoutRequestId, {
        packageId,
        amount,
        phoneNumber: formattedPhone,
        timestamp,
        status: 'pending'
      });

      return {
        success: true,
        checkoutRequestId,
        message: 'STK Push initiated successfully'
      };
    } catch (error) {
      console.error('STK Push initiation error:', error.response?.data || error);
      throw new Error(error.response?.data?.errorMessage || 'Failed to initiate payment');
    }
  }

  // Store payment request in database
  async storePaymentRequest(checkoutRequestId, paymentData) {
    try {
      const query = `
        INSERT INTO mpesa_payments 
        (checkout_request_id, package_id, amount, phone_number, timestamp, status, user_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      await db.query(query, [
        checkoutRequestId,
        paymentData.packageId,
        paymentData.amount,
        paymentData.phoneNumber,
        paymentData.timestamp,
        paymentData.status,
        paymentData.userId || null
      ]);
    } catch (error) {
      console.error('Error storing payment request:', error);
      throw new Error('Failed to store payment request');
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
        await this.updatePaymentStatus(checkoutRequestId, 'success');
      } else if (resultCode === 1032) {
        status = 'failed';
        await this.updatePaymentStatus(checkoutRequestId, 'failed');
      }

      return { status };
    } catch (error) {
      console.error('Payment status check error:', error.response?.data || error);
      throw new Error('Failed to check payment status');
    }
  }

  // Update payment status in database
  async updatePaymentStatus(checkoutRequestId, status) {
    try {
      const query = `
        UPDATE mpesa_payments 
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE checkout_request_id = $2
      `;
      await db.query(query, [status, checkoutRequestId]);
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw new Error('Failed to update payment status');
    }
  }

  // Handle M-Pesa callback
  async handleCallback(callbackData) {
    try {
      const { Body: { stkCallback: { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } } } = callbackData;
      
      let status = 'failed';
      if (ResultCode === 0 && CallbackMetadata) {
        status = 'success';
        // Store transaction details
        const transactionData = {
          checkoutRequestId: CheckoutRequestID,
          mpesaReceiptNumber: CallbackMetadata.Item.find(item => item.Name === 'MpesaReceiptNumber')?.Value,
          transactionDate: CallbackMetadata.Item.find(item => item.Name === 'TransactionDate')?.Value,
          amount: CallbackMetadata.Item.find(item => item.Name === 'Amount')?.Value,
          phoneNumber: CallbackMetadata.Item.find(item => item.Name === 'PhoneNumber')?.Value
        };
        await this.storeTransactionDetails(transactionData);
      }

      await this.updatePaymentStatus(CheckoutRequestID, status);
      return { success: true };
    } catch (error) {
      console.error('Callback handling error:', error);
      throw new Error('Failed to process callback');
    }
  }

  // Store transaction details
  async storeTransactionDetails(transactionData) {
    try {
      const query = `
        UPDATE mpesa_payments 
        SET 
          mpesa_receipt_number = $1,
          transaction_date = $2,
          transaction_amount = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE checkout_request_id = $4
      `;
      await db.query(query, [
        transactionData.mpesaReceiptNumber,
        transactionData.transactionDate,
        transactionData.amount,
        transactionData.checkoutRequestId
      ]);
    } catch (error) {
      console.error('Error storing transaction details:', error);
      throw new Error('Failed to store transaction details');
    }
  }

  // Get payment by checkout request ID
  async getPaymentByCheckoutId(checkoutRequestId) {
    try {
      const query = 'SELECT * FROM mpesa_payments WHERE checkout_request_id = $1';
      const payments = await db.query(query, [checkoutRequestId]);
      return payments[0] || null;
    } catch (error) {
      console.error('Error getting payment:', error);
      throw new Error('Failed to get payment details');
    }
  }

  // Get all payments with pagination
  async getAllPayments(page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      const query = `
        SELECT * FROM mpesa_payments 
        ORDER BY created_at DESC 
        LIMIT $1 OFFSET $2
      `;
      const countQuery = 'SELECT COUNT(*) as total FROM mpesa_payments';
      
      const [payments, countResult] = await Promise.all([
        db.query(query, [limit, offset]),
        db.query(countQuery, [])
      ]);
      
      return {
        payments,
        total: parseInt(countResult[0].total),
        page,
        totalPages: Math.ceil(parseInt(countResult[0].total) / limit)
      };
    } catch (error) {
      console.error('Error getting all payments:', error);
      throw new Error('Failed to get payments');
    }
  }
}

module.exports = new MpesaService(); 