import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  UserRound,
  Bell,
  Shield,
  LockKeyhole,
  LogOut,
  ChevronRight,
  Mail,
  CircleHelp,
} from "lucide-react-native";

import { useAuth } from "../context/AuthContext";

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out of Baatein?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          try {
            setLoggingOut(true);
            await logout();
            router.replace("/login");
          } catch (error) {
            Alert.alert("Error", "Unable to log out. Please try again.");
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  const showComingSoon = (feature: string) => {
    Alert.alert(feature, `${feature} settings will be available soon.`);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={22} color="#222222" />
        </Pressable>

        <Text style={styles.headerTitle}>Settings</Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.accountCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.fullName || user?.username || "U")
                .charAt(0)
                .toUpperCase()}
            </Text>
          </View>

          <View style={styles.accountInfo}>
            <Text style={styles.accountName}>
              {user?.fullName || user?.username || "Baatein User"}
            </Text>
            <Text style={styles.accountUsername}>
              @{user?.username || "username"}
            </Text>
            <Text style={styles.accountEmail}>{user?.email || ""}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>ACCOUNT</Text>

        <View style={styles.section}>
          <SettingItem
            icon={<UserRound size={19} color="#315EFB" />}
            title="Edit Profile"
            subtitle="Change your name, username, bio and photo"
            onPress={() => router.push("/edit-profile")}
          />

          <SettingItem
            icon={<Mail size={19} color="#315EFB" />}
            title="Email Address"
            subtitle={user?.email || "Your registered email"}
            onPress={() => router.push("/change-email")}
          />
        </View>

        <Text style={styles.sectionTitle}>PREFERENCES</Text>

        <View style={styles.section}>
          <SettingItem
            icon={<Bell size={19} color="#315EFB" />}
            title="Notifications"
            subtitle="Manage notification preferences"
            onPress={() => showComingSoon("Notifications")}
          />

          <SettingItem
            icon={<Shield size={19} color="#315EFB" />}
            title="Privacy"
            subtitle="Manage your privacy preferences"
            onPress={() => showComingSoon("Privacy")}
          />

          <SettingItem
            icon={<LockKeyhole size={19} color="#315EFB" />}
            title="Blocked Users"
            subtitle="Manage accounts you have blocked"
            onPress={() => router.push("/blocked-users")}
          />
        </View>

        <Text style={styles.sectionTitle}>SUPPORT</Text>

        <View style={styles.section}>
          <SettingItem
            icon={<CircleHelp size={19} color="#315EFB" />}
            title="Help and Support"
            subtitle="Get help with Baatein"
            onPress={() => showComingSoon("Help and Support")}
          />
        </View>

        <Pressable
          style={[styles.logoutButton, loggingOut && styles.disabledButton]}
          onPress={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? (
            <ActivityIndicator color="#E53935" />
          ) : (
            <>
              <LogOut size={19} color="#E53935" />
              <Text style={styles.logoutText}>Log Out</Text>
            </>
          )}
        </Pressable>

        <Text style={styles.version}>Baatein · Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingItem({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingIcon}>{icon}</View>

      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>

      <ChevronRight size={19} color="#AAAAAA" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  header: {
    height: 55,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
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
    textAlign: "center",
    fontSize: 18,
    fontWeight: "800",
    color: "#222222",
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    paddingHorizontal: 17,
    paddingTop: 20,
    paddingBottom: 35,
  },
  accountCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 27,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: "#E8EDFF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#315EFB",
    fontSize: 23,
    fontWeight: "800",
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#222222",
  },
  accountUsername: {
    fontSize: 12,
    color: "#777777",
    marginTop: 3,
  },
  accountEmail: {
    fontSize: 12,
    color: "#999999",
    marginTop: 3,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#999999",
    letterSpacing: 1,
    marginBottom: 9,
    marginLeft: 3,
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 13,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    overflow: "hidden",
  },
  settingItem: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F2",
  },
  settingIcon: {
    width: 39,
    height: 39,
    borderRadius: 11,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#222222",
  },
  settingSubtitle: {
    fontSize: 11,
    color: "#888888",
    marginTop: 4,
    lineHeight: 16,
  },
  logoutButton: {
    height: 50,
    borderRadius: 11,
    backgroundColor: "#FFF1F1",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginTop: 3,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#E53935",
  },
  disabledButton: {
    opacity: 0.6,
  },
  version: {
    textAlign: "center",
    color: "#AAAAAA",
    fontSize: 11,
    marginTop: 22,
  },
});
