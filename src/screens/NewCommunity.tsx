import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, TextInput, Button, Switch, Alert, FlatList, TouchableOpacity } from "react-native";
import { db } from "../../firebaseConfig";
import { doc, setDoc, collection, getDocs } from "firebase/firestore";

const CreateCommunity = () => {
  const [communityName, setCommunityName] = useState("");
  const [communityDescription, setCommunityDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [communities, setCommunities] = useState([]);

  const handleCreate = async () => {
    if (!communityName.trim()) {
      Alert.alert("Validation Error", "Please enter a community name.");
      return;
    }

    if (!communityDescription.trim()) {
      Alert.alert("Validation Error", "Please enter a community description.");
      return;
    }

    try {
      const newCommunityRef = doc(collection(db, "communities"));
      await setDoc(newCommunityRef, {
        name: communityName,
        description: communityDescription,
        private: isPrivate,
      });
      fetchCommunities(); // Refresh the list after adding
      Alert.alert("Success", "Community created successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to create community.");
      console.error("Error creating community: ", error);
    }
  };

  const fetchCommunities = async () => {
    try {
      const communitiesSnapshot = await getDocs(collection(db, "communities"));
      const communitiesList = communitiesSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setCommunities(communitiesList);
    } catch (error) {
      console.error("Error fetching communities: ", error);
    }
  };

  useEffect(() => {
    fetchCommunities();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Create a New Community</Text>
      <TextInput
        style={styles.input}
        placeholder="Name your community"
        value={communityName}
        onChangeText={setCommunityName}
      />
      <TextInput
        style={styles.input}
        placeholder="Describe your community"
        value={communityDescription}
        onChangeText={setCommunityDescription}
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
      <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
        <Text style={styles.createButtonText}>Create Community</Text>
      </TouchableOpacity>
      <FlatList
        data={communities}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.communityItem}>
            <Text style={styles.communityName}>{item.name}</Text>
            <Text style={styles.communityDescription}>{item.description}</Text>
            <Text style={styles.communityType}>{item.private ? "(Private)" : "(Public)"}</Text>
          </View>
        )}
      />
    </View>
  );
};

export default CreateCommunity;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
    padding: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  input: {
    height: 40,
    marginVertical: 12,
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    borderColor: "#ccc",
    backgroundColor: "#fff",
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 20,
  },
  label: {
    fontSize: 18,
    color: "#333",
  },
  createButton: {
    backgroundColor: "#007bff",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    marginVertical: 10,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  communityItem: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginVertical: 8,
    borderColor: "#ddd",
    borderWidth: 1,
  },
  communityName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  communityDescription: {
    fontSize: 14,
    color: "#666",
    marginVertical: 5,
  },
  communityType: {
    fontSize: 14,
    color: "#999",
  },
});
