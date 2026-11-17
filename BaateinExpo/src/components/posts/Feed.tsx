import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { getFeed } from "../../services/postService";
import FeedPost from "./FeedPost";

interface Post {
  _id: string;
  [key: string]: any;
}

export default function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadFeed = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getFeed();
      setPosts(data);
    } catch (err: any) {
      console.error("Feed loading failed:", err);

      setError(err.response?.data?.message || "Unable to load feed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const handleDelete = (postId: string) => {
    setPosts((previous) => previous.filter((post) => post._id !== postId));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#315efb" />
        <Text style={styles.loadingText}>Loading posts...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.messageContainer}>
        <Text style={styles.errorText}>{error}</Text>

        <Pressable style={styles.retryButton} onPress={loadFeed}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (posts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No posts yet</Text>
        <Text style={styles.emptyText}>Follow people to see their posts.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {posts.map((post) => (
        <FeedPost key={post._id} post={post} onDelete={handleDelete} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginTop: 18,
  },
  loadingContainer: {
    paddingVertical: 35,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#777777",
    fontSize: 13,
    marginTop: 12,
  },
  messageContainer: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FEE2E2",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  errorText: {
    color: "#E04444",
    fontSize: 13,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: "#315efb",
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  emptyContainer: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 28,
    alignItems: "center",
    marginTop: 18,
  },
  emptyTitle: {
    color: "#171717",
    fontSize: 16,
    fontWeight: "700",
  },
  emptyText: {
    color: "#888888",
    fontSize: 13,
    marginTop: 8,
    textAlign: "center",
  },
});
