import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Mail, LockKeyhole, Send } from "lucide-react-native";

import { useAuth } from "../context/AuthContext";
import { requestEmailChange } from "../services/authService";

export default function ChangeEmailScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");

  const handleChangeEmail = async () => {
    const email = newEmail.trim().toLowerCase();

    if (!email || !currentPassword.trim()) {
      Alert.alert(
        "Missing information",
        "Enter your new email and current password.",
      );
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      Alert.alert("Invalid email", "Enter a valid email address.");
      return;
    }

    if (email === user?.email?.toLowerCase()) {
      Alert.alert(
        "Same email",
        "Your new email is already your current email.",
      );
      return;
    }

    try {
      setIsLoading(true);

      const response = await requestEmailChange(email, currentPassword);

      setPendingEmail(response.pendingEmail);
      setEmailSent(true);
      setCurrentPassword("");
      setNewEmail("");
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Unable to request an email change. Please try again.";

      Alert.alert("Email change failed", message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={23} color="#171717" />
          </Pressable>

          <Text style={styles.headerTitle}>Email Address</Text>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {emailSent ? (
            <View style={styles.successCard}>
              <View style={styles.successIcon}>
                <Mail size={30} color="#315EFB" />
              </View>

              <Text style={styles.successTitle}>Verification email sent</Text>

              <Text style={styles.successDescription}>
                We sent a verification link to:
              </Text>

              <Text style={styles.pendingEmail}>{pendingEmail}</Text>

              <Text style={styles.infoText}>
                Open that email and click the verification link to complete your
                email address change. Your current email will remain unchanged
                until verification is complete.
              </Text>

              <Pressable
                style={styles.secondaryButton}
                onPress={() => {
                  setEmailSent(false);
                  setPendingEmail("");
                }}
              >
                <Text style={styles.secondaryButtonText}>
                  Use another email
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.intro}>
                <View style={styles.iconCircle}>
                  <Mail size={28} color="#315EFB" />
                </View>

                <Text style={styles.title}>Change your email</Text>

                <Text style={styles.description}>
                  Update the email address connected to your Baatein account. We
                  will send a verification link to your new address.
                </Text>
              </View>

              <View style={styles.currentEmailCard}>
                <Text style={styles.fieldLabel}>CURRENT EMAIL</Text>
                <Text style={styles.currentEmail}>
                  {user?.email || "Not available"}
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.fieldLabel}>NEW EMAIL ADDRESS</Text>

                <View style={styles.inputWrapper}>
                  <Mail size={19} color="#888" />

                  <TextInput
                    style={styles.input}
                    placeholder="Enter new email address"
                    placeholderTextColor="#999"
                    value={newEmail}
                    onChangeText={setNewEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.fieldLabel}>CURRENT PASSWORD</Text>

                <View style={styles.inputWrapper}>
                  <LockKeyhole size={19} color="#888" />

                  <TextInput
                    style={styles.input}
                    placeholder="Enter your current password"
                    placeholderTextColor="#999"
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                </View>

                <Text style={styles.helperText}>
                  Your password is required to confirm this change.
                </Text>
              </View>

              <Pressable
                style={[
                  styles.primaryButton,
                  isLoading && styles.disabledButton,
                ]}
                onPress={handleChangeEmail}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Send size={18} color="#fff" />
                    <Text style={styles.primaryButtonText}>
                      Send Verification Link
                    </Text>
                  </>
                )}
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  header: {
    height: 58,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#171717",
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    padding: 22,
    paddingBottom: 40,
    flexGrow: 1,
  },
  intro: {
    alignItems: "center",
    marginTop: 22,
    marginBottom: 30,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: "#EAF0FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  title: {
    fontSize: 23,
    fontWeight: "800",
    color: "#171717",
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    lineHeight: 22,
    marginTop: 9,
    maxWidth: 320,
  },
  currentEmailCard: {
    backgroundColor: "#F0F0F0",
    borderRadius: 13,
    padding: 16,
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#777",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  currentEmail: {
    fontSize: 15,
    fontWeight: "600",
    color: "#222",
  },
  inputGroup: {
    marginBottom: 22,
  },
  inputWrapper: {
    minHeight: 54,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 13,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#171717",
    paddingVertical: 14,
    paddingLeft: 11,
  },
  helperText: {
    fontSize: 12,
    color: "#888",
    marginTop: 8,
  },
  primaryButton: {
    height: 54,
    backgroundColor: "#315EFB",
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  successCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 23,
    alignItems: "center",
    marginTop: 35,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  successIcon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: "#EAF0FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#171717",
    textAlign: "center",
  },
  successDescription: {
    fontSize: 14,
    color: "#777",
    marginTop: 14,
  },
  pendingEmail: {
    fontSize: 15,
    fontWeight: "700",
    color: "#315EFB",
    marginTop: 7,
    textAlign: "center",
  },
  infoText: {
    fontSize: 13,
    color: "#777",
    lineHeight: 21,
    textAlign: "center",
    marginTop: 18,
  },
  secondaryButton: {
    marginTop: 25,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 11,
    backgroundColor: "#EAF0FF",
  },
  secondaryButtonText: {
    color: "#315EFB",
    fontSize: 14,
    fontWeight: "700",
  },
});
