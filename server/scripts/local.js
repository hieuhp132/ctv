const axios = require('axios');
const BASE_URL = 'https://apih.ant-tech.asia'; 
const URL2 = 'http://localhost:3000';
async function testChangePassword() {
  
    console.log('Testing changePassword API...');
  
  try {
    const response = await axios.post(
      `${BASE_URL}/local/users/reset`,
      {
        email: "admin@ant-tech.asia", // Replace with the current password
        newPassword: "123456", // Replace with the new password
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Change password response:", response.data);
  } catch (error) {
    console.error("Error changing password:", error.response?.data || error.message);
  }
}

testChangePassword();
