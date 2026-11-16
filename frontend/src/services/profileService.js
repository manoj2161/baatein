import api from "../api/axios";

// Get the logged-in user's own profile.
export const getMyProfile = async () => {
  const response = await api.get("/users/profile");
  return response.data.user || response.data;
};

// Get another user's profile.
export const getUserProfile = async (userId) => {
  const response = await api.get(`/users/${userId}`);
  return response.data.user || response.data;
};

// Get a user's posts.
export const getUserPosts = async (userId) => {
  const response = await api.get(`/posts/user/${userId}`);
  return response.data.posts || [];
};

// Get followers or following list.
export const getFollowList = async (userId, type) => {
  const response = await api.get(`/users/${userId}/${type}`, {
    params: { type },
  });

  return response.data.users || [];
};

export const updateProfile = async (profileData) => {
  const response = await api.put("/users/profile", profileData);
  return response.data.user || response.data;
};

export const checkUsernameAvailability = async (username) => {
  const response = await api.get("/users/username-availability", {
    params: { username },
  });

  return response.data;
};

export const uploadProfilePicture = async (imageFile) => {
  const formData = new FormData();
  formData.append("profilePicture", imageFile);

  const response = await api.post("/users/profile/picture", formData);
  return response.data.user || response.data;
};

export const removeProfilePicture = async () => {
  const response = await api.delete("/users/profile/picture");
  return response.data.user || response.data;
};

export const followUser = async (userId) => {
  const response = await api.put(`/users/${userId}/follow`);
  return response.data;
};

export const unfollowUser = async (userId) => {
  const response = await api.put(`/users/${userId}/unfollow`);
  return response.data;
};
