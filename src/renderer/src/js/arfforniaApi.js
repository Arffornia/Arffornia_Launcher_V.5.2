import axios from 'axios';

const ENDPOINT = 'http://localhost/api/';

export async function fetchPlayerProfile(pseudo) {
  try {
    const response = await axios.get(`${ENDPOINT}profile/${pseudo}`);
    return response.data;
  } catch (err) {
    if (err.response && err.response.data) {
      throw new Error(err.response.data.error || 'An error occurred while fetching the profile.');
    } else {
      throw new Error('An error occurred while fetching the profile.');
    }
  }
};
