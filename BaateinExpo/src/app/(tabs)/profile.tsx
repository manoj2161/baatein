import { useCallback, useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import {
  Settings,
  Grid3X3,
  Heart,
  MessageCircle,
  Plus,
} from "lucide-react-native";

import { useAuth } from "../../context/AuthContext";
import { getUserPosts } from "../../services/postService";

type ProfilePost = {
  _id: string;
  caption?: string;
  media?: {
    url?: string;
    type?: string;
  }[];
  likes?: string[];
  comments?: any[];
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPosts = useCallback(async () => {
    if (!user?._id) {
      setPosts([]);
      setLoading(false);
      return;
    }

    try {
      const result = await getUserPosts(user._id);
      setPosts(result || []);
    } catch (error: any) {
      console.error("Profile posts error:", error);
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Unable to load your posts.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?._id]);

  useFocusEffect(
    useCallback(() => {
      loadPosts();
    }, [loadPosts]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.emptyText}>
            Please log in to view your profile.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const followersCount = user.followers?.length || 0;
  const followingCount = user.following?.length || 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>

        <Pressable
          style={styles.settingsButton}
          onPress={() => router.push("/settings")}
        >
          <Settings size={22} color="#222222" />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.profileSection}>
          {user.profilePicture ? (
            <Image
              source={{ uri: user.profilePicture }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarLetter}>
                {(user.fullName || user.username || "U")
                  .charAt(0)
                  .toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.profileInfo}>
            <Text style={styles.fullName}>
              {user.fullName || user.username}
            </Text>
            <Text style={styles.username}>@{user.username}</Text>

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{posts.length}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>

              <View style={styles.stat}>
                <Text style={styles.statNumber}>{followersCount}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>

              <View style={styles.stat}>
                <Text style={styles.statNumber}>{followingCount}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
            </View>
          </View>
        </View>

        {!!user.bio && <Text style={styles.bio}>{user.bio}</Text>}

        {!!user.status && (
          <View style={styles.statusBox}>
            <Text style={styles.statusText}>{user.status}</Text>
          </View>
        )}

        <View style={styles.actionRow}>
          <Pressable
            style={styles.editButton}
            onPress={() => router.push("/edit-profile")}
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </Pressable>

          <Pressable
            style={styles.shareButton}
            onPress={() =>
              Alert.alert(
                "Coming soon",
                "Profile sharing will be available soon.",
              )
            }
          >
            <Text style={styles.shareButtonText}>Share Profile</Text>
          </Pressable>
        </View>

        <View style={styles.postsHeader}>
          <Grid3X3 size={19} color="#315EFB" />
          <Text style={styles.postsTitle}>Your Posts</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#315EFB" />
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Plus size={30} color="#315EFB" />
            </View>
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptyDescription}>
              Share your first moment with the Baatein community.
            </Text>

            <Pressable
              style={styles.createButton}
              onPress={() => router.push("/(tabs)/create")}
            >
              <Text style={styles.createButtonText}>Create Post</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.postsGrid}>
            {posts.map((post) => {
              const firstMedia = post.media?.[0];

              return (
                <Pressable
                  key={post._id}
                  style={styles.postItem}
                  onPress={() =>
                    router.push({
                      pathname: "/post/[postId]",
                      params: { postId: post._id },
                    })
                  }
                >
                  {firstMedia?.url ? (
                    <Image
                      source={{ uri: firstMedia.url }}
                      style={styles.postImage}
                    />
                  ) : (
                    <View style={styles.textPost}>
                      <Text style={styles.textPostContent} numberOfLines={5}>
                        {post.caption || "Baatein post"}
                      </Text>
                    </View>
                  )}

                  {firstMedia?.type === "video" && (
                    <View style={styles.videoBadge}>
                      <Text style={styles.videoBadgeText}>VIDEO</Text>
                    </View>
                  )}

                  <View style={styles.postOverlay}>
                    <View style={styles.postMetric}>
                      <Heart size={13} color="#FFFFFF" fill="#FFFFFF" />
                      <Text style={styles.postMetricText}>
                        {post.likes?.length || 0}
                      </Text>
                    </View>

                    <View style={styles.postMetric}>
                      <MessageCircle size={13} color="#FFFFFF" />
                      <Text style={styles.postMetricText}>
                        {post.comments?.length || 0}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    height: 55,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  headerTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#222222",
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingBottom: 35,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 24,
    gap: 18,
  },
  avatar: {
    width: 105,
    height: 105,
    borderRadius: 53,
    backgroundColor: "#EEEEEE",
  },
  avatarPlaceholder: {
    width: 105,
    height: 105,
    borderRadius: 53,
    backgroundColor: "#E8EDFF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontSize: 39,
    fontWeight: "800",
    color: "#315EFB",
  },
  profileInfo: {
    flex: 1,
  },
  fullName: {
    fontSize: 19,
    fontWeight: "800",
    color: "#222222",
  },
  username: {
    fontSize: 13,
    color: "#888888",
    marginTop: 3,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 17,
  },
  stat: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 16,
    fontWeight: "800",
    color: "#222222",
  },
  statLabel: {
    fontSize: 11,
    color: "#777777",
    marginTop: 3,
  },
  bio: {
    marginHorizontal: 18,
    marginTop: 19,
    fontSize: 13,
    color: "#444444",
    lineHeight: 20,
  },
  statusBox: {
    alignSelf: "flex-start",
    marginHorizontal: 18,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 15,
    backgroundColor: "#F1F4FF",
  },
  statusText: {
    fontSize: 12,
    color: "#315EFB",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 18,
    marginTop: 20,
  },
  editButton: {
    flex: 1,
    height: 42,
    borderRadius: 9,
    backgroundColor: "#315EFB",
    alignItems: "center",
    justifyContent: "center",
  },
  editButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  shareButton: {
    flex: 1,
    height: 42,
    borderRadius: 9,
    backgroundColor: "#F2F3F5",
    alignItems: "center",
    justifyContent: "center",
  },
  shareButtonText: {
    color: "#333333",
    fontSize: 13,
    fontWeight: "700",
  },
  postsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 18,
    paddingVertical: 15,
    marginTop: 22,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#EEEEEE",
  },
  postsTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#222222",
  },
  loadingContainer: {
    paddingVertical: 45,
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    paddingHorizontal: 35,
    paddingVertical: 35,
  },
  emptyIcon: {
    width: 65,
    height: 65,
    borderRadius: 33,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#222222",
    marginTop: 14,
  },
  emptyDescription: {
    textAlign: "center",
    color: "#888888",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 7,
  },
  createButton: {
    backgroundColor: "#315EFB",
    paddingHorizontal: 23,
    paddingVertical: 11,
    borderRadius: 9,
    marginTop: 17,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  postsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  postItem: {
    width: "33.3333%",
    aspectRatio: 1,
    padding: 1,
    position: "relative",
    backgroundColor: "#F0F0F0",
  },
  postImage: {
    width: "100%",
    height: "100%",
  },
  textPost: {
    flex: 1,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    padding: 9,
  },
  textPostContent: {
    fontSize: 11,
    color: "#333333",
    lineHeight: 16,
  },
  videoBadge: {
    position: "absolute",
    top: 7,
    right: 7,
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  videoBadgeText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "800",
  },
  postOverlay: {
    position: "absolute",
    bottom: 7,
    left: 7,
    right: 7,
    flexDirection: "row",
    gap: 10,
  },
  postMetric: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  postMetricText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    textShadowColor: "#000000",
    textShadowRadius: 3,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 25,
  },
  emptyText: {
    color: "#777777",
    fontSize: 14,
    textAlign: "center",
  },
});
