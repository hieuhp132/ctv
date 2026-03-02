const axios = require('axios');
const BASE_URL = 'https://ctvbe.onrender.com'; // Replace with your backend URL
const RECRUITER_CREDENTIALS = { email: 'ctv1@example.com', password: '123456789' }; // Replace with valid recruiter credentials
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

async function testGetUserInfo() {

    console.log('Testing getProfile API...');
    const token = await getRecruiterToken();
    try {
        const response = await axios.get(`${BASE_URL}/api/auth/user/profile`, {
            headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });
        console.log('Get profile response:', response.data);
    } catch (error) {
        console.error('Error during API testing:', error.response?.data || error.message);
    }
}

async function testGetUserInfoById() {

    console.log('Testing getProfile API...');
    const token = await getRecruiterToken();
    try {
        const response = await axios.get(`${BASE_URL}/db/users/profile`, {
            headers: { 
                'Content-Type': 'application/json',
            },
        });
        console.log('Get profile response:', response.data);
    } catch (error) {
        console.error('Error during API testing:', error.response?.data || error.message);
    } 
        
}
async function testGetUserPasswordById() {

    console.log('Get users raw password...');
    const userId = '68bdcf22131c403154a093ea'; // Replace with a valid user ID
    try {
        const response = await axios.get(`${BASE_URL}/db/user/${userId}/raw-password`, {
            headers: { 
                'Content-Type': 'application/json',
            },
        });
        console.log('Get raw password response:', response.data);
    } catch (error) {
        console.error('Error during API testing:', error.response?.data || error.message);
    }
}
//testGetUserPasswordById();
testGetUserInfo();