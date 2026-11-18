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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import {
  ArrowLeft,
  Grid3X3,
  Heart,
  MessageCircle,
  UserRound,
} from "lucide-react-native";

import { useAuth } from "../../context/AuthContext";
import {
  getUserProfile,
  getUserPosts,
  followUser,
  unfollowUser,
} from "../../services/profileService";

interface PublicUser {
  _id: string;
  username?: string;
  fullName?: string;
  profilePicture?: string;
  bio?: string;
  status?: string;
  followers?: any[];
  following?: any[];
}

interface ProfilePost {
  _id: string;
  caption?: string;
  media?: {
    url?: string;
    type?: string;
  }[];
  likes?: string[];
  comments?: any[];
}

export default function PublicProfileScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user } = useAuth();

  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [error, setError] = useState("");

  const loadProfile = useCallback(async () => {
    if (!userId) return;

    try {
      setError("");

      const [profileResult, postsResult] = await Promise.all([
        getUserProfile(userId),
        getUserPosts(userId),
      ]);

      setProfile(profileResult);
      setPosts(postsResult || []);

      const currentFollowing = (user as any)?.following || [];

      const followingIds = currentFollowing.map((item: any) =>
        typeof item === "string" ? item : item._id,
      );

      setIsFollowing(followingIds.includes(userId));
    } catch (err: any) {
      console.error("Public profile loading error:", err);
      setError(err?.response?.data?.message || "Unable to load this profile.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, user]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
  };

  const handleFollowToggle = async () => {
    if (followLoading || !userId) return;

    try {
      setFollowLoading(true);

      if (isFollowing) {
        await unfollowUser(userId);
        setIsFollowing(false);

        setProfile((previous) =>
          previous
            ? {
                ...previous,
                followers: (previous.followers || []).filter(
                  (item: any) =>
                    (typeof item === "string" ? item : item._id) !==
                    (user as any)?._id,
                ),
              }
            : previous,
        );
      } else {
        await followUser(userId);
        setIsFollowing(true);

        setProfile((previous) =>
          previous
            ? {
                ...previous,
                followers: [...(previous.followers || []), (user as any)?._id],
              }
            : previous,
        );
      }
    } catch (err: any) {
      console.error("Follow status update error:", err);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#315EFB" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={23} color="#222222" />
          </Pressable>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <View style={styles.center}>
          <Text style={styles.errorText}>{error || "Profile not found."}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isOwnProfile = userId === (user as any)?._id;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={23} color="#222222" />
        </Pressable>

        <Text style={styles.headerTitle}>
          {profile.username ? `@${profile.username}` : "Profile"}
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.profileSection}>
          {profile.profilePicture ? (
            <Image
              source={{ uri: profile.profilePicture }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <UserRound size={40} color="#315EFB" />
            </View>
          )}

          <View style={styles.profileInfo}>
            <Text style={styles.fullName}>
              {profile.fullName || profile.username || "User"}
            </Text>

            <Text style={styles.username}>@{profile.username || "user"}</Text>

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{posts.length}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>

              <View style={styles.stat}>
                <Text style={styles.statNumber}>
                  {profile.followers?.length || 0}
                </Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>

              <View style={styles.stat}>
                <Text style={styles.statNumber}>
                  {profile.following?.length || 0}
                </Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
            </View>
          </View>
        </View>

        {!!profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

        {!!profile.status && (
          <View style={styles.statusBox}>
            <Text style={styles.statusText}>{profile.status}</Text>
          </View>
        )}

        {!isOwnProfile && (
          <View style={styles.actionRow}>
            <Pressable
              style={[
                styles.followButton,
                isFollowing && styles.followingButton,
              ]}
              onPress={handleFollowToggle}
              disabled={followLoading}
            >
              {followLoading ? (
                <ActivityIndicator
                  size="small"
                  color={isFollowing ? "#333333" : "#FFFFFF"}
                />
              ) : (
                <Text
                  style={[
                    styles.followButtonText,
                    isFollowing && styles.followingButtonText,
                  ]}
                >
                  {isFollowing ? "Following" : "Follow"}
                </Text>
              )}
            </Pressable>
          </View>
        )}

        <View style={styles.postsHeader}>
          <Grid3X3 size={19} color="#315EFB" />
          <Text style={styles.postsTitle}>Posts</Text>
        </View>

        {posts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptyDescription}>
              This user has not shared any posts.
            </Text>
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
    paddingHorizontal: 17,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "800",
    color: "#222222",
    marginLeft: 8,
  },
  headerSpacer: {
    width: 40,
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
    marginHorizontal: 18,
    marginTop: 20,
  },
  followButton: {
    flex: 1,
    height: 42,
    borderRadius: 9,
    backgroundColor: "#315EFB",
    alignItems: "center",
    justifyContent: "center",
  },
  followingButton: {
    backgroundColor: "#F0F0F0",
  },
  followButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  followingButtonText: {
    color: "#333333",
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
  emptyContainer: {
    alignItems: "center",
    paddingHorizontal: 35,
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#222222",
  },
  emptyDescription: {
    textAlign: "center",
    color: "#888888",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 7,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 25,
  },
  loadingText: {
    color: "#888888",
    fontSize: 13,
    marginTop: 10,
  },
  errorText: {
    color: "#E04444",
    fontSize: 14,
    textAlign: "center",
  },
});
