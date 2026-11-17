import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Send,
  MessageCircle,
  ArrowLeft,
  Plus,
  LoaderCircle,
  MoreVertical,
  Archive,
  Trash2,
  RotateCcw,
  Check,
  X,
  MousePointer2,
  Paperclip,
  Image as ImageIcon,
  Video,
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";

import {
  getConversations,
  getArchivedConversations,
  createConversation,
  getMessages,
  sendMessage,
  searchUsers,
  markMessagesAsRead,
  archiveConversation,
  unarchiveConversation,
  deleteConversation,
  deleteMessagesForMe,
  deleteMessagesForEveryone,
} from "../services/messageService";

const MAX_FILE_SIZE = 100 * 1024 * 1024;

const getOtherUser = (conversation, currentUserId) => {
  return conversation?.participants?.find(
    (participant) => String(participant._id) !== String(currentUserId),
  );
};

const formatTime = (date) => {
  if (!date) return "";

  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatLastSeen = (date, now) => {
  if (!date) return "Offline";

  const difference = Math.max(0, now - new Date(date).getTime());
  const minutes = Math.floor(difference / 60000);

  if (minutes < 1) return "Last seen just now";
  if (minutes === 1) return "Last seen 1 minute ago";

  if (minutes < 60) {
    return `Last seen ${minutes} minutes ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours === 1) return "Last seen 1 hour ago";
  if (hours < 24) return `Last seen ${hours} hours ago`;

  const days = Math.floor(hours / 24);

  if (days === 1) return "Last seen yesterday";
  if (days < 7) return `Last seen ${days} days ago`;

  return `Last seen on ${new Date(date).toLocaleDateString()}`;
};

const getSenderId = (message) => {
  return typeof message.sender === "object"
    ? message.sender?._id
    : message.sender;
};

const getMessagePreview = (message) => {
  if (!message) return "Start a conversation";

  if (message.isDeletedForEveryone || message.deletedForEveryone) {
    return "This message was deleted";
  }

  if (message.text?.trim()) return message.text;

  if (message.mediaType === "image") return "Photo";
  if (message.mediaType === "video") return "Video";

  return "Start a conversation";
};

const Messages = () => {
  const { user, socket, onlineUsers } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [archivedConversations, setArchivedConversations] = useState([]);

  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");

  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState("");
  const [previewImage, setPreviewImage] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);

  const [showArchived, setShowArchived] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [selectedMessageIds, setSelectedMessageIds] = useState([]);
  const [contextMenu, setContextMenu] = useState(null);
  const [deletingMessages, setDeletingMessages] = useState(false);

  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const activeConversationRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const typingActiveRef = useRef(false);
  const messageInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const [viewportHeight, setViewportHeight] = useState(
    window.visualViewport?.height || window.innerHeight,
  );

  const [viewportOffsetTop, setViewportOffsetTop] = useState(
    window.visualViewport?.offsetTop || 0,
  );

  const currentUserId = user?._id;

  useEffect(() => {
    if (!previewImage) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") setPreviewImage("");
    };

    window.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [previewImage]);

  const selectedMessages = messages.filter((message) =>
    selectedMessageIds.includes(String(message._id)),
  );

  const canDeleteForEveryone =
    selectedMessages.length > 0 &&
    selectedMessages.every(
      (message) =>
        String(getSenderId(message)) === String(currentUserId) &&
        !message.isDeletedForEveryone &&
        !message.deletedForEveryone,
    );

  // MOBILE VIEWPORT HEIGHT
  useEffect(() => {
    const updateViewport = () => {
      const viewport = window.visualViewport;

      setViewportHeight(viewport?.height || window.innerHeight);
      setViewportOffsetTop(viewport?.offsetTop || 0);
    };

    updateViewport();

    window.visualViewport?.addEventListener("resize", updateViewport);
    window.visualViewport?.addEventListener("scroll", updateViewport);
    window.addEventListener("resize", updateViewport);

    return () => {
      window.visualViewport?.removeEventListener("resize", updateViewport);
      window.visualViewport?.removeEventListener("scroll", updateViewport);
      window.removeEventListener("resize", updateViewport);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    activeConversationRef.current = selectedConversation?._id || null;
  }, [selectedConversation]);

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);

    window.addEventListener("click", closeMenu);
    window.addEventListener("scroll", closeMenu, true);

    return () => {
      window.removeEventListener("click", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
    };
  }, []);

  // RESIZE MESSAGE INPUT
  useEffect(() => {
    const input = messageInputRef.current;

    if (!input) return;

    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 120)}px`;
  }, [messageText]);

  // CREATE AND CLEAN UP ATTACHMENT PREVIEW
  useEffect(() => {
    if (!selectedFile) {
      setFilePreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(selectedFile);
    setFilePreview(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [selectedFile]);

  const stopTyping = (conversationId) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    if (typingActiveRef.current && conversationId) {
      socketRef.current?.emit("stopTyping", { conversationId });
    }

    typingActiveRef.current = false;
  };

  const loadConversations = async () => {
    try {
      const data = await getConversations();
      setConversations(data);
    } catch (error) {
      console.error("Conversation loading error:", error);
      setError("Unable to load conversations.");
    } finally {
      setLoading(false);
    }
  };

  const loadArchivedConversations = async () => {
    try {
      const data = await getArchivedConversations();
      setArchivedConversations(data);
    } catch (error) {
      console.error("Archived conversation loading error:", error);
      setError("Unable to load archived conversations.");
    }
  };

  useEffect(() => {
    if (currentUserId) {
      loadConversations();
      loadArchivedConversations();
    }
  }, [currentUserId]);

  const markConversationRead = async (conversationId) => {
    if (!conversationId) return;

    try {
      const result = await markMessagesAsRead(conversationId);
      const readIds = new Set(result.messageIds || []);

      if (readIds.size > 0) {
        setMessages((previous) =>
          previous.map((message) =>
            readIds.has(message._id)
              ? {
                  ...message,
                  isRead: true,
                  readAt: new Date().toISOString(),
                }
              : message,
          ),
        );
      }

      setConversations((previous) =>
        previous.map((conversation) =>
          String(conversation._id) === String(conversationId)
            ? { ...conversation, unreadCount: 0 }
            : conversation,
        ),
      );

      setArchivedConversations((previous) =>
        previous.map((conversation) =>
          String(conversation._id) === String(conversationId)
            ? { ...conversation, unreadCount: 0 }
            : conversation,
        ),
      );
    } catch (error) {
      console.error("Mark messages as read error:", error);
    }
  };

  // SOCKET LISTENERS
  useEffect(() => {
    if (!socket || !currentUserId) return;

    socketRef.current = socket;

    const handleNewMessage = (newMessage) => {
      const conversationId =
        typeof newMessage.conversation === "object"
          ? newMessage.conversation?._id
          : newMessage.conversation;

      if (!conversationId) return;

      const isMine = String(getSenderId(newMessage)) === String(currentUserId);

      const isActive =
        String(activeConversationRef.current) === String(conversationId);

      if (isActive) {
        setMessages((previous) => {
          const exists = previous.some(
            (message) => message._id === newMessage._id,
          );

          if (exists) return previous;

          return [...previous, newMessage].sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
          );
        });

        if (!isMine) {
          markConversationRead(conversationId);
        }
      }

      setConversations((previous) => {
        const exists = previous.some(
          (conversation) => String(conversation._id) === String(conversationId),
        );

        if (!exists) {
          loadConversations();
          loadArchivedConversations();
          return previous;
        }

        return previous
          .map((conversation) => {
            if (String(conversation._id) !== String(conversationId)) {
              return conversation;
            }

            let unreadCount = conversation.unreadCount || 0;

            if (!isMine && !isActive) unreadCount += 1;
            if (isActive) unreadCount = 0;

            return {
              ...conversation,
              lastMessage: newMessage,
              updatedAt: newMessage.createdAt,
              unreadCount,
            };
          })
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      });

      loadArchivedConversations();
    };

    const handleMessagesSeen = (data) => {
      if (
        String(activeConversationRef.current) !== String(data.conversationId)
      ) {
        return;
      }

      const readIds = new Set(data.messageIds || []);

      setMessages((previous) =>
        previous.map((message) =>
          readIds.has(message._id)
            ? {
                ...message,
                isRead: true,
                readAt: new Date().toISOString(),
              }
            : message,
        ),
      );
    };

    const handleUnreadCountUpdated = (data) => {
      setConversations((previous) =>
        previous.map((conversation) =>
          String(conversation._id) === String(data.conversationId)
            ? {
                ...conversation,
                unreadCount: data.unreadCount,
              }
            : conversation,
        ),
      );
    };

    const handleUserTyping = (data) => {
      if (
        String(activeConversationRef.current) === String(data.conversationId)
      ) {
        setIsOtherUserTyping(true);
      }
    };

    const handleUserStoppedTyping = (data) => {
      if (
        String(activeConversationRef.current) === String(data.conversationId)
      ) {
        setIsOtherUserTyping(false);
      }
    };

    const handleMessagesDeletedForEveryone = (data) => {
      if (
        String(activeConversationRef.current) !== String(data.conversationId)
      ) {
        return;
      }

      const deletedIds = new Set((data.messageIds || []).map(String));

      setMessages((previous) =>
        previous.map((message) =>
          deletedIds.has(String(message._id))
            ? {
                ...message,
                text: "",
                mediaUrl: "",
                mediaType: "none",
                isDeletedForEveryone: true,
                deletedForEveryone: true,
                deletedAt: new Date().toISOString(),
              }
            : message,
        ),
      );

      setSelectedMessageIds((previous) =>
        previous.filter((id) => !deletedIds.has(String(id))),
      );

      loadConversations();
      loadArchivedConversations();
    };

    const handleMessagesHiddenForMe = (data) => {
      if (
        String(activeConversationRef.current) !== String(data.conversationId)
      ) {
        return;
      }

      const deletedIds = new Set((data.messageIds || []).map(String));

      setMessages((previous) =>
        previous.filter((message) => !deletedIds.has(String(message._id))),
      );

      setSelectedMessageIds((previous) =>
        previous.filter((id) => !deletedIds.has(String(id))),
      );

      loadConversations();
      loadArchivedConversations();
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("messagesSeen", handleMessagesSeen);
    socket.on("unreadCountUpdated", handleUnreadCountUpdated);
    socket.on("userTyping", handleUserTyping);
    socket.on("userStoppedTyping", handleUserStoppedTyping);

    // Support both event names for compatibility.
    socket.on("messagesDeletedForEveryone", handleMessagesDeletedForEveryone);
    socket.on("messagesDeleted", handleMessagesDeletedForEveryone);

    socket.on("messagesHiddenForMe", handleMessagesHiddenForMe);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messagesSeen", handleMessagesSeen);
      socket.off("unreadCountUpdated", handleUnreadCountUpdated);
      socket.off("userTyping", handleUserTyping);
      socket.off("userStoppedTyping", handleUserStoppedTyping);

      socket.off(
        "messagesDeletedForEveryone",
        handleMessagesDeletedForEveryone,
      );
      socket.off("messagesDeleted", handleMessagesDeletedForEveryone);

      socket.off("messagesHiddenForMe", handleMessagesHiddenForMe);

      socketRef.current = null;
    };
  }, [socket, currentUserId]);

  // LOAD MESSAGES
  useEffect(() => {
    if (!selectedConversation?._id) {
      setMessages([]);
      setSelectedMessageIds([]);
      setContextMenu(null);
      setIsOtherUserTyping(false);
      return;
    }

    let cancelled = false;
    const conversationId = selectedConversation._id;

    setIsOtherUserTyping(false);
    setSelectedMessageIds([]);
    setContextMenu(null);

    const loadMessagesForConversation = async () => {
      setMessagesLoading(true);
      setMessages([]);

      try {
        const data = await getMessages(conversationId);

        if (!cancelled) {
          setMessages((previous) => {
            const combined = [...data];

            previous.forEach((message) => {
              const exists = combined.some((item) => item._id === message._id);

              if (!exists) combined.push(message);
            });

            return combined.sort(
              (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
            );
          });

          markConversationRead(conversationId);
        }
      } catch (error) {
        console.error("Message loading error:", error);

        if (!cancelled) {
          setError("Unable to load messages.");
        }
      } finally {
        if (!cancelled) {
          setMessagesLoading(false);
        }
      }
    };

    loadMessagesForConversation();

    return () => {
      cancelled = true;
    };
  }, [selectedConversation?._id]);

  useEffect(() => {
    return () => {
      stopTyping(activeConversationRef.current);
    };
  }, [selectedConversation?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, isOtherUserTyping]);

  // SEARCH USERS
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        const results = await searchUsers(searchQuery);

        if (!cancelled) {
          setSearchResults(
            results.filter(
              (result) => String(result._id) !== String(currentUserId),
            ),
          );
        }
      } catch (error) {
        console.error("User search error:", error);
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, currentUserId]);

  // SELECT PHOTO OR VIDEO
  const handleFileSelection = (event) => {
    const file = event.target.files?.[0];

    // Allow selecting the same file again after removing it.
    event.target.value = "";

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "video/mp4",
      "video/webm",
      "video/quicktime",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Please select a supported image or video file.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("The selected file must be smaller than 100 MB.");
      return;
    }

    setError("");
    setSelectedFile(file);
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleStartConversation = async (otherUser) => {
    try {
      setError("");

      const conversation = await createConversation(otherUser._id);

      setConversations((previous) => {
        const exists = previous.some(
          (item) => String(item._id) === String(conversation._id),
        );

        if (exists) return previous;

        return [
          {
            ...conversation,
            unreadCount: conversation.unreadCount || 0,
          },
          ...previous,
        ];
      });

      setArchivedConversations((previous) =>
        previous.filter(
          (item) => String(item._id) !== String(conversation._id),
        ),
      );

      activeConversationRef.current = conversation._id;
      setSelectedConversation(conversation);
      setIsOtherUserTyping(false);
      setShowSearch(false);
      setSearchQuery("");
      setSearchResults([]);
      setShowArchived(false);
    } catch (error) {
      console.error("Create conversation error:", error);
      setError("Unable to start conversation.");
    }
  };

  const handleSelectConversation = (conversation) => {
    stopTyping(activeConversationRef.current);

    activeConversationRef.current = conversation._id;
    setSelectedConversation(conversation);
    setIsOtherUserTyping(false);
    setSelectedMessageIds([]);
    setContextMenu(null);
    setError("");
    setOpenMenuId(null);
    setSelectedFile(null);
    setMessageText("");
  };

  const handleBackToConversations = () => {
    stopTyping(activeConversationRef.current);
    activeConversationRef.current = null;
    setSelectedConversation(null);
    setSelectedMessageIds([]);
    setContextMenu(null);
    setIsOtherUserTyping(false);
    setMessageText("");
    setSelectedFile(null);
  };

  const handleArchiveConversation = async (conversation) => {
    try {
      setActionLoading(true);
      setError("");

      await archiveConversation(conversation._id);

      setConversations((previous) =>
        previous.filter(
          (item) => String(item._id) !== String(conversation._id),
        ),
      );

      setArchivedConversations((previous) => [
        conversation,
        ...previous.filter(
          (item) => String(item._id) !== String(conversation._id),
        ),
      ]);

      if (String(selectedConversation?._id) === String(conversation._id)) {
        stopTyping(conversation._id);
        activeConversationRef.current = null;
        setSelectedConversation(null);
        setMessages([]);
      }

      setOpenMenuId(null);
    } catch (error) {
      console.error("Archive conversation error:", error);
      setError("Unable to archive this conversation.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnarchiveConversation = async (conversation) => {
    try {
      setActionLoading(true);
      setError("");

      await unarchiveConversation(conversation._id);

      setArchivedConversations((previous) =>
        previous.filter(
          (item) => String(item._id) !== String(conversation._id),
        ),
      );

      setConversations((previous) => [
        conversation,
        ...previous.filter(
          (item) => String(item._id) !== String(conversation._id),
        ),
      ]);

      setOpenMenuId(null);
    } catch (error) {
      console.error("Unarchive conversation error:", error);
      setError("Unable to unarchive this conversation.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConversation = async (conversation) => {
    const otherUser = getOtherUser(conversation, currentUserId);

    const confirmed = window.confirm(
      `Delete your chat with ${otherUser?.username || "this user"}? This will remove it from your inbox.`,
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);
      setError("");

      await deleteConversation(conversation._id);

      setConversations((previous) =>
        previous.filter(
          (item) => String(item._id) !== String(conversation._id),
        ),
      );

      setArchivedConversations((previous) =>
        previous.filter(
          (item) => String(item._id) !== String(conversation._id),
        ),
      );

      if (String(selectedConversation?._id) === String(conversation._id)) {
        stopTyping(conversation._id);
        activeConversationRef.current = null;
        setSelectedConversation(null);
        setMessages([]);
      }

      setOpenMenuId(null);
    } catch (error) {
      console.error("Delete conversation error:", error);
      setError("Unable to delete this conversation.");
    } finally {
      setActionLoading(false);
    }
  };

  // RIGHT-CLICK ANY MESSAGE TO OPEN THE SELECTION MENU
  const handleMessageContextMenu = (event, message) => {
    event.preventDefault();
    event.stopPropagation();

    const menuWidth = 190;
    const menuHeight = 100;

    setContextMenu({
      messageId: String(message._id),
      x: Math.max(
        10,
        Math.min(event.clientX, window.innerWidth - menuWidth - 10),
      ),
      y: Math.max(
        10,
        Math.min(event.clientY, window.innerHeight - menuHeight - 10),
      ),
    });
  };

  const toggleMessageSelection = (messageId) => {
    setSelectedMessageIds((previous) =>
      previous.includes(String(messageId))
        ? previous.filter((id) => id !== String(messageId))
        : [...previous, String(messageId)],
    );

    setContextMenu(null);
  };

  const clearMessageSelection = () => {
    setSelectedMessageIds([]);
    setContextMenu(null);
  };

  const handleDeleteMessages = async (mode) => {
    if (!selectedConversation || selectedMessageIds.length === 0) return;

    if (mode === "everyone" && !canDeleteForEveryone) {
      setError("You can only delete your own messages for everyone.");
      return;
    }

    const description =
      mode === "everyone"
        ? "The selected messages will show as deleted for everyone."
        : "The selected messages will disappear only from your chat.";

    const confirmed = window.confirm(
      `Delete ${selectedMessageIds.length} selected message(s)? ${description}`,
    );

    if (!confirmed) return;

    try {
      setDeletingMessages(true);
      setError("");

      const result =
        mode === "everyone"
          ? await deleteMessagesForEveryone(
              selectedConversation._id,
              selectedMessageIds,
            )
          : await deleteMessagesForMe(
              selectedConversation._id,
              selectedMessageIds,
            );

      const deletedIds = new Set(
        (result.messageIds || selectedMessageIds).map(String),
      );

      if (mode === "everyone") {
        setMessages((previous) =>
          previous.map((message) =>
            deletedIds.has(String(message._id))
              ? {
                  ...message,
                  text: "",
                  mediaUrl: "",
                  mediaType: "none",
                  isDeletedForEveryone: true,
                  deletedForEveryone: true,
                  deletedAt: new Date().toISOString(),
                }
              : message,
          ),
        );
      } else {
        setMessages((previous) =>
          previous.filter((message) => !deletedIds.has(String(message._id))),
        );
      }

      clearMessageSelection();

      await loadConversations();
      await loadArchivedConversations();
    } catch (error) {
      console.error("Delete messages error:", error);
      setError(
        error.response?.data?.message || "Unable to delete selected messages.",
      );
    } finally {
      setDeletingMessages(false);
    }
  };

  // HANDLE TYPING
  const handleMessageChange = (event) => {
    const value = event.target.value;

    setMessageText(value);

    const conversationId = activeConversationRef.current;

    if (!conversationId || !socketRef.current?.connected) return;

    if (value.trim()) {
      if (!typingActiveRef.current) {
        socketRef.current.emit("typing", { conversationId });
        typingActiveRef.current = true;
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(conversationId);
      }, 1200);
    } else {
      stopTyping(conversationId);
    }
  };

  // SEND TEXT MESSAGE OR ATTACHMENT
  const handleSendMessage = async (event) => {
    event.preventDefault();

    const text = messageText.trim();
    const file = selectedFile;

    if ((!text && !file) || !selectedConversation || sending) return;

    stopTyping(selectedConversation._id);

    setSending(true);
    setError("");

    try {
      const newMessage = await sendMessage(
        selectedConversation._id,
        text,
        file,
      );

      setMessages((previous) => {
        const exists = previous.some(
          (message) => message._id === newMessage._id,
        );

        if (exists) return previous;

        return [...previous, newMessage].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
        );
      });

      setConversations((previous) => {
        const updated = previous.map((conversation) => {
          if (String(conversation._id) === String(selectedConversation._id)) {
            return {
              ...conversation,
              lastMessage: newMessage,
              updatedAt: newMessage.createdAt,
            };
          }

          return conversation;
        });

        return updated.sort(
          (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
        );
      });

      setMessageText("");
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Send message error:", error);

      setError(error.response?.data?.message || "Message could not be sent.");
    } finally {
      setSending(false);
    }
  };

  const activeUser = getOtherUser(selectedConversation, currentUserId);

  const isActiveUserOnline = activeUser
    ? onlineUsers.has(String(activeUser._id))
    : false;

  const displayedConversations = showArchived
    ? archivedConversations
    : conversations;

  return (
    <div
      className="fixed inset-x-0 z-0 overflow-hidden bg-[#f7f8fc] text-[#171717]"
      style={{
        top: `${viewportOffsetTop}px`,
        height: `${viewportHeight}px`,
      }}
    >
      <div className={selectedConversation ? "hidden md:block" : "block"}>
        <Sidebar />
      </div>

      <main
        className={`overflow-hidden md:ml-[240px] md:h-screen ${
          selectedConversation ? "h-full pt-0" : "h-[calc(100dvh-120px)] pt-0"
        }`}
      >
        <div
          className={`mx-auto flex h-full max-w-[1400px] flex-col ${
            selectedConversation
              ? "px-0 py-0 md:px-6 md:py-5"
              : "px-2 py-2 sm:px-3 md:px-6 md:py-5"
          }`}
        >
          <div className="mb-3 hidden shrink-0 md:block">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Messages
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Connect and chat with people on Baatein.
            </p>
          </div>

          {error && (
            <div className="mb-2 flex shrink-0 items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              <span className="break-words">{error}</span>
              <button
                onClick={() => setError("")}
                title="Dismiss"
                className="shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div
            className={`grid min-h-0 flex-1 grid-cols-1 overflow-hidden border border-gray-200/80 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.04)] md:grid-cols-[320px_1fr] lg:grid-cols-[350px_1fr] ${
              selectedConversation
                ? "rounded-none md:rounded-2xl"
                : "rounded-xl md:rounded-2xl"
            }`}
          >
            {/* LEFT PANEL */}
            <section
              className={`min-h-0 flex-col border-r border-gray-100 ${
                selectedConversation ? "hidden md:flex" : "flex"
              }`}
            >
              <div className="border-b border-gray-100 p-3 sm:p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold">
                    {showArchived ? "Archived" : "Chats"}
                  </h2>

                  <button
                    onClick={() => {
                      setShowSearch(!showSearch);
                      setSearchQuery("");
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-[#315efb] transition hover:bg-blue-100"
                    title="New message"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                <div className="mb-3 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setShowArchived(false);
                      setShowSearch(false);
                      setOpenMenuId(null);
                    }}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                      !showArchived
                        ? "bg-blue-50 text-[#315efb]"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    Chats
                  </button>

                  <button
                    onClick={() => {
                      setShowArchived(true);
                      setShowSearch(false);
                      setOpenMenuId(null);
                      loadArchivedConversations();
                    }}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                      showArchived
                        ? "bg-blue-50 text-[#315efb]"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    <Archive size={14} />
                    Archived
                  </button>
                </div>

                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value);
                      setShowSearch(true);
                    }}
                    onFocus={() => setShowSearch(true)}
                    placeholder="Search people..."
                    className="w-full rounded-xl bg-gray-100 py-3 pl-10 pr-4 text-sm outline-none transition focus:bg-blue-50 focus:ring-1 focus:ring-[#315efb]"
                  />
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                {showSearch && searchQuery.trim() ? (
                  <div>
                    <p className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Search results
                    </p>

                    {searchResults.length === 0 ? (
                      <p className="px-4 py-5 text-center text-sm text-gray-400">
                        No users found.
                      </p>
                    ) : (
                      searchResults.map((result) => (
                        <button
                          key={result._id}
                          onClick={() => handleStartConversation(result)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-gray-50"
                        >
                          <img
                            src={
                              result.profilePicture ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                result.username,
                              )}&background=e8edff&color=315efb`
                            }
                            alt={result.username}
                            className="h-11 w-11 rounded-full object-cover"
                          />

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-900">
                              {result.username}
                            </p>
                            <p className="truncate text-xs text-gray-500">
                              {result.bio || "Baatein user"}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                ) : loading && !showArchived ? (
                  <div className="flex justify-center py-10">
                    <LoaderCircle className="animate-spin text-[#315efb]" />
                  </div>
                ) : displayedConversations.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    {showArchived ? (
                      <Archive
                        size={36}
                        className="mx-auto mb-3 text-gray-300"
                      />
                    ) : (
                      <MessageCircle
                        size={36}
                        className="mx-auto mb-3 text-gray-300"
                      />
                    )}

                    <p className="font-semibold text-gray-700">
                      {showArchived
                        ? "No archived conversations"
                        : "No conversations yet"}
                    </p>

                    <p className="mt-1 text-sm text-gray-400">
                      {showArchived
                        ? "Conversations you archive will appear here."
                        : "Search for someone to start chatting."}
                    </p>
                  </div>
                ) : (
                  displayedConversations.map((conversation) => {
                    const otherUser = getOtherUser(conversation, currentUserId);

                    if (!otherUser) return null;

                    const active =
                      String(selectedConversation?._id) ===
                      String(conversation._id);

                    const unreadCount = conversation.unreadCount || 0;
                    const isOnline = onlineUsers.has(String(otherUser._id));

                    return (
                      <div
                        key={conversation._id}
                        className={`relative flex items-center gap-3 px-4 py-4 transition ${
                          active ? "bg-blue-50/80" : "hover:bg-gray-50"
                        }`}
                      >
                        <button
                          onClick={() => handleSelectConversation(conversation)}
                          className="flex min-w-0 flex-1 items-center gap-3 text-left"
                        >
                          <div className="relative shrink-0">
                            <img
                              src={
                                otherUser.profilePicture ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  otherUser.username,
                                )}&background=e8edff&color=315efb`
                              }
                              alt={otherUser.username}
                              className="h-12 w-12 rounded-full object-cover"
                            />

                            {!showArchived && isOnline && (
                              <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-gray-900">
                              {otherUser.username}
                            </p>

                            <p
                              className={`mt-1 truncate text-xs ${
                                unreadCount > 0
                                  ? "font-semibold text-gray-900"
                                  : "text-gray-500"
                              }`}
                            >
                              {getMessagePreview(conversation.lastMessage)}
                            </p>
                          </div>
                        </button>

                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <span className="text-[10px] text-gray-400">
                            {formatTime(conversation.lastMessage?.createdAt)}
                          </span>

                          {unreadCount > 0 && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#315efb] px-1.5 text-[10px] font-semibold text-white">
                              {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                          )}
                        </div>

                        <div className="relative shrink-0">
                          <button
                            onClick={() =>
                              setOpenMenuId((previous) =>
                                previous === conversation._id
                                  ? null
                                  : conversation._id,
                              )
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-200 hover:text-gray-700"
                            title="Chat options"
                          >
                            <MoreVertical size={18} />
                          </button>

                          {openMenuId === conversation._id && (
                            <div className="absolute right-0 top-9 z-20 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                              {showArchived ? (
                                <button
                                  disabled={actionLoading}
                                  onClick={() =>
                                    handleUnarchiveConversation(conversation)
                                  }
                                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                >
                                  <RotateCcw size={16} />
                                  Unarchive
                                </button>
                              ) : (
                                <button
                                  disabled={actionLoading}
                                  onClick={() =>
                                    handleArchiveConversation(conversation)
                                  }
                                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                >
                                  <Archive size={16} />
                                  Archive
                                </button>
                              )}

                              <button
                                disabled={actionLoading}
                                onClick={() =>
                                  handleDeleteConversation(conversation)
                                }
                                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                              >
                                <Trash2 size={16} />
                                Delete chat
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* RIGHT CHAT PANEL */}
            <section
              className={`relative min-h-0 min-w-0 flex-col overflow-hidden ${
                selectedConversation ? "flex" : "hidden md:flex"
              }`}
            >
              {selectedConversation && activeUser ? (
                <>
                  {/* CHAT HEADER */}
                  <div className="flex shrink-0 items-center gap-3 border-b border-gray-100 bg-white px-3 py-3 md:px-6 md:py-3.5">
                    <button
                      onClick={handleBackToConversations}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100 hover:text-[#315efb] md:hidden"
                      aria-label="Back to conversations"
                      title="Back to conversations"
                    >
                      <ArrowLeft size={22} />
                    </button>

                    <Link
                      to={`/profile/${activeUser._id}`}
                      className="relative shrink-0"
                      title={`View ${activeUser.username}'s profile`}
                    >
                      <img
                        src={
                          activeUser.profilePicture ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            activeUser.username,
                          )}&background=e8edff&color=315efb`
                        }
                        alt={activeUser.username}
                        className="h-10 w-10 rounded-full object-cover md:h-11 md:w-11"
                      />

                      {isActiveUserOnline && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                      )}
                    </Link>

                    <div className="min-w-0">
                      <Link
                        to={`/profile/${activeUser._id}`}
                        className="block truncate text-sm font-bold text-gray-900 transition hover:text-[#315efb]"
                        title={`View ${activeUser.username}'s profile`}
                      >
                        {activeUser.username}
                      </Link>

                      <p
                        className={`mt-0.5 text-xs ${
                          isActiveUserOnline
                            ? "font-medium text-green-600"
                            : "text-gray-400"
                        }`}
                      >
                        {isOtherUserTyping
                          ? "Typing..."
                          : isActiveUserOnline
                            ? "Online"
                            : formatLastSeen(activeUser.lastSeen, currentTime)}
                      </p>
                    </div>
                  </div>

                  {/* SELECTION TOOLBAR */}
                  {selectedMessageIds.length > 0 && (
                    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-white px-3 py-3 sm:px-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Check size={17} className="text-[#315efb]" />
                        {selectedMessageIds.length} selected
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleDeleteMessages("me")}
                          disabled={deletingMessages}
                          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                        >
                          <Trash2 size={14} />
                          Delete for me
                        </button>

                        {canDeleteForEveryone && (
                          <button
                            onClick={() => handleDeleteMessages("everyone")}
                            disabled={deletingMessages}
                            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                          >
                            {deletingMessages ? (
                              <LoaderCircle
                                size={14}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2 size={14} />
                            )}
                            Delete for everyone
                          </button>
                        )}

                        <button
                          onClick={clearMessageSelection}
                          disabled={deletingMessages}
                          className="rounded-lg px-3 py-2 text-xs font-semibold text-gray-500 transition hover:bg-gray-100"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* MESSAGES AREA */}
                  <div className="relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain bg-[#f5f6fa] px-3 py-4 sm:px-4 sm:py-6 md:px-8">
                    {messagesLoading ? (
                      <div className="flex justify-center py-10">
                        <LoaderCircle className="animate-spin text-[#315efb]" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex h-full flex-col items-center justify-center text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[#315efb] shadow-sm">
                          <MessageCircle size={30} />
                        </div>

                        <p className="font-semibold text-gray-700">
                          Start your conversation
                        </p>

                        <p className="mt-1 text-sm text-gray-400">
                          Send a message to {activeUser.username}.
                        </p>
                      </div>
                    ) : (
                      <div className="mx-auto flex max-w-4xl flex-col gap-3">
                        {messages.map((message) => {
                          const isMine =
                            String(getSenderId(message)) ===
                            String(currentUserId);

                          const isSelected = selectedMessageIds.includes(
                            String(message._id),
                          );

                          const isDeleted =
                            message.isDeletedForEveryone ||
                            message.deletedForEveryone;

                          return (
                            <div
                              key={message._id}
                              className={`flex w-full ${
                                isMine ? "justify-end" : "justify-start"
                              }`}
                            >
                              <div
                                onContextMenu={(event) =>
                                  handleMessageContextMenu(event, message)
                                }
                                className={`group relative max-w-[88%] cursor-context-menu transition-all duration-150 sm:max-w-[75%] md:max-w-[68%] ${
                                  isSelected
                                    ? "rounded-[22px] ring-2 ring-[#315efb] ring-offset-2"
                                    : ""
                                }`}
                              >
                                <div
                                  className={`overflow-hidden rounded-[22px] px-3 py-3 shadow-[0_2px_8px_rgba(15,23,42,0.06)] sm:px-4 ${
                                    isDeleted
                                      ? "border border-gray-200 bg-gray-100 text-gray-500"
                                      : isMine
                                        ? "rounded-br-[7px] bg-[#315efb] text-white"
                                        : "rounded-bl-[7px] border border-gray-100/90 bg-white text-gray-800"
                                  }`}
                                >
                                  {isDeleted ? (
                                    <p className="flex items-center gap-2 px-1 text-[13px] italic">
                                      <Trash2 size={13} />
                                      This message was deleted
                                    </p>
                                  ) : (
                                    <>
                                      {message.mediaType === "image" &&
                                        message.mediaUrl && (
                                          <img
                                            src={message.mediaUrl}
                                            alt="Message attachment"
                                            loading="lazy"
                                            draggable="false"
                                            onClick={() =>
                                              setPreviewImage(message.mediaUrl)
                                            }
                                            className="mb-2 max-h-[360px] w-full max-w-[320px] cursor-zoom-in rounded-xl object-contain"
                                          />
                                        )}

                                      {message.mediaType === "video" &&
                                        message.mediaUrl && (
                                          <video
                                            src={message.mediaUrl}
                                            controls
                                            playsInline
                                            preload="metadata"
                                            className="mb-2 max-h-[360px] w-full max-w-[320px] rounded-xl bg-black"
                                          >
                                            Your browser does not support video
                                            playback.
                                          </video>
                                        )}

                                      {message.text && (
                                        <p className="whitespace-pre-wrap break-words px-1 text-[14px] leading-[1.55]">
                                          {message.text}
                                        </p>
                                      )}
                                    </>
                                  )}

                                  <div
                                    className={`mt-2 flex items-center justify-end gap-1.5 px-1 ${
                                      isDeleted
                                        ? "text-gray-400"
                                        : isMine
                                          ? "text-blue-100"
                                          : "text-gray-400"
                                    }`}
                                  >
                                    <span className="text-[10px] font-medium tracking-wide">
                                      {formatTime(message.createdAt)}
                                    </span>

                                    {isMine && !isDeleted && (
                                      <span className="flex items-center gap-0.5 text-[10px] font-medium">
                                        {message.isRead ? (
                                          <>
                                            <Check size={12} />
                                            <Check
                                              size={12}
                                              className="-ml-2"
                                            />
                                            Seen
                                          </>
                                        ) : (
                                          <>
                                            <Check size={12} />
                                            Sent
                                          </>
                                        )}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {isSelected && (
                                  <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#315efb] text-white shadow-sm">
                                    <Check size={11} />
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* RIGHT-CLICK MENU */}
                    {contextMenu && (
                      <div
                        className="fixed z-50 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl"
                        style={{
                          left: contextMenu.x,
                          top: contextMenu.y,
                        }}
                        onClick={(event) => event.stopPropagation()}
                        onContextMenu={(event) => event.preventDefault()}
                      >
                        <button
                          onClick={() =>
                            toggleMessageSelection(contextMenu.messageId)
                          }
                          className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                        >
                          {selectedMessageIds.includes(
                            String(contextMenu.messageId),
                          ) ? (
                            <X size={16} className="text-gray-500" />
                          ) : (
                            <MousePointer2
                              size={16}
                              className="text-[#315efb]"
                            />
                          )}

                          {selectedMessageIds.includes(
                            String(contextMenu.messageId),
                          )
                            ? "Deselect message"
                            : "Select message"}
                        </button>

                        {selectedMessageIds.length > 0 && (
                          <button
                            onClick={clearMessageSelection}
                            className="flex w-full items-center gap-2.5 border-t border-gray-100 px-4 py-3 text-left text-sm text-gray-600 transition hover:bg-gray-50"
                          >
                            <X size={16} />
                            Clear selection
                          </button>
                        )}
                      </div>
                    )}

                    {isOtherUserTyping && (
                      <div className="mt-4 flex justify-start">
                        <div className="rounded-2xl rounded-bl-[7px] border border-gray-100 bg-white px-4 py-3 text-xs text-gray-500 shadow-sm">
                          {activeUser.username} is typing...
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* ATTACHMENT PREVIEW */}
                  {selectedFile && filePreview && (
                    <div className="flex shrink-0 items-center gap-3 border-t border-gray-100 bg-white px-3 py-3 sm:px-5">
                      <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                        {selectedFile.type.startsWith("image/") ? (
                          <img
                            src={filePreview}
                            alt="Selected attachment"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-[#315efb]">
                            <Video size={25} />
                            <span className="text-[9px] font-semibold">
                              VIDEO
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-800">
                          {selectedFile.name}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={removeSelectedFile}
                        disabled={sending}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        title="Remove attachment"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )}

                  {/* MESSAGE INPUT */}
                  <form
                    onSubmit={handleSendMessage}
                    className="flex shrink-0 items-end gap-2 border-t border-gray-100 bg-white px-3 py-2 pb-[calc(8px+env(safe-area-inset-bottom))] sm:gap-3 sm:px-4 sm:py-3 md:px-6 md:pb-4"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                      onChange={handleFileSelection}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={sending || Boolean(selectedFile)}
                      className="mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#315efb] disabled:cursor-not-allowed disabled:opacity-40 sm:h-12 sm:w-12"
                      title="Attach photo or video"
                      aria-label="Attach photo or video"
                    >
                      <Paperclip size={20} />
                    </button>

                    <textarea
                      ref={messageInputRef}
                      rows={1}
                      value={messageText}
                      onChange={handleMessageChange}
                      onFocus={() => {
                        requestAnimationFrame(() => {
                          messageInputRef.current?.scrollIntoView({
                            block: "nearest",
                            behavior: "auto",
                          });
                        });
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          event.currentTarget.closest("form")?.requestSubmit();
                        }
                      }}
                      placeholder="Write a message..."
                      maxLength={5000}
                      className="max-h-[120px] min-h-[44px] min-w-0 flex-1 resize-none overflow-y-auto rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-base leading-5 outline-none transition placeholder:text-gray-400 focus:border-[#315efb] focus:bg-white focus:ring-2 focus:ring-blue-50 sm:px-5"
                    />

                    <button
                      type="submit"
                      disabled={
                        (!messageText.trim() && !selectedFile) || sending
                      }
                      className="mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#315efb] text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 sm:h-12 sm:w-12"
                      title="Send message"
                    >
                      {sending ? (
                        <LoaderCircle size={19} className="animate-spin" />
                      ) : (
                        <Send size={19} />
                      )}
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                  <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 text-[#315efb]">
                    <MessageCircle size={38} />
                  </div>

                  <h2 className="text-xl font-bold text-gray-900">
                    Your messages
                  </h2>

                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-gray-500">
                    Select a conversation or search for someone to start a
                    private chat.
                  </p>

                  <button
                    onClick={() => setShowSearch(true)}
                    className="mt-5 rounded-xl bg-[#315efb] px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    New message
                  </button>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {previewImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          onClick={() => setPreviewImage("")}
        >
          <button
            type="button"
            onClick={() => setPreviewImage("")}
            className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
            aria-label="Close image preview"
            title="Close"
          >
            <X size={24} />
          </button>

          <img
            src={previewImage}
            alt="Full-size message attachment"
            onClick={(event) => event.stopPropagation()}
            className="max-h-full max-w-full rounded-lg object-contain"
          />
        </div>
      )}
    </div>
  );
};

export default Messages;
