import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Camera, Trash2, Save, ArrowLeft } from "lucide-react-native";
import { useRouter } from "expo-router";

import { useAuth } from "../../context/AuthContext";
import {
  updateProfile,
  uploadProfilePicture,
  removeProfilePicture,
} from "../../services/authService";

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuth();

  const [username, setUsername] = useState(user?.username || "");
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [status, setStatus] = useState(user?.status || "");

  const [profilePicture, setProfilePicture] = useState(
    user?.profilePicture || "",
  );

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    setUsername(user?.username || "");
    setFullName(user?.fullName || "");
    setBio(user?.bio || "");
    setStatus(user?.status || "");
    setProfilePicture(user?.profilePicture || "");
  }, [user]);

  const chooseProfilePicture = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission required",
          "Please allow gallery access to select a profile picture.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) return;

      const image = result.assets[0];

      setUploading(true);

      const fileName = image.fileName || `profile-${Date.now()}.jpg`;

      const mimeType = image.mimeType || "image/jpeg";

      const updatedUser = await uploadProfilePicture(
        image.uri,
        fileName,
        mimeType,
      );

      updateUser(updatedUser);
      setProfilePicture(updatedUser.profilePicture || "");

      Alert.alert("Success", "Profile picture updated.");
    } catch (error: any) {
      console.error("Profile picture upload error:", error);

      Alert.alert(
        "Upload failed",
        error?.response?.data?.message || "Unable to upload profile picture.",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePicture = () => {
    Alert.alert(
      "Remove profile picture",
      "Are you sure you want to remove your profile picture?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              setRemoving(true);

              const updatedUser = await removeProfilePicture();

              updateUser(updatedUser);
              setProfilePicture("");

              Alert.alert("Success", "Profile picture removed.");
            } catch (error: any) {
              Alert.alert(
                "Error",
                error?.response?.data?.message ||
                  "Unable to remove profile picture.",
              );
            } finally {
              setRemoving(false);
            }
          },
        },
      ],
    );
  };

  const handleSave = async () => {
    const normalizedUsername = username.trim().toLowerCase();

    if (!normalizedUsername) {
      Alert.alert("Required", "Please enter a username.");
      return;
    }

    if (normalizedUsername.length < 3 || normalizedUsername.length > 30) {
      Alert.alert(
        "Invalid username",
        "Username must contain between 3 and 30 characters.",
      );
      return;
    }

    if (!/^[a-z0-9._]+$/.test(normalizedUsername)) {
      Alert.alert(
        "Invalid username",
        "Use only lowercase letters, numbers, periods and underscores.",
      );
      return;
    }

    if (fullName.trim().length > 50) {
      Alert.alert("Invalid name", "Full name cannot exceed 50 characters.");
      return;
    }

    if (bio.trim().length > 150) {
      Alert.alert("Invalid bio", "Bio cannot exceed 150 characters.");
      return;
    }

    if (status.trim().length > 60) {
      Alert.alert("Invalid status", "Status cannot exceed 60 characters.");
      return;
    }

    try {
      setSaving(true);

      const updatedUser = await updateProfile({
        username: normalizedUsername,
        fullName: fullName.trim(),
        bio: bio.trim(),
        status: status.trim(),
      });

      updateUser(updatedUser);

      Alert.alert("Success", "Your profile has been updated.", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error("Profile update error:", error);

      Alert.alert(
        "Update failed",
        error?.response?.data?.message || "Unable to update your profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={23} color="#222222" />
          </Pressable>

          <Text style={styles.headerTitle}>Edit Profile</Text>

          <Pressable
            onPress={handleSave}
            disabled={saving || uploading || removing}
            style={styles.headerSave}
          >
            {saving ? (
              <ActivityIndicator color="#315EFB" size="small" />
            ) : (
              <Text style={styles.headerSaveText}>Save</Text>
            )}
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.photoSection}>
            <View style={styles.photoContainer}>
              {profilePicture ? (
                <Image
                  source={{ uri: profilePicture }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.placeholder}>
                  <Camera size={38} color="#315EFB" />
                </View>
              )}

              {(uploading || removing) && (
                <View style={styles.photoLoading}>
                  <ActivityIndicator color="#FFFFFF" />
                </View>
              )}
            </View>

            <Pressable
              onPress={chooseProfilePicture}
              disabled={uploading || removing}
              style={styles.changePhotoButton}
            >
              <Text style={styles.changePhotoText}>
                {uploading ? "Uploading..." : "Change Profile Photo"}
              </Text>
            </Pressable>

            {profilePicture ? (
              <Pressable
                onPress={handleRemovePicture}
                disabled={uploading || removing}
                style={styles.removePhotoButton}
              >
                {removing ? (
                  <ActivityIndicator size="small" color="#E53935" />
                ) : (
                  <>
                    <Trash2 size={15} color="#E53935" />
                    <Text style={styles.removePhotoText}>Remove Photo</Text>
                  </>
                )}
              </Pressable>
            ) : null}
          </View>

          <View style={styles.form}>
            <InputField
              label="Username"
              value={username}
              onChangeText={setUsername}
              placeholder="Enter username"
              maxLength={30}
              autoCapitalize="none"
            />

            <InputField
              label="Full Name"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
              maxLength={50}
            />

            <InputField
              label="Bio"
              value={bio}
              onChangeText={setBio}
              placeholder="Write something about yourself"
              multiline
              maxLength={150}
            />

            <Text style={styles.characterCount}>{bio.length}/150</Text>

            <InputField
              label="Status"
              value={status}
              onChangeText={setStatus}
              placeholder="What's on your mind?"
              maxLength={60}
            />

            <Text style={styles.characterCount}>{status.length}/60</Text>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Your email address cannot be changed from this screen.
              </Text>
            </View>
          </View>

          <Pressable
            style={[
              styles.saveButton,
              (saving || uploading || removing) && styles.disabledButton,
            ]}
            onPress={handleSave}
            disabled={saving || uploading || removing}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Save size={18} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  maxLength,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
  maxLength: number;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#AAAAAA"
        maxLength={maxLength}
        multiline={multiline}
        autoCapitalize={autoCapitalize || "sentences"}
        style={[styles.input, multiline && styles.multilineInput]}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    height: 55,
    paddingHorizontal: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  backButton: {
    width: 38,
    height: 38,
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#222222",
  },
  headerSave: {
    minWidth: 45,
    alignItems: "flex-end",
  },
  headerSaveText: {
    color: "#315EFB",
    fontSize: 15,
    fontWeight: "700",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 40,
  },
  photoSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  photoContainer: {
    width: 112,
    height: 112,
    borderRadius: 56,
    overflow: "hidden",
    backgroundColor: "#EEF2FF",
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  photoLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  changePhotoButton: {
    marginTop: 13,
  },
  changePhotoText: {
    color: "#315EFB",
    fontSize: 14,
    fontWeight: "700",
  },
  removePhotoButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },
  removePhotoText: {
    color: "#E53935",
    fontSize: 12,
    fontWeight: "600",
  },
  form: {
    gap: 17,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    color: "#333333",
    fontWeight: "700",
  },
  input: {
    minHeight: 49,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 11,
    paddingHorizontal: 14,
    color: "#222222",
    fontSize: 14,
    backgroundColor: "#FAFAFA",
  },
  multilineInput: {
    minHeight: 100,
    paddingTop: 13,
  },
  characterCount: {
    fontSize: 11,
    color: "#999999",
    textAlign: "right",
    marginTop: -12,
  },
  infoBox: {
    backgroundColor: "#F1F4FF",
    borderRadius: 10,
    padding: 13,
  },
  infoText: {
    fontSize: 12,
    color: "#52638F",
    lineHeight: 18,
  },
  saveButton: {
    height: 51,
    borderRadius: 11,
    backgroundColor: "#315EFB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginTop: 28,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.6,
  },
});
