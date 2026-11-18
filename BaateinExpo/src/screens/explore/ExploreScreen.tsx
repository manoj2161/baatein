import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Search,
  UserRound,
  Users,
  X,
  Clock,
  Trash2,
  ArrowLeft,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";

import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { followUser, unfollowUser } from "../../services/profileService";

interface ExploreUser {
  _id: string;
  username?: string;
  fullName?: string;
  profilePicture?: string;
}

interface SearchHistoryUser {
  _id: string;
  username?: string;
  fullName?: string;
  profilePicture?: string;
}

const SEARCH_HISTORY_KEY = "baatein_people_search_history";

export default function ExploreScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [users, setUsers] = useState<ExploreUser[]>([]);
  const [search, setSearch] = useState("");
  const [searchHistory, setSearchHistory] = useState<SearchHistoryUser[]>([]);
  const [followingUsers, setFollowingUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingLoading, setFollowingLoading] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUsers = useCallback(async () => {
    try {
      setError("");

      const response = await api.get("/users");
      const allUsers = response.data.users || [];

      setUsers(
        allUsers.filter((item: ExploreUser) => item._id !== (user as any)?._id),
      );

      const currentFollowing = ((user as any)?.following || []).map(
        (item: any) => (typeof item === "string" ? item : item._id),
      );

      setFollowingUsers(currentFollowing);
    } catch (err: any) {
      console.error("People loading error:", err);
      setError(err.response?.data?.message || "Unable to load people.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadSearchHistory = useCallback(async () => {
    try {
      const savedHistory = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);

      if (!savedHistory) {
        setSearchHistory([]);
        return;
      }

      const parsedHistory = JSON.parse(savedHistory);

      if (Array.isArray(parsedHistory)) {
        const validHistory = parsedHistory.filter(
          (item): item is SearchHistoryUser =>
            typeof item === "object" &&
            item !== null &&
            typeof item._id === "string",
        );

        setSearchHistory(validHistory);
      }
    } catch (err) {
      console.error("Search history loading error:", err);
      setSearchHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useFocusEffect(
    useCallback(() => {
      loadSearchHistory();
    }, [loadSearchHistory]),
  );

  const saveViewedProfile = async (person: SearchHistoryUser) => {
    const updatedHistory = [
      person,
      ...searchHistory.filter((item) => item._id !== person._id),
    ].slice(0, 20);

    setSearchHistory(updatedHistory);

    try {
      await AsyncStorage.setItem(
        SEARCH_HISTORY_KEY,
        JSON.stringify(updatedHistory),
      );
    } catch (err) {
      console.error("Saving profile history failed:", err);
    }
  };

  const openProfile = async (person: ExploreUser) => {
    await saveViewedProfile(person);

    router.push({
      pathname: "/user/[userId]",
      params: { userId: person._id },
    });
  };

  const removeSearch = async (userId: string) => {
    const updatedHistory = searchHistory.filter((item) => item._id !== userId);

    setSearchHistory(updatedHistory);

    try {
      await AsyncStorage.setItem(
        SEARCH_HISTORY_KEY,
        JSON.stringify(updatedHistory),
      );
    } catch (err) {
      console.error("Removing profile history failed:", err);
    }
  };

  const clearAllHistory = async () => {
    setSearchHistory([]);

    try {
      await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (err) {
      console.error("Clearing profile history failed:", err);
    }
  };

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return [];

    return users.filter((item) => {
      const username = item.username?.toLowerCase() || "";
      const fullName = item.fullName?.toLowerCase() || "";

      return username.includes(query) || fullName.includes(query);
    });
  }, [users, search]);

  const handleFollowToggle = async (userId: string) => {
    if (followingLoading) return;

    const isFollowing = followingUsers.includes(userId);

    try {
      setFollowingLoading(userId);

      if (isFollowing) {
        await unfollowUser(userId);

        setFollowingUsers((previous) => previous.filter((id) => id !== userId));
      } else {
        await followUser(userId);

        setFollowingUsers((previous) =>
          previous.includes(userId) ? previous : [...previous, userId],
        );
      }
    } catch (err: any) {
      console.error("Follow status update error:", err);
    } finally {
      setFollowingLoading(null);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/discover");
    }
  };

  const renderUser = ({ item }: { item: ExploreUser }) => {
    const isFollowing = followingUsers.includes(item._id);
    const isProcessing = followingLoading === item._id;

    return (
      <View style={styles.userCard}>
        <Pressable style={styles.userInfo} onPress={() => openProfile(item)}>
          {item.profilePicture ? (
            <Image
              source={{ uri: item.profilePicture }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <UserRound size={23} color="#777777" />
            </View>
          )}

          <View style={styles.userDetails}>
            <Text style={styles.fullName} numberOfLines={1}>
              {item.fullName || item.username || "User"}
            </Text>

            <Text style={styles.username} numberOfLines={1}>
              @{item.username || "user"}
            </Text>
          </View>
        </Pressable>

        <Pressable
          style={[styles.followButton, isFollowing && styles.followingButton]}
          onPress={() => handleFollowToggle(item._id)}
          disabled={!!followingLoading}
        >
          {isProcessing ? (
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
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={handleBack}
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={23} color="#171717" />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.title}>People</Text>
          <Text style={styles.subtitle}>Find people on Baatein</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color="#888888" />

        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or username..."
          placeholderTextColor="#999999"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />

        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <X size={19} color="#888888" />
          </Pressable>
        )}
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#315EFB" />
          <Text style={styles.stateText}>Loading people...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{error}</Text>

          <Pressable
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              loadUsers();
            }}
          >
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : search.trim() ? (
        filteredUsers.length === 0 ? (
          <View style={styles.emptyState}>
            <Search size={36} color="#A1A1AA" />
            <Text style={styles.emptyTitle}>No people found</Text>
            <Text style={styles.emptyText}>
              Try searching with a different name or username.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredUsers}
            renderItem={renderUser}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        )
      ) : (
        <View style={styles.historyContainer}>
          {historyLoading ? (
            <ActivityIndicator color="#315EFB" />
          ) : searchHistory.length > 0 ? (
            <>
              <View style={styles.historyHeader}>
                <View style={styles.historyTitleContainer}>
                  <Clock size={18} color="#777777" />
                  <Text style={styles.historyTitle}>Recently viewed</Text>
                </View>

                <Pressable
                  onPress={clearAllHistory}
                  style={styles.clearAllButton}
                >
                  <Trash2 size={15} color="#E04444" />
                  <Text style={styles.clearAllText}>Clear all</Text>
                </Pressable>
              </View>

              <FlatList
                data={searchHistory}
                keyExtractor={(item) => item._id}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <View style={styles.historyItem}>
                    <Pressable
                      style={styles.historySearch}
                      onPress={() => openProfile(item)}
                    >
                      {item.profilePicture ? (
                        <Image
                          source={{ uri: item.profilePicture }}
                          style={styles.historyAvatar}
                        />
                      ) : (
                        <View style={styles.historyAvatarPlaceholder}>
                          <UserRound size={17} color="#777777" />
                        </View>
                      )}

                      <View style={styles.historyDetails}>
                        <Text style={styles.historyText} numberOfLines={1}>
                          {item.fullName || item.username || "User"}
                        </Text>
                        <Text style={styles.historyUsername}>
                          @{item.username || "user"}
                        </Text>
                      </View>
                    </Pressable>

                    <Pressable
                      onPress={() => removeSearch(item._id)}
                      style={styles.removeHistoryButton}
                      accessibilityLabel="Remove from recent profiles"
                    >
                      <X size={17} color="#888888" />
                    </Pressable>
                  </View>
                )}
              />
            </>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Users size={32} color="#315EFB" />
              </View>

              <Text style={styles.emptyTitle}>Find your people</Text>
              <Text style={styles.emptyText}>
                Search for someone's name or username. People whose profiles you
                open will appear here.
              </Text>
            </View>
          )}
        </View>
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 15,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 23,
    fontWeight: "800",
    color: "#171717",
  },
  subtitle: {
    fontSize: 13,
    color: "#888888",
    marginTop: 3,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 17,
    marginBottom: 12,
    paddingHorizontal: 14,
    height: 49,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: "#171717",
    fontSize: 14,
    height: "100%",
  },
  historyContainer: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  historyTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  historyTitle: {
    color: "#333333",
    fontSize: 14,
    fontWeight: "700",
  },
  clearAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    padding: 5,
  },
  clearAllText: {
    color: "#E04444",
    fontSize: 12,
    fontWeight: "600",
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  historySearch: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  historyAvatar: {
    width: 39,
    height: 39,
    borderRadius: 20,
  },
  historyAvatarPlaceholder: {
    width: 39,
    height: 39,
    borderRadius: 20,
    backgroundColor: "#EEEEEE",
    alignItems: "center",
    justifyContent: "center",
  },
  historyDetails: {
    flex: 1,
  },
  historyText: {
    color: "#333333",
    fontSize: 13,
    fontWeight: "700",
  },
  historyUsername: {
    color: "#888888",
    fontSize: 11,
    marginTop: 3,
  },
  removeHistoryButton: {
    padding: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    padding: 13,
    marginBottom: 10,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  userInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    marginRight: 10,
  },
  avatar: {
    width: 47,
    height: 47,
    borderRadius: 24,
    backgroundColor: "#EEEEEE",
  },
  avatarPlaceholder: {
    width: 47,
    height: 47,
    borderRadius: 24,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
  },
  userDetails: {
    flex: 1,
  },
  fullName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#171717",
  },
  username: {
    fontSize: 12,
    color: "#888888",
    marginTop: 4,
  },
  followButton: {
    minWidth: 88,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#315EFB",
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 9,
  },
  followingButton: {
    backgroundColor: "#F0F0F0",
  },
  followButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  followingButtonText: {
    color: "#444444",
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 25,
  },
  stateText: {
    color: "#888888",
    fontSize: 13,
    marginTop: 10,
  },
  errorText: {
    color: "#E04444",
    fontSize: 14,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 15,
    backgroundColor: "#315EFB",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 9,
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 35,
    paddingBottom: 60,
  },
  emptyIcon: {
    width: 65,
    height: 65,
    borderRadius: 33,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  emptyTitle: {
    color: "#171717",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 12,
  },
  emptyText: {
    color: "#888888",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 7,
  },
});
