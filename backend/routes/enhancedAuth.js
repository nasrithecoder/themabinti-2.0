const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const PostgresModels = require('../models/PostgresModels');
const enhancedMpesaService = require('../services/enhancedMpesaService');
const router = express.Router();

// Define seller packages
const sellerPackages = {
  basic: { 
    photoUploads: 1, 
    videoUploads: 0, 
    price: 1000,
    duration: 30 // days
  },
  standard: { 
    photoUploads: 2, 
    videoUploads: 0, 
    price: 1500,
    duration: 30
  },
  premium: { 
    photoUploads: 3, 
    videoUploads: 1, 
    price: 2500,
    duration: 30
  },
};

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

// Register user
router.post('/register', async (req, res) => {
  const { userName, email, password, accountType, packageId, phoneNumber, paymentPhone } = req.body;

  try {
    console.log('[AUTH] Registration request:', { userName, email, accountType, packageId });

    // Validate input
    if (!userName || !email || !password || !accountType) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    if (!['buyer', 'seller'].includes(accountType)) {
      return res.status(400).json({ message: 'Invalid account type' });
    }

    if (accountType === 'seller' && !packageId) {
      return res.status(400).json({ message: 'Package ID is required for sellers' });
    }

    if (accountType === 'seller' && !sellerPackages[packageId]) {
      return res.status(400).json({ message: 'Invalid package ID' });
    }

    // Check for existing user
    const existingUser = await PostgresModels.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (accountType === 'seller') {
      // For sellers, initiate M-Pesa payment first
      const packageInfo = sellerPackages[packageId];
      const phone = paymentPhone || phoneNumber;
      
      if (!phone) {
        return res.status(400).json({ message: 'Phone number required for payment' });
      }

      try {
        const paymentResult = await enhancedMpesaService.initiateSellerPayment(
          phone,
          packageInfo.price,
          packageId,
          `${packageId.charAt(0).toUpperCase() + packageId.slice(1)} Package`
        );

        return res.status(202).json({
          message: 'Payment initiated. Please complete payment on your phone.',
          paymentInitiated: true,
          checkoutRequestId: paymentResult.checkoutRequestId,
          userData: {
            userName,
            email,
            password: hashedPassword,
            phoneNumber: phoneNumber || undefined,
            accountType,
            packageId
          },
          packageId,
          amount: packageInfo.price
        });
      } catch (paymentError) {
        console.error('[AUTH] Payment initiation error:', paymentError);
        return res.status(400).json({ message: 'Failed to initiate payment' });
      }
    }

    // For buyers, create user immediately
    const newUser = await PostgresModels.createUser({
      userName,
      email,
      password: hashedPassword,
      phoneNumber: phoneNumber || null,
      accountType
    });

    // Generate JWT
    const token = jwt.sign(
      { 
        userId: newUser.id, 
        userName: newUser.user_name, 
        email: newUser.email, 
        accountType: newUser.account_type 
      },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { 
        id: newUser.id,
        userName: newUser.user_name, 
        email: newUser.email, 
        accountType: newUser.account_type
      }
    });
  } catch (err) {
    console.error('[AUTH] Registration error:', err);
    res.status(500).json({ message: 'Server error', details: err.message });
  }
});

// Complete seller registration after payment
router.post('/complete-seller-registration', async (req, res) => {
  const { userName, email, password, phoneNumber, packageId, checkoutRequestId } = req.body;

  try {
    // Check payment status
    const payment = await PostgresModels.getPaymentByCheckoutId(checkoutRequestId);
    if (!payment || payment.status !== 'success') {
      return res.status(400).json({ message: 'Payment not completed or failed' });
    }

    // Check for existing user
    const existingUser = await PostgresModels.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const packageInfo = sellerPackages[packageId];
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + packageInfo.duration);

    // Create seller user
    const newUser = await PostgresModels.createUser({
      userName,
      email,
      password, // already hashed
      phoneNumber: phoneNumber || null,
      accountType: 'seller',
      sellerPackage: {
        packageId,
        photoUploads: packageInfo.photoUploads,
        videoUploads: packageInfo.videoUploads,
        expiresAt
      }
    });

    // Generate JWT
    const token = jwt.sign(
      { 
        userId: newUser.id, 
        userName: newUser.user_name, 
        email: newUser.email, 
        accountType: newUser.account_type 
      },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Seller registration completed successfully',
      token,
      user: {
        id: newUser.id,
        userName: newUser.user_name,
        email: newUser.email,
        accountType: newUser.account_type,
        sellerPackage: {
          packageId: newUser.seller_package_id,
          photoUploads: newUser.photo_uploads_limit,
          videoUploads: newUser.video_uploads_limit,
          expiresAt: newUser.package_expires_at
        }
      }
    });
  } catch (err) {
    console.error('[AUTH] Complete registration error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await PostgresModels.getUserByEmail(email);
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        userName: user.user_name, 
        email: user.email, 
        accountType: user.account_type 
      },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '24h' }
    );

    const responseData = {
      token,
      user: {
        id: user.id,
        userName: user.user_name,
        email: user.email,
        accountType: user.account_type,
        sellerPackage: user.account_type === 'seller' ? {
          packageId: user.seller_package_id,
          photoUploads: user.photo_uploads_limit,
          videoUploads: user.video_uploads_limit,
          expiresAt: user.package_expires_at
        } : undefined,
      },
    };

    res.json(responseData);
  } catch (err) {
    console.error('[AUTH] Login error:', err);
    res.status(500).json({ message: 'Server error', details: err.message });
  }
});

// Seller package upgrade
router.post('/upgrade-seller-package', authMiddleware, async (req, res) => {
  try {
    const { newPackageId, paymentPhone } = req.body;
    const user = req.user;

    if (user.account_type !== 'seller') {
      return res.status(403).json({ message: 'Only sellers can upgrade packages' });
    }

    if (!['basic', 'standard', 'premium'].includes(newPackageId)) {
      return res.status(400).json({ message: 'Invalid package ID' });
    }

    const packageOrder = ['basic', 'standard', 'premium'];
    const currentIdx = packageOrder.indexOf(user.seller_package_id || 'basic');
    const newIdx = packageOrder.indexOf(newPackageId);

    if (newIdx <= currentIdx) {
      return res.status(400).json({ message: 'You can only upgrade to a higher package' });
    }

    const packageInfo = sellerPackages[newPackageId];
    const phone = paymentPhone || user.phone_number;

    if (!phone) {
      return res.status(400).json({ message: 'Phone number required for payment' });
    }

    // Initiate STK Push
    const paymentResult = await enhancedMpesaService.initiateSellerPayment(
      phone,
      packageInfo.price,
      newPackageId,
      `${newPackageId.charAt(0).toUpperCase() + newPackageId.slice(1)} Package`,
      user.id
    );

    return res.status(202).json({
      message: 'Payment initiated. Please complete payment on your phone.',
      paymentInitiated: true,
      checkoutRequestId: paymentResult.checkoutRequestId,
      newPackageId,
      amount: packageInfo.price
    });
  } catch (err) {
    console.error('[AUTH] Upgrade error:', err);
    res.status(500).json({ message: 'Server error', details: err.message });
  }
});

// Complete seller package upgrade
router.post('/complete-seller-upgrade', authMiddleware, async (req, res) => {
  try {
    const { newPackageId, checkoutRequestId } = req.body;
    const user = req.user;

    if (user.account_type !== 'seller') {
      return res.status(403).json({ message: 'Only sellers can upgrade packages' });
    }

    // Check payment status
    const payment = await PostgresModels.getPaymentByCheckoutId(checkoutRequestId);
    if (!payment || payment.status !== 'success') {
      return res.status(400).json({ message: 'Payment not completed or failed' });
    }

    const packageInfo = sellerPackages[newPackageId];
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + packageInfo.duration);

    // Update user package
    const updatedUser = await PostgresModels.updateUserPackage(user.id, {
      packageId: newPackageId,
      photoUploads: packageInfo.photoUploads,
      videoUploads: packageInfo.videoUploads,
      expiresAt
    });

    return res.json({
      message: 'Seller package upgraded successfully',
      sellerPackage: {
        packageId: updatedUser.seller_package_id,
        photoUploads: updatedUser.photo_uploads_limit,
        videoUploads: updatedUser.video_uploads_limit,
        expiresAt: updatedUser.package_expires_at
      }
    });
  } catch (err) {
    console.error('[AUTH] Complete upgrade error:', err);
    res.status(500).json({ message: 'Server error', details: err.message });
  }
});

// Check payment status
router.get('/payment-status/:checkoutRequestId', async (req, res) => {
  try {
    const { checkoutRequestId } = req.params;
    const payment = await PostgresModels.getPaymentByCheckoutId(checkoutRequestId);
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json({
      status: payment.status,
      amount: payment.amount,
      packageId: payment.package_id,
      paymentType: payment.payment_type
    });
  } catch (err) {
    console.error('[AUTH] Payment status error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    
    const profileData = {
      id: user.id,
      userName: user.user_name,
      email: user.email,
      phoneNumber: user.phone_number,
      accountType: user.account_type,
      isActive: user.is_active,
      createdAt: user.created_at
    };

    if (user.account_type === 'seller') {
      profileData.sellerPackage = {
        packageId: user.seller_package_id,
        photoUploads: user.photo_uploads_limit,
        videoUploads: user.video_uploads_limit,
        expiresAt: user.package_expires_at
      };

      // Get seller analytics
      const analytics = await PostgresModels.getSellerAnalytics(user.id);
      profileData.analytics = analytics;
    }

    res.json(profileData);
  } catch (err) {
    console.error('[AUTH] Profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;