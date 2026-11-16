import api from "../api/axios";

export const getNotifications = async () => {
  const response = await api.get("/notifications");
  return response.data.notifications || [];
};

export const markNotificationRead = async (notificationId) => {
  const response = await api.put(`/notifications/${notificationId}/read`);

  return response.data;
};

export const markAllRead = async () => {
  const response = await api.put("/notifications/read-all");
  return response.data;
};
