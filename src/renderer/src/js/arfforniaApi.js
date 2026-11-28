import axios from 'axios';

import { currentEnvironment } from './environment';
import i18n from '../i18n/translator';
import { acceptLanguage } from '../i18n/localized';

const endpoint = () => currentEnvironment().api;

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
    const response = await api.get(`${endpoint()}profile/${pseudo}`);
    return response.data;
  } catch (err) {
    if (err.response && err.response.data) {
      throw new Error(err.response.data.error || 'An error occurred while fetching the profile.', { cause: err });
    } else {
      throw new Error('An error occurred while fetching the profile.', { cause: err });
    }
  }
};

export async function fetchBestPlayersByVote(size) {
  try {
    const response = await api.get(`${endpoint()}best_player_vote/${size}`);
    return response.data;
  } catch (err) {
    if (err.response && err.response.data) {
      throw new Error(err.response.data.error || 'An error occurred while fetching best players by vote.', { cause: err });
    } else {
      throw new Error('An error occurred while fetching best players by vote.', { cause: err });
    }
  }
};

export async function fetchBestPlayersByPoint(size) {
  try {
    const response = await api.get(`${endpoint()}best_player_point/${size}`);
    return response.data;
  } catch (err) {
    if (err.response && err.response.data) {
      throw new Error(err.response.data.error || 'An error occurred while fetching best players by point.', { cause: err });
    } else {
      throw new Error('An error occurred while fetching best players by point.', { cause: err });
    }
  }
};

export async function fetchBestSellers(size) {
  try {
    const response = await api.get(`${endpoint()}shop/bestSallers/${size}`);
    return response.data;
  } catch (err) {
    if (err.response && err.response.data) {
      throw new Error(err.response.data.error || 'An error occurred while fetching best seller.', { cause: err });
    } else {
      throw new Error('An error occurred while fetching best seller.', { cause: err });
    }
  }
};

export async function fetchNewestItems(size) {
  try {
    const response = await api.get(`${endpoint()}shop/newest/${size}`);
    return response.data;
  } catch (err) {
    if (err.response && err.response.data) {
      throw new Error(err.response.data.error || 'An error occurred while fetching newest items.', { cause: err });
    } else {
      throw new Error('An error occurred while fetching newest items.', { cause: err });
    }
  }
};

export async function fetchSaleItems(size) {
  try {
    const response = await api.get(`${endpoint()}shop/sales/${size}`);
    return response.data;
  } catch (err) {
    if (err.response && err.response.data) {
      throw new Error(err.response.data.error || 'An error occurred while fetching sale items.', { cause: err });
    } else {
      throw new Error('An error occurred while fetching sale items.', { cause: err });
    }
  }
};

export async function fetchLauncherImages() {
  try {
    const response = await api.get(`${endpoint()}launcherImages`);
    return response.data;
  } catch (err) {
    if (err.response && err.response.data) {
      throw new Error(err.response.data.error || 'An error occurred while fetching launcher images.', { cause: err });
    } else {
      throw new Error('An error occurred while fetching launcher images.', { cause: err });
    }
  }
};
