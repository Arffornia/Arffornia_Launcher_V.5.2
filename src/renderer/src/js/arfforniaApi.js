import axios from 'axios';

import { ARFFORNIA_API_ENDPOINT } from '../../../shared/endpoints';
import i18n from '../i18n/translator';
import { acceptLanguage } from '../i18n/localized';

const ENDPOINT = ARFFORNIA_API_ENDPOINT;

/**
 * Asks the API for text in the launcher's UI language (not the OS language Chromium would send).
 * @param {import('axios').InternalAxiosRequestConfig} config
 */
export function withUiLocale(config) {
  config.headers.set('Accept-Language', acceptLanguage(i18n.global.locale.value));
  return config;
}

const api = axios.create();
api.interceptors.request.use(withUiLocale);

export async function fetchPlayerProfile(pseudo) {
  try {
    const response = await api.get(`${ENDPOINT}profile/${pseudo}`);
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
    const response = await api.get(`${ENDPOINT}best_player_vote/${size}`);
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
    const response = await api.get(`${ENDPOINT}best_player_point/${size}`);
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
    const response = await api.get(`${ENDPOINT}shop/bestSallers/${size}`);
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
    const response = await api.get(`${ENDPOINT}shop/newest/${size}`);
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
    const response = await api.get(`${ENDPOINT}shop/sales/${size}`);
    return response.data;
  } catch (err) {
    if (err.response && err.response.data) {
      throw new Error(err.response.data.error || 'An error occurred while fetching sale items.');
    } else {
      throw new Error('An error occurred while fetching sale items.');
    }
  }
};

export async function fetchLauncherImages() {
  try {
    const response = await api.get(`${ENDPOINT}launcherImages`);
    return response.data;
  } catch (err) {
    if (err.response && err.response.data) {
      throw new Error(err.response.data.error || 'An error occurred while fetching launcher images.');
    } else {
      throw new Error('An error occurred while fetching launcher images.');
    }
  }
};
