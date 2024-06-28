import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { firebase_auth, db } from "../../firebaseConfig"; // Ensure firebase_auth is imported
import { collection, getDocs } from "firebase/firestore";

const Home = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = firebase_auth.currentUser; // Get the current user

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
        .filter((user) => user.id !== currentUser.uid); // Filter out the current user

      setUsers(userList);
      console.log("Fetched users: ", userList);
    } catch (error) {
      console.error("Error fetching users: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = users.filter((user) => {
        const fullName = `${user.firstName?.toLowerCase()} ${user.lastName?.toLowerCase()}`;
        return fullName.includes(searchQuery.toLowerCase());
      });
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers([]);
    }
  }, [searchQuery, users]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchBar}
        placeholder="Search for users..."
        value={searchQuery}
        onChangeText={(text) => setSearchQuery(text)}
      />
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        searchQuery.length > 0 && (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.userItem}
                onPress={() =>
                  navigation.navigate("UserDetails", { user: item })
                }
              >
                <Text style={styles.userName}>
                  {item.firstName} {item.lastName}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text>No users found</Text>}
          />
        )
      )}
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  searchBar: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  userItem: {
    padding: 12,
    borderBottomColor: "#ccc",
    borderBottomWidth: 1,
  },
  userName: {
    fontSize: 16,
  },
});
