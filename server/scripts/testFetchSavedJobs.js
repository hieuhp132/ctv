const axios = require('axios');

const BASE_URL = 'https://ctvbe.onrender.com/api/jobs'; // Replace with your backend URL
const USER_ID = '68bea22e4de88dafc3496288'; // Replace with a valid user ID

async function testFetchSavedJobs() {
  console.log('Testing fetchSavedJobs API...');

  try {
    const response = await axios.get(`${BASE_URL}`, {
      params: { savedBy: USER_ID },
    });
    console.log('Fetch saved jobs response:', response.data);
  } catch (error) {
    console.error('Error during API testing:', error.response?.data || error.message);
  }
}

testFetchSavedJobs();
