const axios = require('axios');

class MpesaRegisterUrlsService {
  constructor() {
    this.shortcode = process.env.MPESA_SHORTCODE;
    this.confirmationUrl = process.env.MPESA_CONFIRMATION_URL;
    this.validationUrl = process.env.MPESA_VALIDATION_URL;
    this.env = process.env.NODE_ENV === 'production' ? 'production' : 'sandbox';
    this.baseUrl = this.env === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';
    this.consumerKey = process.env.MPESA_CONSUMER_KEY;
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  }

  async generateAccessToken() {
    const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
    const response = await axios.get(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });
    return response.data.access_token;
  }

  async registerC2BUrls() {
    const accessToken = await this.generateAccessToken();
    const payload = {
      ShortCode: this.shortcode,
      ResponseType: "Completed",
      ConfirmationURL: this.confirmationUrl,
      ValidationURL: this.validationUrl,
    };

    try {
      const response = await axios.post(
        `${this.baseUrl}/mpesa/c2b/v1/registerurl`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log('[MPESA][C2B Register] Response:', response.data);
      return response.data;
    } catch (e) {
      console.error('[MPESA][C2B Register] Error:', e.response?.data || e.message);
      return { error: e.response?.data || e.message };
    }
  }
}

module.exports = new MpesaRegisterUrlsService(); 