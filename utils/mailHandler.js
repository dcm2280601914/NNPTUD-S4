const nodemailer = require('nodemailer');

/**
 * Mailtrap config
 * Replace user/pass with your Mailtrap SMTP credentials
 */
const transporter = nodemailer.createTransport({
  host: 'sandbox.smtp.mailtrap.io',
  port: 2525,
  auth: {
    user: 'YOUR_MAILTRAP_USERNAME',
    pass: 'YOUR_MAILTRAP_PASSWORD'
  }
});

/**
 * Send welcome email with temporary password
 */
async function sendPasswordEmail(email, username, password) {
  const mailOptions = {
    from: '"NNPTUD-S4 App" <noreply@nnptud-s4.com>',
    to: email,
    subject: 'Your NNPTUD-S4 Account Password',
    html: `
      <h2>Welcome ${username}!</h2>
      <p>Your account has been created successfully.</p>
      <p><strong>Username:</strong> ${username}</p>
      <p><strong>Temporary Password:</strong> ${password}</p>
      <p>Please login and change your password.</p>
      <p>Best regards,<br>NNPTUD-S4 Team</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password email sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`Failed to send email to ${email}:`, error.message);
    return false;
  }
}

module.exports = { sendPasswordEmail };