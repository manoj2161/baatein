import api from "./api";
import type { ImagePickerAsset } from "expo-image-picker";

// GET ACTIVE CONVERSATIONS
export const getConversations = async () => {
  const response = await api.get("/messages/conversations");
  return response.data.conversations || [];
};

// GET ARCHIVED CONVERSATIONS
export const getArchivedConversations = async () => {
  const response = await api.get("/messages/archived");
  return response.data.conversations || [];
};

// ARCHIVE CONVERSATION
export const archiveConversation = async (conversationId: string) => {
  const response = await api.patch(`/messages/${conversationId}/archive`);
  return response.data;
};

// UNARCHIVE CONVERSATION
export const unarchiveConversation = async (conversationId: string) => {
  const response = await api.patch(`/messages/${conversationId}/unarchive`);
  return response.data;
};

// DELETE CONVERSATION
export const deleteConversation = async (conversationId: string) => {
  const response = await api.delete(`/messages/${conversationId}`);
  return response.data;
};

// CREATE CONVERSATION
export const createConversation = async (userId: string) => {
  const response = await api.post("/messages/conversation", { userId });
  return response.data.conversation;
};

// GET MESSAGES
export const getMessages = async (conversationId: string) => {
  const response = await api.get(`/messages/${conversationId}`);
  return response.data.messages || [];
};

// SEND TEXT OR MEDIA MESSAGE
export const sendMessage = async (
  conversationId: string,
  text: string,
  asset: ImagePickerAsset | null = null,
) => {
  if (asset) {
    const formData = new FormData();

    formData.append("text", text || "");

    const fileName =
      asset.fileName ||
      `message-${Date.now()}.${asset.type === "video" ? "mp4" : "jpg"}`;

    const mimeType =
      asset.mimeType || (asset.type === "video" ? "video/mp4" : "image/jpeg");

    formData.append("media", {
      uri: asset.uri,
      name: fileName,
      type: mimeType,
    } as any);

    const response = await api.post(`/messages/${conversationId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data.newMessage;
  }

  const response = await api.post(`/messages/${conversationId}`, {
    text: text || "",
  });

  return response.data.newMessage;
};

// MARK MESSAGES AS READ
export const markMessagesAsRead = async (conversationId: string) => {
  if (!conversationId) {
    throw new Error("Conversation ID is required");
  }

  const response = await api.patch(`/messages/${conversationId}/read`);

  return response.data;
};

// SEARCH USERS
export const searchUsers = async (query: string) => {
  const response = await api.get("/explore/search", {
    params: { query },
  });

  return response.data.users || response.data.results || [];
};

// DELETE MESSAGES FOR EVERYONE
export const deleteMessagesForEveryone = async (
  conversationId: string,
  messageIds: string[],
) => {
  const response = await api.delete(
    `/messages/${conversationId}/messages/everyone`,
    {
      data: { messageIds },
    },
  );

  return response.data;
};

// DELETE MESSAGES FOR ME
export const deleteMessagesForMe = async (
  conversationId: string,
  messageIds: string[],
) => {
  const response = await api.delete(`/messages/${conversationId}/messages/me`, {
    data: { messageIds },
  });

  return response.data;
};
