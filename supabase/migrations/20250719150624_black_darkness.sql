-- PostgreSQL schema for M-Pesa payments tracking
-- This file is for reference only - tables are created automatically by the application

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
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_checkout_request ON mpesa_payments(checkout_request_id);
CREATE INDEX IF NOT EXISTS idx_status ON mpesa_payments(status);
CREATE INDEX IF NOT EXISTS idx_package ON mpesa_payments(package_id);
CREATE INDEX IF NOT EXISTS idx_user ON mpesa_payments(user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_mpesa_payments_updated_at ON mpesa_payments;
CREATE TRIGGER update_mpesa_payments_updated_at
  BEFORE UPDATE ON mpesa_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Sample queries for reference

-- Get all successful payments
SELECT * FROM mpesa_payments WHERE status = 'success' ORDER BY created_at DESC;

-- Get payment statistics
SELECT 
  status,
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM mpesa_payments 
GROUP BY status;

-- Get payments by package
SELECT 
  package_id,
  COUNT(*) as count,
  SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END) as revenue
FROM mpesa_payments 
GROUP BY package_id;

-- Get recent payments with user info (if user_id is available)
SELECT 
  mp.*,
  CASE 
    WHEN mp.status = 'success' THEN 'Completed'
    WHEN mp.status = 'pending' THEN 'Processing'
    ELSE 'Failed'
  END as status_display
FROM mpesa_payments mp
ORDER BY mp.created_at DESC
LIMIT 50;