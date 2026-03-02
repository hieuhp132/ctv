const axios = require('axios');

const BASE_URL = 'https://ctvbe.onrender.com/'; // Updated to match the correct route
const JOB_ID = 'exampleJobId'; // Replace with a valid job ID
const USER_ID = 'exampleUserId'; // Replace with a valid user ID

async function testSaveJob() {
  try {
    console.log('Testing saveJob API...');
    //const saveResponse = await axios.put(`${BASE_URL}/job/${JOB_ID}/save`, { userId: USER_ID });
    //console.log('Save job response:', saveResponse.data);

    console.log('Testing unsaveJob API...');
    //const unsaveResponse = await axios.put(`${BASE_URL}/job/${JOB_ID}/unsave`, { userId: USER_ID });
    //console.log('Unsave job response:', unsaveResponse.data);

    console.log('Fetching all jobs...');
    const jobsResponse = await axios.get(`${BASE_URL}/api/jobs`);
    console.log('All jobs:', jobsResponse.data);
  } catch (error) {
    console.error('Error during API testing:', error.response?.data || error.message);
  }
}

testSaveJob();
