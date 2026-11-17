import api from "../api/axios";

export const getConversations = async () => {
  const response = await api.get("/messages/conversations");
  return response.data.conversations || [];
};

export const getArchivedConversations = async () => {
  const response = await api.get("/messages/archived");
  return response.data.conversations || [];
};

export const archiveConversation = async (conversationId) => {
  const response = await api.patch(`/messages/${conversationId}/archive`);
  return response.data;
};

export const unarchiveConversation = async (conversationId) => {
  const response = await api.patch(`/messages/${conversationId}/unarchive`);
  return response.data;
};

export const deleteConversation = async (conversationId) => {
  const response = await api.delete(`/messages/${conversationId}`);
  return response.data;
};

export const createConversation = async (userId) => {
  const response = await api.post("/messages/conversation", { userId });
  return response.data.conversation;
};

export const getMessages = async (conversationId) => {
  const response = await api.get(`/messages/${conversationId}`);
  return response.data.messages || [];
};

export const sendMessage = async (conversationId, text, file = null) => {
  if (file) {
    const formData = new FormData();

    formData.append("text", text || "");
    formData.append("media", file);

    const response = await api.post(`/messages/${conversationId}`, formData);

    return response.data.newMessage;
  }

  const response = await api.post(`/messages/${conversationId}`, {
    text: text || "",
  });

  return response.data.newMessage;
};

export const markMessagesAsRead = async (conversationId) => {
  if (!conversationId) {
    throw new Error("Conversation ID is required");
  }

  const response = await api.patch(`/messages/${conversationId}/read`);
  return response.data;
};

export const searchUsers = async (query) => {
  const response = await api.get(
    `/explore/search?query=${encodeURIComponent(query)}`,
  );

  return response.data.users || response.data.results || [];
};

export const deleteMessagesForEveryone = async (conversationId, messageIds) => {
  const response = await api.delete(
    `/messages/${conversationId}/messages/everyone`,
    {
      data: { messageIds },
    },
  );

  return response.data;
};

export const deleteMessagesForMe = async (conversationId, messageIds) => {
  const response = await api.delete(`/messages/${conversationId}/messages/me`, {
    data: { messageIds },
  });

  return response.data;
};
