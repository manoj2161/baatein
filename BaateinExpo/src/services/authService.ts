import api, { saveAuthToken, clearAuthToken } from "./api";

export interface AuthUser {
  _id: string;
  username: string;
  email: string;
  fullName?: string;
  profilePicture?: string;
  bio?: string;
  status?: string;
  phoneNumber?: string;
  followers?: string[];
  following?: string[];
}

// AUTH RESPONSE
interface AuthResponse {
  message: string;
  token: string;
  user: AuthUser;
}

// PROFILE UPDATE DATA
export interface UpdateProfileData {
  username?: string;
  fullName?: string;
  bio?: string;
  status?: string;
}

// EMAIL CHANGE RESPONSE
export interface EmailChangeResponse {
  message: string;
  pendingEmail: string;
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

// UPDATE PROFILE
export const updateProfile = async (
  data: UpdateProfileData,
): Promise<AuthUser> => {
  const response = await api.put<{ message: string; user: AuthUser }>(
    "/users/profile",
    data,
  );

  return response.data.user;
};

// REQUEST EMAIL CHANGE
export const requestEmailChange = async (
  email: string,
  currentPassword: string,
): Promise<EmailChangeResponse> => {
  const response = await api.post<EmailChangeResponse>(
    "/users/settings/email",
    {
      email: email.trim().toLowerCase(),
      currentPassword,
    },
  );

  return response.data;
};

// UPLOAD PROFILE PICTURE
export const uploadProfilePicture = async (
  imageUri: string,
  fileName: string,
  mimeType: string,
): Promise<AuthUser> => {
  const formData = new FormData();

  formData.append("profilePicture", {
    uri: imageUri,
    name: fileName,
    type: mimeType,
  } as any);

  const response = await api.post<{ message: string; user: AuthUser }>(
    "/users/profile/picture",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data.user;
};

// REMOVE PROFILE PICTURE
export const removeProfilePicture = async (): Promise<AuthUser> => {
  const response = await api.delete<{ message: string; user: AuthUser }>(
    "/users/profile/picture",
  );

  return response.data.user;
};

// CHECK USERNAME AVAILABILITY
export const checkUsernameAvailability = async (
  username: string,
): Promise<{ available: boolean; message: string }> => {
  const response = await api.get("/users/username-availability", {
    params: { username },
  });

  return response.data;
};
