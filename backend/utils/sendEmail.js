
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const sendEmail = async ({ to, subject, html }) => {
  console.log('📧 Nodemailer Debug: Preparing to send email...');
  console.log('     ➤ EMAIL_USER:', process.env.EMAIL_USER);
  console.log('     ➤ Recipient (to):', to);
  console.log('     ➤ Subject:', subject);

  if (!to) {
    console.error('❌ sendEmail Error: "to" field is undefined!');
    throw new Error('Recipient email is missing.');
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10),
    secure: parseInt(process.env.EMAIL_PORT, 10) === 465, 
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const mailOptions = {
    from: `"AwaazNow" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully to:', to);
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    throw error;
  }
};

export default sendEmail;





