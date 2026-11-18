import axios from "axios";
import { Platform } from "react-native";

const API_URL = "https://baatein-1nk3.onrender.com/api";

const TOKEN_KEY = "baatein_auth_token";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Save JWT
export const saveAuthToken = async (token: string) => {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TOKEN_KEY, token);
    }
    return;
  }

  const SecureStore = await import("expo-secure-store");
  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

// Read JWT
export const getAuthToken = async (): Promise<string | null> => {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem(TOKEN_KEY);
    }
    return null;
  }

  const SecureStore = await import("expo-secure-store");
  return await SecureStore.getItemAsync(TOKEN_KEY);
};

// Remove JWT
export const clearAuthToken = async () => {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(TOKEN_KEY);
    }
    return;
  }

  const SecureStore = await import("expo-secure-store");
  await SecureStore.deleteItemAsync(TOKEN_KEY);
};

// Attach JWT to API requests
api.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

export default api;
