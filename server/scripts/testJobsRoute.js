const axios = require('axios');
const { headers } = require('../utils/supabaseClient');

const BASE_URL = 'https://ctvbe.onrender.com'; // Replace with your backend URL
const ADMIN_CREDENTIALS = { email: 'admin@ant-tech.asia', password: 'admin123' }; // Replace with valid admin credentials

async function getAdminToken() {
  console.log('Fetching admin token...');
  try {
    const response = await axios.post(`${BASE_URL}/db/users/login`, ADMIN_CREDENTIALS, {
      headers: { 'Content-Type': 'application/json' },
    });
    console.log('Login response:', response.data);
    const token = response.data.user?.token;
    if (!token) {
      throw new Error('Token not returned from login endpoint');
    }
    console.log('Admin token fetched successfully:', token);
    return token;
  } catch (error) {
    console.error('Error fetching admin token:', error.response?.data || error.message);
    throw new Error('Failed to fetch admin token');
  }
}

async function testUpdateJobsById(jobId, updates) {
    console.log('Testing updateBasicInfo API...');
    
    try {        const adminToken = await getAdminToken();

        const response = await axios.put(`${BASE_URL}/api/jobs/${jobId}`, updates, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${adminToken}`,
            },
        });
        console.log('Update job by ID response:', response.data);
    } catch (e) {
        
    }

}

async function testUpdateJobJD(id, jdlink) {
    console.log('Testing update job jd');
    
    try {
      const token = await getAdminToken();
      const response = await axios.patch(`${BASE_URL}/api/jobs/${id}/jd`,
        { jdLink: jdlink },
        {
          headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        }
      });
      console.log('Updated jd', response.data);
    } catch(err) {

    }
}

//testUpdateJobsById('68c12a639438bea602e7e809', { keywords: ['Future Leader_', 'Operating System', 'Team Management'] });
//testUpdateJobsById('68c12ad69438bea602e7e830', { keywords: ['_Future Leader', 'Operating System', 'Team_Management'] });
testUpdateJobJD('68c6fa36b5a9f416b212abd0','https://test.exapmle.com');
