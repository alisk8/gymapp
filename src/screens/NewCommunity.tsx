import React, { useState } from "react";
import { StyleSheet, Text, View, TextInput, Button, Switch, Alert } from "react-native";
import { db } from "../../firebaseConfig";
import { doc, setDoc, collection } from "firebase/firestore"; // Import 'collection' along with 'doc' and 'setDoc'

const CreateCommunity = () => {
  const [communityName, setCommunityName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  const handleCreate = async () => {
    if (!communityName.trim()) {
      Alert.alert("Validation Error", "Please enter a community name.");
      return;
    }

    try {
      const newCommunityRef = doc(collection(db, "communities")); // Correctly use 'collection' here
      await setDoc(newCommunityRef, {
        name: communityName,
        private: isPrivate,
      });
      Alert.alert("Success", "Community created successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to create community.");
      console.error("Error creating community: ", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Create a New Community</Text>
      <TextInput
        style={styles.input}
        placeholder="Name your community"
        value={communityName}
        onChangeText={setCommunityName}
      />
      <View style={styles.switchContainer}>
        <Text style={styles.label}>Private Community</Text>
        <Switch
          trackColor={{ false: "#767577", true: "#81b0ff" }}
          thumbColor={isPrivate ? "#f5dd4b" : "#f4f3f4"}
          ios_backgroundColor="#3e3e3e"
          onValueChange={() => setIsPrivate(previousState => !previousState)}
          value={isPrivate}
        />
      </View>
      <Button title="Create Community" onPress={handleCreate} />
    </View>
  );
};

export default CreateCommunity;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    height: 40,
    marginVertical: 12,
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
    borderColor: "#ccc",
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
  },
});
