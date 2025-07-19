const mysql = require('mysql2/promise');

// Create a connection pool for better performance
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'themabinti_payments',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Initialize the database and create tables if they don't exist
async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    
    // Create database if it doesn't exist
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'themabinti_payments'}`);
    await connection.execute(`USE ${process.env.DB_NAME || 'themabinti_payments'}`);
    
    // Create mpesa_payments table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS mpesa_payments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        checkout_request_id VARCHAR(255) NOT NULL UNIQUE,
        package_id VARCHAR(50) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        phone_number VARCHAR(15) NOT NULL,
        timestamp VARCHAR(14) NOT NULL,
        status ENUM('pending', 'success', 'failed') NOT NULL DEFAULT 'pending',
        mpesa_receipt_number VARCHAR(255),
        transaction_date VARCHAR(14),
        transaction_amount DECIMAL(10,2),
        user_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_checkout_request (checkout_request_id),
        INDEX idx_status (status),
        INDEX idx_package (package_id),
        INDEX idx_user (user_id)
      )
    `);
    
    connection.release();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

module.exports = {
  query: async (sql, params) => {
    const [rows] = await pool.execute(sql, params);
    return rows;
  },
  initializeDatabase
};