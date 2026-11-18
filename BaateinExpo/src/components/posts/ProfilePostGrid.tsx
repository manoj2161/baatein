import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Video, Heart, MessageCircle } from "lucide-react-native";

export interface ProfilePost {
  _id: string;
  caption?: string;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  likes?: any[];
  comments?: any[];
  createdAt?: string;
}

interface ProfilePostGridProps {
  posts: ProfilePost[];
  onPostPress?: (post: ProfilePost) => void;
}

const SCREEN_WIDTH = Dimensions.get("window").width;
const GRID_GAP = 3;
const ITEM_SIZE = (SCREEN_WIDTH - 36 - GRID_GAP * 2) / 3;

export default function ProfilePostGrid({
  posts,
  onPostPress,
}: ProfilePostGridProps) {
  if (posts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No posts yet</Text>
        <Text style={styles.emptySubtitle}>Your posts will appear here.</Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {posts.map((post) => (
        <Pressable
          key={post._id}
          style={styles.postItem}
          onPress={() => onPostPress?.(post)}
        >
          {post.mediaUrl ? (
            <Image
              source={{ uri: post.mediaUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.noMedia}>
              <Text style={styles.noMediaText}>No media</Text>
            </View>
          )}

          {post.mediaType === "video" && (
            <View style={styles.videoIcon}>
              <Video size={17} color="#FFFFFF" />
            </View>
          )}

          <View style={styles.overlay}>
            <View style={styles.overlayItem}>
              <Heart size={14} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.overlayText}>{post.likes?.length || 0}</Text>
            </View>

            <View style={styles.overlayItem}>
              <MessageCircle size={14} color="#FFFFFF" />
              <Text style={styles.overlayText}>
                {post.comments?.length || 0}
              </Text>
            </View>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
  },
  postItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    backgroundColor: "#F1F1F1",
    position: "relative",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  noMedia: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEEEEE",
  },
  noMediaText: {
    color: "#888888",
    fontSize: 11,
  },
  videoIcon: {
    position: "absolute",
    top: 7,
    right: 7,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 5,
    borderRadius: 6,
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    flexDirection: "row",
    justifyContent: "center",
    gap: 17,
    paddingVertical: 7,
  },
  overlayItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  overlayText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 35,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#444444",
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#999999",
    marginTop: 6,
  },
});
