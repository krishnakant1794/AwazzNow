
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  console.log('⚙️ Forgot Password: Request received for email:', email);
  if (!email) {
    return res.status(400).json({ message: 'Please provide an email address.' });
  }

  let user; 
  try {
    user = await User.findOne({ email });

    console.log('👤 User found:', user);
    console.log('📧 user.email:', user?.email);

    if (!user) {
      console.warn(`⚠️ No user found with email: ${email}`);
      return res.status(200).json({
        message: 'If a user with that email exists, a reset link has been sent.',
      });
    }

    
    const resetToken = user.getResetPasswordToken();
    console.log('🔐 Generated reset token:', resetToken);

    
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const message = `
      <h1>Password Reset Requested</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}" target="_blank">${resetUrl}</a>
      <p>This link will expire in 10 minutes.</p>
    `;

    
    console.log('📨 Attempting to send email with values:');
    console.log('    ➤ To:', user.email);
    console.log('    ➤ Subject: AwaazNow Password Reset Request');
    console.log('    ➤ Reset URL:', resetUrl);

    await sendEmail({
      to: user.email,
      subject: 'AwaazNow Password Reset Request',
      html: message,
    });

    console.log('✅ Email sent successfully!');
    res.status(200).json({ message: 'Password reset email sent successfully.' });

  } catch (error) {
    console.error('❌ forgotPassword error:', error.message);

    
    if (user) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
    }

    res.status(500).json({
      message: 'Could not send reset email. Please try again later.',
      error: error.message,
    });
  }
};




