import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
} from "react-native";
import { Search, Users, UserRound, X } from "lucide-react-native";

import api from "../../services/api";
import { followUser } from "../../services/profileService";
import { useAuth } from "../../context/AuthContext";

interface ExploreUser {
  _id: string;
  username?: string;
  fullName?: string;
  profilePicture?: string;
}

export default function ExploreScreen() {
  const { user } = useAuth();

  const [users, setUsers] = useState<ExploreUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [followingUsers, setFollowingUsers] = useState<string[]>([]);
  const [followingId, setFollowingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/users");
      const fetchedUsers = response.data.users || [];

      const currentUserId = user?._id?.toString();

      const filteredUsers = fetchedUsers.filter(
        (item: ExploreUser) => item._id?.toString() !== currentUserId,
      );

      setUsers(filteredUsers);

      setFollowingUsers(
        (user?.following || []).map((item: any) =>
          typeof item === "object" ? item._id?.toString() : item.toString(),
        ),
      );
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError("Unable to load users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchUsers();
    }
  }, [user?._id]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return users;

    return users.filter((person) => {
      const username = person.username?.toLowerCase() || "";
      const fullName = person.fullName?.toLowerCase() || "";

      return username.includes(query) || fullName.includes(query);
    });
  }, [users, search]);

  const handleFollow = async (userId: string) => {
    if (followingUsers.includes(userId) || followingId) return;

    try {
      setFollowingId(userId);

      await followUser(userId);

      setFollowingUsers((previous) => [...previous, userId]);
    } catch (err: any) {
      console.error("Follow failed:", err);

      Alert.alert(
        "Follow failed",
        err.response?.data?.message || "Unable to follow this user.",
      );
    } finally {
      setFollowingId(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headingSection}>
        <View style={styles.headingIcon}>
          <Users size={22} color="#315efb" />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.heading}>Explore People</Text>
          <Text style={styles.subtitle}>
            Discover and connect with people on Baatein.
          </Text>
        </View>
      </View>

      <View style={styles.searchBox}>
        <Search size={19} color="#999999" />

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name or username..."
          placeholderTextColor="#999999"
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <X size={18} color="#777777" />
          </Pressable>
        )}
      </View>

      {!loading && !error && (
        <Text style={styles.resultCount}>
          {filteredUsers.length}{" "}
          {filteredUsers.length === 1 ? "person" : "people"} found
        </Text>
      )}

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#315efb" />
          <Text style={styles.stateText}>Finding people...</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyState}>
          <Text style={styles.errorText}>{error}</Text>

          <Pressable style={styles.retryButton} onPress={fetchUsers}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : filteredUsers.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <UserRound size={27} color="#999999" />
          </View>

          <Text style={styles.emptyTitle}>
            {search ? "No users found" : "No people to explore"}
          </Text>

          <Text style={styles.stateText}>
            {search
              ? "Try another name or username."
              : "There are no other registered users yet."}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.listContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.userList}
        >
          {filteredUsers.map((person) => {
            const userId = person._id.toString();
            const isFollowing = followingUsers.includes(userId);
            const isFollowLoading = followingId === userId;

            return (
              <View key={userId} style={styles.userCard}>
                {person.profilePicture ? (
                  <Image
                    source={{ uri: person.profilePicture }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <UserRound size={25} color="#999999" />
                  </View>
                )}

                <View style={styles.userInfo}>
                  <Text style={styles.username} numberOfLines={1}>
                    {person.username || "Unknown user"}
                  </Text>

                  <Text style={styles.fullName} numberOfLines={1}>
                    {person.fullName || "Baatein user"}
                  </Text>
                </View>

                <Pressable
                  onPress={() => handleFollow(userId)}
                  disabled={isFollowing || followingId !== null}
                  style={[
                    styles.followButton,
                    isFollowing && styles.followingButton,
                  ]}
                >
                  {isFollowLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text
                      style={[
                        styles.followText,
                        isFollowing && styles.followingText,
                      ]}
                    >
                      {isFollowing ? "Following" : "Follow"}
                    </Text>
                  )}
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 20,
    paddingTop: 26,
  },
  headingSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 12,
  },
  headingIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: "#EFF4FF",
    alignItems: "center",
    justifyContent: "center",
  },
  heading: {
    fontSize: 19,
    fontWeight: "700",
    color: "#171717",
  },
  subtitle: {
    fontSize: 12,
    color: "#777777",
    marginTop: 4,
  },
  searchBox: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 13,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    color: "#171717",
    fontSize: 13,
    paddingVertical: 10,
  },
  resultCount: {
    color: "#777777",
    fontSize: 12,
    marginTop: 18,
    marginBottom: 12,
  },
  listContainer: {
    flex: 1,
  },
  userList: {
    paddingBottom: 105,
    gap: 12,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 15,
    padding: 12,
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#EEEEEE",
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#F1F1F1",
    alignItems: "center",
    justifyContent: "center",
  },
  userInfo: {
    flex: 1,
  },
  username: {
    color: "#171717",
    fontSize: 14,
    fontWeight: "700",
  },
  fullName: {
    color: "#888888",
    fontSize: 12,
    marginTop: 4,
  },
  followButton: {
    minWidth: 82,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#315efb",
    alignItems: "center",
    justifyContent: "center",
  },
  followingButton: {
    backgroundColor: "#F0F0F0",
  },
  followText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  followingText: {
    color: "#666666",
  },
  centerState: {
    paddingVertical: 60,
    alignItems: "center",
  },
  stateText: {
    color: "#888888",
    fontSize: 13,
    marginTop: 10,
    textAlign: "center",
  },
  emptyState: {
    padding: 30,
    marginTop: 20,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emptyIcon: {
    width: 55,
    height: 55,
    borderRadius: 30,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    color: "#171717",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 14,
  },
  errorText: {
    color: "#E04444",
    fontSize: 13,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 15,
    paddingHorizontal: 18,
    paddingVertical: 9,
    backgroundColor: "#315efb",
    borderRadius: 8,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
});
