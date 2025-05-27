import axios from 'axios';

import { launcherSettings } from '../../../main/launcherSettings';

const ENDPOINT = launcherSettings.ARFFORNIA_API_ENDPOINT;

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

export async function fetchBestPlayersByVote(size) {
  try {
    const response = await axios.get(`${ENDPOINT}best_player_vote/${size}`);
    return response.data;
  } catch (err) {
    if (err.response && err.response.data) {
      throw new Error(err.response.data.error || 'An error occurred while fetching best players by vote.');
    } else {
      throw new Error('An error occurred while fetching best players by vote.');
    }
  }
};

export async function fetchBestPlayersByPoint(size) {
  try {
    const response = await axios.get(`${ENDPOINT}best_player_point/${size}`);
    return response.data;
  } catch (err) {
    if (err.response && err.response.data) {
      throw new Error(err.response.data.error || 'An error occurred while fetching best players by point.');
    } else {
      throw new Error('An error occurred while fetching best players by point.');
    }
  }
};

export async function fetchBestSellers(size) {
  try {
    const response = await axios.get(`${ENDPOINT}shop/bestSallers/${size}`);
    return response.data;
  } catch (err) {
    if (err.response && err.response.data) {
      throw new Error(err.response.data.error || 'An error occurred while fetching best seller.');
    } else {
      throw new Error('An error occurred while fetching best seller.');
    }
  }
};

export async function fetchNewestItems(size) {
  try {
    const response = await axios.get(`${ENDPOINT}shop/newest/${size}`);
    return response.data;
  } catch (err) {
    if (err.response && err.response.data) {
      throw new Error(err.response.data.error || 'An error occurred while fetching newest items.');
    } else {
      throw new Error('An error occurred while fetching newest items.');
    }
  }
};

export async function fetchSaleItems(size) {
  try {
    const response = await axios.get(`${ENDPOINT}shop/sales/${size}`);
    return response.data;
  } catch (err) {
    if (err.response && err.response.data) {
      throw new Error(err.response.data.error || 'An error occurred while fetching sale items.');
    } else {
      throw new Error('An error occurred while fetching sale items.');
    }
  }
};
