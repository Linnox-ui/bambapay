const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

/**
 * Generate 6-digit numeric OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

class AuthController {
  // @desc    Register a new user (OTP-based, no immediate login)
  // @access  Public
  static async register(req, res, next) {
    try {
      const { firstName, lastName, email, phone, password, pin, currency } = req.body;

      // Check if user exists
      const userExists = await User.findOne({ $or: [{ email }, { phone }] });
      if (userExists) {
        return res.status(400).json({
          success: false,
          message: userExists.email === email ? 'Email already registered' : 'Phone number already registered'
        });
      }

      // Generate OTP
      const otp = generateOTP();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Create user (unverified)
      const user = await User.create({
        firstName,
        lastName,
        email,
        phone,
        password,
        pin,
        currency: currency || 'KES',
        isVerified: false,
        verificationOTP: otp,
        otpExpires
      });

      // Send OTP via email
      const emailSubject = 'Your BambaPay Verification Code';
      const emailBody = `Hello ${firstName},\n\nYour BambaPay verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you did not request this, please ignore this email.\n\n- BambaPay Team`;

      await sendEmail(email, emailSubject, emailBody);

      res.status(200).json({
        success: true,
        message: 'OTP sent to email',
        data: {
          email: user.email
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // @desc    Verify OTP and activate account
  // @access  Public
  static async verifyOTP(req, res, next) {
    try {
      const { email, otp } = req.body;

      // Find user with OTP fields (select: false, so explicitly include them)
      const user = await User.findOne({ email: email.toLowerCase() })
        .select('+verificationOTP +otpExpires +password');

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Check if already verified
      if (user.isVerified) {
        return res.status(400).json({ success: false, message: 'Account already verified. Please log in.' });
      }

      // Check if OTP exists
      if (!user.verificationOTP || !user.otpExpires) {
        return res.status(400).json({ success: false, message: 'No OTP found. Please request a new one.' });
      }

      // Check if OTP has expired
      if (user.otpExpires < Date.now()) {
        return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
      }

      // Verify OTP match
      if (user.verificationOTP !== otp) {
        return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });
      }

      // OTP is valid — activate account
      user.isVerified = true;
      user.verificationOTP = null;
      user.otpExpires = null;
      user.lastLogin = new Date();

      await user.save();

      // Generate JWT token
      const token = generateToken(user._id);

      res.status(200).json({
        success: true,
        message: 'Account verified successfully',
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          balance: user.balance,
          currency: user.currency,
          isVerified: user.isVerified
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // @desc    Resend OTP to email
  // @access  Public
  static async resendOTP(req, res, next) {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email: email.toLowerCase() })
        .select('+verificationOTP +otpExpires');

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      if (user.isVerified) {
        return res.status(400).json({ success: false, message: 'Account already verified' });
      }

      // Generate new OTP
      const otp = generateOTP();
      user.verificationOTP = otp;
      user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);

      await user.save();

      // Send new OTP
      const emailSubject = 'Your BambaPay Verification Code';
      const emailBody = `Hello ${user.firstName},\n\nYour new BambaPay verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\n- BambaPay Team`;

      await sendEmail(email, emailSubject, emailBody);

      res.status(200).json({
        success: true,
        message: 'New OTP sent to email',
        data: {
          email: user.email
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // @desc    Login user
  // @access  Public
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Find user with password
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      // Check if account is verified
      if (!user.isVerified) {
        return res.status(403).json({
          success: false,
          message: 'Account not verified. Please verify your email first.'
        });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      // Update last login
      user.lastLogin = Date.now();
      await user.save();

      const token = generateToken(user._id);

      res.json({
        success: true,
        message: 'Login successful!',
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          balance: user.balance,
          currency: user.currency,
          isVerified: user.isVerified,
          isAdmin: user.isAdmin
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // @desc    Get current user
  // @access  Private
  static async getMe(req, res, next) {
    try {
      const user = await User.findById(req.user.id);
      res.json({
        success: true,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          balance: user.balance,
          currency: user.currency,
          isVerified: user.isVerified,
          isAdmin: user.isAdmin,
          kycStatus: user.kycStatus,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // @desc    Update user profile
  // @access  Private
  static async updateProfile(req, res, next) {
    try {
      const { firstName, lastName, phone } = req.body;
      const updateData = {};

      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;
      if (phone) updateData.phone = phone;

      const user = await User.findByIdAndUpdate(
        req.user.id,
        updateData,
        { new: true, runValidators: true }
      );

      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          balance: user.balance,
          currency: user.currency
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // @desc    Change password
  // @access  Private
  static async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user.id).select('+password');

      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect' });
      }

      user.password = newPassword;
      await user.save();

      res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;