import { Platform } from 'react-native';

export const CLOUD_API_URL = 'https://quickbill-restaurant-pos-1.onrender.com/api';
export const LOCAL_API_URL = 'http://192.168.1.42:5000/api';

// In development, default to your currently running local backend server
export const DEFAULT_API_URL = typeof __DEV__ !== 'undefined' && __DEV__
  ? LOCAL_API_URL
  : CLOUD_API_URL;

export const LOCAL_DEV_API_URL = Platform.OS === 'android'
  ? 'http://10.0.2.2:5000/api'
  : 'http://localhost:5000/api';

export const TRIAL_PERIOD_DAYS = 3;
