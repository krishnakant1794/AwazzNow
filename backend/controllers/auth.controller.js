
import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import sendEmail from '../utils/sendEmail.js';
import crypto from 'crypto';

dotenv.config();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
};

export const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    const user = await User.create({
      username,
      email,
      password,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data provided' });
    }
  } catch (error) {
    console.error('Error in registerUser:', error.message);
    res.status(500).json({ message: error.message || 'Server error during registration' });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Error in loginUser:', error.message);
    res.status(500).json({ message: 'Server error during login' });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      console.warn(`Attempted password reset for unregistered email: ${email}`);
      return res.status(200).json({ message: 'If a user with that email exists, a password reset link has been sent.' });
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const message = `
      <h1>Password Reset Request for AwaazNow</h1>
      <p>You have requested a password reset for your AwaazNow account.</p>
      <p>Please click the button below to reset your password:</p>
      <a href="${resetUrl}" clicktracking="off" style="background-color: #FFA500; color: #000000; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; margin-bottom: 20px;">Reset My Password</a>
      <p>If the button above does not work, please copy and paste the following URL into your web browser:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <br>
      <p>This link is valid for 10 minutes. If you did not request this, please ignore this email.</p>
      <p>Thank you,</p>
      <p>The AwaazNow Team</p>
    `;

    try {
      console.log('📨 Attempting to send email to:', user.email);
      await sendEmail({
        to: user.email,
        subject: 'AwaazNow Password Reset Request',
        html: message,
      });

      res.status(200).json({ message: 'Password reset link sent to your email.' });
    } catch (emailError) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      console.error('Error sending email for password reset:', emailError);
      res.status(500).json({ message: 'Email could not be sent. Please try again later.' });
    }
  } catch (error) {
    console.error('Error in forgotPassword (main try-catch):', error.message);
    res.status(500).json({ message: error.message || 'Server error during password reset request.' });
  }
};

export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  try {
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired password reset token. Please request a new link.' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({ message: 'Password has been reset successfully.' });
  } catch (error) {
    console.error('Error in resetPassword:', error.message);
    res.status(500).json({ message: error.message || 'Server error during password reset.' });
  }
};



