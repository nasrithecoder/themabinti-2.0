const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const mpesaService = require('../services/mpesaService');
const router = express.Router();

// Define valid seller packages
const sellerPackages = {
  basic: { photoUploads: 1, videoUploads: 0 },
  standard: { photoUploads: 2, videoUploads: 0 },
  premium: { photoUploads: 3, videoUploads: 1 },
};

// Register
router.post('/register', async (req, res) => {
  const { userName, email, password, accountType, packageId, phoneNumber, paymentPhone } = req.body;

  try {
    // Validate input
    if (!userName || !email || !password || !accountType) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }
    if (!['buyer', 'seller'].includes(accountType)) {
      return res.status(400).json({ message: 'Invalid account type' });
    }
    if (accountType === 'seller' && !packageId) {
      return res.status(400).json({ 
        message: 'Package ID is required for sellers. Please select a package (basic, standard, or premium).'
      });
    }
    if (accountType === 'seller' && !sellerPackages[packageId]) {
      return res.status(400).json({ 
        message: `Invalid package ID: ${packageId}. Must be one of: basic, standard, premium.`
      });
    }

    // Check for existing user
    const existingUser = await User.findOne({ $or: [{ userName }, { email }] });
    if (existingUser) {
      if (existingUser.userName === userName) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      if (existingUser.email === email) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (accountType === 'seller') {
      // For sellers, initiate M-Pesa payment, do NOT create user yet
      const packagePrices = {
        basic: 800,
        standard: 1500,
        premium: 2500
      };
      const amount = packagePrices[packageId];
      const phone = paymentPhone || phoneNumber;
      if (!phone) {
        return res.status(400).json({ message: 'Phone number required for payment' });
      }
      try {
        // Initiate M-Pesa payment
        const paymentResult = await mpesaService.initiateSTKPush(
          phone,
          amount,
          packageId,
          `${packageId.charAt(0).toUpperCase() + packageId.slice(1)} Package`
        );
        if (!paymentResult.success) {
          return res.status(400).json({ message: 'Failed to initiate payment' });
        }
        // Return payment details for frontend to handle
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
          amount
        });
      } catch (paymentError) {
        console.error('Payment initiation error:', paymentError);
        return res.status(400).json({ message: 'Failed to initiate payment' });
      }
    }

    // For buyers, create and save user immediately
    const newUser = new User({
      userName,
      email,
      password: hashedPassword,
      phoneNumber: phoneNumber || undefined,
      accountType,
    });
    await newUser.save();

    // Generate JWT
    const token = jwt.sign(
      { userId: newUser._id, userName: newUser.userName, email: newUser.email, accountType: newUser.accountType },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '1h' }
    );

    const responseData = {
      message: 'User registered successfully',
      token,
      user: { 
        userName: newUser.userName, 
        email: newUser.email, 
        accountType: newUser.accountType
      }
    };
    console.log('Sending response:', responseData);

    res.status(201).json(responseData);
  } catch (err) {
    console.error('Error in /register:', err);
    res.status(500).json({ message: 'Server error', details: err.message });
  }
});

// Complete seller registration after payment
router.post('/complete-seller-registration', async (req, res) => {
  const { userName, email, password, phoneNumber, packageId, checkoutRequestId } = req.body;

  try {
    // Check payment status
    const payment = await mpesaService.getPaymentByCheckoutId(checkoutRequestId);
    if (!payment || payment.status !== 'success') {
      return res.status(400).json({ message: 'Payment not completed or failed' });
    }

    // Check for existing user again (in case of race condition)
    const existingUser = await User.findOne({ $or: [{ userName }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user with seller package
    const newUser = new User({
      userName,
      email,
      password, // already hashed from previous step
      phoneNumber: phoneNumber || undefined,
      accountType: 'seller',
      sellerPackage: {
        packageId,
        photoUploads: sellerPackages[packageId].photoUploads,
        videoUploads: sellerPackages[packageId].videoUploads,
      }
    });
    await newUser.save();

    // Generate JWT
    const token = jwt.sign(
      { userId: newUser._id, userName: newUser.userName, email: newUser.email, accountType: newUser.accountType },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '1h' }
    );

    res.json({
      message: 'Seller registration completed successfully',
      token,
      user: {
        userName: newUser.userName,
        email: newUser.email,
        accountType: newUser.accountType,
        sellerPackage: newUser.sellerPackage
      }
    });
  } catch (err) {
    console.error('Complete registration error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Check payment status
router.get('/payment-status/:checkoutRequestId', async (req, res) => {
  try {
    const { checkoutRequestId } = req.params;
    const payment = await mpesaService.getPaymentByCheckoutId(checkoutRequestId);
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json({
      status: payment.status,
      amount: payment.amount,
      packageId: payment.package_id
    });
  } catch (err) {
    console.error('Payment status error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).lean();
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user._id, userName: user.userName, email: user.email, accountType: user.accountType },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '1h' }
    );

    const responseData = {
      token,
      user: {
        userName: user.userName,
        email: user.email,
        accountType: user.accountType,
        sellerPackage: user.accountType === 'seller' ? user.sellerPackage : undefined,
      },
    };
    console.log('Login response:', responseData);

    res.json(responseData);
  } catch (err) {
    console.error('Error in /login:', err);
    res.status(500).json({ message: 'Server error', details: err.message });
  }
});

module.exports = router;
