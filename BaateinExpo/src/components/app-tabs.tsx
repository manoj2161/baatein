import { Tabs, useRouter } from "expo-router";
import {
  House,
  PenLine,
  PlusSquare,
  MessageCircle,
  UserRound,
  Bell,
  Search,
} from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAuth } from "../context/AuthContext";

export default function AppTabs() {
  const router = useRouter();
  const { notificationUnreadCount } = useAuth();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#315EFB",
        tabBarInactiveTintColor: "#777777",
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          height: 72,
          paddingTop: 2,
          paddingBottom: 18,
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#EEEEEE",
          elevation: 8,
        },
      }}
    >
      {/* HOME */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: true,
          headerTitle: "baatein.",
          headerTitleAlign: "left",
          headerTitleStyle: {
            color: "#315EFB",
            fontSize: 25,
            fontWeight: "800",
          },
          headerStyle: {
            backgroundColor: "#FFFFFF",
          },
          headerShadowVisible: false,
          headerTitleContainerStyle: {
            marginLeft: 8,
          },
          headerRight: () => (
            <View style={styles.headerActions}>
              <Pressable
                onPress={() => router.push("/search")}
                style={styles.headerButton}
              >
                <Search size={21} color="#333333" />
              </Pressable>

              <Pressable
                onPress={() => router.push("/notification-center")}
                style={styles.headerButton}
              >
                <Bell size={21} color="#333333" />

                {notificationUnreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {notificationUnreadCount > 99
                        ? "99+"
                        : notificationUnreadCount}
                    </Text>
                  </View>
                )}
              </Pressable>
            </View>
          ),
          tabBarIcon: ({ color, size }) => (
            <House color={color} size={size + 3} />
          ),
        }}
      />

      {/* THE UNSENT */}
      <Tabs.Screen
        name="unsent"
        options={{
          title: "The Unsent",
          tabBarIcon: ({ color, size }) => (
            <PenLine color={color} size={size + 3} />
          ),
        }}
      />

      {/* CREATE */}
      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
          tabBarIcon: ({ color, size }) => (
            <PlusSquare color={color} size={size + 5} />
          ),
        }}
      />

      {/* MESSAGES */}
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, size }) => (
            <MessageCircle color={color} size={size + 3} />
          ),
        }}
      />

      {/* PROFILE */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <UserRound color={color} size={size + 3} />
          ),
        }}
      />

      {/* HIDDEN ROUTES */}
      <Tabs.Screen name="search" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginRight: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 1,
    right: 0,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
  },
});
