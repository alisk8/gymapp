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
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
} from "firebase/firestore";

const UserDetails = ({ route, navigation }) => {
  const { user } = route.params;
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const currentUser = firebase_auth.currentUser;

  useEffect(() => {
    checkConnectionStatus();
    setLoading(false);
  }, []);

  const checkConnectionStatus = async () => {
    const userRef = doc(db, "userProfiles", currentUser.uid);
    const userSnapshot = await getDoc(userRef);
    const currentUserData = userSnapshot.data();

    if (currentUserData?.following.includes(user.id)) {
      setIsConnected(true);
    }
  };

  const handleConnect = async () => {
    const currentUserRef = doc(db, "userProfiles", currentUser.uid);
    const otherUserRef = doc(db, "userProfiles", user.id);

    try {
      await updateDoc(currentUserRef, {
        following: arrayUnion(user.id),
      });

      await updateDoc(otherUserRef, {
        followers: arrayUnion(currentUser.uid),
      });

      setIsConnected(true);
    } catch (error) {
      console.error("Error connecting with user: ", error);
    }
  };

  const handleDisconnect = async () => {
    const currentUserRef = doc(db, "userProfiles", currentUser.uid);
    const otherUserRef = doc(db, "userProfiles", user.id);

    try {
      await updateDoc(currentUserRef, {
        following: arrayRemove(user.id),
      });

      await updateDoc(otherUserRef, {
        followers: arrayRemove(currentUser.uid),
      });

      setIsConnected(false);
    } catch (error) {
      console.error("Error disconnecting with user: ", error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileContainer}>
        <Image
          source={{
            uri: user.profilePicture || "https://via.placeholder.com/150",
          }}
          style={styles.profileImage}
        />
        <Text style={styles.name}>{`${user.firstName} ${user.lastName}`}</Text>
        <Text style={styles.bio}>{user.bio}</Text>

        <TouchableOpacity
          style={isConnected ? styles.disconnectButton : styles.connectButton}
          onPress={isConnected ? handleDisconnect : handleConnect}
        >
          <Text style={styles.buttonText}>
            {isConnected ? "Unfollow" : "Connect"}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.detailsContainer}>
        <Text style={styles.label}>Gym Interests:</Text>
        <Text style={styles.value}>{user.gym_interests}</Text>
        <Text style={styles.label}>Favorite Exercises:</Text>
        <Text style={styles.value}>
          {user.favoriteExercises?.join(", ") || "None"}
        </Text>
      </View>
    </ScrollView>
  );
};

export default UserDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  profileContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
  },
  bio: {
    fontSize: 16,
    fontStyle: "italic",
    textAlign: "center",
    marginVertical: 10,
    paddingHorizontal: 20,
  },
  connectButton: {
    backgroundColor: "#1e90ff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  disconnectButton: {
    backgroundColor: "#ff4d4d",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
  detailsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 16,
  },
  value: {
    fontSize: 16,
    marginTop: 8,
  },
});
