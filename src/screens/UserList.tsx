import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { db } from "../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

const UserList = ({ route, navigation }) => {
  const { userIds, title } = route.params;
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const fetchedUsers = [];
        for (const userId of userIds) {
          const userRef = doc(db, "userProfiles", userId);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            fetchedUsers.push({ id: userId, ...userDoc.data() });
          }
        }
        setUsers(fetchedUsers);
      } catch (error) {
        console.error("Error fetching users: ", error);
      }
    };

    fetchUsers();
  }, [userIds]);

  const handleUserRemoved = (userId) => {
    setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {users.map((user, index) => (
        <TouchableOpacity
          key={index}
          style={styles.userContainer}
          onPress={() =>
            navigation.navigate("UserDetails", {
              user,
              onUserRemoved: handleUserRemoved,
            })
          }
        >
          <Image
            source={
              user.profilePicture
                ? { uri: user.profilePicture }
                : require("../../assets/placeholder.jpeg")
            }
            style={styles.profileImage}
          />
          <View style={styles.userInfo}>
            <Text style={styles.name}>
              {user.firstName} {user.lastName}
            </Text>
            <Text style={styles.bio}>{user.bio}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

export default UserList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 20,
    textAlign: "center",
  },
  userContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
  },
  bio: {
    fontSize: 14,
    color: "#666",
  },
});
