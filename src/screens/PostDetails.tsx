import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Swiper from "react-native-swiper";
import { firebase_auth, db } from "../../firebaseConfig";
import {
  doc,
  updateDoc,
  getDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";

const PostDetails = ({ route }) => {
  const { posts, postIndex, userId } = route.params;
  const scrollViewRef = useRef(null);
  const postHeight = 400; // Adjust this value to the height of each post container
  const [expandedPosts, setExpandedPosts] = useState({});
  const [localPosts, setLocalPosts] = useState([]);

  useEffect(() => {
    const currentUser = firebase_auth.currentUser;
    if (!currentUser) {
      console.error("User not authenticated");
      return;
    }

    const userUid = currentUser.uid;
    const updatedPosts = posts.map((post) => ({
      ...post,
      liked: post.likes ? post.likes.includes(userUid) : false,
      saved: post.savedBy ? post.savedBy.includes(userUid) : false,
    }));
    setLocalPosts(updatedPosts);
  }, [posts]);

  useEffect(() => {
    setTimeout(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          y: postIndex * (postHeight + 100),
          animated: true,
        });
      }
    }, 100);
  }, [postIndex]);

  const handleLike = async (postId, collection, index) => {
    const postRef = doc(db, "userProfiles", userId, collection, postId);
    const currentUser = firebase_auth.currentUser;

    if (!currentUser) {
      console.error("User not authenticated");
      return;
    }

    const userUid = currentUser.uid;

    try {
      const postDoc = await getDoc(postRef);
      if (postDoc.exists()) {
        await updateDoc(postRef, {
          likes: arrayUnion(userUid),
        });

        setLocalPosts((prevPosts) => {
          const updatedPosts = [...prevPosts];
          updatedPosts[index] = {
            ...updatedPosts[index],
            likes: [...(updatedPosts[index].likes || []), userUid],
            liked: true,
          };
          return updatedPosts;
        });
      } else {
        console.error("Post does not exist");
      }
    } catch (error) {
      console.error("Error liking post: ", error);
    }
  };

  const handleUnlike = async (postId, collection, index) => {
    const postRef = doc(db, "userProfiles", userId, collection, postId);
    const currentUser = firebase_auth.currentUser;

    if (!currentUser) {
      console.error("User not authenticated");
      return;
    }

    const userUid = currentUser.uid;

    try {
      const postDoc = await getDoc(postRef);
      if (postDoc.exists()) {
        await updateDoc(postRef, {
          likes: arrayRemove(userUid),
        });

        setLocalPosts((prevPosts) => {
          const updatedPosts = [...prevPosts];
          updatedPosts[index] = {
            ...updatedPosts[index],
            likes: updatedPosts[index].likes.filter((uid) => uid !== userUid),
            liked: false,
          };
          return updatedPosts;
        });
      } else {
        console.error("Post does not exist");
      }
    } catch (error) {
      console.error("Error unliking post: ", error);
      Alert.alert("Error", "Error unliking post. Please try again.");
    }
  };

  const handleSave = async (postId, collection, index) => {
    const currentUser = firebase_auth.currentUser;
    if (!currentUser) {
      console.error("User not authenticated");
      return;
    }

    const userUid = currentUser.uid;
    const postRef = doc(db, "userProfiles", userId, collection, postId);

    try {
      const postDoc = await getDoc(postRef);
      if (postDoc.exists()) {
        await updateDoc(postRef, {
          savedBy: arrayUnion(userUid),
        });

        setLocalPosts((prevPosts) => {
          const updatedPosts = [...prevPosts];
          updatedPosts[index] = {
            ...updatedPosts[index],
            savedBy: [...(updatedPosts[index].savedBy || []), userUid],
            saved: true,
          };
          return updatedPosts;
        });
      } else {
        console.error("Post does not exist");
      }
    } catch (error) {
      console.error("Error saving post: ", error);
      Alert.alert("Error", "Error saving post. Please try again.");
    }
  };

  const handleUnsave = async (postId, collection, index) => {
    const currentUser = firebase_auth.currentUser;
    if (!currentUser) {
      console.error("User not authenticated");
      return;
    }

    const userUid = currentUser.uid;
    const postRef = doc(db, "userProfiles", userId, collection, postId);

    try {
      const postDoc = await getDoc(postRef);
      if (postDoc.exists()) {
        await updateDoc(postRef, {
          savedBy: arrayRemove(userUid),
        });

        setLocalPosts((prevPosts) => {
          const updatedPosts = [...prevPosts];
          updatedPosts[index] = {
            ...updatedPosts[index],
            savedBy: updatedPosts[index].savedBy.filter(
              (uid) => uid !== userUid
            ),
            saved: false,
          };
          return updatedPosts;
        });
      } else {
        console.error("Post does not exist");
      }
    } catch (error) {
      console.error("Error unsaving post: ", error);
      Alert.alert("Error", "Error unsaving post. Please try again.");
    }
  };

  const getSetsAndSupersetsInfo = (exercises) => {
    return exercises
      .map((exercise) => {
        if (exercise.repsConfig === "reps") {
          const setsCount = exercise.sets.length;
          const supersetsCount = exercise.supersets
            ? exercise.supersets.reduce(
                (acc, superset) => acc + superset.sets.length,
                0
              )
            : 0;
          return {
            name: exercise.name,
            setsCount,
            supersetsCount,
            dropSetsCount: exercise.sets[0]?.dropSetsCount || 0,
            weightConfig: exercise.weightConfig,
            supersets: exercise.supersets
              ? exercise.supersets.map((superset) => ({
                  name: superset.name,
                  setsCount: superset.sets.length,
                  weightConfig: superset.weightConfig,
                }))
              : [],
          };
        }
        return null;
      })
      .filter((info) => info !== null);
  };

  const toggleExpandPost = (index) => {
    setExpandedPosts((prevState) => ({
      ...prevState,
      [index]: !prevState[index],
    }));
  };

  return (
    <ScrollView style={styles.container} ref={scrollViewRef}>
      {localPosts &&
        localPosts.map((post, index) => (
          <View key={index} style={styles.postContainer}>
            <View style={styles.imageContainer}>
              <Swiper style={styles.swiper}>
                {post.mediaUrls ? (
                  post.mediaUrls.map((url, i) => (
                    <Image
                      key={i}
                      source={{ uri: url }}
                      style={styles.postImage}
                    />
                  ))
                ) : (
                  <Image
                    source={{
                      uri: "https://cdn.pixabay.com/photo/2018/05/28/13/14/dumbell-3435990_1280.jpg",
                    }}
                    style={styles.postImage}
                  />
                )}
              </Swiper>
              {post.type === "workout" && (
                <View style={styles.overlay}>
                  <Text style={styles.workoutTitle}>{post.templateName}</Text>
                </View>
              )}
            </View>
            <View
              style={[
                styles.contentContainer,
                !expandedPosts[index] && styles.blurredContent,
              ]}
            >
              <View style={styles.postActions}>
                <TouchableOpacity
                  onPress={async () => {
                    try {
                      post.liked
                        ? await handleUnlike(post.id, post.collection, index)
                        : await handleLike(post.id, post.collection, index);
                    } catch (error) {
                      console.error("Error handling like/unlike: ", error);
                    }
                  }}
                >
                  <Ionicons
                    name={post.liked ? "heart" : "heart-outline"}
                    size={24}
                    color="black"
                  />
                  <Text style={styles.likesDisplayed}>
                    {post.likes ? post.likes.length : 0} likes
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={async () => {
                    try {
                      post.saved
                        ? await handleUnsave(post.id, post.collection, index)
                        : await handleSave(post.id, post.collection, index);
                    } catch (error) {
                      console.error("Error handling save/unsave: ", error);
                    }
                  }}
                  style={styles.savedDisplayed}
                >
                  <Ionicons
                    name={post.saved ? "bookmark" : "bookmark-outline"}
                    size={24}
                    color="black"
                  />
                  <Text>{post.savedBy ? post.savedBy.length : 0} saved</Text>
                </TouchableOpacity>
              </View>
              {post.exercises &&
                getSetsAndSupersetsInfo(post.exercises).map(
                  (exerciseInfo, idx) => (
                    <View key={idx} style={styles.exerciseContainer}>
                      <Text style={styles.exerciseName}>
                        {exerciseInfo.name}
                      </Text>
                      <Text style={styles.exerciseDetail}>
                        Sets: {exerciseInfo.setsCount}
                      </Text>
                      <Text style={styles.exerciseDetail}>
                        Supersets: {exerciseInfo.supersetsCount}
                      </Text>
                      <Text style={styles.exerciseDetail}>
                        Drop Sets: {exerciseInfo.dropSetsCount}
                      </Text>
                      <Text style={styles.exerciseDetail}>
                        Weight Config: {exerciseInfo.weightConfig}
                      </Text>
                      {exerciseInfo.supersets.map((superset, i) => (
                        <View key={i} style={styles.supersetContainer}>
                          <Text style={styles.supersetName}>
                            Superset: {superset.name}
                          </Text>
                          <Text style={styles.supersetDetail}>
                            Sets: {superset.setsCount}
                          </Text>
                          <Text style={styles.supersetDetail}>
                            Weight Config: {superset.weightConfig}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )
                )}
              <View style={styles.commentSection}>
                <Text style={styles.commentTitle}>Comments</Text>
                <View style={styles.commentsContainer}>
                  {/* Example of existing comments */}
                  <View style={styles.comment}>
                    <Text style={styles.commentAuthor}>User1</Text>
                    <Text style={styles.commentText}>Great workout!</Text>
                  </View>
                  <View style={styles.comment}>
                    <Text style={styles.commentAuthor}>User2</Text>
                    <Text style={styles.commentText}>Keep it up!</Text>
                  </View>
                </View>
                <View style={styles.commentInputContainer}>
                  <TextInput
                    style={styles.commentInput}
                    placeholder="Add a comment..."
                  />
                  <TouchableOpacity style={styles.commentButton}>
                    <Text style={styles.commentButtonText}>Post</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            {!expandedPosts[index] && (
              <TouchableOpacity
                style={styles.seeMoreButton}
                onPress={() => toggleExpandPost(index)}
              >
                <Text style={styles.seeMoreText}>See More</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
    </ScrollView>
  );
};

export default PostDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 10,
  },
  postContainer: {
    marginBottom: 20,
    overflow: "hidden",
  },
  imageContainer: {
    position: "relative",
  },
  postImage: {
    width: "100%",
    height: 300,
    borderRadius: 10,
  },
  swiper: {
    height: 300,
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  workoutTitle: {
    fontSize: 50,
    fontWeight: "bold",
    color: "#fff",
  },
  postActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  exerciseContainer: {
    marginVertical: 5,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  exerciseDetail: {
    fontSize: 14,
  },
  supersetContainer: {
    marginVertical: 5,
    marginLeft: 10,
  },
  supersetName: {
    fontSize: 14,
    fontWeight: "bold",
  },
  supersetDetail: {
    fontSize: 12,
  },
  commentSection: {
    marginTop: 20,
  },
  commentTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  commentsContainer: {
    marginBottom: 10,
  },
  comment: {
    flexDirection: "row",
    marginBottom: 5,
  },
  commentAuthor: {
    fontWeight: "bold",
    marginRight: 5,
  },
  commentText: {
    color: "#555",
  },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
  },
  commentButton: {
    backgroundColor: "#1e90ff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  commentButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  likesDisplayed: {
    marginLeft: 3,
  },
  savedDisplayed: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    justifyContent: "flex-end",
  },
  contentContainer: {
    paddingBottom: 10,
  },
  blurredContent: {
    maxHeight: 150,
    overflow: "hidden",
    position: "relative",
  },
  seeMoreButton: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 10,
    alignItems: "center",
  },
  seeMoreText: {
    color: "#fff",
    fontWeight: "bold",
  },
  expanded: {
    maxHeight: "100%",
  },
  collapsed: {
    maxHeight: 150,
  },
});
