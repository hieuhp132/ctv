const fs = require("fs");
const filePath="../data/activities.json"; 
// đọc file
const rawData = fs.readFileSync(filePath, "utf8");
let data = JSON.parse(rawData);

// hàm chuẩn hóa description
function normalizeDescription(desc) {
  return desc
    .replace(/(.+) updated referral for .*/i, "$1 updated a referral")
    .replace(/(.+) submitted referral for .*/i, "$1 submitted a referral");
}

// xử lý data
data = data.map(item => ({
  ...item,
  description: normalizeDescription(item.description)
}));

// overwrite file cũ
fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");

console.log("File updated successfully.");