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

    // --- DEBUG LOGGING ---
    console.log('[MPESA DEBUG] Initializing MpesaService');
    console.log(`[MPESA DEBUG] Environment: ${this.env}`);
    console.log(`[MPESA DEBUG] Base URL: ${this.baseUrl}`);
    console.log(`[MPESA DEBUG] Consumer Key exists: ${!!this.consumerKey}`);
    console.log(`[MPESA DEBUG] Consumer Secret exists: ${!!this.consumerSecret}`);
    console.log(`[MPESA DEBUG] Passkey exists: ${!!this.passkey}`);
    console.log(`[MPESA DEBUG] Shortcode: ${this.shortcode}`);
    console.log(`[MPESA DEBUG] Callback Base URL: ${process.env.BASE_URL}`);

    // --- SANDBOX TESTING: In-memory token cache (resets on server restart) ---
    this._accessToken = null;
    this._accessTokenExpiry = null;
  }

  // Generate access token (with in-memory caching for 1 hour)
  async getAccessToken() {
    const now = Date.now();
    console.log('[MPESA DEBUG] Attempting to get access token...');
    if (this._accessToken && this._accessTokenExpiry && now < this._accessTokenExpiry) {
      console.log('[MPESA DEBUG] Returning cached access token.');
      return this._accessToken;
    }
    try {
      console.log('[MPESA DEBUG] No cached token. Requesting new token...');
      const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
      const response = await axios.get(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        headers: {
          Authorization: `Basic ${auth}`
        }
      });
      const token = response.data.access_token;
      
      if (token) {
        console.log('[MPESA DEBUG] Successfully received new access token.');
      } else {
        console.warn('[MPESA DEBUG] No access token received in response. Full response:', response.data);
      }

      // Cache token for 1 hour (3600 seconds)
      this._accessToken = token;
      this._accessTokenExpiry = now + 3600 * 1000;
      return token;
    } catch (error) {
      console.error('[MPESA DEBUG] Error getting access token. Status:', error.response?.status);
      console.error('[MPESA DEBUG] Error data:', error.response?.data);
      console.error('[MPESA DEBUG] Full error:', error);
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
    console.log(`[MPESA DEBUG] Initiating STK Push for phone: ${phoneNumber}, amount: ${amount}, package: ${packageName} (ID: ${packageId})`);
    try {
      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        console.error('[MPESA DEBUG] STK Push failed: Could not retrieve access token.');
        throw new Error('Could not retrieve access token for STK Push.');
      }
      console.log('[MPESA DEBUG] Access token retrieved for STK Push.');

      const timestamp = this.getTimestamp();
      const password = this.generatePassword();
      console.log(`[MPESA DEBUG] Timestamp: ${timestamp}`);
      // Security: Don't log the password in production.
      if (this.env !== 'production') {
          console.log(`[MPESA DEBUG] Generated Password: ${password}`);
      }

      // Format phone number (ensure it starts with 254)
      const formattedPhone = phoneNumber.startsWith('254') ? phoneNumber : `254${phoneNumber.replace(/^0/, '')}`;
      console.log(`[MPESA DEBUG] Formatted Phone Number: ${formattedPhone}`);

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

      console.log('[MPESA DEBUG] STK Push Payload:', JSON.stringify(payload, null, 2));

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

      console.log('[MPESA DEBUG] STK Push API Response:', JSON.stringify(response.data, null, 2));

      // Store the checkout request ID for status checking
      const checkoutRequestId = response.data.CheckoutRequestID;
      if (checkoutRequestId) {
        console.log(`[MPESA DEBUG] Storing payment request with CheckoutRequestID: ${checkoutRequestId}`);
        await this.storePaymentRequest(checkoutRequestId, {
          packageId,
          amount,
          phoneNumber: formattedPhone,
          timestamp,
          status: 'pending'
        });
      } else {
        console.warn('[MPESA DEBUG] No CheckoutRequestID received in STK Push response.');
      }

      return {
        success: true,
        checkoutRequestId,
        message: 'STK Push initiated successfully'
      };
    } catch (error) {
      console.error('[MPESA DEBUG] STK Push initiation failed.');
      if (error.response) {
        console.error('[MPESA DEBUG] Error status:', error.response.status);
        console.error('[MPESA DEBUG] Error headers:', JSON.stringify(error.response.headers, null, 2));
        console.error('[MPESA DEBUG] Error data:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.error('[MPESA DEBUG] Error message:', error.message);
      }
      console.error('[MPESA DEBUG] Full error object:', error);
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
    console.log('[MPESA DEBUG] Received M-Pesa callback.');
    console.log('[MPESA DEBUG] Callback data:', JSON.stringify(callbackData, null, 2));
    try {
      const { Body: { stkCallback: { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } } } = callbackData;
      
      console.log(`[MPESA DEBUG] Callback details - CheckoutRequestID: ${CheckoutRequestID}, ResultCode: ${ResultCode}, ResultDesc: ${ResultDesc}`);

      let status = 'failed';
      if (ResultCode === 0 && CallbackMetadata) {
        status = 'success';
        console.log('[MPESA DEBUG] Callback indicates successful payment.');
        // Store transaction details
        const transactionData = {
          checkoutRequestId: CheckoutRequestID,
          mpesaReceiptNumber: CallbackMetadata.Item.find(item => item.Name === 'MpesaReceiptNumber')?.Value,
          transactionDate: CallbackMetadata.Item.find(item => item.Name === 'TransactionDate')?.Value,
          amount: CallbackMetadata.Item.find(item => item.Name === 'Amount')?.Value,
          phoneNumber: CallbackMetadata.Item.find(item => item.Name === 'PhoneNumber')?.Value
        };
        console.log('[MPESA DEBUG] Storing transaction details:', JSON.stringify(transactionData, null, 2));
        await this.storeTransactionDetails(transactionData);
      } else {
        console.log(`[MPESA DEBUG] Callback indicates failed or cancelled payment. ResultCode: ${ResultCode}`);
      }

      console.log(`[MPESA DEBUG] Updating payment status to '${status}' for CheckoutRequestID: ${CheckoutRequestID}`);
      await this.updatePaymentStatus(CheckoutRequestID, status);
      return { success: true };
    } catch (error) {
      console.error('[MPESA DEBUG] Callback handling error.');
      console.error('[MPESA DEBUG] Full error object:', error);
      // It's possible callbackData structure is not as expected.
      console.error('[MPESA DEBUG] Original callback data that caused error:', JSON.stringify(callbackData, null, 2));
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