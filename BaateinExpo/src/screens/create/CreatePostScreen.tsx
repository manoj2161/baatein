
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { VideoView, useVideoPlayer } from "expo-video";
import {
  Sparkles,
  ImagePlus,
  Video,
  X,
  Send,
  CheckCircle2,
  Image as ImageIcon,
  Film,
} from "lucide-react-native";

import { createPost } from "../../services/postService";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

function VideoPreview({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = true;
  });

  return (
    <VideoView
      player={player}
      style={styles.previewMedia}
      nativeControls
      contentFit="contain"
    />
  );
}

export default function CreatePostScreen() {
  const [caption, setCaption] = useState("");
  const [media, setMedia] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isVideo = media?.type === "video";

  const chooseMedia = async (type: "image" | "video") => {
    try {
      setError("");

      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        setError("Gallery permission is required to select media.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes:
          type === "image" ? ["images"] : ["videos"],
        allowsEditing: false,
        quality: 0.8,
        videoMaxDuration: 60,
      });

      if (result.canceled || !result.assets.length) return;

      const selected = result.assets[0];

      if (type === "image" && selected.type === "video") {
        setError("Please select an image.");
        return;
      }

      if (type === "video" && selected.type !== "video") {
        setError("Please select a video.");
        return;
      }

      const size = selected.fileSize;

      if (size && selected.type === "video" && size > MAX_VIDEO_SIZE) {
        setError("Video size must be less than 100 MB.");
        return;
      }

      if (size && selected.type !== "video" && size > MAX_IMAGE_SIZE) {
        setError("Image size must be less than 10 MB.");
        return;
      }

      setMedia(selected);
    } catch (err) {
      console.error("Media selection failed:", err);
      setError("Unable to select media. Please try again.");
    }
  };

  const removeMedia = () => {
    if (loading) return;

    setMedia(null);
    setError("");
  };

  const handleSubmit = async () => {
    if (loading) return;

    if (!media) {
      setError("Choose a photo or video before sharing.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await createPost([media], caption.trim());

      setCaption("");
      setMedia(null);

      Alert.alert("Success", "Your post has been shared.");
    } catch (err: any) {
      console.error("Post creation failed:", err);

      setError(
        err.response?.data?.message ||
          "Unable to create post. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Caption */}
      <View style={styles.card}>
        <View style={styles.sectionHeading}>
          <View style={styles.headingIcon}>
            <Sparkles size={21} color="#315efb" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>
              Start with a thought
            </Text>
            <Text style={styles.sectionSubtitle}>
              Every post has a story behind it.
            </Text>
          </View>
        </View>

        <TextInput
          value={caption}
          onChangeText={setCaption}
          placeholder="What's happening in your world?"
          placeholderTextColor="#999999"
          multiline
          maxLength={2200}
          textAlignVertical="top"
          style={styles.captionInput}
        />

        <View style={styles.characterCount}>
          <Text style={styles.countText}>
            {caption.length} / 2200
          </Text>
        </View>
      </View>

      {/* Media */}
      <View style={styles.card}>
        <View style={styles.mediaHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Your moment</Text>
            <Text style={styles.sectionSubtitle}>
              Add a photo or video to your post.
            </Text>
          </View>

          <View style={styles.headingIcon}>
            <ImageIcon size={20} color="#315efb" />
          </View>
        </View>

        {!media ? (
          <View style={styles.uploadArea}>
            <View style={styles.uploadIcon}>
              <ImagePlus size={34} color="#315efb" />
            </View>

            <Text style={styles.uploadTitle}>
              Bring your moment to life
            </Text>

            <Text style={styles.uploadDescription}>
              Choose something from your device to share with your followers.
            </Text>

            <View style={styles.pickerButtons}>
              <Pressable
                style={styles.photoButton}
                onPress={() => chooseMedia("image")}
              >
                <ImagePlus size={18} color="#FFFFFF" />
                <Text style={styles.photoButtonText}>Choose Photo</Text>
              </Pressable>

              <Pressable
                style={styles.videoButton}
                onPress={() => chooseMedia("video")}
              >
                <Video size={18} color="#444444" />
                <Text style={styles.videoButtonText}>Choose Video</Text>
              </Pressable>
            </View>

            <Text style={styles.limitText}>
              Images up to 10 MB · Videos up to 100 MB
            </Text>
          </View>
        ) : (
          <View style={styles.selectedMedia}>
            <View style={styles.selectedHeader}>
              <View style={styles.fileInfo}>
                <View style={styles.fileIcon}>
                  {isVideo ? (
                    <Film size={18} color="#315efb" />
                  ) : (
                    <ImageIcon size={18} color="#315efb" />
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={styles.fileName}>
                    {media.fileName || "Selected media"}
                  </Text>

                  <Text style={styles.fileSize}>
                    {media.fileSize
                      ? `${(media.fileSize / (1024 * 1024)).toFixed(2)} MB`
                      : "Media selected"}
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={removeMedia}
                disabled={loading}
                style={styles.removeButton}
              >
                <X size={19} color="#666666" />
              </Pressable>
            </View>

            <View style={styles.previewContainer}>
              {isVideo ? (
                <VideoPreview uri={media.uri} />
              ) : (
                <Image
                  source={{ uri: media.uri }}
                  style={styles.previewMedia}
                  resizeMode="contain"
                />
              )}
            </View>

            <View style={styles.readyMessage}>
              <CheckCircle2 size={16} color="#16A34A" />
              <Text style={styles.readyText}>
                Media ready to share
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Error */}
      {error !== "" && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Share */}
      <View style={styles.shareCard}>
        <Text style={styles.shareTitle}>
          Ready to share your moment?
        </Text>

        <Text style={styles.shareSubtitle}>
          Your followers will be able to see your new post.
        </Text>

        <Pressable
          onPress={handleSubmit}
          disabled={loading || !media}
          style={[
            styles.shareButton,
            (!media || loading) && styles.disabledButton,
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Send size={17} color="#FFFFFF" />
              <Text style={styles.shareButtonText}>Share Post</Text>
            </>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  content: {
    padding: 16,
    paddingBottom: 35,
    gap: 18,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 18,
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  headingIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: "#EFF4FF",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    color: "#171717",
    fontSize: 16,
    fontWeight: "700",
  },
  sectionSubtitle: {
    color: "#888888",
    fontSize: 12,
    marginTop: 4,
  },
  captionInput: {
    minHeight: 125,
    color: "#333333",
    fontSize: 15,
    lineHeight: 24,
    padding: 0,
  },
  characterCount: {
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingTop: 12,
    alignItems: "flex-end",
  },
  countText: {
    color: "#999999",
    fontSize: 11,
  },
  mediaHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  uploadArea: {
    minHeight: 280,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#C9D8FF",
    borderRadius: 16,
    backgroundColor: "#F7F9FF",
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadIcon: {
    width: 75,
    height: 75,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#171717",
    textAlign: "center",
  },
  uploadDescription: {
    color: "#888888",
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 8,
    maxWidth: 260,
  },
  pickerButtons: {
    width: "100%",
    gap: 10,
    marginTop: 22,
  },
  photoButton: {
    height: 46,
    borderRadius: 11,
    backgroundColor: "#315efb",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  photoButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  videoButton: {
    height: 46,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  videoButtonText: {
    color: "#444444",
    fontSize: 13,
    fontWeight: "700",
  },
  limitText: {
    color: "#999999",
    fontSize: 10,
    marginTop: 17,
  },
  selectedMedia: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    overflow: "hidden",
  },
  selectedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
  },
  fileInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  fileIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EFF4FF",
    alignItems: "center",
    justifyContent: "center",
  },
  fileName: {
    color: "#333333",
    fontSize: 12,
    fontWeight: "700",
  },
  fileSize: {
    color: "#999999",
    fontSize: 11,
    marginTop: 3,
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  previewContainer: {
    minHeight: 220,
    backgroundColor: "#F4F6FA",
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  previewMedia: {
    width: "100%",
    height: 300,
    borderRadius: 9,
  },
  readyMessage: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    padding: 12,
  },
  readyText: {
    color: "#16A34A",
    fontSize: 11,
    fontWeight: "600",
  },
  errorBox: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    borderWidth: 1,
    padding: 13,
    borderRadius: 12,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 12,
  },
  shareCard: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: "#EFF4FF",
    borderWidth: 1,
    borderColor: "#DCE6FF",
  },
  shareTitle: {
    color: "#171717",
    fontSize: 15,
    fontWeight: "700",
  },
  shareSubtitle: {
    color: "#777777",
    fontSize: 12,
    marginTop: 5,
  },
  shareButton: {
    height: 47,
    borderRadius: 11,
    backgroundColor: "#315efb",
    marginTop: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  shareButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.5,
  },
});
