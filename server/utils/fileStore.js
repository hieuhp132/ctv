const fs = require("fs");
const path = require("path");

const HELPER_DIR = path.join(__dirname, "../data");

const readFile = (filename) => {
  const filePath = path.join(HELPER_DIR, filename);

  try {
    // 1️⃣ Nếu file chưa tồn tại → tạo file rỗng hợp lệ
    if (!fs.existsSync(filePath)) {
      if (!fs.existsSync(HELPER_DIR)) {
        fs.mkdirSync(HELPER_DIR, { recursive: true });
      }
      fs.writeFileSync(filePath, "[]", "utf8");
      return [];
    }

    // 2️⃣ Đọc nội dung
    const data = fs.readFileSync(filePath, "utf8").trim();

    // 3️⃣ File rỗng → trả về []
    if (!data) return [];

    // 4️⃣ Parse JSON an toàn
    return JSON.parse(data);
  } catch (err) {
    console.error(`❌ Failed to read ${filename}:`, err.message);

    // 5️⃣ Fallback an toàn – tránh crash server
    return [];
  }
};

const writeFile = (filename, data) => {
  if (!fs.existsSync(HELPER_DIR)) {
    fs.mkdirSync(HELPER_DIR, { recursive: true });
  }

  const filePath = path.join(HELPER_DIR, filename);

  fs.writeFileSync(
    filePath,
    JSON.stringify(data, null, 2),
    "utf8"
  );
};

module.exports = {
  readFile,
  writeFile,
};
