const { Pool } = require('pg');

// Create a connection pool for better performance
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Initialize the database and create tables if they don't exist
async function initializeDatabase() {
  try {
    const client = await pool.connect();
    
    // Create mpesa_payments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS mpesa_payments (
        id SERIAL PRIMARY KEY,
        checkout_request_id VARCHAR(255) NOT NULL UNIQUE,
        package_id VARCHAR(50) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        phone_number VARCHAR(15) NOT NULL,
        timestamp VARCHAR(14) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
        mpesa_receipt_number VARCHAR(255),
        transaction_date VARCHAR(14),
        transaction_amount DECIMAL(10,2),
        user_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_checkout_request ON mpesa_payments(checkout_request_id);
      CREATE INDEX IF NOT EXISTS idx_status ON mpesa_payments(status);
      CREATE INDEX IF NOT EXISTS idx_package ON mpesa_payments(package_id);
      CREATE INDEX IF NOT EXISTS idx_user ON mpesa_payments(user_id);
    `);
    
    // Create trigger for updated_at
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);
    
    await client.query(`
      DROP TRIGGER IF EXISTS update_mpesa_payments_updated_at ON mpesa_payments;
      CREATE TRIGGER update_mpesa_payments_updated_at
        BEFORE UPDATE ON mpesa_payments
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
    
    client.release();
    console.log('PostgreSQL database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

module.exports = {
  query: async (text, params) => {
    const client = await pool.connect();
    try {
      const result = await client.query(text, params);
      return result.rows;
    } finally {
      client.release();
    }
  },
  initializeDatabase,
  pool
};