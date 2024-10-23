import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator, Alert,
} from "react-native";
import { firebase_auth, db } from "../../firebaseConfig";
import {arrayRemove, arrayUnion, collection, doc, getDoc, getDocs, updateDoc} from "firebase/firestore";
import {useNavigation} from "@react-navigation/native";

const ExploreScreen = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = firebase_auth.currentUser;
  const nav = useNavigation();

  const fetchUsers = async () => {
    setLoading(true);
    try {

      const currentUserRef = doc(db, "userProfiles", currentUser.uid);
      const currentUserDoc = await getDoc(currentUserRef);
      const currentUserData = currentUserDoc.data();

      const followingList = currentUserData?.following || [];

      const userCollection = collection(db, "userProfiles");
      const userSnapshot = await getDocs(userCollection);
      const userList = userSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
          isFollowing: followingList.includes(doc.id),
        }))
        .filter((user) => user.id !== currentUser.uid);
      //add an attribute to the user list above like isFollowing checking if its in the current user's doc

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


  const handleFollow = async (otherUserId) => {

    if (currentUser) {
      const currentUserRef = doc(db, "userProfiles", currentUser.uid);
      const otherUserRef = doc(db, "userProfiles", otherUserId);
      try {
        await updateDoc(currentUserRef, {
          following: arrayUnion(otherUserId),
        });

        //for the sake of testing keep this
        await updateDoc(otherUserRef, {
          followers: arrayUnion(currentUser.uid),
        });

        //need to update the users list here to update the isFollowing field
        setUsers((prevUsers) =>
            prevUsers.map((user) =>
                user.id === otherUserId ? { ...user, isFollowing: true } : user
            )
        );


      } catch (error) {
        console.error("Error updating document: ", error);
        Alert.alert("Error", "Error following user. Please try again.");
      }
    } else {
      Alert.alert("Error", "No user is logged in");
    }
  };

  const handleUnfollow = async (otherUserId) => {

    if (currentUser) {
      const userRef = doc(db, "userProfiles", currentUser.uid);

      try {
        await updateDoc(userRef, {
          following: arrayRemove(otherUserId),
        });

        //need to update the users list here to update the isFollowing field
        setUsers((prevUsers) =>
            prevUsers.map((user) =>
                user.id === otherUserId ? { ...user, isFollowing: false} : user
            )
        );


      } catch (error) {
        console.error("Error updating document: ", error);
        Alert.alert("Error", "Error unfollowing user. Please try again.");
      }
    } else {
      Alert.alert("Error", "No user is logged in");
    }
  };

  const renderUserItem = (user) => (
    <View key={user.id} style={styles.userItem}>
      <TouchableOpacity onPress={()=>{nav.navigate('UserDetails', {user: user})}}>
      <Image
        source={{
          uri: user.profilePicture || "https://via.placeholder.com/100",
        }}
        style={styles.userImage}
      />
      <Text style={styles.userName}>
        {`${user.firstName} ${user.lastName}`}
      </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.connectButton} onPress={() => user.isFollowing? handleUnfollow(user.id): handleFollow(user.id)}>
        <Text style={styles.connectButtonText}>{user.isFollowing ? "Following" : "Connect"}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderUserRows = (users) => {
    const rows = [];
    for (let i = 0; i < users.length; i += 3) {
      const userRow = users.slice(i, i + 3);
      rows.push(
        <View key={i} style={styles.userRow}>
          {userRow.map(renderUserItem)}
        </View>
      );
    }
    return rows;
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={styles.pageTitle}>Connect with Other Gym Goers</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#007BFF" />
      ) : (
        <View style={styles.userRowsContainer}>{renderUserRows(users)}</View>
      )}
    </ScrollView>
  );
};

export default ExploreScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
    paddingTop: 30,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
    color: "#333",
  },
  userRowsContainer: {
    alignItems: "center", // Centers the rows within the container
    paddingHorizontal: 10,
  },
  userRow: {
    flexDirection: "row",
    justifyContent: "space-around", // Distributes space evenly between items
    marginBottom: 15,
    width: "100%", // Ensures the row takes full width
  },
  userItem: {
    width: 120,
    alignItems: "center",
    marginHorizontal: 5,
    paddingVertical: 20,
    paddingHorizontal: 10,
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
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 10,
    color: "#333",
  },
  connectButton: {
    backgroundColor: '#016e03',
    paddingVertical: 5,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: "#007BFF",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    zIndex: 100,
  },
  connectButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
    zIndex: 100,
  },
});
