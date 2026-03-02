const axios = require('axios');
const baseUrl = 'https://ctvbe.onrender.com'; // Replace with your server's base URL

const testDeleteUser = async () => {
  const userId = '68c8605bcff1ddfe652f22f3'; // Replace with a valid user ID from your database

  try {
    const response = await axios.delete(`${baseUrl}/db/user/${userId}/remove`);
    console.log('User removed successfully:', response.data);
  } catch (error) {
    console.error('Error removing user:', error.response?.data || error.message);
  }
};

const testDoSignup = async () => {

  const payload = {
    name: "Im For Testing",
    email: "daovietminhhieu@gmail.com",
    password: "123456",
    promocode: null,
  }
  try {
    const response = await axios.post(`${baseUrl}/db/users/signup`, payload);
    console.log('User successfully registered', response.data);
  } catch(err) {
    console.error('Error signup:', err.response?.data || err.message);
  }
}

const testForgotPassword = async () => {

  const payload = { email: "daovietminhhieu@gmail.com" };
  try {
    const response = await axios.post(`${baseUrl}/db/users/forgotPassword`, payload);
    console.log(`Password sent`);
  } catch(err) {
    console.error('Error forgot password:', err.response?.data || err.message);
  }
}

testForgotPassword();
//testDoSignup();
//testDeleteUser();