const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const BASE_URL = 'https://ctvbe.onrender.com'; // Updated to include /api prefix
const recruiterCredit = { email: 'daovietminhhieu@gmail.com', password: '123456' }; // Replace with valid recruiter credentials

const adminCredit = { email: 'admin@ant-tech.asia', password:'admin123'};

async function getToken(isAdmin) {
  console.log('Fetching token...');
  try {
    const response = await axios.post(`${BASE_URL}/db/users/login`, isAdmin? adminCredit : recruiterCredit, {
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

//router.get("/mine", auth, role(["recruiter"]), referralCtrl.getMyReferrals);
const testGetReferral = async (isAdmin) => {
    console.log(`Log in as ${isAdmin}`);
    const token = await getToken(isAdmin);

    const endpoint = isAdmin ? "/api/referrals" : "/api/referrals/mine";
    try {
      const response = await axios.get(`${BASE_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Print recruiter emails

      //console.log("Full response:", JSON.stringify(response.data, null, 2));

      // Your API might return { data: [...] } or just [...]
      //const referrals = response.data.data || response.data;
  
      //console.log("Single referral recruiter email:", referrals.recruiter?.email);
    
      //console.log("Response", response.data);
      const firstReferral = response.data.items[0];
      console.log("First recruiter email:", firstReferral);
    } catch (error) {
        console.error('Error fetching referrals:', error.response?.data || error.message);
    }
}

const testUpdateReferalStatus = async (id, status, bonus) => {

  console.log("Log in as Admin");
  const token = await getToken(true);
  
  const payload = {
    status,
    bonus
  }
  try {
    const response = await axios.put(`${BASE_URL}/api/referrals/${id}`, payload, {
      headers: {Authorization: `Bearer ${token}`},
    });
    console.log("Status updated.!");
  } catch (err) {
    console.error('Error updating referral status:', err.response?.data || err.message);
  }
 
}

const testUpdateReferralFields = async (id, updates) => {
  console.log("Logging in as Admin...");
  const token = await getToken(true);

  const endpoint = `${BASE_URL}/api/referrals/${id}/fields`; // endpoint update fields
  try {
    const response = await axios.put(endpoint, updates, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("Referral fields updated successfully:");
    console.dir(response.data, { depth: null });
  } catch (err) {
    console.error("Error updating referral fields:", err.response?.data || err.message);
  }
};


const testReferralRoute = async () => {
  const filePath = path.join(__dirname, '07_Softwaresicherheit2.pdf');
  
  const token = await getToken(false);  
  
  const formData = new FormData();
  formData.append('jobId', '68cc407e3bf5f4ed8c6fb09f'); // Replace with a valid job ID
  formData.append('candidateName', 'Last Candidate Tested');
  formData.append('email', 'test@example.com');
  formData.append('phone', '123456789');
  formData.append('linkedin', 'https://linkedin.com/in/test');
  formData.append('portfolio', 'https://portfolio.com/test');
  formData.append('suitability', 'Highly suitable for the role');
  formData.append('bonus', '500');
  formData.append('message', 'This is a test referral');
  formData.append('cv', fs.createReadStream(filePath));
  
  try {
    const response = await axios.post(`${BASE_URL}/api/referrals`, formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${token}`,
      },
    });
    
    console.log('Referral route test successful:', response.data);
  } catch (error) {
    console.error('Referral route test failed:', error.response?.data || error.message);
  } 
};

const runTests = () => {
//testUpdateReferralFields("68ccf54da6ec619087586639", {candidateEmail: "hieuhp132@gmail.com", bonus: 500});
testGetReferral(true);
//testUpdateReferalStatus("68ccf54da6ec619087586639", "offer", 0);
//testReferralRoute();
}

runTests();