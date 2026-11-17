
import axios from "axios";
import * as SecureStore from "expo-secure-store";

const API_URL = "https://baatein-1nk3.onrender.com/api";

const TOKEN_KEY = "baatein_auth_token";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Save JWT securely on the Android device
export const saveAuthToken = async (token: string) => {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

// Read saved JWT
export const getAuthToken = async () => {
  return await SecureStore.getItemAsync(TOKEN_KEY);
};

// Remove JWT during logout
export const clearAuthToken = async () => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
};

// Automatically attach JWT to every API request
api.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
