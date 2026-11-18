import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import {
  PenLine,
  Plus,
  Heart,
  MessageCircle,
  RefreshCw,
  Trash2,
} from "lucide-react-native";
import axios from "axios";

import {
  getUnsentFeed,
  getMyUnsent,
  toggleUnsentReaction,
  deleteUnsent,
  UnsentMessage,
} from "../../services/unsentService";

type ActiveTab = "all" | "mine";

export default function UnsentScreen() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<ActiveTab>("all");

  const [messages, setMessages] = useState<UnsentMessage[]>([]);
  const [myMessages, setMyMessages] = useState<UnsentMessage[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [reactingIds, setReactingIds] = useState<string[]>([]);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);

  const loadMessages = useCallback(async () => {
    try {
      setError("");

      const [feedResponse, myResponse] = await Promise.all([
        getUnsentFeed(),
        getMyUnsent(),
      ]);

      setMessages(feedResponse.unsent || []);
      setMyMessages(myResponse.unsent || []);
    } catch (err) {
      console.error("Load Unsent feed error:", err);

      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            "Unable to load messages. Please try again.",
        );
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMessages();
    }, [loadMessages]),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadMessages();
  };

  const openCreateScreen = () => {
    router.push("/unsent/create");
  };

  const handleReaction = async (unsentId: string) => {
    if (reactingIds.includes(unsentId)) return;

    setReactingIds((previous) => [...previous, unsentId]);

    try {
      await toggleUnsentReaction(unsentId);
      await loadMessages();
    } catch (err) {
      console.error("Unsent reaction error:", err);

      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || "Unable to update your reaction."
        : "Something went wrong. Please try again.";

      Alert.alert("Reaction failed", message);
    } finally {
      setReactingIds((previous) => previous.filter((id) => id !== unsentId));
    }
  };

  const handleDelete = (unsentId: string) => {
    const isOwnPost = myMessages.some((item) => item._id === unsentId);

    if (!isOwnPost || deletingIds.includes(unsentId)) return;

    Alert.alert(
      "Delete Unsent",
      "Are you sure you want to permanently delete this message and its replies?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeletingIds((previous) => [...previous, unsentId]);

            try {
              await deleteUnsent(unsentId);

              setMessages((previous) =>
                previous.filter((item) => item._id !== unsentId),
              );

              setMyMessages((previous) =>
                previous.filter((item) => item._id !== unsentId),
              );
            } catch (err) {
              console.error("Delete Unsent error:", err);

              const message = axios.isAxiosError(err)
                ? err.response?.data?.message ||
                  "Unable to delete this message."
                : "Something went wrong. Please try again.";

              Alert.alert("Delete failed", message);
            } finally {
              setDeletingIds((previous) =>
                previous.filter((id) => id !== unsentId),
              );
            }
          },
        },
      ],
    );
  };

  const openReplies = (unsentId: string) => {
    router.push({
      pathname: "/unsent/[unsentId]",
      params: { unsentId },
    });
  };

  const renderMessage = ({ item }: { item: UnsentMessage }) => {
    const date = new Date(item.createdAt);
    const isReacting = reactingIds.includes(item._id);
    const isDeleting = deletingIds.includes(item._id);

    const isOwnPost = myMessages.some((message) => message._id === item._id);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.isAnonymous
                ? "A"
                : item.author?.username?.charAt(0)?.toUpperCase() || "U"}
            </Text>
          </View>

          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>
              {item.isAnonymous
                ? "Anonymous"
                : item.author?.fullName || item.author?.username}
            </Text>

            <Text style={styles.date}>
              {date.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </Text>
          </View>

          <View style={styles.headerActions}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>

            {isOwnPost && (
              <Pressable
                style={styles.deleteButton}
                onPress={() => handleDelete(item._id)}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#D64545" />
                ) : (
                  <Trash2 size={17} color="#D64545" />
                )}
              </Pressable>
            )}
          </View>
        </View>

        <Text style={styles.messageContent}>{item.content}</Text>

        <View style={styles.cardFooter}>
          {activeTab === "all" && (
            <>
              <Pressable
                style={styles.actionItem}
                onPress={() => handleReaction(item._id)}
                disabled={isReacting || isDeleting}
              >
                {isReacting ? (
                  <ActivityIndicator size="small" color="#315EFB" />
                ) : (
                  <Heart
                    size={18}
                    color={item.isReacted ? "#315EFB" : "#777777"}
                    fill={item.isReacted ? "#315EFB" : "transparent"}
                  />
                )}

                <Text
                  style={[
                    styles.actionText,
                    item.isReacted && styles.reactedText,
                  ]}
                >
                  {item.reactionCount}
                </Text>
              </Pressable>

              <Pressable
                style={styles.actionItem}
                onPress={() => openReplies(item._id)}
                disabled={isDeleting}
              >
                <MessageCircle size={18} color="#777777" />
                <Text style={styles.actionText}>{item.replyCount}</Text>
              </Pressable>
            </>
          )}

          <View style={styles.visibilityBadge}>
            <Text style={styles.visibilityText}>
              {item.visibility === "anonymous"
                ? "Anonymous"
                : item.visibility === "followers"
                  ? "Followers"
                  : "Public"}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const currentMessages = activeTab === "all" ? messages : myMessages;

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color="#315EFB" />
          <Text style={styles.stateText}>Loading your space...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.stateContainer}>
          <RefreshCw size={35} color="#315EFB" />

          <Text style={styles.emptyHeading}>Unable to load messages</Text>

          <Text style={styles.stateText}>{error}</Text>

          <Pressable
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              loadMessages();
            }}
          >
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      );
    }

    if (activeTab === "mine") {
      return (
        <View style={styles.stateContainer}>
          <View style={styles.iconContainer}>
            <PenLine size={34} color="#315EFB" />
          </View>

          <Text style={styles.emptyHeading}>
            You haven't written anything yet.
          </Text>

          <Text style={styles.stateText}>
            Your private collection of unsent words will appear here. Write
            something whenever you're ready.
          </Text>

          <Pressable style={styles.emptyWriteButton} onPress={openCreateScreen}>
            <Plus size={17} color="#FFFFFF" />
            <Text style={styles.emptyWriteText}>Write an Unsent</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.stateContainer}>
        <View style={styles.iconContainer}>
          <PenLine size={34} color="#315EFB" />
        </View>

        <Text style={styles.emptyHeading}>Your unsent words belong here.</Text>

        <Text style={styles.stateText}>
          Share the thoughts, messages, and feelings you never had the courage
          to send. Your story, your choice, your identity.
        </Text>

        <Text style={styles.comingSoon}>
          Your space. Your words. Your story.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>The Unsent</Text>
            <Text style={styles.subtitle}>
              Some words are meant to be shared, even if they were never sent.
            </Text>
          </View>

          <Pressable style={styles.writeButton} onPress={openCreateScreen}>
            <Plus size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.tabsContainer}>
          <Pressable
            style={[
              styles.tabButton,
              activeTab === "all" && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("all")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "all" && styles.activeTabText,
              ]}
            >
              All Unsent
            </Text>

            <View
              style={[
                styles.tabCount,
                activeTab === "all" && styles.activeTabCount,
              ]}
            >
              <Text
                style={[
                  styles.tabCountText,
                  activeTab === "all" && styles.activeTabCountText,
                ]}
              >
                {messages.length}
              </Text>
            </View>
          </Pressable>

          <Pressable
            style={[
              styles.tabButton,
              activeTab === "mine" && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("mine")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "mine" && styles.activeTabText,
              ]}
            >
              My Unsent
            </Text>

            <View
              style={[
                styles.tabCount,
                activeTab === "mine" && styles.activeTabCount,
              ]}
            >
              <Text
                style={[
                  styles.tabCountText,
                  activeTab === "mine" && styles.activeTabCountText,
                ]}
              >
                {myMessages.length}
              </Text>
            </View>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={currentMessages}
        keyExtractor={(item) => item._id}
        renderItem={renderMessage}
        extraData={{
          activeTab,
          myMessages,
          reactingIds,
          deletingIds,
        }}
        contentContainerStyle={
          currentMessages.length === 0 ? styles.emptyList : styles.listContent
        }
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#315EFB"
            colors={["#315EFB"]}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <Pressable style={styles.floatingButton} onPress={openCreateScreen}>
        <Plus size={21} color="#FFFFFF" />
        <Text style={styles.floatingButtonText}>Write an Unsent</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 18,
  },
  header: {
    paddingTop: 18,
    paddingBottom: 14,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleContainer: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 25,
    fontWeight: "800",
    color: "#315EFB",
  },
  subtitle: {
    fontSize: 13,
    color: "#777777",
    lineHeight: 20,
    marginTop: 7,
  },
  writeButton: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: "#315EFB",
    alignItems: "center",
    justifyContent: "center",
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#EEEEF2",
    borderRadius: 13,
    padding: 4,
    marginTop: 20,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 11,
    borderRadius: 10,
  },
  activeTabButton: {
    backgroundColor: "#FFFFFF",
    elevation: 2,
  },
  tabText: {
    color: "#777777",
    fontSize: 13,
    fontWeight: "600",
  },
  activeTabText: {
    color: "#315EFB",
    fontWeight: "800",
  },
  tabCount: {
    minWidth: 21,
    height: 21,
    paddingHorizontal: 5,
    borderRadius: 7,
    backgroundColor: "#E3E3E8",
    alignItems: "center",
    justifyContent: "center",
  },
  activeTabCount: {
    backgroundColor: "#EFF4FF",
  },
  tabCountText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#777777",
  },
  activeTabCountText: {
    color: "#315EFB",
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
    paddingBottom: 75,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 39,
    height: 39,
    borderRadius: 14,
    backgroundColor: "#EFF4FF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#315EFB",
    fontSize: 16,
    fontWeight: "800",
  },
  authorInfo: {
    flex: 1,
    marginLeft: 10,
  },
  authorName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#222222",
  },
  date: {
    fontSize: 11,
    color: "#999999",
    marginTop: 3,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    maxWidth: "48%",
  },
  categoryBadge: {
    backgroundColor: "#F1F4FF",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
    flexShrink: 1,
  },
  categoryText: {
    color: "#315EFB",
    fontSize: 10,
    fontWeight: "700",
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#FFF1F1",
    alignItems: "center",
    justifyContent: "center",
  },
  messageContent: {
    color: "#333333",
    fontSize: 14,
    lineHeight: 23,
    marginTop: 17,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F1F1",
    paddingTop: 13,
    marginTop: 16,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
    gap: 6,
    minHeight: 28,
  },
  actionText: {
    color: "#777777",
    fontSize: 12,
  },
  reactedText: {
    color: "#315EFB",
    fontWeight: "700",
  },
  visibilityBadge: {
    marginLeft: "auto",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
  },
  visibilityText: {
    color: "#777777",
    fontSize: 10,
    fontWeight: "600",
  },
  stateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 15,
  },
  iconContainer: {
    width: 76,
    height: 76,
    borderRadius: 25,
    backgroundColor: "#EFF4FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyHeading: {
    fontSize: 19,
    fontWeight: "800",
    color: "#171717",
    textAlign: "center",
    marginTop: 20,
  },
  stateText: {
    fontSize: 13,
    lineHeight: 21,
    color: "#777777",
    textAlign: "center",
    marginTop: 12,
  },
  comingSoon: {
    color: "#AAAAAA",
    fontSize: 11,
    marginTop: 22,
  },
  emptyWriteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#315EFB",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 22,
  },
  emptyWriteText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  retryButton: {
    backgroundColor: "#315EFB",
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 10,
    marginTop: 20,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  floatingButton: {
    position: "absolute",
    bottom: 15,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#315EFB",
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 30,
    elevation: 5,
  },
  floatingButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});
