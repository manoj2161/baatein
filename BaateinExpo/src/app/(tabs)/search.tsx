import { View, Text, StyleSheet } from "react-native";

export default function SearchRoute() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Search Screen</Text>
      <Text style={styles.subtitle}>Navigation is working.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#315EFB",
  },
  subtitle: {
    marginTop: 8,
    color: "#777777",
  },
});
