import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
  Trash2,
} from "lucide-react-native";

import { useAuth } from "../../context/AuthContext";
import { toggleLike, addComment, deletePost } from "../../services/postService";

interface PostUser {
  _id?: string;
  username?: string;
  profilePicture?: string;
}

interface Comment {
  _id?: string;
  user?: PostUser;
  text: string;
}

interface Post {
  _id: string;
  user?: PostUser;
  caption?: string;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  createdAt?: string;
  likes?: any[];
  comments?: Comment[];
}

interface FeedPostProps {
  post: Post;
  onDelete?: (postId: string) => void;
}

export default function FeedPost({ post, onDelete }: FeedPostProps) {
  const { user } = useAuth();

  const [liked, setLiked] = useState(
    post.likes?.some((id) => String(id?._id || id) === String(user?._id)) ||
      false,
  );

  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);

  const [comments, setComments] = useState<Comment[]>(post.comments || []);

  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const author = post.user || {};
  const authorId = author._id;

  const isOwner = String(authorId) === String(user?._id);

  const player = useVideoPlayer(
    post.mediaType === "video" ? post.mediaUrl || null : null,
    (videoPlayer) => {
      videoPlayer.loop = false;
      videoPlayer.muted = false;
    },
  );

  // LIKE / UNLIKE
  const handleLike = async () => {
    const previousLiked = liked;

    setLiked(!previousLiked);

    setLikesCount((count) => (previousLiked ? count - 1 : count + 1));

    try {
      await toggleLike(post._id);
    } catch (error) {
      setLiked(previousLiked);

      setLikesCount((count) => (previousLiked ? count + 1 : count - 1));

      console.error("Like failed:", error);
      Alert.alert("Error", "Unable to update like.");
    }
  };

  // ADD COMMENT
  const handleComment = async () => {
    const text = commentText.trim();

    if (!text || loading) return;

    try {
      setLoading(true);

      await addComment(post._id, text);

      setComments((previous) => [
        ...previous,
        {
          user: {
            _id: user?._id,
            username: user?.username,
            profilePicture: user?.profilePicture,
          },
          text,
        },
      ]);

      setCommentText("");
    } catch (error: any) {
      console.error("Comment failed:", error);

      Alert.alert(
        "Error",
        error.response?.data?.message || "Unable to add comment.",
      );
    } finally {
      setLoading(false);
    }
  };

  // DELETE POST
  const handleDelete = () => {
    setMenuOpen(false);

    Alert.alert("Delete post", "Are you sure you want to delete this post?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setDeleting(true);

            await deletePost(post._id);

            onDelete?.(post._id);
          } catch (error: any) {
            console.error("Delete failed:", error);

            Alert.alert(
              "Error",
              error.response?.data?.message || "Unable to delete this post.",
            );

            setDeleting(false);
          }
        },
      },
    ]);
  };

  const formattedDate = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString()
    : "";

  return (
    <View style={styles.container}>
      {/* Post Header */}
      <View style={styles.header}>
        <View style={styles.authorSection}>
          {author.profilePicture ? (
            <Image
              source={{ uri: author.profilePicture }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarLetter}>
                {author.username?.charAt(0)?.toUpperCase() || "U"}
              </Text>
            </View>
          )}

          <View style={styles.authorInfo}>
            <Text style={styles.username}>{author.username || "User"}</Text>

            <Text style={styles.date}>{formattedDate}</Text>
          </View>
        </View>

        {/* Owner Menu */}
        {isOwner && (
          <View style={styles.menuContainer}>
            <Pressable
              style={styles.menuButton}
              onPress={() => setMenuOpen((previous) => !previous)}
              disabled={deleting}
            >
              <MoreHorizontal size={23} color="#555555" />
            </Pressable>

            {menuOpen && (
              <View style={styles.menu}>
                <Pressable
                  style={styles.deleteMenuItem}
                  onPress={handleDelete}
                  disabled={deleting}
                >
                  <Trash2 size={17} color="#E04444" />

                  <Text style={styles.deleteMenuText}>Delete post</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Caption */}
      {!!post.caption && <Text style={styles.caption}>{post.caption}</Text>}

      {/* Post Media */}
      {post.mediaUrl && post.mediaType === "video" ? (
        <VideoView
          player={player}
          style={styles.media}
          contentFit="contain"
          nativeControls
        />
      ) : post.mediaUrl ? (
        <Image
          source={{ uri: post.mediaUrl }}
          style={styles.media}
          resizeMode="contain"
        />
      ) : null}

      {/* Likes and Comments Count */}
      <View style={styles.actions}>
        <Pressable style={styles.actionButton} onPress={handleLike}>
          <Heart
            size={24}
            color={liked ? "#EF4444" : "#444444"}
            fill={liked ? "#EF4444" : "transparent"}
          />

          <Text style={styles.actionCount}>{likesCount}</Text>
        </Pressable>

        <View style={styles.actionButton}>
          <MessageCircle size={23} color="#444444" />

          <Text style={styles.actionCount}>{comments.length}</Text>
        </View>
      </View>

      {/* Comments */}
      {comments.length > 0 && (
        <View style={styles.commentsContainer}>
          {comments.map((comment, index) => (
            <Text key={comment._id || index} style={styles.comment}>
              <Text style={styles.commentUsername}>
                {comment.user?.username || "User"}{" "}
              </Text>

              <Text style={styles.commentText}>{comment.text}</Text>
            </Text>
          ))}
        </View>
      )}

      {/* Add Comment */}
      <View style={styles.commentInputContainer}>
        <TextInput
          style={styles.commentInput}
          placeholder="Write a comment..."
          placeholderTextColor="#999999"
          value={commentText}
          onChangeText={setCommentText}
          maxLength={500}
          editable={!loading}
          returnKeyType="send"
          onSubmitEditing={handleComment}
        />

        <Pressable
          style={styles.sendButton}
          onPress={handleComment}
          disabled={loading || !commentText.trim()}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#315efb" />
          ) : (
            <Send size={19} color="#315efb" />
          )}
        </Pressable>
      </View>

      {deleting && (
        <View style={styles.deletingOverlay}>
          <ActivityIndicator color="#315efb" />
          <Text style={styles.deletingText}>Deleting post...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    marginBottom: 18,
    overflow: "visible",
  },
  header: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  authorSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 11,
  },
  avatar: {
    width: 43,
    height: 43,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: "#315efb",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  authorInfo: {
    flex: 1,
    gap: 4,
  },
  username: {
    fontSize: 14,
    fontWeight: "700",
    color: "#171717",
  },
  date: {
    fontSize: 11,
    color: "#888888",
  },
  menuContainer: {
    position: "relative",
    zIndex: 10,
  },
  menuButton: {
    width: 38,
    height: 38,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  menu: {
    position: "absolute",
    top: 40,
    right: 0,
    width: 155,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEEEEE",
    borderRadius: 10,
    elevation: 6,
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  deleteMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 13,
  },
  deleteMenuText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#E04444",
  },
  caption: {
    paddingHorizontal: 15,
    paddingBottom: 12,
    fontSize: 14,
    lineHeight: 21,
    color: "#333333",
  },
  media: {
    width: "100%",
    height: 380,
    backgroundColor: "#F5F5F5",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 25,
    paddingHorizontal: 15,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F1",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionCount: {
    fontSize: 13,
    fontWeight: "600",
    color: "#444444",
  },
  commentsContainer: {
    paddingHorizontal: 15,
    paddingTop: 12,
    gap: 9,
  },
  comment: {
    fontSize: 13,
    lineHeight: 19,
  },
  commentUsername: {
    fontWeight: "700",
    color: "#222222",
  },
  commentText: {
    color: "#555555",
  },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 13,
  },
  commentInput: {
    flex: 1,
    minHeight: 42,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 9,
    paddingHorizontal: 12,
    fontSize: 13,
    color: "#171717",
  },
  sendButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  deletingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.8)",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
  },
  deletingText: {
    color: "#555555",
    fontSize: 12,
  },
});
