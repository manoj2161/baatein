import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  PenLine,
  Plus,
  Heart,
  MessageCircle,
  RefreshCw,
} from "lucide-react-native";
import axios from "axios";

import { getUnsentFeed, UnsentMessage } from "../../services/unsentService";

export default function UnsentScreen() {
  const router = useRouter();

  const [messages, setMessages] = useState<UnsentMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadMessages = useCallback(async () => {
    try {
      setError("");

      const response = await getUnsentFeed();

      setMessages(response.unsent || []);
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

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadMessages();
  };

  const openCreateScreen = () => {
    router.push("/unsent/create");
  };

  const renderMessage = ({ item }: { item: UnsentMessage }) => {
    const date = new Date(item.createdAt);

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

          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
        </View>

        <Text style={styles.messageContent}>{item.content}</Text>

        <View style={styles.cardFooter}>
          <View style={styles.actionItem}>
            <Heart
              size={17}
              color={item.isReacted ? "#315EFB" : "#777777"}
              fill={item.isReacted ? "#315EFB" : "transparent"}
            />
            <Text style={styles.actionText}>{item.reactionCount}</Text>
          </View>

          <View style={styles.actionItem}>
            <MessageCircle size={17} color="#777777" />
            <Text style={styles.actionText}>{item.replyCount}</Text>
          </View>

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
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item._id}
        renderItem={renderMessage}
        contentContainerStyle={
          messages.length === 0 ? styles.emptyList : styles.listContent
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
    paddingBottom: 18,
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
  categoryBadge: {
    backgroundColor: "#F1F4FF",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
    maxWidth: "42%",
  },
  categoryText: {
    color: "#315EFB",
    fontSize: 10,
    fontWeight: "700",
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
  },
  actionText: {
    color: "#777777",
    fontSize: 12,
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
