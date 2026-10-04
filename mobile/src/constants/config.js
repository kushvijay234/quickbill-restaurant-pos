import { Platform } from 'react-native';

// In development, default to local machine or production Render backend
export const DEFAULT_API_URL = 'https://quickbill-restaurant-pos-1.onrender.com/api';

// For local testing on Android Emulator: http://10.0.2.2:5000/api
// For local testing on iOS Simulator / Physical device: http://<YOUR_LOCAL_IP>:5000/api
export const LOCAL_DEV_API_URL = Platform.OS === 'android'
  ? 'http://10.0.2.2:5000/api'
  : 'http://localhost:5000/api';
