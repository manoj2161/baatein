import api from "./api";

export interface NotificationSender {
  _id: string;
  username: string;
  profilePicture?: string;
}

export interface NotificationPost {
  _id: string;
  mediaUrl?: string;
}

export interface AppNotification {
  _id: string;
  sender: NotificationSender;
  type: "like" | "comment" | "follow";
  post?: NotificationPost | null;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export const getNotifications = async (): Promise<AppNotification[]> => {
  const response = await api.get("/notifications");
  return response.data.notifications || [];
};

export const markNotificationAsRead = async (notificationId: string) => {
  const response = await api.put(`/notifications/${notificationId}/read`);

  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await api.put("/notifications/read-all");

  return response.data;
};
