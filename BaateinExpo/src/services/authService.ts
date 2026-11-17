import api, { saveAuthToken, clearAuthToken } from "./api";

export interface AuthUser {
  _id: string;
  username: string;
  email: string;
  profilePicture?: string;
  bio?: string;
}

interface AuthResponse {
  message: string;
  token: string;
  user: AuthUser;
}

// SIGNUP
export const signupUser = async (data: {
  username: string;
  email: string;
  password: string;
}): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/auth/signup", data);

  await saveAuthToken(response.data.token);

  return response.data;
};

// LOGIN
export const loginUser = async (data: {
  email: string;
  password: string;
}): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/auth/login", data);

  await saveAuthToken(response.data.token);

  return response.data;
};

// LOGOUT
export const logoutUser = async () => {
  try {
    await api.post("/auth/logout");
  } finally {
    await clearAuthToken();
  }
};

// GET CURRENT USER
export const getCurrentUser = async (): Promise<AuthUser> => {
  const response = await api.get<{ user: AuthUser }>("/users/profile");

  return response.data.user;
};
