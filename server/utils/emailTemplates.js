const getWelcomeEmailTemplate = (name, verificationLink) => {
  const subject = 'Welcome to Ant-tech Asia 🚀';
  const body = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Hi ${name},</h2>
      <p>Thank you for registering at Ant-tech Asia.</p>
      <p>Your account has been successfully created.</p>
      <p><strong>👉 Next step:</strong> Please verify your email address to start using our services.</p>
      <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; margin: 10px 0; font-size: 16px; color: white; background-color: #007bff; text-decoration: none; border-radius: 5px;">Verify Email</a>
      <p>If you didn’t create this account, please ignore this email.</p>
      <br>
      <p>Best regards,</p>
      <p><strong>Ant-tech Asia Team</strong></p>
    </div>
  `;
  return { subject, html: body };
};

module.exports = {
  getWelcomeEmailTemplate,
};
