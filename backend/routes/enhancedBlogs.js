const express = require('express');
const PostgresModels = require('../models/PostgresModels');
const router = express.Router();

// Get all blogs
router.get('/', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    const blogs = await PostgresModels.getBlogs(limit);
    
    console.log('[BLOGS] Fetched blogs:', blogs.length);
    res.json(blogs);
  } catch (err) {
    console.error('[BLOGS] Get blogs error:', err);
    res.status(500).json({ message: 'Server error', details: err.message });
  }
});

// Get single blog by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const blog = await PostgresModels.query(
      'SELECT * FROM blogs WHERE id = $1 AND is_published = true',
      [id]
    );
    
    if (!blog[0]) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Increment view count
    await PostgresModels.query(
      'UPDATE blogs SET view_count = view_count + 1 WHERE id = $1',
      [id]
    );

    res.json(blog[0]);
  } catch (err) {
    console.error('[BLOGS] Get blog error:', err);
    res.status(500).json({ message: 'Server error', details: err.message });
  }
});

// Create blog post
router.post('/', async (req, res) => {
  try {
    const { title, content, author, excerpt, featuredImage } = req.body;

    if (!title || !content || !author) {
      return res.status(400).json({ message: 'Title, content, and author are required' });
    }

    const blogData = {
      title: title.trim(),
      content: content.trim(),
      author: author.trim(),
      excerpt: excerpt?.trim() || content.substring(0, 200) + '...',
      featuredImage: featuredImage || null,
      userId: null // For unauthenticated users
    };

    const blog = await PostgresModels.createBlog(blogData);
    
    console.log('[BLOGS] Blog created:', blog.id);
    res.status(201).json({ message: 'Blog posted successfully', blog });
  } catch (err) {
    console.error('[BLOGS] Create blog error:', err);
    res.status(500).json({ message: 'Server error', details: err.message });
  }
});

// Update blog (admin only)
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, author, excerpt, featuredImage, isPublished } = req.body;

    const updateFields = [];
    const values = [];
    let paramCount = 0;

    if (title !== undefined) {
      paramCount++;
      updateFields.push(`title = $${paramCount}`);
      values.push(title.trim());
    }

    if (content !== undefined) {
      paramCount++;
      updateFields.push(`content = $${paramCount}`);
      values.push(content.trim());
    }

    if (author !== undefined) {
      paramCount++;
      updateFields.push(`author = $${paramCount}`);
      values.push(author.trim());
    }

    if (excerpt !== undefined) {
      paramCount++;
      updateFields.push(`excerpt = $${paramCount}`);
      values.push(excerpt.trim());
    }

    if (featuredImage !== undefined) {
      paramCount++;
      updateFields.push(`featured_image = $${paramCount}`);
      values.push(featuredImage);
    }

    if (isPublished !== undefined) {
      paramCount++;
      updateFields.push(`is_published = $${paramCount}`);
      values.push(isPublished);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    paramCount++;
    updateFields.push(`updated_at = now()`);
    values.push(id);

    const query = `UPDATE blogs SET ${updateFields.join(', ')} WHERE id = $${paramCount}`;
    await PostgresModels.query(query, values);

    res.json({ message: 'Blog updated successfully' });
  } catch (err) {
    console.error('[BLOGS] Update blog error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete blog (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await PostgresModels.query('DELETE FROM blogs WHERE id = $1', [id]);
    res.json({ message: 'Blog deleted successfully' });
  } catch (err) {
    console.error('[BLOGS] Delete blog error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;