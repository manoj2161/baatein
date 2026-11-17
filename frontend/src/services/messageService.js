import api from "../api/axios";

// Get all active conversations.
export const getConversations = async () => {
  const response = await api.get("/messages/conversations");
  return response.data.conversations || [];
};

// Get archived conversations.
export const getArchivedConversations = async () => {
  const response = await api.get("/messages/archived");
  return response.data.conversations || [];
};

// Archive a conversation.
export const archiveConversation = async (conversationId) => {
  const response = await api.patch(`/messages/${conversationId}/archive`);
  return response.data;
};

// Restore an archived conversation.
export const unarchiveConversation = async (conversationId) => {
  const response = await api.patch(`/messages/${conversationId}/unarchive`);
  return response.data;
};

// Delete a conversation for the current user.
export const deleteConversation = async (conversationId) => {
  const response = await api.delete(`/messages/${conversationId}`);
  return response.data;
};

// Create or get a conversation.
export const createConversation = async (userId) => {
  const response = await api.post("/messages/conversation", { userId });
  return response.data.conversation;
};

// Get messages of a conversation.
export const getMessages = async (conversationId) => {
  const response = await api.get(`/messages/${conversationId}`);
  return response.data.messages || [];
};

// Send a text message or a message with an attachment.
export const sendMessage = async (conversationId, text, file = null) => {
  if (file) {
    const formData = new FormData();

    formData.append("text", text || "");
    formData.append("media", file);

    const response = await api.post(`/messages/${conversationId}`, formData);

    return response.data.newMessage;
  }

  const response = await api.post(`/messages/${conversationId}`, { text });

  return response.data.newMessage;
};

// Mark received messages as read.
export const markMessagesAsRead = async (conversationId) => {
  if (!conversationId) {
    throw new Error("Conversation ID is required");
  }

  const response = await api.patch(`/messages/${conversationId}/read`);
  return response.data;
};

// Search users.
export const searchUsers = async (query) => {
  const response = await api.get(
    `/explore/search?query=${encodeURIComponent(query)}`,
  );

  return response.data.users || response.data.results || [];
};

// Delete selected messages for everyone.
export const deleteMessagesForEveryone = async (conversationId, messageIds) => {
  const response = await api.delete(
    `/messages/${conversationId}/messages/everyone`,
    {
      data: { messageIds },
    },
  );

  return response.data;
};

// Delete selected messages only for the current user.
export const deleteMessagesForMe = async (conversationId, messageIds) => {
  const response = await api.delete(`/messages/${conversationId}/messages/me`, {
    data: { messageIds },
  });

  return response.data;
};
