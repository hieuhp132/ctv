const axios = require('axios');
const BASE_URL = 'https://ctvbe.onrender.com'; // Replace with your backend URL
const RECRUITER_CREDENTIALS = { email: 'ctv1@example.com', password: '123456' }; // Replace with valid recruiter credentials
async function getRecruiterToken() {
  console.log('Fetching recruiter token...');
  
  try {
    const response = await axios.post(`${BASE_URL}/db/users/login`, RECRUITER_CREDENTIALS, {
      headers: { 'Content-Type': 'application/json' },
    });
    console.log('Login response:', response.data);
    const token = response.data.user?.token; 
    if (!token) {
      throw new Error('Token not returned from login endpoint');
    }
    console.log('Recruiter token fetched successfully:', token);
    return token;
  } catch (error) {
    console.error('Error fetching recruiter token:', error.response?.data || error.message);
    throw new Error('Failed to fetch recruiter token');
  } 
}

async function testChangePassword() {
  
    console.log('Testing changePassword API...');
  
    const USER_TOKEN = await getRecruiterToken();

  try {
    const response = await axios.put(
      `${BASE_URL}/api/auth/user/change-password`,
      {
        currentPassword: "123456", // Replace with the current password
        newPassword: "123456789", // Replace with the new password
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${USER_TOKEN}`,
        },
      }
    );

    console.log("Change password response:", response.data);
  } catch (error) {
    console.error("Error changing password:", error.response?.data || error.message);
  }
}

testChangePassword();
