import api from "./api";

// Get logged-in user's profile
export const getMyProfile = async () => {
  const response = await api.get("/users/profile");
  return response.data.user || response.data;
};

// Get another user's profile
export const getUserProfile = async (userId: string) => {
  const response = await api.get(`/users/${userId}`);
  return response.data.user || response.data;
};

// Get user's posts
export const getUserPosts = async (userId: string) => {
  const response = await api.get(`/posts/user/${userId}`);
  return response.data.posts || [];
};

// Get followers or following
export const getFollowList = async (
  userId: string,
  type: "followers" | "following",
) => {
  const response = await api.get(`/users/${userId}/${type}`, {
    params: { type },
  });

  return response.data.users || [];
};

// Update profile
export const updateProfile = async (profileData: any) => {
  const response = await api.put("/users/profile", profileData);
  return response.data.user || response.data;
};

// Check username availability
export const checkUsernameAvailability = async (username: string) => {
  const response = await api.get("/users/username-availability", {
    params: { username },
  });

  return response.data;
};

// Upload profile picture
export const uploadProfilePicture = async (imageFile: any) => {
  const formData = new FormData();
  formData.append("profilePicture", imageFile);

  const response = await api.post("/users/profile/picture", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data.user || response.data;
};

// Remove profile picture
export const removeProfilePicture = async () => {
  const response = await api.delete("/users/profile/picture");
  return response.data.user || response.data;
};

// Follow user
export const followUser = async (userId: string) => {
  const response = await api.put(`/users/${userId}/follow`);
  return response.data;
};

// Unfollow user
export const unfollowUser = async (userId: string) => {
  const response = await api.put(`/users/${userId}/unfollow`);
  return response.data;
};
