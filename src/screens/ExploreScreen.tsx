import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { firebase_auth, db } from "../../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

const ExploreScreen = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = firebase_auth.currentUser;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const userCollection = collection(db, "userProfiles");
      const userSnapshot = await getDocs(userCollection);
      const userList = userSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((user) => user.id !== currentUser.uid);

      setUsers(userList);
    } catch (error) {
      console.error("Error fetching users: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const renderUserItem = (user) => (
    <View key={user.id} style={styles.userItem}>
      <Image
        source={{
          uri: user.profilePicture || "https://via.placeholder.com/100",
        }}
        style={styles.userImage}
      />
      <Text style={styles.userName}>
        {`${user.firstName} ${user.lastName}`}
      </Text>
      <TouchableOpacity style={styles.connectButton}>
        <Text style={styles.connectButtonText}>Connect</Text>
      </TouchableOpacity>
    </View>
  );

  const renderUserRows = (users) => (
    <View style={styles.userRowsContainer}>
      <ScrollView horizontal>
        <View style={styles.userRow}>
          {users.slice(0, Math.ceil(users.length / 2)).map(renderUserItem)}
        </View>
      </ScrollView>
      <ScrollView horizontal>
        <View style={styles.userRow}>
          {users.slice(Math.ceil(users.length / 2)).map(renderUserItem)}
        </View>
      </ScrollView>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={styles.pageTitle}>Connect with Other Gym Goers</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#007BFF" />
      ) : (
        <>
          <Text style={styles.sectionTitle}>Nearby Locations</Text>
          {renderUserRows(users)}

          <Text style={styles.sectionTitle}>Similar Favorite Exercises</Text>
          {renderUserRows(users)}

          <Text style={styles.sectionTitle}>Similar Experience Levels</Text>
          {renderUserRows(users)}
        </>
      )}
    </ScrollView>
  );
};

export default ExploreScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7", // Light background for better contrast
    paddingHorizontal: 24,
    paddingTop: 100,
  },
  contentContainer: {
    paddingBottom: 100, // Extra padding at the bottom
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
    color: "#333",
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginVertical: 20,
    color: "#555",
  },
  userRowsContainer: {
    marginBottom: 40,
    paddingRight: 10,
  },
  userRow: {
    flexDirection: "row",
    marginBottom: 15,
  },
  userItem: {
    width: 130, // Slightly wider user cards
    alignItems: "center",
    marginHorizontal: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  userImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 10,
  },
  userName: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 6,
    color: "#333",
  },
  connectButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  connectButtonText: {
    color: "#fff",
    fontSize: 14,
  },
});
