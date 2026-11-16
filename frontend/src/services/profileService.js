import api from "../api/axios";

export const getUserProfile = async (userId) => {
  const response = await api.get(`/users/${userId}`);
  return response.data.user || response.data;
};

export const getUserPosts = async (userId) => {
  const response = await api.get(`/posts/user/${userId}`);
  return response.data.posts || [];
};

export const updateProfile = async (profileData) => {
  const response = await api.put("/users/profile", profileData);
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
