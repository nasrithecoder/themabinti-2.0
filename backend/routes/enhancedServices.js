const express = require('express');
const jwt = require('jsonwebtoken');
const PostgresModels = require('../models/PostgresModels');
const router = express.Router();

// Authentication middleware
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    const user = await PostgresModels.getUserById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Create service
router.post('/', authMiddleware, async (req, res) => {
  const { name, images, video, minPrice, maxPrice, location, phoneNumber, category, subcategory, description } = req.body;

  try {
    const user = req.user;
    
    if (user.account_type !== 'seller') {
      return res.status(403).json({ message: 'Only sellers can post services' });
    }

    // Validate inputs
    if (!name || !minPrice || !maxPrice || !location || !phoneNumber || !category || !subcategory || !description) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate media limits
    const imageCount = Array.isArray(images) ? images.length : 0;
    const videoCount = video ? 1 : 0;

    if (imageCount > user.photo_uploads_limit) {
      return res.status(400).json({ 
        message: `Your ${user.seller_package_id} package allows only ${user.photo_uploads_limit} photo(s)` 
      });
    }

    if (videoCount > user.video_uploads_limit) {
      return res.status(400).json({ 
        message: `Your ${user.seller_package_id} package allows only ${user.video_uploads_limit} video(s)` 
      });
    }

    if (imageCount === 0 && videoCount === 0) {
      return res.status(400).json({ message: 'At least one media file is required' });
    }

    // Validate prices
    const min = Number(minPrice);
    const max = Number(maxPrice);
    
    if (isNaN(min) || isNaN(max) || min < 0 || max < 0 || min > max) {
      return res.status(400).json({ message: 'Invalid price range' });
    }

    // Prepare media array
    const media = [];
    if (images) {
      media.push(...images.map(data => ({ type: 'image', data })));
    }
    if (video) {
      media.push({ type: 'video', data: video });
    }

    const serviceData = {
      userId: user.id,
      name,
      description,
      minPrice: min,
      maxPrice: max,
      location,
      phoneNumber,
      category,
      subcategory,
      media
    };

    const service = await PostgresModels.createService(serviceData);
    
    console.log('[SERVICES] Service created:', service.id);
    res.status(201).json({ message: 'Service posted successfully', service });
  } catch (err) {
    console.error('[SERVICES] Create service error:', err);
    res.status(500).json({ message: 'Server error', details: err.message });
  }
});

// Get all services
router.get('/', async (req, res) => {
  try {
    const { category, subcategory, location, search, limit } = req.query;
    
    const filters = {};
    if (category) filters.category = category;
    if (subcategory) filters.subcategory = subcategory;
    if (location) filters.location = location;
    if (search) filters.search = search;
    if (limit) filters.limit = parseInt(limit);

    const services = await PostgresModels.getServices(filters);
    
    // Format services for frontend
    const formattedServices = services.map(service => ({
      _id: service.id,
      name: service.name,
      description: service.description,
      minPrice: parseFloat(service.min_price),
      maxPrice: parseFloat(service.max_price),
      location: service.location,
      phoneNumber: service.phone_number,
      category: service.category,
      subcategory: service.subcategory,
      media: JSON.parse(service.media || '[]'),
      viewCount: service.view_count,
      bookingCount: service.booking_count,
      userId: {
        userName: service.provider_name
      },
      createdAt: service.created_at
    }));

    res.json(formattedServices);
  } catch (err) {
    console.error('[SERVICES] Get services error:', err);
    res.status(500).json({ message: 'Server error', details: err.message });
  }
});


// Get service by ID
router.get('/id/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const service = await PostgresModels.getServiceById(id);
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Track service view
    const userAgent = req.get('User-Agent');
    const ipAddress = req.ip || req.connection.remoteAddress;
    
    try {
      await PostgresModels.trackServiceView(id, null, ipAddress, userAgent);
    } catch (viewError) {
      console.error('[SERVICES] Error tracking view:', viewError);
      // Don't fail the request if view tracking fails
    }

    // Format service for frontend
    const formattedService = {
      _id: service.id,
      name: service.name,
      description: service.description,
      minPrice: parseFloat(service.min_price),
      maxPrice: parseFloat(service.max_price),
      location: service.location,
      phoneNumber: service.phone_number,
      category: service.category,
      subcategory: service.subcategory,
      media: JSON.parse(service.media || '[]'),
      viewCount: service.view_count,
      bookingCount: service.booking_count,
      userId: {
        userName: service.provider_name,
        email: service.provider_email
      },
      createdAt: service.created_at
    };

    res.json(formattedService);
  } catch (err) {
    console.error('[SERVICES] Get service by ID error:', err);
    res.status(500).json({ message: 'Server error', details: err.message });
  }
});

// Get user's services (for seller dashboard)
router.get('/my-services', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    
    if (user.account_type !== 'seller') {
      return res.status(403).json({ message: 'Only sellers can view their services' });
    }

    const services = await PostgresModels.getUserServices(user.id);
    
    const formattedServices = services.map(service => ({
      _id: service.id,
      name: service.name,
      description: service.description,
      minPrice: parseFloat(service.min_price),
      maxPrice: parseFloat(service.max_price),
      location: service.location,
      phoneNumber: service.phone_number,
      category: service.category,
      subcategory: service.subcategory,
      media: JSON.parse(service.media || '[]'),
      viewCount: service.view_count,
      bookingCount: service.booking_count,
      isActive: service.is_active,
      createdAt: service.created_at
    }));

    res.json(formattedServices);
  } catch (err) {
    console.error('[SERVICES] Get user services error:', err);
    res.status(500).json({ message: 'Server error', details: err.message });
  }
});

// Update service status (activate/deactivate)
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const user = req.user;

    // Check if user owns the service
    const service = await PostgresModels.getServiceById(id);
    if (!service || service.user_id !== user.id) {
      return res.status(404).json({ message: 'Service not found or unauthorized' });
    }

    await PostgresModels.query(
      'UPDATE services SET is_active = $1, updated_at = now() WHERE id = $2',
      [isActive, id]
    );

    res.json({ message: 'Service status updated successfully' });
  } catch (err) {
    console.error('[SERVICES] Update service status error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete service
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Check if user owns the service
    const service = await PostgresModels.getServiceById(id);
    if (!service || service.user_id !== user.id) {
      return res.status(404).json({ message: 'Service not found or unauthorized' });
    }

    await PostgresModels.query('DELETE FROM services WHERE id = $1', [id]);
    res.json({ message: 'Service deleted successfully' });
  } catch (err) {
    console.error('[SERVICES] Delete service error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search services
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const services = await PostgresModels.getServices({ search: query });
    
    const formattedServices = services.map(service => ({
      _id: service.id,
      name: service.name,
      description: service.description,
      minPrice: parseFloat(service.min_price),
      maxPrice: parseFloat(service.max_price),
      location: service.location,
      phoneNumber: service.phone_number,
      category: service.category,
      subcategory: service.subcategory,
      media: JSON.parse(service.media || '[]'),
      viewCount: service.view_count,
      bookingCount: service.booking_count,
      userId: {
        userName: service.provider_name
      },
      createdAt: service.created_at
    }));

    res.json(formattedServices);
  } catch (err) {
    console.error('[SERVICES] Search error:', err);
    res.status(500).json({ message: 'Server error', details: err.message });
  }
});

// Get services by category
router.get('/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const services = await PostgresModels.getServices({ category, limit: 4 });
    
    const formattedServices = services.map(service => ({
      _id: service.id,
      name: service.name,
      description: service.description,
      minPrice: parseFloat(service.min_price),
      maxPrice: parseFloat(service.max_price),
      location: service.location,
      phoneNumber: service.phone_number,
      category: service.category,
      subcategory: service.subcategory,
      media: JSON.parse(service.media || '[]'),
      viewCount: service.view_count,
      bookingCount: service.booking_count,
      userId: {
        userName: service.provider_name
      },
      createdAt: service.created_at
    }));

    res.json(formattedServices);
  } catch (err) {
    console.error('[SERVICES] Get category services error:', err);
    res.status(500).json({ message: 'Server error', details: err.message });
  }
});

module.exports = router;