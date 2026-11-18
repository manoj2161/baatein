import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Send, Trash2, MessageCircle } from "lucide-react-native";
import axios from "axios";

import {
  getUnsentReplies,
  createUnsentReply,
  deleteUnsentReply,
  UnsentReply,
} from "../../services/unsentService";

export default function UnsentRepliesScreen() {
  const router = useRouter();
  const { unsentId } = useLocalSearchParams<{ unsentId: string }>();

  const [replies, setReplies] = useState<UnsentReply[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const loadReplies = useCallback(async () => {
    if (!unsentId) return;

    try {
      setError("");
      const response = await getUnsentReplies(unsentId);
      setReplies(response.replies || []);
    } catch (err) {
      console.error("Load Unsent replies error:", err);

      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            "Unable to load replies. Please try again.",
        );
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [unsentId]);

  useEffect(() => {
    loadReplies();
  }, [loadReplies]);

  const handleSendReply = async () => {
    const trimmedContent = content.trim();

    if (!trimmedContent) {
      Alert.alert("Empty reply", "Please write a reply first.");
      return;
    }

    if (trimmedContent.length > 1000) {
      Alert.alert("Reply too long", "Replies cannot exceed 1000 characters.");
      return;
    }

    try {
      setSending(true);

      await createUnsentReply(unsentId, trimmedContent);

      setContent("");
      await loadReplies();
    } catch (err) {
      console.error("Create Unsent reply error:", err);

      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || "Unable to send your reply."
        : "Something went wrong. Please try again.";

      Alert.alert("Reply failed", message);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteReply = (replyId: string) => {
    Alert.alert("Delete reply", "Are you sure you want to delete this reply?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteUnsentReply(unsentId, replyId);
            await loadReplies();
          } catch (err) {
            console.error("Delete Unsent reply error:", err);

            const message = axios.isAxiosError(err)
              ? err.response?.data?.message || "Unable to delete this reply."
              : "Something went wrong. Please try again.";

            Alert.alert("Delete failed", message);
          }
        },
      },
    ]);
  };

  const renderReply = ({ item }: { item: UnsentReply }) => {
    const date = new Date(item.createdAt);

    return (
      <View style={styles.replyCard}>
        <View style={styles.replyHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>A</Text>
          </View>

          <View style={styles.replyAuthorInfo}>
            <Text style={styles.replyAuthor}>Anonymous</Text>
            <Text style={styles.replyDate}>
              {date.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </Text>
          </View>

          {item.isOwnReply && (
            <Pressable
              style={styles.deleteButton}
              onPress={() => handleDeleteReply(item._id)}
            >
              <Trash2 size={17} color="#D64545" />
            </Pressable>
          )}
        </View>

        <Text style={styles.replyContent}>{item.content}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={22} color="#222222" />
          </Pressable>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Replies</Text>
            <Text style={styles.headerSubtitle}>
              A space to listen and understand.
            </Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>

        {loading ? (
          <View style={styles.stateContainer}>
            <ActivityIndicator size="large" color="#315EFB" />
            <Text style={styles.stateText}>Loading replies...</Text>
          </View>
        ) : error ? (
          <View style={styles.stateContainer}>
            <Text style={styles.stateText}>{error}</Text>

            <Pressable
              style={styles.retryButton}
              onPress={() => {
                setLoading(true);
                loadReplies();
              }}
            >
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            style={styles.replyList}
            data={replies}
            keyExtractor={(item) => item._id}
            renderItem={renderReply}
            contentContainerStyle={
              replies.length === 0 ? styles.emptyList : styles.listContent
            }
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIcon}>
                  <MessageCircle size={30} color="#315EFB" />
                </View>

                <Text style={styles.emptyTitle}>No replies yet</Text>

                <Text style={styles.emptyDescription}>
                  Be the first to respond. Sometimes a few words can mean a lot.
                </Text>
              </View>
            }
          />
        )}

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            placeholder="Write an anonymous reply..."
            placeholderTextColor="#999999"
            value={content}
            onChangeText={setContent}
            multiline
            maxLength={1000}
            editable={!sending}
            textAlignVertical="center"
            scrollEnabled
          />

          <Pressable
            style={[
              styles.sendButton,
              (!content.trim() || sending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendReply}
            disabled={!content.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Send size={19} color="#FFFFFF" />
            )}
          </Pressable>
        </View>

        <Text style={styles.characterCount}>{content.length}/1000</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    height: 65,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  backButton: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#222222",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#999999",
    marginTop: 3,
  },
  headerSpacer: {
    width: 39,
  },
  replyList: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 20,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 25,
  },
  replyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  replyHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#EFF4FF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#315EFB",
  },
  replyAuthorInfo: {
    flex: 1,
    marginLeft: 10,
  },
  replyAuthor: {
    fontSize: 13,
    fontWeight: "700",
    color: "#222222",
  },
  replyDate: {
    fontSize: 10,
    color: "#999999",
    marginTop: 3,
  },
  deleteButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#FFF1F1",
    alignItems: "center",
    justifyContent: "center",
  },
  replyContent: {
    fontSize: 14,
    lineHeight: 22,
    color: "#333333",
    marginTop: 13,
  },
  emptyContainer: {
    alignItems: "center",
    paddingHorizontal: 15,
  },
  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 23,
    backgroundColor: "#EFF4FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#222222",
  },
  emptyDescription: {
    fontSize: 13,
    lineHeight: 21,
    color: "#888888",
    textAlign: "center",
    marginTop: 9,
  },
  stateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 25,
  },
  stateText: {
    fontSize: 13,
    color: "#777777",
    textAlign: "center",
    marginTop: 12,
  },
  retryButton: {
    backgroundColor: "#315EFB",
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 18,
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 110,
    backgroundColor: "#F5F5F5",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#222222",
  },
  sendButton: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: "#315EFB",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
  characterCount: {
    textAlign: "right",
    color: "#AAAAAA",
    fontSize: 10,
    paddingHorizontal: 17,
    paddingTop: 5,
    paddingBottom: 8,
    backgroundColor: "#FFFFFF",
  },
});
