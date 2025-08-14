const express = require('express');
const PostgresModels = require('../models/PostgresModels');
const router = express.Router();

// Create contact
router.post('/', async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  try {
    if (!name || !email || !phone || !subject || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate phone format
    const phoneRegex = /^\+?\d{10,15}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      return res.status(400).json({ message: 'Invalid phone number format' });
    }

    const contactData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      subject: subject.trim(),
      message: message.trim()
    };

    const contact = await PostgresModels.createContact(contactData);
    
    console.log('[CONTACTS] Contact created:', contact.id);
    res.status(201).json({ message: 'Contact form submitted successfully', contact });
  } catch (err) {
    console.error('[CONTACTS] Create contact error:', err);
    res.status(500).json({ message: 'Server error', details: err.message });
  }
});

// Get all contacts (admin only)
router.get('/', async (req, res) => {
  try {
    // Simple auth check for admin routes
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Authorization required' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const baseQuery = 'SELECT * FROM contacts ORDER BY created_at DESC';
    const countQuery = 'SELECT COUNT(*) as count FROM contacts';
    
    const result = await PostgresModels.getPaginatedResults(baseQuery, countQuery, [], page, limit);
    
    res.json({
      contacts: result.data,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages
    });
  } catch (err) {
    console.error('[CONTACTS] Get contacts error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update contact status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!['unread', 'read', 'responded'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    await PostgresModels.query(
      'UPDATE contacts SET status = $1, updated_at = now() WHERE id = $2',
      [status, id]
    );

    res.json({ message: 'Contact status updated successfully' });
  } catch (err) {
    console.error('[CONTACTS] Update status error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;