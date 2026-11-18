import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Plus } from "lucide-react-native";

import { useAuth } from "../../context/AuthContext";
import { getStories, createStory } from "../../services/storyService";
import StoryViewer from "./StoryViewer";

interface StoryUser {
  _id: string;
  username?: string;
  profilePicture?: string;
}

interface Story {
  _id: string;
  user?: StoryUser;
  mediaUrl: string;
  mediaType: "image" | "video";
  createdAt: string;
  isViewed?: boolean;
  viewersCount?: number;
}

export default function StoriesBar() {
  const { user } = useAuth();

  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [error, setError] = useState("");

  const loadStories = useCallback(async () => {
    try {
      setError("");

      const data = await getStories();
      setStories(data);
    } catch (err) {
      console.error("Unable to load stories:", err);
      setError("Unable to load stories.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  const handleViewed = useCallback((storyId: string) => {
    setStories((currentStories) =>
      currentStories.map((story) =>
        story._id === storyId ? { ...story, isViewed: true } : story,
      ),
    );
  }, []);

  const handleUpload = async () => {
    try {
      setError("");

      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission required",
          "Allow Baatein to access your photos and videos to upload a story.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        allowsEditing: false,
        quality: 0.8,
        videoMaxDuration: 60,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];

      if (asset.type !== "image" && asset.type !== "video") {
        Alert.alert("Invalid media", "Please select a valid image or video.");
        return;
      }

      setUploading(true);

      await createStory(asset);
      await loadStories();

      Alert.alert("Success", "Your story has been uploaded.");
    } catch (err: any) {
      console.error("Story upload error:", err);

      const message =
        err.response?.data?.message ||
        "Unable to upload story. Please try again.";

      Alert.alert("Upload failed", message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (storyId: string) => {
    setStories((currentStories) =>
      currentStories.filter((story) => story._id !== storyId),
    );

    setSelectedIndex(null);
  };

  // Keep only the latest story for each user.
  const latestStories = Object.values(
    stories.reduce<Record<string, Story>>((groups, story) => {
      const userId = story.user?._id;

      if (!userId) return groups;

      if (
        !groups[userId] ||
        new Date(story.createdAt).getTime() >
          new Date(groups[userId].createdAt).getTime()
      ) {
        groups[userId] = story;
      }

      return groups;
    }, {}),
  );

  // Separate your story from other users' stories.
  const myStory = latestStories.find(
    (story) => String(story.user?._id) === String(user?._id),
  );

  const otherStories = latestStories.filter(
    (story) => String(story.user?._id) !== String(user?._id),
  );

  const openStory = (story: Story) => {
    const index = stories.findIndex((item) => item._id === story._id);

    if (index !== -1) {
      setSelectedIndex(index);
    }
  };

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.heading}>Stories</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storyList}
        >
          {/* Your Story */}
          <View style={styles.storyItem}>
            <View
              style={[
                styles.storyRing,
                myStory
                  ? myStory.isViewed
                    ? styles.viewedRing
                    : styles.unviewedRing
                  : styles.emptyRing,
              ]}
            >
              <Pressable
                style={styles.avatarButton}
                onPress={() => myStory && openStory(myStory)}
                disabled={!myStory}
              >
                {user?.profilePicture ? (
                  <Image
                    source={{ uri: user.profilePicture }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarLetter}>
                      {user?.username?.charAt(0)?.toUpperCase() || "Y"}
                    </Text>
                  </View>
                )}
              </Pressable>

              {/* Add Story Button */}
              <Pressable
                style={styles.addButton}
                onPress={handleUpload}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Plus size={15} color="#FFFFFF" />
                )}
              </Pressable>
            </View>

            <Text style={styles.username} numberOfLines={1}>
              {uploading ? "Uploading..." : "Your story"}
            </Text>
          </View>

          {/* Other Users' Stories */}
          {otherStories.map((story) => {
            const isViewed = Boolean(story.isViewed);

            return (
              <Pressable
                key={story._id}
                style={styles.storyItem}
                onPress={() => openStory(story)}
              >
                <View
                  style={[
                    styles.storyRing,
                    isViewed ? styles.viewedRing : styles.unviewedRing,
                  ]}
                >
                  <View style={styles.avatarButton}>
                    {story.user?.profilePicture ? (
                      <Image
                        source={{ uri: story.user.profilePicture }}
                        style={styles.avatar}
                      />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarLetter}>
                          {story.user?.username?.charAt(0)?.toUpperCase() ||
                            "U"}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <Text style={styles.username} numberOfLines={1}>
                  {story.user?.username || "User"}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {loading && (
          <ActivityIndicator
            size="small"
            color="#315EFB"
            style={styles.loader}
          />
        )}

        {!!error && <Text style={styles.errorText}>{error}</Text>}
      </View>

      {/* Story Viewer */}
      <StoryViewer
        visible={selectedIndex !== null}
        stories={stories}
        initialIndex={selectedIndex ?? 0}
        onClose={() => setSelectedIndex(null)}
        onDelete={handleDelete}
        onViewed={handleViewed}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    padding: 13,
    marginBottom: 14,
  },
  heading: {
    fontSize: 15,
    fontWeight: "700",
    color: "#171717",
    marginBottom: 13,
  },
  storyList: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    paddingBottom: 2,
  },
  storyItem: {
    width: 66,
    alignItems: "center",
  },
  storyRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  unviewedRing: {
    backgroundColor: "#E83E8C",
  },
  viewedRing: {
    backgroundColor: "#D1D5DB",
  },
  emptyRing: {
    backgroundColor: "#E5E7EB",
  },
  avatarButton: {
    width: "100%",
    height: "100%",
    borderRadius: 30,
    padding: 2,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 28,
  },
  avatarPlaceholder: {
    flex: 1,
    borderRadius: 28,
    backgroundColor: "#315EFB",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "700",
  },
  addButton: {
    position: "absolute",
    right: -1,
    bottom: -1,
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: "#315EFB",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  username: {
    color: "#666666",
    fontSize: 11,
    marginTop: 6,
    maxWidth: 66,
    textAlign: "center",
  },
  loader: {
    marginTop: 8,
  },
  errorText: {
    color: "#E04444",
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
  },
});
