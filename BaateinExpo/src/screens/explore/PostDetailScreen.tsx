import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { getDiscoverPosts } from "../../services/postService";
import FeedPost from "../../components/posts/FeedPost";

export default function PostDetailScreen() {
  const router = useRouter();
  const { postId } = useLocalSearchParams<{ postId: string }>();

  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPost = async () => {
      try {
        setLoading(true);
        setError("");

        const posts = await getDiscoverPosts();

        const selectedPost = posts.find(
          (item: any) => String(item._id) === String(postId),
        );

        if (!selectedPost) {
          setError("This post could not be found.");
          return;
        }

        setPost(selectedPost);
      } catch (err: any) {
        console.error("Post detail error:", err);

        setError(err.response?.data?.message || "Unable to load this post.");
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      loadPost();
    }
  }, [postId]);

  const handleDelete = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={23} color="#171717" />
        </Pressable>

        <Text style={styles.headerTitle}>Post</Text>

        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#315EFB" />
          <Text style={styles.message}>Loading post...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{error}</Text>

          <Pressable style={styles.backToExplore} onPress={() => router.back()}>
            <Text style={styles.backToExploreText}>Go back</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <FeedPost post={post} onDelete={handleDelete} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  header: {
    height: 54,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  headerTitle: {
    color: "#171717",
    fontSize: 17,
    fontWeight: "700",
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    padding: 10,
    paddingBottom: 40,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 25,
  },
  message: {
    color: "#888888",
    fontSize: 13,
    marginTop: 12,
  },
  errorText: {
    color: "#E04444",
    fontSize: 14,
    textAlign: "center",
  },
  backToExplore: {
    marginTop: 16,
    backgroundColor: "#315EFB",
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 9,
  },
  backToExploreText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});
