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
      }); // CHANGE: More specific error message
    }
    if (accountType === 'seller' && !sellerPackages[packageId]) {
      return res.status(400).json({ 
        message: `Invalid package ID: ${packageId}. Must be one of: basic, standard, premium.`
      }); // CHANGE: More specific error message
    }

    // Check for existing user
    let user = await User.findOne({ $or: [{ userName }, { email }] });
    if (user) {
      if (user.userName === userName) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      if (user.email === email) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Prepare user data
    let userData = {
      userName,
      email,
      password: hashedPassword,
      phoneNumber: phoneNumber || undefined,
      accountType,
    };

    // For sellers, initiate M-Pesa payment first
    if (accountType === 'seller') {
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
        console.log('in try-catch');
        // Create user first but without seller package
        const tempUser = new User(userData);
        await tempUser.save();

        // Initiate M-Pesa payment
        const paymentResult = await mpesaService.initiateSTKPush(
          phone,
          amount,
          packageId,
          `${packageId.charAt(0).toUpperCase() + packageId.slice(1)} Package`
        );

        if (!paymentResult.success) {
          // Delete the temporary user if payment initiation fails
          await User.findByIdAndDelete(tempUser._id);
          return res.status(400).json({ message: 'Failed to initiate payment' });
        }

        // Return payment details for frontend to handle
        return res.status(202).json({
          message: 'Payment initiated. Please complete payment on your phone.',
          paymentInitiated: true,
          checkoutRequestId: paymentResult.checkoutRequestId,
          userId: tempUser._id,
          packageId,
          amount
        });

      } catch (paymentError) {
        console.error('Payment initiation error:', paymentError);
        return res.status(400).json({ message: 'Failed to initiate payment' });
      }
    }
console.log('Out of try-catch mpesa stk push not triggered');
    // Create and save user
    const user = new User(userData);
    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, userName: user.userName, email: user.email, accountType: user.accountType },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '1h' }
    );

    const responseData = {
      message: 'User registered successfully',
      token,
      user: { 
        userName: user.userName, 
        email: user.email, 
        accountType: user.accountType
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
  const { userId, checkoutRequestId, packageId } = req.body;

  try {
    // Check payment status
    const payment = await mpesaService.getPaymentByCheckoutId(checkoutRequestId);
    
    if (!payment || payment.status !== 'success') {
      return res.status(400).json({ message: 'Payment not completed or failed' });
    }

    // Update user with seller package
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.sellerPackage = {
      packageId,
      photoUploads: sellerPackages[packageId].photoUploads,
      videoUploads: sellerPackages[packageId].videoUploads,
    };

    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, userName: user.userName, email: user.email, accountType: user.accountType },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '1h' }
    );

    res.json({
      message: 'Seller registration completed successfully',
      token,
      user: {
        userName: user.userName,
        email: user.email,
        accountType: user.accountType,
        sellerPackage: user.sellerPackage
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
