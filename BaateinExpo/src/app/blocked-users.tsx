import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { ArrowLeft, ShieldBan, UserRound } from "lucide-react-native";

import {
  getBlockedUsers,
  unblockUser,
  type BlockedUser,
} from "../services/blockService";

export default function BlockedUsersScreen() {
  const router = useRouter();

  const [users, setUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  const loadBlockedUsers = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const blockedUsers = await getBlockedUsers();
      setUsers(blockedUsers);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Unable to load blocked users.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBlockedUsers();
    }, [loadBlockedUsers]),
  );

  const handleUnblock = (user: BlockedUser) => {
    Alert.alert(
      "Unblock User",
      `Are you sure you want to unblock @${user.username}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Unblock",
          onPress: async () => {
            try {
              setUnblockingId(user._id);

              await unblockUser(user._id);

              setUsers((previousUsers) =>
                previousUsers.filter((item) => item._id !== user._id),
              );
            } catch (error: any) {
              Alert.alert(
                "Error",
                error?.response?.data?.message ||
                  "Unable to unblock this user.",
              );
            } finally {
              setUnblockingId(null);
            }
          },
        },
      ],
    );
  };

  const renderUser = ({ item }: { item: BlockedUser }) => {
    const isUnblocking = unblockingId === item._id;

    return (
      <View style={styles.userCard}>
        {item.profilePicture ? (
          <Image source={{ uri: item.profilePicture }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <UserRound size={24} color="#777" />
          </View>
        )}

        <View style={styles.userInfo}>
          <Text style={styles.fullName} numberOfLines={1}>
            {item.fullName || item.username}
          </Text>

          <Text style={styles.username} numberOfLines={1}>
            @{item.username}
          </Text>

          {!!item.bio && (
            <Text style={styles.bio} numberOfLines={1}>
              {item.bio}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.unblockButton}
          onPress={() => handleUnblock(item)}
          disabled={isUnblocking}
          activeOpacity={0.8}
        >
          {isUnblocking ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.unblockText}>Unblock</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={23} color="#171717" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Blocked Users</Text>

          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.descriptionContainer}>
          <ShieldBan size={19} color="#777" />
          <Text style={styles.description}>
            These accounts cannot interact with you while they are blocked.
          </Text>
        </View>

        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#171717" />
          </View>
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => item._id}
            renderItem={renderUser}
            contentContainerStyle={[
              styles.listContent,
              users.length === 0 && styles.emptyListContent,
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadBlockedUsers(true)}
                tintColor="#171717"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIcon}>
                  <ShieldBan size={30} color="#777" />
                </View>

                <Text style={styles.emptyTitle}>No blocked users</Text>

                <Text style={styles.emptyDescription}>
                  Accounts you block will appear here.
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
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
  header: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  backButton: {
    width: 38,
    height: 38,
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#171717",
  },
  headerSpacer: {
    width: 38,
  },
  descriptionContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 10,
  },
  description: {
    flex: 1,
    color: "#777777",
    fontSize: 13,
    lineHeight: 19,
  },
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 30,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EEEEEE",
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
  },
  userInfo: {
    flex: 1,
    gap: 3,
  },
  fullName: {
    color: "#171717",
    fontSize: 14,
    fontWeight: "700",
  },
  username: {
    color: "#777777",
    fontSize: 12,
  },
  bio: {
    color: "#888888",
    fontSize: 12,
    marginTop: 2,
  },
  unblockButton: {
    minWidth: 82,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#171717",
    alignItems: "center",
    justifyContent: "center",
  },
  unblockText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyListContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#171717",
    marginBottom: 7,
  },
  emptyDescription: {
    fontSize: 13,
    color: "#888888",
    textAlign: "center",
    lineHeight: 19,
  },
});
