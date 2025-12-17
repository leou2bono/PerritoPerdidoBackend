// src/api/client.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AUTH_API = 'https://perrito-auth.fly.dev';
export const PROFILE_API = 'https://perrito-profile.fly.dev';

const client = axios.create();

client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('access');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = await AsyncStorage.getItem('refresh');
      if (!refresh) throw error;
      try {
        const res = await axios.post(`${AUTH_API}/auth/refresh`, { refresh });
        await AsyncStorage.setItem('access', res.data.access);
        original.headers.Authorization = `Bearer ${res.data.access}`;
        return client(original);
      } catch (e) {
        await AsyncStorage.multiRemove(['access', 'refresh']);
        throw error;
      }
    }
    throw error;
  }
);

export default client;
