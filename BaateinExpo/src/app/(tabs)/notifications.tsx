import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  CheckCheck,
} from "lucide-react-native";

import {
  AppNotification,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../../services/notificationService";

export default function NotificationsScreen() {
  const router = useRouter();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState("");

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead,
  ).length;

  const fetchNotifications = useCallback(async () => {
    try {
      setError("");
      const data = await getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error("Notifications fetch error:", err);
      setError("Unable to load notifications. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleNotificationPress = async (notification: AppNotification) => {
    if (notification.isRead) return;

    // Update the UI immediately
    setNotifications((current) =>
      current.map((item) =>
        item._id === notification._id ? { ...item, isRead: true } : item,
      ),
    );

    try {
      await markNotificationAsRead(notification._id);
    } catch (err) {
      console.error("Mark notification read error:", err);

      // Restore the unread state if the request fails
      setNotifications((current) =>
        current.map((item) =>
          item._id === notification._id ? { ...item, isRead: false } : item,
        ),
      );

      Alert.alert("Error", "Unable to update notification.");
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0 || markingAll) return;

    try {
      setMarkingAll(true);

      await markAllNotificationsAsRead();

      setNotifications((current) =>
        current.map((item) => ({ ...item, isRead: true })),
      );
    } catch (err) {
      console.error("Mark all read error:", err);
      Alert.alert("Error", "Unable to update notifications.");
    } finally {
      setMarkingAll(false);
    }
  };

  const getNotificationText = (notification: AppNotification) => {
    if (notification.message?.trim()) {
      return notification.message;
    }

    switch (notification.type) {
      case "like":
        return "liked your post";
      case "comment":
        return "commented on your post";
      case "follow":
        return "started following you";
      default:
        return "interacted with you";
    }
  };

  const getNotificationIcon = (type: AppNotification["type"]) => {
    switch (type) {
      case "like":
        return <Heart size={17} color="#E53935" fill="#E53935" />;
      case "comment":
        return <MessageCircle size={17} color="#315EFB" />;
      case "follow":
        return <UserPlus size={17} color="#16A36A" />;
      default:
        return <Bell size={17} color="#777777" />;
    }
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);

    if (!Number.isFinite(seconds) || seconds < 0) return "Just now";
    if (seconds < 60) return "Just now";

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    return new Date(date).toLocaleDateString();
  };

  const renderNotification = ({ item }: { item: AppNotification }) => {
    const senderName = item.sender?.username || "Someone";

    return (
      <Pressable
        style={[
          styles.notificationItem,
          !item.isRead && styles.unreadNotification,
        ]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={styles.avatarWrapper}>
          {item.sender?.profilePicture ? (
            <Image
              source={{ uri: item.sender.profilePicture }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarLetter}>
                {senderName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.typeIcon}>{getNotificationIcon(item.type)}</View>
        </View>

        <View style={styles.notificationContent}>
          <Text style={styles.notificationText}>
            <Text style={styles.senderName}>{senderName} </Text>
            {getNotificationText(item)}
          </Text>

          <Text style={styles.timeText}>{getTimeAgo(item.createdAt)}</Text>
        </View>

        {item.post?.mediaUrl ? (
          <Image
            source={{ uri: item.post.mediaUrl }}
            style={styles.postThumbnail}
          />
        ) : !item.isRead ? (
          <View style={styles.unreadDot} />
        ) : null}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={23} color="#222222" />
        </Pressable>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.headerSubtitle}>{unreadCount} unread</Text>
          )}
        </View>

        <Pressable
          style={[
            styles.markAllButton,
            (unreadCount === 0 || markingAll) && styles.disabledButton,
          ]}
          onPress={handleMarkAllRead}
          disabled={unreadCount === 0 || markingAll}
        >
          {markingAll ? (
            <ActivityIndicator size="small" color="#315EFB" />
          ) : (
            <CheckCheck
              size={21}
              color={unreadCount > 0 ? "#315EFB" : "#AAAAAA"}
            />
          )}
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#315EFB" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Bell size={38} color="#BBBBBB" />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              fetchNotifications();
            }}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={renderNotification}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            notifications.length === 0 && styles.emptyList,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#315EFB"
              colors={["#315EFB"]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Bell size={34} color="#315EFB" />
              </View>
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptySubtitle}>
                When someone likes, comments on, or follows you, you'll see it
                here.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    height: 65,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 10,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#171717",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#777777",
    marginTop: 2,
  },
  markAllButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    backgroundColor: "#F5F5F5",
  },
  listContent: {
    paddingBottom: 25,
  },
  notificationItem: {
    minHeight: 86,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F2",
    backgroundColor: "#FFFFFF",
  },
  unreadNotification: {
    backgroundColor: "#F4F7FF",
  },
  avatarWrapper: {
    width: 52,
    height: 52,
    marginRight: 13,
  },
  avatar: {
    width: 49,
    height: 49,
    borderRadius: 25,
    backgroundColor: "#EEEEEE",
  },
  avatarPlaceholder: {
    width: 49,
    height: 49,
    borderRadius: 25,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontSize: 19,
    fontWeight: "800",
    color: "#315EFB",
  },
  typeIcon: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEEEEE",
    alignItems: "center",
    justifyContent: "center",
  },
  notificationContent: {
    flex: 1,
    justifyContent: "center",
    paddingRight: 8,
  },
  notificationText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#555555",
  },
  senderName: {
    fontWeight: "800",
    color: "#171717",
  },
  timeText: {
    fontSize: 11,
    color: "#999999",
    marginTop: 5,
  },
  postThumbnail: {
    width: 43,
    height: 50,
    borderRadius: 7,
    backgroundColor: "#EEEEEE",
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#315EFB",
    marginHorizontal: 5,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  loadingText: {
    fontSize: 13,
    color: "#888888",
    marginTop: 12,
  },
  errorText: {
    fontSize: 13,
    color: "#777777",
    textAlign: "center",
    marginTop: 14,
  },
  retryButton: {
    marginTop: 17,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 9,
    backgroundColor: "#315EFB",
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 38,
  },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#222222",
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: "#888888",
    textAlign: "center",
    marginTop: 8,
  },
});
