const axios = require('axios');
const logger = require('./config/logger');

// Get the URL from command line arguments
const url = process.argv[2] || 'http://localhost:3000/api/veterinarian/approved-clinic/1';

async function testApi() {
  try {
    logger.info(`Testing API endpoint: ${url}`);
    const response = await axios.get(url);
    logger.info('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    logger.error('Error:', error.message);
    if (error.response) {
      logger.error('Response data:', error.response.data);
      logger.error('Response status:', error.response.status);
    }
  }
}

testApi(); 