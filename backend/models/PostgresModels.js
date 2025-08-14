const { Pool } = require('pg');

// Create a connection pool for better performance
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

class PostgresModels {
  constructor() {
    this.pool = pool;
  }

  async query(text, params) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(text, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  // User operations
  async createUser(userData) {
    const query = `
      INSERT INTO users (user_name, email, password_hash, phone_number, account_type, seller_package_id, photo_uploads_limit, video_uploads_limit, package_expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const values = [
      userData.userName,
      userData.email,
      userData.password,
      userData.phoneNumber,
      userData.accountType,
      userData.sellerPackage?.packageId,
      userData.sellerPackage?.photoUploads,
      userData.sellerPackage?.videoUploads,
      userData.sellerPackage?.expiresAt
    ];
    const result = await this.query(query, values);
    return result[0];
  }

  async getUserByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1 AND is_active = true';
    const result = await this.query(query, [email]);
    return result[0];
  }

  async getUserById(id) {
    const query = 'SELECT * FROM users WHERE id = $1 AND is_active = true';
    const result = await this.query(query, [id]);
    return result[0];
  }

  async updateUserPackage(userId, packageData) {
    const query = `
      UPDATE users 
      SET seller_package_id = $1, photo_uploads_limit = $2, video_uploads_limit = $3, package_expires_at = $4, updated_at = now()
      WHERE id = $5
      RETURNING *
    `;
    const values = [
      packageData.packageId,
      packageData.photoUploads,
      packageData.videoUploads,
      packageData.expiresAt,
      userId
    ];
    const result = await this.query(query, values);
    return result[0];
  }

  // Service operations
  async createService(serviceData) {
    const query = `
      INSERT INTO services (user_id, name, description, min_price, max_price, location, phone_number, category, subcategory, media)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    const values = [
      serviceData.userId,
      serviceData.name,
      serviceData.description,
      serviceData.minPrice,
      serviceData.maxPrice,
      serviceData.location,
      serviceData.phoneNumber,
      serviceData.category,
      serviceData.subcategory,
      JSON.stringify(serviceData.media)
    ];
    const result = await this.query(query, values);
    return result[0];
  }

  async getServices(filters = {}) {
    let query = `
      SELECT s.*, u.user_name as provider_name 
      FROM services s 
      JOIN users u ON s.user_id = u.id 
      WHERE s.is_active = true
    `;
    const values = [];
    let paramCount = 0;

    if (filters.category) {
      paramCount++;
      query += ` AND s.category = $${paramCount}`;
      values.push(filters.category);
    }

    if (filters.subcategory) {
      paramCount++;
      query += ` AND s.subcategory = $${paramCount}`;
      values.push(filters.subcategory);
    }

    if (filters.location) {
      paramCount++;
      query += ` AND s.location ILIKE $${paramCount}`;
      values.push(`%${filters.location}%`);
    }

    if (filters.search) {
      paramCount++;
      query += ` AND (s.name ILIKE $${paramCount} OR s.description ILIKE $${paramCount})`;
      values.push(`%${filters.search}%`);
    }

    query += ' ORDER BY s.created_at DESC';

    if (filters.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      values.push(filters.limit);
    }

    const result = await this.query(query, values);
    return result;
  }

  async getServiceById(id) {
    const query = `
      SELECT s.*, u.user_name as provider_name, u.email as provider_email
      FROM services s 
      JOIN users u ON s.user_id = u.id 
      WHERE s.id = $1 AND s.is_active = true
    `;
    const result = await this.query(query, [id]);
    return result[0];
  }

  async getUserServices(userId) {
    const query = `
      SELECT * FROM services 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `;
    const result = await this.query(query, [userId]);
    return result;
  }

  // Appointment operations
  async createAppointment(appointmentData) {
    const query = `
      INSERT INTO appointments (service_id, user_id, booking_type, client_name, client_email, client_phone, appointment_date, appointment_time, message, payment_required, payment_amount)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    const values = [
      appointmentData.serviceId,
      appointmentData.userId,
      appointmentData.bookingType,
      appointmentData.clientName,
      appointmentData.clientEmail,
      appointmentData.clientPhone,
      appointmentData.appointmentDate,
      appointmentData.appointmentTime,
      appointmentData.message,
      appointmentData.paymentRequired || false,
      appointmentData.paymentAmount
    ];
    const result = await this.query(query, values);
    return result[0];
  }

  async getUserAppointments(userId) {
    const query = `
      SELECT a.*, s.name as service_name, s.location as service_location
      FROM appointments a
      LEFT JOIN services s ON a.service_id = s.id
      WHERE a.user_id = $1
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `;
    const result = await this.query(query, [userId]);
    return result;
  }

  async getServiceAppointments(serviceId) {
    const query = `
      SELECT * FROM appointments 
      WHERE service_id = $1 
      ORDER BY appointment_date DESC, appointment_time DESC
    `;
    const result = await this.query(query, [serviceId]);
    return result;
  }

  // Payment operations
  async createPayment(paymentData) {
    const query = `
      INSERT INTO payments (checkout_request_id, user_id, appointment_id, payment_type, package_id, amount, phone_number, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const values = [
      paymentData.checkoutRequestId,
      paymentData.userId,
      paymentData.appointmentId,
      paymentData.paymentType,
      paymentData.packageId,
      paymentData.amount,
      paymentData.phoneNumber,
      paymentData.timestamp
    ];
    const result = await this.query(query, values);
    return result[0];
  }

  async updatePaymentStatus(checkoutRequestId, status, transactionData = {}) {
    const query = `
      UPDATE payments 
      SET status = $1, mpesa_receipt_number = $2, transaction_date = $3, transaction_amount = $4, updated_at = now()
      WHERE checkout_request_id = $5
      RETURNING *
    `;
    const values = [
      status,
      transactionData.mpesaReceiptNumber,
      transactionData.transactionDate,
      transactionData.amount,
      checkoutRequestId
    ];
    const result = await this.query(query, values);
    return result[0];
  }

  async getPaymentByCheckoutId(checkoutRequestId) {
    const query = 'SELECT * FROM payments WHERE checkout_request_id = $1';
    const result = await this.query(query, [checkoutRequestId]);
    return result[0];
  }

  // Analytics operations
  async getDashboardStats() {
    const queries = {
      totalUsers: 'SELECT COUNT(*) as count FROM users WHERE is_active = true',
      totalSellers: 'SELECT COUNT(*) as count FROM users WHERE account_type = \'seller\' AND is_active = true',
      totalServices: 'SELECT COUNT(*) as count FROM services WHERE is_active = true',
      totalAppointments: 'SELECT COUNT(*) as count FROM appointments',
      pendingAppointments: 'SELECT COUNT(*) as count FROM appointments WHERE status = \'pending\'',
      totalContacts: 'SELECT COUNT(*) as count FROM contacts',
      totalPayments: 'SELECT COUNT(*) as count FROM payments',
      successfulPayments: 'SELECT COUNT(*) as count FROM payments WHERE status = \'success\'',
      totalRevenue: 'SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = \'success\''
    };

    const results = {};
    for (const [key, query] of Object.entries(queries)) {
      const result = await this.query(query);
      results[key] = key === 'totalRevenue' ? parseFloat(result[0].total) : parseInt(result[0].count);
    }

    return results;
  }

  async getSellerAnalytics(userId) {
    const queries = {
      totalServices: 'SELECT COUNT(*) as count FROM services WHERE user_id = $1',
      activeServices: 'SELECT COUNT(*) as count FROM services WHERE user_id = $1 AND is_active = true',
      totalViews: 'SELECT COALESCE(SUM(view_count), 0) as total FROM services WHERE user_id = $1',
      totalBookings: 'SELECT COALESCE(SUM(booking_count), 0) as total FROM services WHERE user_id = $1',
      totalAppointments: 'SELECT COUNT(*) as count FROM appointments a JOIN services s ON a.service_id = s.id WHERE s.user_id = $1',
      pendingAppointments: 'SELECT COUNT(*) as count FROM appointments a JOIN services s ON a.service_id = s.id WHERE s.user_id = $1 AND a.status = \'pending\''
    };

    const results = {};
    for (const [key, query] of Object.entries(queries)) {
      const result = await this.query(query, [userId]);
      results[key] = parseInt(result[0].count || result[0].total);
    }

    return results;
  }

  // Service view tracking
  async trackServiceView(serviceId, userId = null, ipAddress = null, userAgent = null) {
    const query = `
      INSERT INTO service_views (service_id, user_id, ip_address, user_agent)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [serviceId, userId, ipAddress, userAgent];
    const result = await this.query(query, values);
    return result[0];
  }

  // Contact operations
  async createContact(contactData) {
    const query = `
      INSERT INTO contacts (name, email, phone, subject, message)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [
      contactData.name,
      contactData.email,
      contactData.phone,
      contactData.subject,
      contactData.message
    ];
    const result = await this.query(query, values);
    return result[0];
  }

  // Blog operations
  async createBlog(blogData) {
    const query = `
      INSERT INTO blogs (title, content, author, user_id, excerpt, featured_image)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [
      blogData.title,
      blogData.content,
      blogData.author,
      blogData.userId,
      blogData.excerpt,
      blogData.featuredImage
    ];
    const result = await this.query(query, values);
    return result[0];
  }

  async getBlogs(limit = null) {
    let query = 'SELECT * FROM blogs WHERE is_published = true ORDER BY created_at DESC';
    if (limit) {
      query += ` LIMIT ${limit}`;
    }
    const result = await this.query(query);
    return result;
  }

  // Admin operations
  async createAdmin(adminData) {
    const query = `
      INSERT INTO admins (email, password_hash, role)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const values = [adminData.email, adminData.password, adminData.role || 'admin'];
    const result = await this.query(query, values);
    return result[0];
  }

  async getAdminByEmail(email) {
    const query = 'SELECT * FROM admins WHERE email = $1 AND is_active = true';
    const result = await this.query(query, [email]);
    return result[0];
  }

  async updateAdminLastLogin(adminId) {
    const query = 'UPDATE admins SET last_login = now() WHERE id = $1';
    await this.query(query, [adminId]);
  }

  // Pagination helper
  async getPaginatedResults(baseQuery, countQuery, params, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const dataQuery = `${baseQuery} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    
    const [data, countResult] = await Promise.all([
      this.query(dataQuery, [...params, limit, offset]),
      this.query(countQuery, params)
    ]);

    const total = parseInt(countResult[0].count);
    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    };
  }
}

module.exports = new PostgresModels();