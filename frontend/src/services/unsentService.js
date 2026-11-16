import api from "../api/axios";

// CREATE AN UNSENT MESSAGE
export const createUnsent = async (data) => {
  const response = await api.post("/unsent", data);
  return response.data;
};

// GET UNSENT FEED
export const getUnsentFeed = async () => {
  const response = await api.get("/unsent/feed");
  return response.data.unsent || [];
};

// GET MY UNSENT MESSAGES
export const getMyUnsent = async () => {
  const response = await api.get("/unsent/my");
  return response.data.unsent || [];
};

// TOGGLE "I FELT THIS TOO" REACTION
export const toggleUnsentReaction = async (unsentId) => {
  const response = await api.put(`/unsent/${unsentId}/reaction`);
  return response.data;
};

// DELETE MY UNSENT MESSAGE
export const deleteUnsent = async (unsentId) => {
  const response = await api.delete(`/unsent/${unsentId}`);
  return response.data;
};
