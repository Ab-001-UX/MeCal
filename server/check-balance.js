import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const checkBalance = async () => {
  try {
    const response = await axios.get(`https://api.ng.termii.com/api/get-balance?api_key=${process.env.TERMII_API_KEY}`);
    console.log('Termii Balance Info:', response.data);
  } catch (error) {
    console.error('Error checking balance:', error.response?.data || error.message);
  }
};

checkBalance();
