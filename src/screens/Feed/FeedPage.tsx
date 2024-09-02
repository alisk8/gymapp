import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, FlatList, TouchableOpacity, RefreshControl, TextInput, Modal } from 'react-native';
import { db, firebase_auth } from '../../../firebaseConfig';
import { collection, getDocs, query, orderBy, limit, startAfter, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from '@firebase/firestore';
import { InteractionManager } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Swiper from 'react-native-swiper';
import { useFocusEffect } from "@react-navigation/native";

const defaultProfilePicture = 'https://firebasestorage.googleapis.com/v0/b/gym-app-a79f9.appspot.com/o/media%2Fpfp.jpeg?alt=media&token=dd124ee9-6c61-48ad-b41c-97f3acc3350c';

const FeedPage = ({ navigation }) => {
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [lastVisible, setLastVisible] = useState({});
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadedHighlightIds, setLoadedHighlightIds] = useState(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);

  // Modal state
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      fetchUserProfile();
      fetchUsers();
    });
    return () => task.cancel();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (userProfile) {
        fetchHighlights(true);  // true indicates it's a refresh
      }
    }, [userProfile])
  );

  const fetchUserProfile = async () => {
    try {
      const currentUser = firebase_auth.currentUser;
      if (currentUser) {
        const userRef = doc(db, 'userProfiles', currentUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        } else {
          setError('User profile not found');
        }
      } else {
        setError('No user is logged in');
      }
    } catch (error) {
      console.error('Error fetching user profile: ', error);
      setError('Failed to load user profile');
    }
  };

  const fetchUsers = async () => {
    try {
      const userCollection = collection(db, "userProfiles");
      const userSnapshot = await getDocs(userCollection);
      const userList = userSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((user) => user.id !== firebase_auth.currentUser.uid); // Filter out the current user
      setUsers(userList);
    } catch (error) {
      console.error("Error fetching users: ", error);
    }
  };

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

  const fetchCommentCount = async (userId, postId, collectionName) => {
    try {
      const commentsRef = collection(db, 'userProfiles', userId, collectionName, postId, 'comments');
      const commentsSnapshot = await getDocs(commentsRef);
      return commentsSnapshot.size;
    } catch (error) {
      console.error('Error fetching comment count: ', error);
      return 0;
    }
  };

  const fetchHighlights = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
      setLastVisible({});
      setLoadedHighlightIds(new Set());
    }

    if (loadingMore && !isRefresh) return;

    setLoadingMore(true);

    try {
      const following = userProfile.following || [];
      if (following.length === 0) {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
        return;
      }

      let allHighlights = [];
      let newLastVisible = { ...lastVisible };

      const currentUserUid = firebase_auth.currentUser.uid;

      for (const userId of following) {
        const userRef = doc(db, 'userProfiles', userId);
        const userDoc = await getDoc(userRef);
        const userProfileData = userDoc.data();

        let highlightsQuery = query(
          collection(db, 'userProfiles', userId, 'highlights'),
          orderBy('timestamp', 'desc'),
          limit(10)
        );

        let workoutsQuery = query(
          collection(db, 'userProfiles', userId, 'workouts'),
          orderBy('createdAt', 'desc'),
          limit(10)
        );

        if (lastVisible[userId] && lastVisible[userId].highlight && !isRefresh) {
          highlightsQuery = query(highlightsQuery, startAfter(lastVisible[userId].highlight));
        }
        if (lastVisible[userId] && lastVisible[userId].workout && !isRefresh) {
          workoutsQuery = query(workoutsQuery, startAfter(lastVisible[userId].workout));
        }

        const [highlightsSnapshot, workoutsSnapshot] = await Promise.all([
          getDocs(highlightsQuery),
          getDocs(workoutsQuery)
        ]);

        if (highlightsSnapshot.docs.length > 0) {
          newLastVisible[userId] = {
            ...newLastVisible[userId],
            highlight: highlightsSnapshot.docs[highlightsSnapshot.docs.length - 1]
          };

          for (const doc of highlightsSnapshot.docs) {
            const highlightData = doc.data();
            const commentCount = await fetchCommentCount(userId, doc.id, 'highlights');

            if (!loadedHighlightIds.has(doc.id)) {
              allHighlights.push({
                id: doc.id,
                ...highlightData,
                userId,
                firstName: userProfileData.firstName,
                lastName: userProfileData.lastName,
                profilePicture: userProfileData.profilePicture || defaultProfilePicture,
                timestamp: highlightData.timestamp ? highlightData.timestamp.toDate() : null,
                liked: highlightData.likes ? highlightData.likes.includes(currentUserUid) : false,
                saved: highlightData.savedBy ? highlightData.savedBy.includes(currentUserUid) : false,
                likes: highlightData.likes ? highlightData.likes.length : 0,
                savedBy: highlightData.savedBy ? highlightData.savedBy.length : 0,
                commentCount,
              });
              setLoadedHighlightIds(prevIds => new Set(prevIds).add(doc.id));
            }
          }
        }

        if (workoutsSnapshot.docs.length > 0) {
          newLastVisible[userId] = {
            ...newLastVisible[userId],
            workout: workoutsSnapshot.docs[workoutsSnapshot.docs.length - 1]
          };

          for (const doc of workoutsSnapshot.docs) {
            const workoutData = doc.data();
            const commentCount = await fetchCommentCount(userId, doc.id, 'workouts');

            if (!loadedHighlightIds.has(doc.id)) {
              allHighlights.push({
                id: doc.id,
                ...workoutData,
                type: 'workout',
                userId,
                firstName: userProfileData.firstName,
                lastName: userProfileData.lastName,
                profilePicture: userProfileData.profilePicture || defaultProfilePicture,
                timestamp: workoutData.createdAt ? workoutData.createdAt.toDate() : null,
                liked: workoutData.likes ? workoutData.likes.includes(currentUserUid) : false,
                saved: workoutData.savedBy ? workoutData.savedBy.includes(currentUserUid) : false,
                likes: workoutData.likes ? workoutData.likes.length : 0,
                savedBy: workoutData.savedBy ? workoutData.savedBy.length : 0,
                commentCount,
              });
              setLoadedHighlightIds(prevIds => new Set(prevIds).add(doc.id));
            }
          }
        }
      }

      allHighlights.sort((a, b) => b.timestamp - a.timestamp);
      setHighlights(prevHighlights => {
        if (isRefresh) {
          const updatedHighlights = [...allHighlights];
          prevHighlights.forEach((highlight) => {
            if (!loadedHighlightIds.has(highlight.id)) {
              updatedHighlights.push(highlight);
            }
          });
          return updatedHighlights.sort((a, b) => b.timestamp - a.timestamp);
        } else {
          const postIdSet = new Set(prevHighlights.map(post => post.id));
          const filteredNewHighlights = allHighlights.filter(
            (highlight) => !postIdSet.has(highlight.id)
          );
          return [...prevHighlights, ...filteredNewHighlights].sort((a, b) => b.timestamp - a.timestamp);
        }
      });
      setLastVisible(newLastVisible);
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error fetching highlights: ', error);
      setError('Failed to load highlights');
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const handleLike = async (postId, userId, isWorkout) => {
    const collectionName = isWorkout ? 'workouts' : 'highlights';
    const postRef = doc(db, 'userProfiles', userId, collectionName, postId);
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

        setHighlights(prevHighlights => prevHighlights.map(post =>
          post.id === postId ? { ...post, liked: true, likes: post.likes + 1 } : post
        ));
      } else {
        console.error("Post does not exist");
      }
    } catch (error) {
      console.error("Error liking post: ", error);
    }
  };

  const handleUnlike = async (postId, userId, isWorkout) => {
    const collectionName = isWorkout ? 'workouts' : 'highlights';
    const postRef = doc(db, 'userProfiles', userId, collectionName, postId);
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

        setHighlights(prevHighlights => prevHighlights.map(post =>
          post.id === postId ? { ...post, liked: false, likes: post.likes - 1 } : post
        ));
      } else {
        console.error("Post does not exist");
      }
    } catch (error) {
      console.error("Error unliking post: ", error);
    }
  };

  const handleSave = async (postId, userId, isWorkout) => {
    const collectionName = isWorkout ? 'workouts' : 'highlights';
    const postRef = doc(db, 'userProfiles', userId, collectionName, postId);
    const currentUser = firebase_auth.currentUser;
    const userRef = doc(db, 'userProfiles', currentUser.uid);

    if (!currentUser) {
      console.error("User not authenticated");
      return;
    }

    const userUid = currentUser.uid;

    try {
      const postDoc = await getDoc(postRef);
      if (postDoc.exists()) {
        await updateDoc(postRef, {
          savedBy: arrayUnion(userUid),
        });

        await updateDoc(userRef, {
          savedPosts: arrayUnion({ collection: collectionName, postId, userId }),
        });

        setHighlights(prevHighlights => prevHighlights.map(post =>
          post.id === postId ? { ...post, saved: true, savedBy: post.savedBy + 1 } : post
        ));
      } else {
        console.error("Post does not exist");
      }
    } catch (error) {
      console.error("Error saving post: ", error);
    }
  };

  const handleUnsave = async (postId, userId, isWorkout) => {
    const collectionName = isWorkout ? 'workouts' : 'highlights';
    const postRef = doc(db, 'userProfiles', userId, collectionName, postId);
    const currentUser = firebase_auth.currentUser;
    const userRef = doc(db, 'userProfiles', currentUser.uid);

    if (!currentUser) {
      console.error("User not authenticated");
      return;
    }

    const userUid = currentUser.uid;

    try {
      const postDoc = await getDoc(postRef);
      if (postDoc.exists()) {
        await updateDoc(postRef, {
          savedBy: arrayRemove(userUid),
        });

        await updateDoc(userRef, {
          savedPosts: arrayRemove({ collection: collectionName, postId, userId }),
        });

        setHighlights(prevHighlights => prevHighlights.map(post =>
          post.id === postId ? { ...post, saved: false, savedBy: post.savedBy - 1 } : post
        ));
      } else {
        console.error("Post does not exist");
      }
    } catch (error) {
      console.error("Error unsaving post: ", error);
    }
  };

  const handleComment = (postId, userId, isWorkout) => {
    navigation.navigate('Comments', { postId, userId, isWorkout });
  };

  const formatTotalWorkoutTime = (totalTime) => {
    const minutes = Math.floor(totalTime / 60000); // Convert milliseconds to minutes
    const seconds = Math.floor((totalTime % 60000) / 1000); // Get remaining seconds
    return `${minutes} mins ${seconds} secs`;
  };

  const openModal = (mediaUrl) => {
    setSelectedMedia(mediaUrl);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setSelectedMedia(null);
  };

  const renderItem = useCallback(({ item }) => {
    if (item.type === 'workout') {
      const totalSets = item.exercises.reduce((acc, exercise) => acc + (exercise.sets ? exercise.sets.length : 0), 0);
      const elapsedTime = formatTotalWorkoutTime(item.totalWorkoutTime);

      return (
        <View style={styles.highlightContainer}>
          <View style={styles.userInfoContainer}>
            <TouchableOpacity onPress={() => navigation.navigate('UserDetails', { user: item })}>
              <Image source={{ uri: item.profilePicture }} style={styles.profilePicture} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('UserDetails', { user: item })}>
              <Text style={styles.userNameText}>{item.firstName} {item.lastName}</Text>
            </TouchableOpacity>
          </View>

          {item.workoutDescription && <Text style={styles.descriptionText}>{item.workoutDescription}</Text>}

          <View style={styles.metricsContainer}>
            <Text style={styles.metricText}>{`Total Sets: ${totalSets}`}</Text>
            <Text style={styles.metricText}>{`Workout Time: ${elapsedTime}`}</Text>
          </View>

          <Text style={styles.exerciseHeader}>{item.title}</Text>
          
          {item.exercises && item.exercises.length > 0 ? (
            <View style={styles.exerciseNamesContainer}>
              {item.exercises.map((exercise, index) => (
                <View key={index} style={styles.exerciseItemContainer}>
                  <Text style={styles.exerciseNameText}>{exercise.name}</Text>
                  {exercise.sets && exercise.sets.length > 0 ? (
                    exercise.sets.map((set, setIndex) => (
                      <Text key={set.key} style={styles.bestSetText}>
                        {`Set ${setIndex + 1}: ${set.weight} ${exercise.weightUnit} x ${exercise.repsUnit === 'time' ? `${Math.floor(set.time / 60000)} mins ${Math.floor((set.time % 60000) / 1000)} secs` : `${set.reps} ${exercise.repsUnit}`}`}
                      </Text>
                    ))
                  ) : (
                    <Text style={styles.bestSetText}>No sets available</Text>
                  )}
                  {exercise.isSuperset && exercise.supersetExercise && (
                    <Text style={styles.supersetText}>
                      {`Superset with: ${exercise.supersetExercise}`}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.bestSetText}>No exercises available</Text>
          )}
          {item.mediaUrls && item.mediaUrls.length > 0 && (
            <View style={styles.imageContainer}>
              <Swiper style={styles.swiper} showsPagination={true}>
                {item.mediaUrls.map((mediaUrl, index) => (
                  <TouchableOpacity key={`${item.id}_${index}`} onPress={() => openModal(mediaUrl)}>
                    <Image
                      source={{ uri: mediaUrl }}
                      style={styles.postImage}
                    />
                  </TouchableOpacity>
                ))}
              </Swiper>
            </View>
          )}

          {item.timestamp && <Text style={styles.timestampText}>{new Date(item.timestamp).toLocaleDateString()}</Text>}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={() => item.liked ? handleUnlike(item.id, item.userId, true) : handleLike(item.id, item.userId, true)}>
              <Icon name={item.liked ? "heart" : "heart-outline"} size={25} color="#000" />
              <Text style={styles.actionText}>{item.likes}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => handleComment(item.id, item.userId, true)}>
              <Icon name="chatbubble-outline" size={25} color="#000" />
              <Text style={styles.actionText}>{item.commentCount}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => item.saved ? handleUnsave(item.id, item.userId, true) : handleSave(item.id, item.userId, true)}>
              <Icon name={item.saved ? "bookmark" : "bookmark-outline"} size={25} color="#000" />
              <Text style={styles.actionText}>{item.savedBy}</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    } else {
      return (
        <View style={styles.highlightContainer}>
          <View style={styles.userInfoContainer}>
            <TouchableOpacity onPress={() => navigation.navigate('UserDetails', { user: item })}>
              <Image source={{ uri: item.profilePicture }} style={styles.profilePicture} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('UserDetails', { user: item })}>
              <Text style={styles.userNameText}>{item.firstName} {item.lastName}</Text>
            </TouchableOpacity>
          </View>
          {item.caption && <Text style={styles.captionText}>{item.caption}</Text>}
          {item.description && <Text style={styles.descriptionText}>{item.description}</Text>}
          {item.mediaUrls && item.mediaUrls.length > 0 && (
            <View style={styles.imageContainer}>
              <Swiper style={styles.swiper} showsPagination={true}>
                {item.mediaUrls.map((mediaUrl, index) => (
                  <TouchableOpacity key={`${item.id}_${index}`} onPress={() => openModal(mediaUrl)}>
                    <Image
                      source={{ uri: mediaUrl }}
                      style={styles.postImage}
                    />
                  </TouchableOpacity>
                ))}
              </Swiper>
            </View>
          )}
          {item.timestamp && <Text style={styles.timestampText}>{new Date(item.timestamp).toLocaleDateString()}</Text>}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={() => item.liked ? handleUnlike(item.id, item.userId, false) : handleLike(item.id, item.userId, false)}>
              <Icon name={item.liked ? "heart" : "heart-outline"} size={25} color="#000" />
              <Text style={styles.actionText}>{item.likes}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => handleComment(item.id, item.userId, false)}>
              <Icon name="chatbubble-outline" size={25} color="#000" />
              <Text style={styles.actionText}>{item.commentCount}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => item.saved ? handleUnsave(item.id, item.userId, false) : handleSave(item.id, item.userId, false)}>
              <Icon name={item.saved ? "bookmark" : "bookmark-outline"} size={25} color="#000" />
              <Text style={styles.actionText}>{item.savedBy}</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#D4DEE7' }}>
      <FlatList
        data={searchQuery.length > 0 ? filteredUsers : highlights}
        keyExtractor={item => item.id}
        renderItem={searchQuery.length > 0 ? ({ item }) => (
          <TouchableOpacity
            style={styles.userItem}
            onPress={() => navigation.navigate("UserDetails", { user: item })}
          >
            <Text style={styles.userName}>
              {item.firstName} {item.lastName}
            </Text>
          </TouchableOpacity>
        ) : renderItem}
        onEndReached={() => {
          if (!loadingMore && searchQuery.length === 0) {
            fetchHighlights();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loadingMore && <ActivityIndicator size="large" color="#0000ff" />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchHighlights(true)} />
        }
        ListHeaderComponent={
          <TextInput
            style={styles.searchBar}
            placeholder="Search for users..."
            value={searchQuery}
            onChangeText={(text) => setSearchQuery(text)}
          />
        }
      />
      
      {isModalVisible && selectedMedia && (
        <Modal visible={isModalVisible} transparent={true} animationType="fade">
          <View style={styles.modalContainer}>
            <TouchableOpacity style={styles.modalCloseButton} onPress={closeModal}>
              <Icon name="close" size={30} color="#fff" />
            </TouchableOpacity>
            <Image
              source={{ uri: selectedMedia }}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  profilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userNameText: {
    fontSize: 16,
    fontFamily: 'Rubik-Bold',
    color: '#000',
    flex: 1, // Ensure the text takes up available space and wraps
  },
  swiper: {
    height: 300,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  actionText: {
    marginLeft: 5,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#000',
    flex: 1, // Ensure the text takes up available space and wraps
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#D4DEE7',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#D4DEE7',
  },
  errorText: {
    color: '#000',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    flex: 1, // Ensure the text takes up available space and wraps
  },
  exerciseNamesContainer: {
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  highlightContainer: {
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  captionText: {
    fontSize: 18,
    fontFamily: 'Rubik-Bold',
    marginVertical: 5,
    color: '#333',
    flex: 1, // Ensure the text takes up available space and wraps
  },
  descriptionText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666',
    marginBottom: 10,
    flex: 1, // Ensure the text takes up available space and wraps
  },
  metricsContainer: {
    marginBottom: 10,
    flexDirection: 'column', // Display metrics in a column
  },
  metricText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#007bff',
    marginBottom: 2, // Add some space between the two lines
  },
  exerciseHeader: {
    fontSize: 16,
    fontFamily: 'Rubik-Bold',
    marginBottom: 5,
    color: '#333',
    flex: 1, // Ensure the text takes up available space and wraps
  },
  exerciseItemContainer: {
    backgroundColor: '#D4DEE7', // Set the background color to #D4DEE7
    padding: 10,
    borderRadius: 5,
    marginBottom: 5,
  },
  exerciseNameText: {
    fontSize: 16,
    fontFamily: 'Rubik-Bold',
    color: '#007bff',
    flex: 1, // Ensure the text takes up available space and wraps
  },
  bestSetText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#555',
    marginTop: 2,
    flex: 1, // Ensure the text takes up available space and wraps
  },
  supersetText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#888',
    marginTop: 2,
    flex: 1, // Ensure the text takes up available space and wraps
  },
  imageContainer: {
    marginTop: 10,
  },
  postImage: {
    width: '100%',
    height: 300,
    borderRadius: 10,
    borderWidth: 1, // Add 1px border
    borderColor: '#000', // Black border color
  },
  timestampText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#888',
    marginTop: 10,
    alignSelf: 'flex-end',
    flex: 1, // Ensure the text takes up available space and wraps
  },
  searchBar: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginBottom: 16,
    marginHorizontal: 15,
    fontFamily: 'Inter-Regular',
    color: '#000',
    backgroundColor: '#f8f8f8',
  },
  userItem: {
    padding: 12,
    borderBottomColor: "#ccc",
    borderBottomWidth: 1,
  },
  userName: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#000',
    flex: 1, // Ensure the text takes up available space and wraps
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '100%',
    height: '80%',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
  },
});

export default FeedPage;
