const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: true, // true nếu dùng SSL (port 465)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"Ant-tech Asia" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

function sendWelcomeEmail(name, recipientEmail) {
  const subject = "Welcome to Ant-tech Asia 🚀";
  const htmlContent = `
    <h1>Welcome to Ant-tech Asia 🚀</h1>
    <p>Hi ${name},</p>
    <p>Thank you for registering at Ant-tech Asia.<br>Your account has been successfully created.</p>
    <p>Now you can log in our system. Enjoy !</p>
    <p>Best regards,<br>Ant-tech Asia Team</p>
  `;

  return sendEmail(recipientEmail, subject, htmlContent);
}

function sendLoginNotification(name, recipientEmail, time, location, device) {
  const subject = "New login to your Ant-tech Asia account";
  const htmlContent = `
    <h1>New login to your Ant-tech Asia account</h1>
    <p>Hi ${name},</p>
    <p>We noticed a login to your Ant-tech Asia account.</p>
    <p>Details:</p>
    <ul>
      <li>Time: ${time}</li>
      <li>Location: ${location}</li>
      <li>Device: ${device}</li>
    </ul>
    <p>If this was you, no action is required.</p>
    <p>If not, please reset your password immediately.</p>
    <a href="https://example.com/reset-password" style="display: inline-block; padding: 10px 20px; background-color: #dc3545; color: #fff; text-decoration: none; border-radius: 5px;">Reset Password</a>
    <p>Ant-tech Asia Security Team</p>
  `;

  return sendEmail(recipientEmail, subject, htmlContent);
}

function sendResetPasswordEmail(name, recipientEmail, newPassword) {
  const subject = "🔐 Your new password for Ant-tech Asia";
  const htmlContent = `
    <h1>Here is your new password</h1>
    <p>Hi ${name},</p>
    <p>We have generated a new password for your account:</p>
    <p><strong>${newPassword}</strong></p>
    <p>— Ant-tech Asia Support</p>
  `;

  return sendEmail(recipientEmail, subject, htmlContent);
}


function sendApplicationConfirmationEmail(candidateName, recipientEmail, jobTitle) {
  const subject = "Your application has been received – Ant-tech Asia";
  const htmlContent = `
    <h1>Your application has been received – Ant-tech Asia</h1>
    <p>Dear ${candidateName},</p>
    <p>Thank you for applying for the position <em>${jobTitle}</em> at Ant-tech Asia.<br>
    We have successfully received your application and our recruitment team will review your profile shortly.</p>
    <p>You will be updated on the next steps soon.</p>
    <p>Best regards,<br>Ant-tech Asia Talent Acquisition Team</p>
  `;

  return sendEmail(recipientEmail, subject, htmlContent);
}

function sendInterviewInvitation(candidateName, recipientEmail, jobTitle, date, time, location) {
  const subject = "Invitation to Interview – Ant-tech Asia";
  const htmlContent = `
    <h1>Invitation to Interview – Ant-tech Asia</h1>
    <p>Dear ${candidateName},</p>
    <p>We are pleased to inform you that your profile has been shortlisted for the <em>${jobTitle}</em> position.</p>
    <p>We would like to invite you for an interview:</p>
    <ul>
      <li>Date: ${date}</li>
      <li>Time: ${time}</li>
      <li>Location/Link: ${location}</li>
    </ul>
    <p>Please confirm your availability by replying to this email.</p>
    <p>Looking forward to meeting you,<br>Ant-tech Asia HR Team</p>
  `;

  return sendEmail(recipientEmail, subject, htmlContent);
}

function sendApplicationStatusUpdate(candidateName, recipientEmail, jobTitle) {
  const subject = "Update on your application – Ant-tech Asia";
  const htmlContent = `
    <h1>Update on your application – Ant-tech Asia</h1>
    <p>Dear ${candidateName},</p>
    <p>We would like to update you regarding your application for the <em>${jobTitle}</em> role.<br>
    Your profile is still under review, and our hiring team will get back to you as soon as possible.</p>
    <p>Thank you for your patience and interest in Ant-tech Asia.</p>
    <p>Best regards,<br>Ant-tech Asia Recruitment</p>
  `;

  return sendEmail(recipientEmail, subject, htmlContent);
}

function sendApplicationRejectionEmail(candidateName, recipientEmail, jobTitle) {
  const subject = "Application outcome – Ant-tech Asia";
  const htmlContent = `
    <h1>Application outcome – Ant-tech Asia</h1>
    <p>Dear ${candidateName},</p>
    <p>Thank you for your interest in the <em>${jobTitle}</em> position at Ant-tech Asia.<br>
    After careful consideration, we regret to inform you that we have chosen to move forward with other candidates for this role.</p>
    <p>We truly appreciate the time and effort you put into your application and encourage you to apply for future opportunities with us.</p>
    <p>Best regards,<br>Ant-tech Asia Talent Team</p>
  `;

  return sendEmail(recipientEmail, subject, htmlContent);
}

function sendOfferLetterEmail(candidateName, recipientEmail, jobTitle) {
  const subject = "Congratulations! Offer from Ant-tech Asia 🎉";
  const htmlContent = `
    <h1>Congratulations! Offer from Ant-tech Asia 🎉</h1>
    <p>Dear ${candidateName},</p>
    <p>Congratulations! We are delighted to offer you the position of <em>${jobTitle}</em> at Ant-tech Asia.</p>
    <p>Our HR team will contact you shortly with your employment contract and onboarding details.<br>
    We are excited to welcome you to our team and look forward to achieving great things together.</p>
    <p>Warm regards,<br>Ant-tech Asia HR Team</p>
  `;

  return sendEmail(recipientEmail, subject, htmlContent);
}

module.exports = {
  sendWelcomeEmail,
  sendLoginNotification,
  sendResetPasswordEmail,
  sendApplicationConfirmationEmail,
  sendInterviewInvitation,
  sendApplicationStatusUpdate,
  sendApplicationRejectionEmail,
  sendOfferLetterEmail,
};
