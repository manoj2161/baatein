import { Tabs, useRouter } from "expo-router";
import {
  House,
  Search,
  PlusSquare,
  MessageCircle,
  UserRound,
  Bell,
} from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAuth } from "../context/AuthContext";

export default function AppTabs() {
  const router = useRouter();
  const { notificationUnreadCount } = useAuth();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitle: "baatein.",
        headerTitleAlign: "left",
        headerTitleStyle: {
          color: "#315efb",
          fontSize: 25,
          fontWeight: "800",
        },
        headerStyle: {
          backgroundColor: "#FFFFFF",
        },
        headerShadowVisible: false,

        headerRight: () => (
          <Pressable
            onPress={() => router.push("/(tabs)/notifications")}
            style={styles.notificationButton}
          >
            <Bell size={22} color="#333333" />

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
        ),

        tabBarActiveTintColor: "#315efb",
        tabBarInactiveTintColor: "#777777",
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,

        tabBarStyle: {
          height: 62,
          paddingTop: 8,
          paddingBottom: 8,
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#EEEEEE",
          elevation: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <House color={color} size={size + 3} />
          ),
        }}
      />

      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, size }) => (
            <Search color={color} size={size + 3} />
          ),
        }}
      />

      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
          tabBarIcon: ({ color, size }) => (
            <PlusSquare color={color} size={size + 5} />
          ),
        }}
      />

      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, size }) => (
            <MessageCircle color={color} size={size + 3} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <UserRound color={color} size={size + 3} />
          ),
        }}
      />

      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  notificationButton: {
    width: 42,
    height: 42,
    marginRight: 14,
    borderRadius: 21,
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
