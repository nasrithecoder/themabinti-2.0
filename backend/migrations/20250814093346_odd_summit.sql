/*
  # Complete Themabinti Database Schema Migration

  1. New Tables
    - `users` - User accounts with seller packages
    - `services` - Service listings with media
    - `appointments` - Booking appointments
    - `payments` - M-Pesa payment tracking
    - `contacts` - Contact form submissions
    - `blogs` - Blog posts
    - `admins` - Admin accounts
    - `service_views` - Service view tracking
    - `service_bookings` - Service booking payments

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Proper foreign key constraints

  3. Performance
    - Optimized indexes for queries
    - Auto-updating timestamps
    - Proper data types and constraints
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_name varchar(255) NOT NULL UNIQUE,
  email varchar(255) NOT NULL UNIQUE,
  password_hash varchar(255) NOT NULL,
  phone_number varchar(20),
  account_type varchar(20) NOT NULL CHECK (account_type IN ('buyer', 'seller')) DEFAULT 'buyer',
  seller_package_id varchar(20) CHECK (seller_package_id IN ('basic', 'standard', 'premium')),
  photo_uploads_limit integer DEFAULT 0,
  video_uploads_limit integer DEFAULT 0,
  package_expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Services table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  description text,
  min_price decimal(10,2) NOT NULL CHECK (min_price >= 0),
  max_price decimal(10,2) NOT NULL CHECK (max_price >= min_price),
  location varchar(255) NOT NULL,
  phone_number varchar(20) NOT NULL,
  category varchar(100) NOT NULL,
  subcategory varchar(255) NOT NULL,
  media jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  view_count integer DEFAULT 0,
  booking_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  booking_type varchar(20) NOT NULL CHECK (booking_type IN ('general', 'service')) DEFAULT 'general',
  client_name varchar(255) NOT NULL,
  client_email varchar(255) NOT NULL,
  client_phone varchar(20),
  appointment_date date NOT NULL,
  appointment_time varchar(10) NOT NULL,
  message text,
  status varchar(20) NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')) DEFAULT 'pending',
  payment_required boolean DEFAULT false,
  payment_amount decimal(10,2),
  payment_status varchar(20) CHECK (payment_status IN ('pending', 'paid', 'failed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Payments table (M-Pesa tracking)
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  checkout_request_id varchar(255) NOT NULL UNIQUE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  payment_type varchar(50) NOT NULL CHECK (payment_type IN ('seller_registration', 'package_upgrade', 'service_booking')),
  package_id varchar(50),
  amount decimal(10,2) NOT NULL CHECK (amount > 0),
  phone_number varchar(20) NOT NULL,
  timestamp varchar(14) NOT NULL,
  status varchar(20) NOT NULL CHECK (status IN ('pending', 'success', 'failed')) DEFAULT 'pending',
  mpesa_receipt_number varchar(255),
  transaction_date varchar(14),
  transaction_amount decimal(10,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar(255) NOT NULL,
  email varchar(255) NOT NULL,
  phone varchar(20) NOT NULL,
  subject varchar(500) NOT NULL,
  message text NOT NULL,
  status varchar(20) DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'responded')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Blogs table
CREATE TABLE IF NOT EXISTS blogs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title varchar(500) NOT NULL,
  content text NOT NULL,
  author varchar(255) NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  excerpt text,
  featured_image text,
  is_published boolean DEFAULT true,
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email varchar(255) NOT NULL UNIQUE,
  password_hash varchar(255) NOT NULL,
  role varchar(20) NOT NULL CHECK (role IN ('admin', 'super_admin')) DEFAULT 'admin',
  last_login timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Service views tracking
CREATE TABLE IF NOT EXISTS service_views (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  ip_address inet,
  user_agent text,
  viewed_at timestamptz DEFAULT now()
);

-- Service bookings (for paid bookings)
CREATE TABLE IF NOT EXISTS service_bookings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  appointment_id uuid REFERENCES appointments(id) ON DELETE CASCADE,
  payment_id uuid REFERENCES payments(id) ON DELETE SET NULL,
  booking_amount decimal(10,2) NOT NULL CHECK (booking_amount > 0),
  commission_rate decimal(5,2) DEFAULT 10.00,
  commission_amount decimal(10,2),
  status varchar(20) NOT NULL CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_account_type ON users(account_type);
CREATE INDEX IF NOT EXISTS idx_users_seller_package ON users(seller_package_id);

CREATE INDEX IF NOT EXISTS idx_services_user_id ON services(user_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_subcategory ON services(subcategory);
CREATE INDEX IF NOT EXISTS idx_services_location ON services(location);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_services_created_at ON services(created_at);

CREATE INDEX IF NOT EXISTS idx_appointments_service_id ON appointments(service_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

CREATE INDEX IF NOT EXISTS idx_payments_checkout_request ON payments(checkout_request_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_type ON payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

CREATE INDEX IF NOT EXISTS idx_service_views_service_id ON service_views(service_id);
CREATE INDEX IF NOT EXISTS idx_service_views_viewed_at ON service_views(viewed_at);

CREATE INDEX IF NOT EXISTS idx_service_bookings_service_id ON service_bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_service_bookings_status ON service_bookings(status);

-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for auto-updating timestamps
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blogs_updated_at BEFORE UPDATE ON blogs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_bookings_updated_at BEFORE UPDATE ON service_bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can read own data" ON users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE TO authenticated USING (auth.uid() = id);

-- RLS Policies for services
CREATE POLICY "Anyone can read active services" ON services FOR SELECT USING (is_active = true);
CREATE POLICY "Sellers can manage own services" ON services FOR ALL TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for appointments
CREATE POLICY "Users can read own appointments" ON appointments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service owners can read their service appointments" ON appointments FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM services WHERE services.id = appointments.service_id AND services.user_id = auth.uid())
);
CREATE POLICY "Anyone can create appointments" ON appointments FOR INSERT WITH CHECK (true);

-- RLS Policies for payments
CREATE POLICY "Users can read own payments" ON payments FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for contacts
CREATE POLICY "Anyone can create contacts" ON contacts FOR INSERT WITH CHECK (true);

-- RLS Policies for blogs
CREATE POLICY "Anyone can read published blogs" ON blogs FOR SELECT USING (is_published = true);

-- RLS Policies for service views
CREATE POLICY "Anyone can create service views" ON service_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Service owners can read their service views" ON service_views FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM services WHERE services.id = service_views.service_id AND services.user_id = auth.uid())
);

-- RLS Policies for service bookings
CREATE POLICY "Users can read own bookings" ON service_bookings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service owners can read their service bookings" ON service_bookings FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM services WHERE services.id = service_bookings.service_id AND services.user_id = auth.uid())
);

-- Function to calculate commission
CREATE OR REPLACE FUNCTION calculate_commission()
RETURNS TRIGGER AS $$
BEGIN
  NEW.commission_amount = NEW.booking_amount * (NEW.commission_rate / 100);
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-calculate commission
CREATE TRIGGER calculate_service_booking_commission 
  BEFORE INSERT OR UPDATE ON service_bookings 
  FOR EACH ROW EXECUTE FUNCTION calculate_commission();

-- Function to update service stats
CREATE OR REPLACE FUNCTION update_service_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF TG_TABLE_NAME = 'service_views' THEN
      UPDATE services SET view_count = view_count + 1 WHERE id = NEW.service_id;
    ELSIF TG_TABLE_NAME = 'service_bookings' THEN
      UPDATE services SET booking_count = booking_count + 1 WHERE id = NEW.service_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Triggers to update service stats
CREATE TRIGGER update_service_view_count 
  AFTER INSERT ON service_views 
  FOR EACH ROW EXECUTE FUNCTION update_service_stats();

CREATE TRIGGER update_service_booking_count 
  AFTER INSERT ON service_bookings 
  FOR EACH ROW EXECUTE FUNCTION update_service_stats();