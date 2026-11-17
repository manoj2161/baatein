import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  ArrowLeft,
  Archive,
  ImagePlus,
  MoreVertical,
  Search,
  Send,
  Video,
} from "lucide-react-native";

import { useAuth } from "../../context/AuthContext";
import {
  getConversations,
  getArchivedConversations,
  createConversation,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  archiveConversation,
  unarchiveConversation,
  deleteConversation,
  searchUsers,
} from "../../services/messageService";

type AnyObject = Record<string, any>;

const getId = (value: any): string => {
  if (!value) return "";
  return String(typeof value === "object" ? value._id || value.id : value);
};

const getOtherUser = (conversation: AnyObject, currentUserId: string) => {
  const participants = conversation.participants || conversation.users || [];

  return (
    participants.find(
      (participant: any) => getId(participant) !== currentUserId,
    ) ||
    conversation.otherUser ||
    conversation.user ||
    {}
  );
};

const getName = (user: AnyObject) => user?.username || user?.name || "User";

const getProfilePicture = (user: AnyObject) =>
  user?.profilePicture || user?.avatar || null;

const getMessageText = (message: AnyObject) =>
  message?.text || message?.content || "";

const formatTime = (dateValue: any) => {
  if (!dateValue) return "";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function MessagesScreen() {
  const { user, socket, onlineUsers, unreadCounts } = useAuth();
  const navigation = useNavigation();
  const currentUserId = String(user?._id || "");
  const flatListRef = useRef<FlatList>(null);

  const [conversations, setConversations] = useState<AnyObject[]>([]);
  const [archivedConversations, setArchivedConversations] = useState<
    AnyObject[]
  >([]);
  const [messages, setMessages] = useState<AnyObject[]>([]);

  const [selectedConversation, setSelectedConversation] =
    useState<AnyObject | null>(null);
  const [selectedUser, setSelectedUser] = useState<AnyObject | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<AnyObject[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searching, setSearching] = useState(false);
  const [typingUser, setTypingUser] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      headerShown: !selectedConversation,
      tabBarStyle: selectedConversation ? { display: "none" } : undefined,
    });
  }, [navigation, selectedConversation]);

  const activeConversations = showArchived
    ? archivedConversations
    : conversations;

  const scrollToLatest = useCallback((animated = true) => {
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToEnd({ animated });
    });
  }, []);

  const addMessageIfNew = useCallback((newMessage: AnyObject) => {
    const newMessageId = getId(newMessage);

    setMessages((previous) => {
      if (
        newMessageId &&
        previous.some((message) => getId(message) === newMessageId)
      ) {
        return previous;
      }

      return [...previous, newMessage];
    });
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const [active, archived] = await Promise.all([
        getConversations(),
        getArchivedConversations(),
      ]);

      setConversations(active);
      setArchivedConversations(archived);
    } catch (error: any) {
      Alert.alert(
        "Messages",
        error.response?.data?.message || "Unable to load conversations.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const results = await searchUsers(searchQuery.trim());
        setSearchResults(results);
      } catch (error) {
        console.error("User search failed:", error);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const openConversation = async (
    conversation: AnyObject,
    otherUser?: AnyObject,
  ) => {
    Keyboard.dismiss();

    setSelectedConversation(conversation);
    setSelectedUser(otherUser || getOtherUser(conversation, currentUserId));
    setMessages([]);
    setMessagesLoading(true);
    setTypingUser(false);

    try {
      const conversationId = getId(conversation);

      const [messageList] = await Promise.all([
        getMessages(conversationId),
        markMessagesAsRead(conversationId),
      ]);

      // Remove any duplicate IDs returned by the API.
      const uniqueMessages = Array.from(
        new Map(
          messageList.map((message: AnyObject, index: number) => [
            getId(message) || `message-${index}`,
            message,
          ]),
        ).values(),
      );

      setMessages(uniqueMessages);

      setConversations((previous) =>
        previous.map((item) =>
          getId(item) === conversationId ? { ...item, unreadCount: 0 } : item,
        ),
      );
    } catch (error: any) {
      Alert.alert(
        "Messages",
        error.response?.data?.message || "Unable to load messages.",
      );
    } finally {
      setMessagesLoading(false);
      scrollToLatest(false);
    }
  };

  const startConversation = async (person: AnyObject) => {
    try {
      Keyboard.dismiss();

      const conversation = await createConversation(getId(person));

      setShowSearch(false);
      setSearchQuery("");
      setSearchResults([]);

      await loadConversations();
      await openConversation(conversation, person);
    } catch (error: any) {
      Alert.alert(
        "Messages",
        error.response?.data?.message || "Unable to start conversation.",
      );
    }
  };

  const closeConversation = () => {
    Keyboard.dismiss();
    setSelectedConversation(null);
    setSelectedUser(null);
    setTypingUser(false);
    setMessageText("");
  };

  useEffect(() => {
    if (!socket || !selectedConversation) return;

    const conversationId = getId(selectedConversation);

    const handleNewMessage = (message: AnyObject) => {
      const incomingConversationId = getId(message.conversation);

      if (incomingConversationId !== conversationId) return;

      addMessageIfNew(message);

      markMessagesAsRead(conversationId).catch(console.error);
      scrollToLatest();
    };

    const handleMessagesSeen = (data: AnyObject) => {
      if (
        data.conversationId &&
        String(data.conversationId) !== conversationId
      ) {
        return;
      }

      setMessages((previous) =>
        previous.map((message) => ({
          ...message,
          isRead: true,
          read: true,
        })),
      );
    };

    const handleTyping = (data: AnyObject) => {
      if (getId(data.conversationId) !== conversationId) return;
      if (getId(data.userId) === currentUserId) return;

      setTypingUser(true);
    };

    const handleStoppedTyping = (data: AnyObject) => {
      if (getId(data.conversationId) !== conversationId) return;
      setTypingUser(false);
    };

    const handleDeleted = (data: AnyObject) => {
      const deletedIds = data.messageIds || [];

      setMessages((previous) =>
        previous.map((message) =>
          deletedIds.includes(getId(message))
            ? {
                ...message,
                text: "This message was deleted",
                mediaUrl: null,
              }
            : message,
        ),
      );
    };

    const handleHidden = (data: AnyObject) => {
      const deletedIds = data.messageIds || [];

      setMessages((previous) =>
        previous.filter((message) => !deletedIds.includes(getId(message))),
      );
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("messagesSeen", handleMessagesSeen);
    socket.on("userTyping", handleTyping);
    socket.on("userStoppedTyping", handleStoppedTyping);
    socket.on("messagesDeletedForEveryone", handleDeleted);
    socket.on("messagesDeleted", handleDeleted);
    socket.on("messagesHiddenForMe", handleHidden);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messagesSeen", handleMessagesSeen);
      socket.off("userTyping", handleTyping);
      socket.off("userStoppedTyping", handleStoppedTyping);
      socket.off("messagesDeletedForEveryone", handleDeleted);
      socket.off("messagesDeleted", handleDeleted);
      socket.off("messagesHiddenForMe", handleHidden);
    };
  }, [
    socket,
    selectedConversation,
    currentUserId,
    scrollToLatest,
    addMessageIfNew,
  ]);

  useEffect(() => {
    if (!socket || !selectedConversation) return;

    const conversationId = getId(selectedConversation);

    if (messageText.trim()) {
      socket.emit("userTyping", { conversationId });
    } else {
      socket.emit("userStoppedTyping", { conversationId });
    }

    return () => {
      socket.emit("userStoppedTyping", { conversationId });
    };
  }, [messageText, socket, selectedConversation]);

  const handleSendMessage = async () => {
    const text = messageText.trim();

    if (!text || !selectedConversation || sending) return;

    setMessageText("");
    setSending(true);

    try {
      const newMessage = await sendMessage(getId(selectedConversation), text);

      addMessageIfNew(newMessage);

      loadConversations();
      scrollToLatest();
    } catch (error: any) {
      setMessageText(text);

      Alert.alert(
        "Message failed",
        error.response?.data?.message || "Unable to send message.",
      );
    } finally {
      setSending(false);
    }
  };

  const handleAttachment = async () => {
    if (!selectedConversation || sending) return;

    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission required",
          "Allow photo library access to attach media.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        allowsEditing: false,
        quality: 0.8,
        videoMaxDuration: 60,
      });

      if (result.canceled || !result.assets?.length) return;

      setSending(true);

      const newMessage = await sendMessage(
        getId(selectedConversation),
        messageText.trim(),
        result.assets[0],
      );

      // API response and Socket.IO can deliver the same message.
      // Add it only once using its database ID.
      addMessageIfNew(newMessage);

      setMessageText("");
      loadConversations();
      scrollToLatest();
    } catch (error: any) {
      Alert.alert(
        "Upload failed",
        error.response?.data?.message || "Unable to send attachment.",
      );
    } finally {
      setSending(false);
    }
  };

  const handleArchive = async (conversation: AnyObject) => {
    const conversationId = getId(conversation);

    try {
      if (showArchived) {
        await unarchiveConversation(conversationId);
      } else {
        await archiveConversation(conversationId);
      }

      await loadConversations();

      if (getId(selectedConversation) === conversationId) {
        closeConversation();
      }
    } catch (error: any) {
      Alert.alert(
        "Messages",
        error.response?.data?.message || "Unable to update conversation.",
      );
    }
  };

  const handleDeleteConversation = (conversation: AnyObject) => {
    Alert.alert(
      "Delete conversation",
      "Are you sure you want to delete this conversation?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteConversation(getId(conversation));

              if (getId(selectedConversation) === getId(conversation)) {
                closeConversation();
              }

              await loadConversations();
            } catch (error: any) {
              Alert.alert(
                "Error",
                error.response?.data?.message ||
                  "Unable to delete conversation.",
              );
            }
          },
        },
      ],
    );
  };

  const renderConversation = ({ item }: { item: AnyObject }) => {
    const otherUser = getOtherUser(item, currentUserId);
    const otherUserId = getId(otherUser);
    const isOnline = onlineUsers.has(otherUserId);
    const unreadCount = unreadCounts[getId(item)] ?? item.unreadCount ?? 0;

    const lastMessage =
      item.lastMessage ||
      item.latestMessage ||
      item.messages?.[item.messages.length - 1];

    return (
      <Pressable
        style={styles.conversationItem}
        onPress={() => openConversation(item, otherUser)}
      >
        <View style={styles.avatarContainer}>
          {getProfilePicture(otherUser) ? (
            <Image
              source={{ uri: getProfilePicture(otherUser) }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarLetter}>
                {getName(otherUser).charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          {isOnline && <View style={styles.onlineDot} />}
        </View>

        <View style={styles.conversationDetails}>
          <Text style={styles.username}>{getName(otherUser)}</Text>
          <Text numberOfLines={1} style={styles.lastMessage}>
            {getMessageText(lastMessage) || "Start a conversation"}
          </Text>
        </View>

        <View style={styles.conversationMeta}>
          <Text style={styles.timeText}>
            {formatTime(lastMessage?.createdAt || item.updatedAt)}
          </Text>

          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </Text>
            </View>
          )}

          <Pressable
            hitSlop={10}
            onPress={() => handleArchive(item)}
            style={styles.smallAction}
          >
            <Archive size={17} color="#777777" />
          </Pressable>
        </View>
      </Pressable>
    );
  };

  const renderSearchResult = ({ item }: { item: AnyObject }) => (
    <Pressable
      style={styles.conversationItem}
      onPress={() => startConversation(item)}
    >
      {getProfilePicture(item) ? (
        <Image
          source={{ uri: getProfilePicture(item) }}
          style={styles.avatar}
        />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarLetter}>
            {getName(item).charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      <View style={styles.conversationDetails}>
        <Text style={styles.username}>{getName(item)}</Text>
        <Text style={styles.lastMessage}>
          {item.fullName || item.email || "Tap to message"}
        </Text>
      </View>

      <Text style={styles.messageAction}>Message</Text>
    </Pressable>
  );

  const renderMessage = ({ item }: { item: AnyObject }) => {
    const senderId = getId(item.sender);
    const isMine = senderId === currentUserId;
    const mediaUrl = item.mediaUrl || item.media?.url || item.imageUrl || null;
    const isVideo = item.mediaType === "video" || item.media?.type === "video";

    return (
      <View
        style={[
          styles.messageRow,
          isMine ? styles.myMessageRow : styles.theirMessageRow,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isMine ? styles.myBubble : styles.theirBubble,
          ]}
        >
          {!!mediaUrl &&
            (isVideo ? (
              <View style={styles.videoPlaceholder}>
                <Video size={30} color="#FFFFFF" />
                <Text style={styles.videoText}>Video attachment</Text>
              </View>
            ) : (
              <Image
                source={{ uri: mediaUrl }}
                style={styles.messageImage}
                resizeMode="cover"
              />
            ))}

          {!!getMessageText(item) && (
            <Text style={[styles.messageText, isMine && styles.myMessageText]}>
              {getMessageText(item)}
            </Text>
          )}

          <View style={styles.messageFooter}>
            <Text style={[styles.messageTime, isMine && styles.myMessageTime]}>
              {formatTime(item.createdAt)}
            </Text>

            {isMine && (
              <Text style={styles.readReceipt}>
                {item.isRead || item.read ? "Seen" : "Sent"}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (selectedConversation) {
    const isOnline = onlineUsers.has(getId(selectedUser));

    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={styles.chatContainer}
          behavior="padding"
          keyboardVerticalOffset={0}
        >
          <View style={styles.chatHeader}>
            <Pressable onPress={closeConversation} style={styles.backButton}>
              <ArrowLeft size={23} color="#222222" />
            </Pressable>

            {getProfilePicture(selectedUser) ? (
              <Image
                source={{ uri: getProfilePicture(selectedUser) }}
                style={styles.chatAvatar}
              />
            ) : (
              <View style={styles.chatAvatarPlaceholder}>
                <Text style={styles.avatarLetter}>
                  {getName(selectedUser).charAt(0).toUpperCase()}
                </Text>
              </View>
            )}

            <View style={styles.chatUserDetails}>
              <Text style={styles.chatUsername}>{getName(selectedUser)}</Text>
              <Text style={styles.statusText}>
                {typingUser ? "Typing..." : isOnline ? "Online" : "Offline"}
              </Text>
            </View>

            <Pressable
              onPress={() => handleDeleteConversation(selectedConversation)}
              style={styles.headerAction}
            >
              <MoreVertical size={22} color="#555555" />
            </Pressable>
          </View>

          {messagesLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#315efb" />
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item, index) => getId(item) || String(index)}
              renderItem={renderMessage}
              contentContainerStyle={styles.messagesList}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() => scrollToLatest(false)}
              ListEmptyComponent={
                <Text style={styles.emptyMessages}>
                  No messages yet. Start the conversation.
                </Text>
              }
            />
          )}

          <View style={styles.composer}>
            <Pressable
              onPress={handleAttachment}
              style={styles.attachButton}
              disabled={sending}
            >
              <ImagePlus size={23} color="#555555" />
            </Pressable>

            <TextInput
              style={styles.messageInput}
              placeholder="Write a message..."
              placeholderTextColor="#999999"
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={5000}
              textAlignVertical="center"
              blurOnSubmit={false}
              returnKeyType="default"
              onFocus={() => scrollToLatest()}
            />

            <Pressable
              onPress={handleSendMessage}
              disabled={!messageText.trim() || sending}
              style={[
                styles.sendButton,
                (!messageText.trim() || sending) && styles.sendButtonDisabled,
              ]}
            >
              {sending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Send size={19} color="#FFFFFF" />
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.pageTitle}>Messages</Text>
          <Text style={styles.pageSubtitle}>Your conversations</Text>
        </View>

        <Pressable
          onPress={() => {
            setShowSearch((previous) => !previous);
            setSearchQuery("");
            setSearchResults([]);
          }}
          style={styles.searchButton}
        >
          <Search size={21} color="#315efb" />
        </Pressable>
      </View>

      {showSearch && (
        <View style={styles.searchContainer}>
          <Search size={19} color="#888888" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search people..."
            placeholderTextColor="#999999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        </View>
      )}

      {showSearch && searchQuery.trim().length > 0 ? (
        searching ? (
          <View style={styles.center}>
            <ActivityIndicator color="#315efb" />
          </View>
        ) : (
          <FlatList
            data={searchResults}
            keyExtractor={(item, index) => getId(item) || String(index)}
            renderItem={renderSearchResult}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text style={styles.emptyText}>No users found.</Text>
            }
          />
        )
      ) : (
        <>
          <View style={styles.filterRow}>
            <Pressable
              onPress={() => setShowArchived(false)}
              style={[
                styles.filterButton,
                !showArchived && styles.activeFilter,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  !showArchived && styles.activeFilterText,
                ]}
              >
                Chats
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setShowArchived(true)}
              style={[styles.filterButton, showArchived && styles.activeFilter]}
            >
              <Archive size={15} color={showArchived ? "#FFFFFF" : "#666666"} />
              <Text
                style={[
                  styles.filterText,
                  showArchived && styles.activeFilterText,
                ]}
              >
                Archived
              </Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#315efb" />
            </View>
          ) : (
            <FlatList
              data={activeConversations}
              keyExtractor={(item, index) => getId(item) || String(index)}
              renderItem={renderConversation}
              onRefresh={loadConversations}
              refreshing={loading}
              contentContainerStyle={
                activeConversations.length === 0 ? styles.emptyList : undefined
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyTitle}>
                    {showArchived
                      ? "No archived chats"
                      : "No conversations yet"}
                  </Text>
                  <Text style={styles.emptyText}>
                    Search for someone to start a conversation.
                  </Text>
                </View>
              }
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: 6,
    paddingBottom: 8,
  },
  pageHeader: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#222222",
  },
  pageSubtitle: {
    color: "#888888",
    fontSize: 13,
    marginTop: 3,
  },
  searchButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#EFF3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    marginHorizontal: 18,
    marginBottom: 12,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#F4F5F7",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
  },
  searchInput: {
    flex: 1,
    marginLeft: 9,
    color: "#222222",
    fontSize: 15,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 18,
    paddingBottom: 12,
    gap: 9,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 17,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "#F1F2F5",
  },
  activeFilter: {
    backgroundColor: "#315efb",
  },
  filterText: {
    color: "#666666",
    fontSize: 13,
    fontWeight: "600",
  },
  activeFilterText: {
    color: "#FFFFFF",
  },
  conversationItem: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F1",
  },
  avatarContainer: {
    position: "relative",
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
    backgroundColor: "#E8EDFF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    color: "#315efb",
    fontSize: 19,
    fontWeight: "700",
  },
  onlineDot: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    right: 0,
    bottom: 1,
  },
  conversationDetails: {
    flex: 1,
    marginLeft: 12,
  },
  username: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222222",
  },
  lastMessage: {
    fontSize: 13,
    color: "#888888",
    marginTop: 5,
  },
  conversationMeta: {
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 7,
  },
  timeText: {
    fontSize: 10,
    color: "#999999",
  },
  unreadBadge: {
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: "#315efb",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  unreadText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  smallAction: {
    padding: 3,
  },
  messageAction: {
    color: "#315efb",
    fontSize: 12,
    fontWeight: "700",
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingTop: 90,
  },
  emptyTitle: {
    color: "#333333",
    fontSize: 17,
    fontWeight: "700",
  },
  emptyText: {
    color: "#999999",
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  chatContainer: {
    flex: 1,
  },
  chatHeader: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  backButton: {
    padding: 7,
    marginRight: 5,
  },
  chatAvatar: {
    width: 39,
    height: 39,
    borderRadius: 20,
  },
  chatAvatarPlaceholder: {
    width: 39,
    height: 39,
    borderRadius: 20,
    backgroundColor: "#E8EDFF",
    alignItems: "center",
    justifyContent: "center",
  },
  chatUserDetails: {
    flex: 1,
    marginLeft: 10,
  },
  chatUsername: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222222",
  },
  statusText: {
    fontSize: 11,
    color: "#22A45A",
    marginTop: 3,
  },
  headerAction: {
    padding: 8,
  },
  messagesList: {
    padding: 15,
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  messageRow: {
    flexDirection: "row",
    marginVertical: 5,
  },
  myMessageRow: {
    justifyContent: "flex-end",
  },
  theirMessageRow: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "82%",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  myBubble: {
    backgroundColor: "#315efb",
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: "#F0F1F4",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    color: "#222222",
    fontSize: 14,
    lineHeight: 20,
  },
  myMessageText: {
    color: "#FFFFFF",
  },
  messageFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 5,
    gap: 7,
  },
  messageTime: {
    fontSize: 9,
    color: "#999999",
  },
  myMessageTime: {
    color: "#DCE4FF",
  },
  readReceipt: {
    fontSize: 9,
    color: "#DCE4FF",
  },
  messageImage: {
    width: 210,
    height: 190,
    borderRadius: 10,
    marginBottom: 5,
  },
  videoPlaceholder: {
    width: 210,
    height: 135,
    borderRadius: 10,
    backgroundColor: "#333333",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
  },
  videoText: {
    color: "#FFFFFF",
    fontSize: 12,
    marginTop: 7,
  },
  emptyMessages: {
    textAlign: "center",
    color: "#999999",
    fontSize: 13,
    marginVertical: 25,
  },
  composer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 9,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    backgroundColor: "#FFFFFF",
    gap: 8,
  },
  attachButton: {
    width: 38,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  messageInput: {
    flex: 1,
    maxHeight: 110,
    minHeight: 42,
    backgroundColor: "#F2F3F6",
    borderRadius: 22,
    paddingHorizontal: 15,
    paddingTop: 11,
    paddingBottom: 9,
    color: "#222222",
    fontSize: 14,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#315efb",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
});
