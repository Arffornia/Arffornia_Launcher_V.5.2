import axios from "axios";

const ENDPOINT = "https://api.mcstatus.io/v2/";
const ARFFORNIA_MC_IP = "arffornia.com:25565"

export async function fetchServerStatus() {
  try {
    const response = await axios.get(`${ENDPOINT}status/java//${ARFFORNIA_MC_IP}`);
    return response.data;
  } catch (err) {
    if (err.response && err.response.data) {
      throw new Error(err.response.data.error || 'An error occurred while fetching the server status.');
    } else {
      throw new Error('An error occurred while fetching the server status.');
    }
  }
};
