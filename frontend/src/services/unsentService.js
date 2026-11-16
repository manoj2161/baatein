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

// GET REPLIES FOR AN UNSENT MESSAGE
export const getUnsentReplies = async (unsentId) => {
  const response = await api.get(`/unsent/${unsentId}/replies`);
  return response.data.replies || [];
};

// CREATE AN ANONYMOUS REPLY
export const createUnsentReply = async (unsentId, content) => {
  const response = await api.post(`/unsent/${unsentId}/replies`, {
    content,
  });

  return response.data;
};

// DELETE YOUR OWN REPLY
export const deleteUnsentReply = async (unsentId, replyId) => {
  const response = await api.delete(`/unsent/${unsentId}/replies/${replyId}`);

  return response.data;
};
