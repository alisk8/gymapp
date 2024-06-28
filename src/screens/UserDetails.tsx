import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import Swiper from "react-native-swiper";
import { Ionicons } from "@expo/vector-icons";
import { firebase_auth, db } from "../../firebaseConfig";
import {
  doc,
  updateDoc,
  getDoc,
  getDocs,
  collection,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";

const UserDetails = ({ route, navigation }) => {
  const { user, onUserRemoved } = route.params;
  const [isFollowing, setIsFollowing] = useState(false);
  const [profilePicture, setProfilePicture] = useState(user.profilePicture);
  const [additionalInfo, setAdditionalInfo] = useState(user);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkFollowingStatus = async () => {
      const currentUser = firebase_auth.currentUser;

      if (currentUser) {
        try {
          const userRef = doc(db, "userProfiles", currentUser.uid);
          const userDoc = await getDoc(userRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.following && userData.following.includes(user.id)) {
              setIsFollowing(true);
            }
          }
        } catch (error) {
          console.error("Error fetching following status: ", error);
        }
      }
    };

    checkFollowingStatus();
  }, [user.id]);

  useEffect(() => {
    setProfilePicture(user.profilePicture);
  }, [user.profilePicture]);

  useEffect(() => {
    setAdditionalInfo(user);
  }, [user]);

  useEffect(() => {
    fetchHighlightsAndWorkouts();
  }, [user.id]);

  const fetchHighlightsAndWorkouts = async () => {
    setLoading(true);
    const userRef = doc(db, "userProfiles", user.id);

    const highlightsRef = collection(userRef, "highlights");
    const highlightsSnapshot = await getDocs(highlightsRef);
    const highlightsData = highlightsSnapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
      timestamp: doc.data().timestamp?.toDate().getTime() || Date.now(),
      type: "highlight",
      collection: "highlights",
    }));

    const workoutsRef = collection(userRef, "templates");
    const workoutsSnapshot = await getDocs(workoutsRef);
    const workoutsData = workoutsSnapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
      timestamp: doc.data().timestamp?.toDate().getTime() || Date.now(),
      type: "workout",
      collection: "templates",
    }));

    const combinedData = [...highlightsData, ...workoutsData].sort(
      (a, b) => a.timestamp - b.timestamp
    );

    setPosts(combinedData);
    setLoading(false);
  };

  const handleFollow = async () => {
    const currentUser = firebase_auth.currentUser;

    if (currentUser) {
      const userRef = doc(db, "userProfiles", currentUser.uid);
      const followedUserRef = doc(db, "userProfiles", user.id);

      try {
        await updateDoc(userRef, {
          following: arrayUnion(user.id),
        });

        await updateDoc(followedUserRef, {
          followers: arrayUnion(currentUser.uid),
        });

        setIsFollowing(true);
      } catch (error) {
        console.error("Error updating document: ", error);
        Alert.alert("Error", "Error following user. Please try again.");
      }
    } else {
      Alert.alert("Error", "No user is logged in");
    }
  };

  const handleUnfollow = async () => {
    const currentUser = firebase_auth.currentUser;

    if (currentUser) {
      const userRef = doc(db, "userProfiles", currentUser.uid);
      const followedUserRef = doc(db, "userProfiles", user.id);

      try {
        await updateDoc(userRef, {
          following: arrayRemove(user.id),
        });

        await updateDoc(followedUserRef, {
          followers: arrayRemove(currentUser.uid),
        });

        setIsFollowing(false);
        if (onUserRemoved) {
          onUserRemoved(user.id);
          navigation.goBack();
        }
      } catch (error) {
        console.error("Error updating document: ", error);
        Alert.alert("Error", "Error unfollowing user. Please try again.");
      }
    } else {
      Alert.alert("Error", "No user is logged in");
    }
  };

  const handleFollowButtonPress = () => {
    if (isFollowing) {
      Alert.alert(
        "Unfollow",
        `Are you sure you want to unfollow ${user.firstName} ${user.lastName}?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Yes", onPress: handleUnfollow },
        ],
        { cancelable: false }
      );
    } else {
      handleFollow();
    }
  };

  const handlePostPress = (postIndex) => {
    navigation.navigate("PostDetails", { posts, postIndex, userId: user.id });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileContainer}>
        <Image
          source={
            profilePicture
              ? { uri: profilePicture }
              : require("../../assets/placeholder.jpeg")
          }
          style={styles.profileImage}
        />
        <Text style={styles.name}>
          {additionalInfo.firstName} {additionalInfo.lastName}
        </Text>
        <Text style={styles.bio}>{additionalInfo.bio}</Text>
        <TouchableOpacity
          style={isFollowing ? styles.followingButton : styles.followButton}
          onPress={handleFollowButtonPress}
        >
          <Text
            style={
              isFollowing ? styles.followingButtonText : styles.followButtonText
            }
          >
            {isFollowing ? "Following" : "Follow"}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.detailsContainer}>
        <Text style={styles.label}>Gym Interests:</Text>
        <Text style={styles.value}>
          {additionalInfo.gym_interests?.join(", ")}
        </Text>
      </View>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      ) : (
        <View style={styles.postsContainer}>
          {posts.length > 0 ? (
            posts.map((post, index) => (
              <View key={index} style={styles.postWrapper}>
                {index % 3 === 0 && <View style={styles.row} />}
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => handlePostPress(index)}
                >
                  {post.type === "workout" ? (
                    <View style={styles.imageContainer}>
                      <Image
                        source={{
                          uri: "https://cdn.pixabay.com/photo/2018/05/28/13/14/dumbell-3435990_1280.jpg",
                        }}
                        style={styles.postImage}
                      />
                      <View style={styles.overlay}>
                        <Text style={styles.workoutTitle}>
                          {post.templateName}
                        </Text>
                      </View>
                    </View>
                  ) : post.mediaUrls ? (
                    <Swiper
                      autoplay
                      autoplayTimeout={4}
                      showsPagination={false}
                      style={styles.swiper}
                    >
                      {post.mediaUrls.map((url, i) => (
                        <Image
                          key={i}
                          source={{ uri: url }}
                          style={styles.postImage}
                        />
                      ))}
                    </Swiper>
                  ) : (
                    <Image
                      source={require("../../assets/placeholder.jpeg")}
                      style={styles.postImage}
                    />
                  )}
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.noEntriesText}>No posts found.</Text>
          )}
        </View>
      )}
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
  followButton: {
    marginTop: 10,
    backgroundColor: "#1e90ff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  followButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  followingButton: {
    marginTop: 10,
    backgroundColor: "#32cd32",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  followingButtonText: {
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
  postsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
  },
  postWrapper: {
    width: "33%",
    padding: 5,
  },
  row: {
    flexDirection: "row",
    width: "100%",
  },
  card: {
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  postImage: {
    width: "100%",
    height: 100,
    borderRadius: 10,
    marginBottom: 10,
  },
  swiper: {
    height: 100,
  },
  noEntriesText: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginVertical: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  imageContainer: {
    position: "relative",
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 5,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  workoutTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
});
