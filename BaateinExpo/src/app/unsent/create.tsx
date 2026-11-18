import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Check, Lock, Users, Globe } from "lucide-react-native";
import axios from "axios";

import {
  createUnsent,
  UnsentCategory,
  UnsentVisibility,
} from "../../services/unsentService";

const categories: UnsentCategory[] = [
  "To Someone",
  "To My Past",
  "To My Future",
  "An Apology",
  "A Thank You",
  "A Goodbye",
  "A Dream",
  "A Secret",
];

export default function CreateUnsentScreen() {
  const router = useRouter();

  const [content, setContent] = useState("");
  const [category, setCategory] = useState<UnsentCategory>("To Someone");
  const [visibility, setVisibility] = useState<UnsentVisibility>("anonymous");
  const [loading, setLoading] = useState(false);

  const handlePublish = async () => {
    if (!content.trim()) {
      Alert.alert("Empty message", "Please write something first.");
      return;
    }

    if (content.trim().length > 5000) {
      Alert.alert(
        "Message too long",
        "Your message cannot exceed 5000 characters.",
      );
      return;
    }

    try {
      setLoading(true);

      await createUnsent({
        content: content.trim(),
        category,
        visibility,
      });

      Alert.alert("Published", "Your words have found their place.", [
        {
          text: "Continue",
          onPress: () => router.replace("/(tabs)/unsent"),
        },
      ]);
    } catch (error) {
      console.error("Publish Unsent error:", error);

      const message = axios.isAxiosError(error)
        ? error.response?.data?.message ||
          "Unable to publish your message. Please try again."
        : "Something went wrong. Please try again.";

      Alert.alert("Publishing failed", message);
    } finally {
      setLoading(false);
    }
  };

  const visibilityOptions = [
    {
      value: "anonymous" as const,
      label: "Anonymous",
      description: "Nobody knows this message is yours.",
      icon: Lock,
    },
    {
      value: "followers" as const,
      label: "Followers",
      description: "Only people who follow you can see it.",
      icon: Users,
    },
    {
      value: "public" as const,
      label: "Public",
      description: "Everyone can see your identity.",
      icon: Globe,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={22} color="#222222" />
          </Pressable>

          <Text style={styles.headerTitle}>Write an Unsent</Text>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.heading}>Say what you never said.</Text>

          <Text style={styles.description}>
            Some words deserve a place, even if they never reach the person they
            were meant for.
          </Text>

          <View style={styles.editorContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Start writing your unsent words..."
              placeholderTextColor="#AAAAAA"
              multiline
              textAlignVertical="top"
              maxLength={5000}
              value={content}
              onChangeText={setContent}
              editable={!loading}
            />

            <Text style={styles.characterCount}>{content.length}/5000</Text>
          </View>

          <Text style={styles.sectionTitle}>Choose a category</Text>

          <View style={styles.categoryContainer}>
            {categories.map((item) => {
              const selected = category === item;

              return (
                <Pressable
                  key={item}
                  onPress={() => setCategory(item)}
                  style={[
                    styles.categoryChip,
                    selected && styles.categoryChipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      selected && styles.categoryChipTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.sectionTitle}>Who can read it?</Text>

          <View style={styles.visibilityContainer}>
            {visibilityOptions.map((option) => {
              const selected = visibility === option.value;
              const Icon = option.icon;

              return (
                <Pressable
                  key={option.value}
                  onPress={() => setVisibility(option.value)}
                  style={[
                    styles.visibilityOption,
                    selected && styles.visibilityOptionSelected,
                  ]}
                >
                  <View style={styles.visibilityIcon}>
                    <Icon size={20} color={selected ? "#315EFB" : "#777777"} />
                  </View>

                  <View style={styles.visibilityInfo}>
                    <Text style={styles.visibilityTitle}>{option.label}</Text>

                    <Text style={styles.visibilityDescription}>
                      {option.description}
                    </Text>
                  </View>

                  <View
                    style={[styles.radio, selected && styles.radioSelected]}
                  >
                    {selected && <View style={styles.radioInner} />}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.privacyNote}>
            <Lock size={15} color="#777777" />
            <Text style={styles.privacyText}>
              Anonymous messages hide your identity from everyone, including
              other users reading replies.
            </Text>
          </View>

          <Pressable
            style={[
              styles.publishButton,
              (loading || !content.trim()) && styles.publishButtonDisabled,
            ]}
            onPress={handlePublish}
            disabled={loading || !content.trim()}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Check size={19} color="#FFFFFF" />
                <Text style={styles.publishButtonText}>Publish Unsent</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#222222",
  },
  headerSpacer: {
    width: 38,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 45,
  },
  heading: {
    fontSize: 24,
    fontWeight: "800",
    color: "#171717",
  },
  description: {
    fontSize: 13,
    lineHeight: 21,
    color: "#777777",
    marginTop: 9,
  },
  editorContainer: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAEAEA",
    borderRadius: 16,
    marginTop: 24,
    padding: 15,
    minHeight: 210,
  },
  textInput: {
    minHeight: 165,
    fontSize: 15,
    lineHeight: 24,
    color: "#222222",
  },
  characterCount: {
    textAlign: "right",
    fontSize: 11,
    color: "#999999",
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#222222",
    marginTop: 27,
    marginBottom: 13,
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },
  categoryChip: {
    paddingHorizontal: 13,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  categoryChipSelected: {
    backgroundColor: "#EFF4FF",
    borderColor: "#315EFB",
  },
  categoryChipText: {
    color: "#666666",
    fontSize: 12,
    fontWeight: "600",
  },
  categoryChipTextSelected: {
    color: "#315EFB",
    fontWeight: "800",
  },
  visibilityContainer: {
    gap: 10,
  },
  visibilityOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAEAEA",
    borderRadius: 13,
    padding: 13,
  },
  visibilityOptionSelected: {
    borderColor: "#315EFB",
    backgroundColor: "#F8FAFF",
  },
  visibilityIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  visibilityInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  visibilityTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#222222",
  },
  visibilityDescription: {
    fontSize: 11,
    color: "#888888",
    marginTop: 4,
    lineHeight: 16,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#CCCCCC",
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    borderColor: "#315EFB",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#315EFB",
  },
  privacyNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    marginTop: 22,
    padding: 13,
    backgroundColor: "#F1F2F4",
    borderRadius: 11,
  },
  privacyText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 17,
    color: "#666666",
  },
  publishButton: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    backgroundColor: "#315EFB",
    borderRadius: 13,
    marginTop: 25,
  },
  publishButtonDisabled: {
    opacity: 0.5,
  },
  publishButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
