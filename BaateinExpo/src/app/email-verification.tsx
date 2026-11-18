import { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CheckCircle2, XCircle, ArrowLeft } from "lucide-react-native";

import { useAuth } from "../context/AuthContext";
import { getCurrentUser } from "../services/authService";

export default function EmailVerificationScreen() {
  const router = useRouter();
  const { status } = useLocalSearchParams<{ status?: string }>();
  const { updateUser } = useAuth();

  const [isRefreshing, setIsRefreshing] = useState(status === "success");

  const isSuccess = status === "success";

  useEffect(() => {
    let cancelled = false;

    const refreshUser = async () => {
      if (!isSuccess) {
        setIsRefreshing(false);
        return;
      }

      try {
        const updatedUser = await getCurrentUser();

        if (!cancelled) {
          updateUser(updatedUser);
        }
      } catch (error) {
        console.error(
          "Failed to refresh user after email verification:",
          error,
        );
      } finally {
        if (!cancelled) {
          setIsRefreshing(false);
        }
      }
    };

    refreshUser();

    return () => {
      cancelled = true;
    };
  }, [isSuccess, updateUser]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {isRefreshing ? (
          <>
            <ActivityIndicator size="large" color="#315EFB" />

            <Text style={styles.title}>Updating your account</Text>

            <Text style={styles.description}>
              Your email has been verified. Please wait while we refresh your
              account information.
            </Text>
          </>
        ) : isSuccess ? (
          <>
            <View style={styles.successIcon}>
              <CheckCircle2 size={48} color="#16A34A" />
            </View>

            <Text style={styles.title}>Email Verified!</Text>

            <Text style={styles.description}>
              Your Baatein account email address has been updated successfully.
              You can now continue using your account with your new email.
            </Text>

            <Pressable
              style={styles.primaryButton}
              onPress={() => router.replace("/settings")}
            >
              <Text style={styles.primaryButtonText}>Go to Settings</Text>
            </Pressable>
          </>
        ) : (
          <>
            <View style={styles.errorIcon}>
              <XCircle size={48} color="#E53935" />
            </View>

            <Text style={styles.title}>Verification Failed</Text>

            <Text style={styles.description}>
              This verification link is invalid or has expired. Please request
              another email verification link from your account settings.
            </Text>

            <Pressable
              style={styles.primaryButton}
              onPress={() => router.replace("/change-email")}
            >
              <Text style={styles.primaryButtonText}>Try Again</Text>
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  content: {
    flex: 1,
    paddingHorizontal: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  successIcon: {
    width: 90,
    height: 90,
    borderRadius: 30,
    backgroundColor: "#E9F9EF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 25,
  },
  errorIcon: {
    width: 90,
    height: 90,
    borderRadius: 30,
    backgroundColor: "#FFF0F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 25,
  },
  title: {
    fontSize: 25,
    fontWeight: "800",
    color: "#171717",
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: "#777777",
    textAlign: "center",
    lineHeight: 23,
    marginBottom: 30,
  },
  primaryButton: {
    width: "100%",
    height: 53,
    backgroundColor: "#315EFB",
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
