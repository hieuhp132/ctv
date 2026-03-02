const fs = require('fs');
const path = require('path');

const LOGIN_LOG_PATH = path.join(__dirname, '../logs/login.log');

/**
 * Log a user login event to the login.log file
 * @param {string} email - User email
 * @param {string} ip - User IP address (optional)
 */
function logLogin(email, ip = '127.0.0.1') {
  try {
    // Ensure logs directory exists
    const logsDir = path.dirname(LOGIN_LOG_PATH);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const logEntry = {
      email,
      timestamp: new Date().toISOString(),
      ip
    };

    // Append to login.log as NDJSON
    fs.appendFileSync(LOGIN_LOG_PATH, JSON.stringify(logEntry) + '\n', 'utf8');
    console.log(`✓ Login logged for: ${email}`);
  } catch (error) {
    console.error('Error logging login:', error);
  }
}

module.exports = {
  logLogin
};
