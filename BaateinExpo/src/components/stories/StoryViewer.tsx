import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Eye,
  Clock,
} from "lucide-react-native";

import { useAuth } from "../../context/AuthContext";
import {
  deleteStory,
  viewStory,
  getStoryViewers,
} from "../../services/storyService";

interface Story {
  _id: string;
  user?: {
    _id: string;
    username?: string;
    profilePicture?: string;
  };
  mediaType: "image" | "video";
  mediaUrl: string;
  viewersCount?: number;
}

interface StoryViewerProps {
  visible: boolean;
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
  onDelete: (storyId: string) => void;
  onViewed?: (storyId: string) => void;
}

export default function StoryViewer({
  visible,
  stories,
  initialIndex,
  onClose,
  onDelete,
  onViewed,
}: StoryViewerProps) {
  const [index, setIndex] = useState(initialIndex);
  const [deleting, setDeleting] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [viewers, setViewers] = useState<any[]>([]);
  const [loadingViewers, setLoadingViewers] = useState(false);
  const [viewerError, setViewerError] = useState("");

  const progress = useRef(new Animated.Value(0)).current;

  const { user } = useAuth();

  const story = stories[index];
  const owner = story?.user || {};
  const isOwner = String(owner._id) === String(user?._id);

  const player = useVideoPlayer(
    story?.mediaType === "video" ? story.mediaUrl : null,
    (videoPlayer) => {
      videoPlayer.loop = false;
      videoPlayer.muted = true;
    },
  );

  // Reset the viewer when opened.
  useEffect(() => {
    if (visible) {
      setIndex(initialIndex);
      setShowViewers(false);
      setViewers([]);
      setViewerError("");
    }
  }, [visible, initialIndex]);

  // Record a view when another user's story opens.
  useEffect(() => {
    if (!visible || !story || isOwner) return;

    let cancelled = false;

    const recordView = async () => {
      try {
        await viewStory(story._id);

        if (!cancelled) {
          onViewed?.(story._id);
        }
      } catch (error) {
        console.error("Unable to record story view:", error);
      }
    };

    recordView();

    return () => {
      cancelled = true;
    };
  }, [visible, story?._id, isOwner]);

  // Reset viewer history when changing stories.
  useEffect(() => {
    setShowViewers(false);
    setViewers([]);
    setViewerError("");
  }, [story?._id]);

  // Play or pause video.
  useEffect(() => {
    if (!visible || !story || story.mediaType !== "video" || showViewers) {
      player.pause();
      return;
    }

    player.currentTime = 0;
    player.play();

    return () => {
      player.pause();
    };
  }, [visible, story?._id, showViewers]);

  // Automatically move to the next story after 7 seconds.
  useEffect(() => {
    if (!visible || !story || showViewers) return;

    progress.setValue(0);

    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 7000,
      useNativeDriver: false,
    });

    animation.start(({ finished }) => {
      if (!finished) return;

      if (index < stories.length - 1) {
        setIndex((current) => current + 1);
      } else {
        onClose();
      }
    });

    return () => {
      animation.stop();
    };
  }, [visible, index, story?._id, showViewers]);

  if (!story) return null;

  const previous = () => {
    if (index > 0) {
      setIndex((current) => current - 1);
    }
  };

  const next = () => {
    if (index < stories.length - 1) {
      setIndex((current) => current + 1);
    } else {
      onClose();
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete story", "Are you sure you want to delete this story?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setDeleting(true);
            await deleteStory(story._id);
            onDelete(story._id);
          } catch (error: any) {
            Alert.alert(
              "Error",
              error.response?.data?.message || "Unable to delete this story.",
            );
            setDeleting(false);
          }
        },
      },
    ]);
  };

  const handleGetViewers = async () => {
    if (showViewers) {
      setShowViewers(false);
      return;
    }

    setShowViewers(true);
    setLoadingViewers(true);
    setViewerError("");

    try {
      const data = await getStoryViewers(story._id);
      setViewers(data.viewers || []);
    } catch (error: any) {
      setViewerError(
        error.response?.data?.message ||
          "Unable to load viewers. Please try again.",
      );
    } finally {
      setLoadingViewers(false);
    }
  };

  const formatViewedTime = (date?: string) => {
    if (!date) return "Recently";

    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);

    if (Number.isNaN(seconds) || seconds < 0) {
      return "Recently";
    }

    if (seconds < 60) return "Just now";

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) {
      return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
    }

    const days = Math.floor(hours / 24);

    return `${days} ${days === 1 ? "day" : "days"} ago`;
  };

  const animatedWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <Modal
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Story Media */}
        {story.mediaType === "video" ? (
          <VideoView
            player={player}
            style={styles.media}
            contentFit="contain"
            nativeControls={false}
          />
        ) : (
          <Image
            key={story._id}
            source={{ uri: story.mediaUrl }}
            style={styles.media}
            resizeMode="contain"
          />
        )}

        {/* Top Progress Bars */}
        <View style={styles.progressContainer}>
          {stories.map((item, i) => (
            <View key={item._id} style={styles.progressBackground}>
              {i < index && <View style={styles.completedProgress} />}

              {i === index && (
                <Animated.View
                  style={[styles.currentProgress, { width: animatedWidth }]}
                />
              )}
            </View>
          ))}
        </View>

        {/* User Information */}
        <View style={styles.userInfo}>
          {owner.profilePicture ? (
            <Image
              source={{ uri: owner.profilePicture }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarLetter}>
                {owner.username?.charAt(0)?.toUpperCase() || "U"}
              </Text>
            </View>
          )}

          <Text style={styles.username}>{owner.username || "User"}</Text>
        </View>

        {/* Close Button */}
        <Pressable style={styles.closeButton} onPress={onClose}>
          <X color="#FFFFFF" size={25} />
        </Pressable>

        {/* Previous Story */}
        <Pressable
          style={[styles.navigationButton, styles.previousButton]}
          onPress={previous}
          disabled={index === 0 || showViewers}
        >
          <ChevronLeft
            color="#FFFFFF"
            size={30}
            style={{ opacity: index === 0 || showViewers ? 0.3 : 1 }}
          />
        </Pressable>

        {/* Next Story */}
        <Pressable
          style={[styles.navigationButton, styles.nextButton]}
          onPress={next}
          disabled={showViewers}
        >
          <ChevronRight
            color="#FFFFFF"
            size={30}
            style={{ opacity: showViewers ? 0.3 : 1 }}
          />
        </Pressable>

        {/* Owner Actions */}
        {isOwner && !showViewers && (
          <View style={styles.bottomActions}>
            <Pressable style={styles.viewsButton} onPress={handleGetViewers}>
              <Eye color="#FFFFFF" size={19} />
              <Text style={styles.actionText}>
                {story.viewersCount || 0} views
              </Text>
            </Pressable>

            <Pressable
              style={styles.deleteButton}
              onPress={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Trash2 color="#FF7777" size={20} />
              )}
            </Pressable>
          </View>
        )}

        {/* Story Viewers Panel */}
        {showViewers && isOwner && (
          <View style={styles.viewersPanel}>
            <View style={styles.viewersHeader}>
              <View>
                <Text style={styles.viewersTitle}>Story viewers</Text>
                <Text style={styles.viewersSubtitle}>
                  {viewers.length} {viewers.length === 1 ? "person" : "people"}{" "}
                  viewed your story
                </Text>
              </View>

              <Pressable
                style={styles.viewersClose}
                onPress={() => setShowViewers(false)}
              >
                <X color="#555555" size={20} />
              </Pressable>
            </View>

            {loadingViewers ? (
              <ActivityIndicator
                size="large"
                color="#315efb"
                style={styles.loader}
              />
            ) : viewerError ? (
              <Text style={styles.errorText}>{viewerError}</Text>
            ) : viewers.length === 0 ? (
              <View style={styles.emptyViewers}>
                <Eye color="#BBBBBB" size={30} />
                <Text style={styles.emptyText}>
                  No one has viewed this story yet.
                </Text>
              </View>
            ) : (
              <ScrollView
                style={styles.viewersList}
                showsVerticalScrollIndicator={false}
              >
                {viewers.map((viewer) => (
                  <View key={viewer._id} style={styles.viewerItem}>
                    <View style={styles.viewerUser}>
                      {viewer.profilePicture ? (
                        <Image
                          source={{ uri: viewer.profilePicture }}
                          style={styles.viewerAvatar}
                        />
                      ) : (
                        <View style={styles.viewerAvatarPlaceholder}>
                          <Text style={styles.avatarLetter}>
                            {viewer.username?.charAt(0)?.toUpperCase() || "U"}
                          </Text>
                        </View>
                      )}

                      <Text style={styles.viewerUsername}>
                        {viewer.username || "User"}
                      </Text>
                    </View>

                    <View style={styles.viewedTime}>
                      <Clock color="#999999" size={13} />
                      <Text style={styles.timeText}>
                        {formatViewedTime(viewer.viewedAt)}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
  },
  media: {
    width: "100%",
    height: "100%",
  },
  progressContainer: {
    position: "absolute",
    top: 45,
    left: 12,
    right: 55,
    zIndex: 10,
    flexDirection: "row",
    gap: 4,
  },
  progressBackground: {
    height: 3,
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.35)",
    borderRadius: 5,
    overflow: "hidden",
  },
  completedProgress: {
    height: "100%",
    width: "100%",
    backgroundColor: "#FFFFFF",
  },
  currentProgress: {
    height: "100%",
    backgroundColor: "#FFFFFF",
  },
  userInfo: {
    position: "absolute",
    top: 60,
    left: 15,
    right: 65,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#555555",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  username: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  closeButton: {
    position: "absolute",
    top: 53,
    right: 15,
    zIndex: 20,
    padding: 8,
  },
  navigationButton: {
    position: "absolute",
    top: "48%",
    zIndex: 15,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 30,
    padding: 5,
  },
  previousButton: {
    left: 5,
  },
  nextButton: {
    right: 5,
  },
  bottomActions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: "rgba(0,0,0,0.75)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 20,
    paddingVertical: 18,
    paddingBottom: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  viewsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 25,
  },
  actionText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: "rgba(255,80,80,0.15)",
    padding: 12,
    borderRadius: 25,
  },
  viewersPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: "65%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    zIndex: 30,
    paddingBottom: 20,
  },
  viewersHeader: {
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  viewersTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#171717",
  },
  viewersSubtitle: {
    fontSize: 12,
    color: "#777777",
    marginTop: 5,
  },
  viewersClose: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#F2F2F2",
  },
  loader: {
    marginVertical: 30,
  },
  errorText: {
    color: "#E04444",
    textAlign: "center",
    padding: 25,
  },
  emptyViewers: {
    alignItems: "center",
    padding: 30,
    gap: 10,
  },
  emptyText: {
    color: "#777777",
    fontSize: 13,
    textAlign: "center",
  },
  viewersList: {
    paddingHorizontal: 16,
  },
  viewerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F1",
  },
  viewerUser: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    flex: 1,
  },
  viewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  viewerAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#777777",
    alignItems: "center",
    justifyContent: "center",
  },
  viewerUsername: {
    color: "#333333",
    fontSize: 14,
    fontWeight: "600",
  },
  viewedTime: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  timeText: {
    color: "#999999",
    fontSize: 11,
  },
});
