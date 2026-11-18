import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Search,
  Compass,
  Play,
  RefreshCw,
  ArrowLeft,
} from "lucide-react-native";
import { useRouter } from "expo-router";

import { getDiscoverPosts } from "../../services/postService";

interface Post {
  _id: string;
  mediaUrl?: string;
  mediaType?: "image" | "video";
}

function getVideoThumbnail(url: string) {
  if (!url.includes("/video/upload/")) {
    return null;
  }

  return url
    .replace("/video/upload/", "/video/upload/so_0/")
    .replace(/\.(mp4|mov|webm|m4v)(\?.*)?$/i, ".jpg$2");
}

export default function DiscoverScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const tileSize = (width - 8) / 3;

  const loadPosts = useCallback(async () => {
    try {
      setError("");

      const data = await getDiscoverPosts();
      setPosts(data);
    } catch (err: any) {
      console.error("Discover loading failed:", err);
      setError(err.response?.data?.message || "Unable to load discover posts.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadPosts();
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  const openPost = (postId: string) => {
    router.push({
      pathname: "/post/[postId]",
      params: { postId },
    });
  };

  const renderPost = ({ item }: { item: Post }) => {
    const thumbnail =
      item.mediaType === "video"
        ? getVideoThumbnail(item.mediaUrl || "")
        : item.mediaUrl;

    return (
      <Pressable
        style={[styles.postTile, { width: tileSize, height: tileSize }]}
        onPress={() => openPost(item._id)}
      >
        {thumbnail ? (
          <Image
            source={{ uri: thumbnail }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholder}>
            <Compass size={28} color="#A1A1AA" />
          </View>
        )}

        {item.mediaType === "video" && (
          <View style={styles.videoIcon}>
            <Play size={15} color="#FFFFFF" fill="#FFFFFF" />
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Pressable
            onPress={handleBack}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={23} color="#171717" />
          </Pressable>

          <Compass size={23} color="#315EFB" />
          <Text style={styles.title}>Discover</Text>
        </View>

        <Pressable
          onPress={() => router.push("/search")}
          style={styles.searchButton}
          accessibilityRole="button"
          accessibilityLabel="Search people"
        >
          <Search size={20} color="#333333" />
          <Text style={styles.searchText}>People</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#315EFB" />
          <Text style={styles.messageText}>Discovering posts...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>

          <Pressable
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              loadPosts();
            }}
          >
            <RefreshCw size={16} color="#FFFFFF" />
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item._id}
          numColumns={3}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
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
              <Compass size={38} color="#A1A1AA" />
              <Text style={styles.emptyTitle}>Nothing to discover yet</Text>
              <Text style={styles.emptyText}>
                New posts from the community will appear here.
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
    backgroundColor: "#FAFAFA",
  },
  header: {
    minHeight: 58,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  backButton: {
    width: 34,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 2,
  },
  title: {
    color: "#171717",
    fontSize: 21,
    fontWeight: "800",
  },
  searchButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  searchText: {
    color: "#333333",
    fontSize: 13,
    fontWeight: "600",
  },
  grid: {
    paddingBottom: 100,
  },
  row: {
    gap: 4,
    marginBottom: 4,
  },
  postTile: {
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
    position: "relative",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E5E7EB",
  },
  videoIcon: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  centerContainer: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  messageText: {
    color: "#777777",
    fontSize: 13,
    marginTop: 12,
  },
  errorText: {
    color: "#E04444",
    fontSize: 14,
    textAlign: "center",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#315EFB",
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  emptyContainer: {
    flex: 1,
    minHeight: 300,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  emptyTitle: {
    color: "#171717",
    fontSize: 17,
    fontWeight: "700",
    marginTop: 14,
  },
  emptyText: {
    color: "#888888",
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
});
