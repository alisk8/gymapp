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
import { doc, getDocs, collection, getDoc } from "firebase/firestore";

const Saved = ({ navigation }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSavedPosts = async () => {
      setLoading(true);
      const currentUser = firebase_auth.currentUser;

      if (currentUser) {
        try {
          const userRef = doc(db, "userProfiles", currentUser.uid);
          const userDoc = await getDoc(userRef);

          if (userDoc.exists()) {
            const savedPosts = userDoc.data().savedPosts || [];

            const fetchedPosts = await Promise.all(
              savedPosts.map(async (savedPost) => {
                const postRef = doc(
                  db,
                  "userProfiles",
                  savedPost.userId,
                  savedPost.collection,
                  savedPost.postId
                );
                const postDoc = await getDoc(postRef);

                if (postDoc.exists()) {
                  return {
                    ...postDoc.data(),
                    id: savedPost.postID,
                    type: savedPost.collection,
                  };
                }

                return null;
              })
            );

            setPosts(fetchedPosts.filter((post) => post !== null));
          }
        } catch (error) {
          console.error("Error fetching saved posts: ", error);
          Alert.alert("Error", "Error fetching saved posts");
        }
      }

      setLoading(false);
    };

    fetchSavedPosts();
  }, []);

  const handlePostPress = (postIndex) => {
    navigation.navigate("PostDetails", { posts, postIndex });
  };

  return (
    <ScrollView style={styles.container}>
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
                        <Text style={styles.workoutTitle}>Workout</Text>
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
            <Text style={styles.noEntriesText}>No saved posts found.</Text>
          )}
        </View>
      )}
    </ScrollView>
  );
};

export default Saved;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
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
