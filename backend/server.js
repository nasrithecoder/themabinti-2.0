const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const PostgresModels = require('./models/PostgresModels');

// Enhanced routes
const enhancedAuthRoutes = require('./routes/enhancedAuth');
const enhancedServicesRoutes = require('./routes/enhancedServices');
const enhancedAppointmentsRoutes = require('./routes/enhancedAppointments');
const enhancedAdminRoutes = require('./routes/enhancedAdmin');
const enhancedMpesaRoutes = require('./routes/enhancedMpesa');
const enhancedContactsRoutes = require('./routes/enhancedContacts');
const enhancedBlogsRoutes = require('./routes/enhancedBlogs');
const sellerDashboardRoutes = require('./routes/sellerDashboard');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Enhanced API routes
app.use('/api/auth', enhancedAuthRoutes);
app.use('/api/services', enhancedServicesRoutes);
app.use('/api/appointments', enhancedAppointmentsRoutes);
app.use('/api/admin', enhancedAdminRoutes);
app.use('/api/mpesa', enhancedMpesaRoutes);
app.use('/api/contacts', enhancedContactsRoutes);
app.use('/api/blogs', enhancedBlogsRoutes);
app.use('/api/seller', sellerDashboardRoutes);

// Legacy route compatibility
app.use('/api', enhancedAuthRoutes);
app.use('/api/contact', enhancedContactsRoutes);
app.use('/api/service', enhancedServicesRoutes);

// Subcategory route compatibility
app.get('/api/subcategory', async (req, res) => {
  try {
    const { subcategory } = req.query;
    if (!subcategory) {
      return res.status(400).json({ message: 'Subcategory is required' });
    }

    const services = await PostgresModels.getServices({ subcategory });
    
    const formattedServices = services.map(service => ({
      _id: service.id,
      name: service.name,
      minPrice: parseFloat(service.min_price),
      maxPrice: parseFloat(service.max_price),
      location: service.location,
      phoneNumber: service.phone_number,
      category: service.category,
      subcategory: service.subcategory,
      media: JSON.parse(service.media || '[]'),
      userId: {
        userName: service.provider_name
      }
    }));

    res.json(formattedServices);
  } catch (err) {
    console.error('Subcategory route error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Environment variables (hardcoded)
const PORT = process.env.PORT || 5000;

// Test database connection
async function testDatabaseConnection() {
  try {
    await PostgresModels.query('SELECT NOW()');
    console.log('✅ PostgreSQL database connected successfully');
  } catch (error) {
    console.error('❌ PostgreSQL connection error:', error);
    process.exit(1);
  }
}

// Initialize database connection
testDatabaseConnection();

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

