import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import {
  Settings,
  Lock,
  HelpCircle,
  LogOut,
  ChevronRight,
  Grid3X3,
  UserRound,
  X,
} from "lucide-react-native";

import { useAuth } from "../../context/AuthContext";
import { getUserPosts } from "../../services/postService";
import ProfilePostGrid, {
  ProfilePost,
} from "../../components/posts/ProfilePostGrid";
import FeedPost from "../../components/posts/FeedPost";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [loggingOut, setLoggingOut] = useState(false);
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postsError, setPostsError] = useState("");
  const [selectedPost, setSelectedPost] = useState<ProfilePost | null>(null);

  // Fetch posts whenever the profile screen becomes active
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchPosts = async () => {
        if (!user?._id) {
          setPosts([]);
          setLoadingPosts(false);
          return;
        }

        try {
          setLoadingPosts(true);
          setPostsError("");

          const userPosts = await getUserPosts(user._id);

          if (isActive) {
            setPosts(userPosts);
          }
        } catch (error) {
          console.error("Profile posts error:", error);

          if (isActive) {
            setPostsError("Unable to load posts. Please try again.");
          }
        } finally {
          if (isActive) {
            setLoadingPosts(false);
          }
        }
      };

      fetchPosts();

      return () => {
        isActive = false;
      };
    }, [user?._id]),
  );

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            setLoggingOut(true);
            await logout();
          } catch {
            Alert.alert("Error", "Unable to logout. Please try again.");
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  const handlePostDelete = (postId: string) => {
    setPosts((currentPosts) =>
      currentPosts.filter((post) => post._id !== postId),
    );
    setSelectedPost(null);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {user?.profilePicture ? (
              <Image
                source={{ uri: user.profilePicture }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <UserRound size={42} color="#315EFB" />
              </View>
            )}
          </View>

          <Text style={styles.username}>{user?.username || "Username"}</Text>

          {user?.fullName ? (
            <Text style={styles.fullName}>{user.fullName}</Text>
          ) : null}

          <Text style={styles.email}>{user?.email || ""}</Text>

          {user?.status ? (
            <Text style={styles.status}>{user.status}</Text>
          ) : null}

          <Text style={styles.bio}>{user?.bio || "No bio added yet."}</Text>
        </View>

        {/* Profile statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{posts.length}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.stat}>
            <Text style={styles.statNumber}>
              {user?.followers?.length || 0}
            </Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.stat}>
            <Text style={styles.statNumber}>
              {user?.following?.length || 0}
            </Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>

        {/* Edit profile */}
        <Pressable
          style={styles.editButton}
          onPress={() => router.push("/edit-profile")}
        >
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </Pressable>

        {/* User posts */}
        <View style={styles.postsSection}>
          <View style={styles.sectionHeader}>
            <Grid3X3 size={19} color="#315EFB" />
            <Text style={styles.sectionTitle}>Your Posts</Text>
          </View>

          {loadingPosts ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#315EFB" />
              <Text style={styles.loadingText}>Loading your posts...</Text>
            </View>
          ) : postsError ? (
            <View style={styles.emptyPosts}>
              <Text style={styles.errorText}>{postsError}</Text>
            </View>
          ) : (
            <ProfilePostGrid
              posts={posts}
              onPostPress={(post) => setSelectedPost(post)}
            />
          )}
        </View>

        {/* Account menu */}
        <View style={styles.menuSection}>
          <Text style={styles.menuHeading}>Account</Text>

          <MenuItem
            icon={<Settings size={21} color="#444444" />}
            title="Settings"
          />

          <MenuItem icon={<Lock size={21} color="#444444" />} title="Privacy" />

          <MenuItem
            icon={<HelpCircle size={21} color="#444444" />}
            title="Help and Support"
          />

          <Pressable
            style={styles.menuItem}
            onPress={handleLogout}
            disabled={loggingOut}
          >
            <View style={styles.menuLeft}>
              <LogOut size={21} color="#E53935" />
              <Text style={styles.logoutText}>Logout</Text>
            </View>

            {loggingOut ? (
              <ActivityIndicator color="#E53935" />
            ) : (
              <ChevronRight size={20} color="#AAAAAA" />
            )}
          </Pressable>
        </View>

        <Text style={styles.footer}>baatein.</Text>
      </ScrollView>

      {/* Full post modal */}
      <Modal
        visible={selectedPost !== null}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setSelectedPost(null)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Post</Text>

            <Pressable
              onPress={() => setSelectedPost(null)}
              style={styles.closeButton}
            >
              <X size={24} color="#222222" />
            </Pressable>
          </View>

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            {selectedPost ? (
              <FeedPost
                post={selectedPost as any}
                onDelete={handlePostDelete}
              />
            ) : null}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function MenuItem({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <Pressable style={styles.menuItem}>
      <View style={styles.menuLeft}>
        {icon}
        <Text style={styles.menuText}>{title}</Text>
      </View>

      <ChevronRight size={20} color="#AAAAAA" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 35,
  },
  profileHeader: {
    alignItems: "center",
  },
  avatarContainer: {
    width: 108,
    height: 108,
    borderRadius: 54,
    padding: 4,
    borderWidth: 2,
    borderColor: "#315EFB",
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
  },
  avatarPlaceholder: {
    flex: 1,
    borderRadius: 50,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  username: {
    fontSize: 21,
    fontWeight: "800",
    color: "#171717",
    marginTop: 13,
  },
  fullName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444444",
    marginTop: 4,
  },
  email: {
    fontSize: 13,
    color: "#888888",
    marginTop: 4,
  },
  status: {
    fontSize: 13,
    color: "#315EFB",
    marginTop: 9,
    fontWeight: "600",
  },
  bio: {
    fontSize: 14,
    color: "#555555",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 21,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: 26,
    paddingVertical: 17,
    backgroundColor: "#F8F9FC",
    borderRadius: 14,
  },
  stat: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 19,
    fontWeight: "800",
    color: "#171717",
  },
  statLabel: {
    fontSize: 12,
    color: "#777777",
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: "#E5E5E5",
  },
  editButton: {
    marginTop: 17,
    backgroundColor: "#315EFB",
    paddingVertical: 13,
    borderRadius: 11,
    alignItems: "center",
  },
  editButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  postsSection: {
    marginTop: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222222",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 38,
  },
  loadingText: {
    fontSize: 12,
    color: "#888888",
    marginTop: 10,
  },
  emptyPosts: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 38,
  },
  errorText: {
    fontSize: 13,
    color: "#E53935",
    textAlign: "center",
  },
  menuSection: {
    marginTop: 12,
  },
  menuHeading: {
    fontSize: 16,
    fontWeight: "800",
    color: "#222222",
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  menuText: {
    fontSize: 14,
    color: "#333333",
    fontWeight: "500",
  },
  logoutText: {
    fontSize: 14,
    color: "#E53935",
    fontWeight: "600",
  },
  footer: {
    textAlign: "center",
    color: "#315EFB",
    fontSize: 19,
    fontWeight: "800",
    marginTop: 30,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222222",
  },
  closeButton: {
    padding: 6,
  },
  modalScroll: {
    flex: 1,
  },
  modalContent: {
    padding: 12,
    paddingBottom: 30,
  },
});
