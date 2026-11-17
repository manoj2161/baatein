import { View, Text, StyleSheet, ScrollView, SafeAreaView } from "react-native";

import { useAuth } from "../../context/AuthContext";
import StoriesBar from "../../components/stories/StoriesBar";
import Feed from "../../components/posts/Feed";

export default function HomeScreen() {
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.welcomeSection}>
          <Text style={styles.heading}>
            Welcome back{user?.username ? `, ${user.username}` : ""}
          </Text>

          <Text style={styles.subtitle}>
            See what's happening in your community.
          </Text>
        </View>

        <StoriesBar />

        <View style={styles.feedSection}>
          <Text style={styles.feedHeading}>Your Feed</Text>
          <Feed />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 35,
  },
  welcomeSection: {
    marginBottom: 18,
  },
  heading: {
    fontSize: 21,
    fontWeight: "700",
    color: "#171717",
  },
  subtitle: {
    fontSize: 13,
    color: "#777777",
    marginTop: 5,
  },
  feedSection: {
    marginTop: 18,
  },
  feedHeading: {
    fontSize: 18,
    fontWeight: "700",
    color: "#171717",
  },
});
