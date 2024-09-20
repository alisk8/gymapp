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
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
} from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

// Define the navigation type for this screen
type RootStackParamList = {
  ExploreScreen: undefined;
  UserDetails: { user: any };
};

type ExploreScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ExploreScreen"
>;

const ExploreScreen = () => {
  const [users, setUsers] = useState([]);
  const [connectedUsers, setConnectedUsers] = useState<string[]>([]); // Track connected users
  const [loading, setLoading] = useState(true);
  const currentUser = firebase_auth.currentUser;
  const navigation = useNavigation<ExploreScreenNavigationProp>();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch current user's profile to get the list of people they are following
      const currentUserRef = doc(db, "userProfiles", currentUser.uid);
      const currentUserDoc = await getDoc(currentUserRef);
      const currentUserData = currentUserDoc.data();
      const following = currentUserData?.following || [];

      setConnectedUsers(following); // Track connected users

      // Fetch all users
      const userCollection = collection(db, "userProfiles");
      const userSnapshot = await getDocs(userCollection);

      // Filter out users who are already connected
      const userList = userSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter(
          (user) => user.id !== currentUser.uid && !following.includes(user.id)
        );

      setUsers(userList);
    } catch (error) {
      console.error("Error fetching users: ", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (user) => {
    const currentUserRef = doc(db, "userProfiles", currentUser.uid);
    const otherUserRef = doc(db, "userProfiles", user.id);

    try {
      if (connectedUsers.includes(user.id)) {
        // If already connected, disconnect
        await updateDoc(currentUserRef, {
          following: arrayRemove(user.id),
        });

        await updateDoc(otherUserRef, {
          followers: arrayRemove(currentUser.uid),
        });

        setConnectedUsers((prev) =>
          prev.filter((userId) => userId !== user.id)
        );
      } else {
        // If not connected, connect
        await updateDoc(currentUserRef, {
          following: arrayUnion(user.id),
        });

        await updateDoc(otherUserRef, {
          followers: arrayUnion(currentUser.uid),
        });

        setConnectedUsers((prev) => [...prev, user.id]);
      }
    } catch (error) {
      console.error("Error connecting with user: ", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const renderUserItem = (user) => {
    const isConnected = connectedUsers.includes(user.id); // Check if the user is already connected

    return (
      <View key={user.id} style={styles.userItem}>
        <TouchableOpacity
          onPress={() => navigation.navigate("UserDetails", { user })}
        >
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
        <TouchableOpacity
          style={[
            styles.connectButton,
            isConnected ? styles.disconnectButton : null,
          ]}
          onPress={() => handleConnect(user)}
        >
          <Text style={styles.connectButtonText}>
            {isConnected ? "Unfollow" : "Connect"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

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
    alignItems: "center",
    paddingHorizontal: 10,
  },
  userRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 15,
    width: "100%",
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
    backgroundColor: "#016e03",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: "#007BFF",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  disconnectButton: {
    backgroundColor: "gray",
  },
  connectButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
});
