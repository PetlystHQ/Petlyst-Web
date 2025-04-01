const axios = require('axios');

// Get the URL from command line arguments
const url = process.argv[2] || 'http://localhost:3000/api/veterinarian/approved-clinic/1';

async function testApi() {
  try {
    console.log(`Testing API endpoint: ${url}`);
    const response = await axios.get(url);
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

testApi(); 