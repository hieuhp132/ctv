const fs = require("fs");
const path = require("path");

const LOG_DIR = path.join(__dirname, "../logs");
const LOGIN_LOG = path.join(LOG_DIR, "login.log");
const REGISTER_LOG = path.join(LOG_DIR, "register.log");

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function writeLog(file, data) {
  ensureLogDir();
  fs.appendFileSync(
    file,
    JSON.stringify({
      ...data,
      time: new Date().toISOString(),
    }) + "\n",
    "utf8"
  );
}

exports.logLogin = (payload) => writeLog(LOGIN_LOG, payload);
exports.logRegister = (payload) => writeLog(REGISTER_LOG, payload);
