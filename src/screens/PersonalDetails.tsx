import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function PersonalDetails({ route }) {
  const { additionalInfo } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Personal Details</Text>
      <Text style={styles.detail}>First Name: {additionalInfo.firstName}</Text>
      <Text style={styles.detail}>Last Name: {additionalInfo.lastName}</Text>
      <Text style={styles.detail}>Height: {additionalInfo.height}</Text>
      <Text style={styles.detail}>Weight: {additionalInfo.weight}</Text>
      <Text style={styles.detail}>Age: {additionalInfo.age}</Text>
      <Text style={styles.detail}>Sex: {additionalInfo.sex}</Text>
      <Text style={styles.detail}>
        Gym Interests: {additionalInfo.gym_interests.join(", ")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  detail: {
    fontSize: 18,
    marginBottom: 10,
  },
});
