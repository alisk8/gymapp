import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { db, firebase_auth } from '../../../firebaseConfig';
import {collection, getDocs, query, orderBy, limit, startAfter, doc, getDoc, where} from '@firebase/firestore';
import { InteractionManager } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Swiper from 'react-native-swiper';
import {useFocusEffect} from "@react-navigation/native";

const defaultProfilePicture = 'https://firebasestorage.googleapis.com/v0/b/gym-app-a79f9.appspot.com/o/media%2Fpfp.jpeg?alt=media&token=dd124ee9-6c61-48ad-b41c-97f3acc3350c';

const FeedPage = ({ navigation }) => {
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [lastVisible, setLastVisible] = useState({});
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadedHighlightIds, setLoadedHighlightIds] = useState(new Set());


  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      fetchUserProfile();
    });
    return () => task.cancel();
  }, []);


  useFocusEffect(
      useCallback(() => {
        if (userProfile) {
          fetchHighlights(true);
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

  const fetchHighlights = async (isRefresh = false) => {
    if (isRefresh) {
      setLoading(true);
      setLastVisible({});
      setHighlights([]);
      setLoadedHighlightIds(new Set());
    }

    if (loadingMore && !isRefresh) return;

    setLoadingMore(true);

    try {
      const following = userProfile.following || [];
      if (following.length === 0) {
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      let allHighlights = [];
      let newLastVisible = { ...lastVisible };

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


        if (lastVisible[userId] && lastVisible[userId].highlight) {
          highlightsQuery = query(highlightsQuery, startAfter(lastVisible[userId].highlight));
        }
        if (lastVisible[userId] && lastVisible[userId].workout) {
          workoutsQuery = query(workoutsQuery, startAfter(lastVisible[userId].workout));
        }

        const [highlightsSnapshot, workoutsSnapshot] = await Promise.all([
          getDocs(highlightsQuery),
          getDocs(workoutsQuery)
        ]);


        if (highlightsSnapshot.docs.length > 0) {
          newLastVisible[userId] = {
            ...newLastVisible[userId], // Preserve the workout's last visible document
            highlight: highlightsSnapshot.docs[highlightsSnapshot.docs.length - 1]
          };

          highlightsSnapshot.docs.forEach(doc => {
            const highlightData = doc.data();
            if (!loadedHighlightIds.has(doc.id)) {
              allHighlights.push({
                id: doc.id,
                ...highlightData,
                userId,
                firstName: userProfileData.firstName,
                lastName: userProfileData.lastName,
                profilePicture: userProfileData.profilePicture || defaultProfilePicture,
                timestamp: highlightData.timestamp ? highlightData.timestamp.toDate() : null,
              });
              setLoadedHighlightIds(prevIds => new Set(prevIds).add(doc.id));
            }
          });
        }

        if (workoutsSnapshot.docs.length > 0) {
          newLastVisible[userId] = {
            ...newLastVisible[userId], // Preserve the highlight's last visible document
            workout: workoutsSnapshot.docs[workoutsSnapshot.docs.length - 1]
          };

          workoutsSnapshot.docs.forEach(doc => {
            const workoutData = doc.data();
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
              });
              setLoadedHighlightIds(prevIds => new Set(prevIds).add(doc.id));
            }
          });
        }
      }

      allHighlights.sort((a, b) => b.timestamp - a.timestamp);
      setHighlights(prevHighlights => {
        const mergedHighlights = isRefresh ? allHighlights : [...prevHighlights, ...allHighlights];
        return mergedHighlights.sort((a, b) => b.timestamp - a.timestamp);
      });
      setLastVisible(newLastVisible);
      setLoading(false);
      setLoadingMore(false);
      console.log(allHighlights);
    } catch (error) {
      console.error('Error fetching highlights: ', error);
      setError('Failed to load highlights');
      setLoading(false);
      setLoadingMore(false);
    }
  };


  const refreshHighlights = async () => {
    setRefreshing(true);
    await fetchHighlights(true);
    setRefreshing(false);
  };

  const formatTotalWorkoutTime = (totalTime) => {
    const minutes = Math.floor(totalTime / 60);
    const seconds = totalTime % 60;
    return `${minutes} mins ${seconds} secs`;
  };

  const renderItem = useCallback(({ item }) => {


    if (item.type === 'workout') {
      const totalSets = item.exercises.reduce((acc, exercise) => acc + (exercise.setsNum), 0);
      console.log(item);
      const elapsedTime  = formatTotalWorkoutTime(item.totalWorkoutTime);

      // Render workout item
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

            <View style={styles.metricsContainer}>
              <Text style={styles.metricText}>{`Total Sets: ${totalSets}`}</Text>
              <Text style={styles.metricText}>{`Workout Time: ${elapsedTime}`}</Text>
            </View>

            <Text style={styles.exerciseHeader}>Exercises:</Text>
            <View style={styles.exerciseNamesContainer}>
              {item.exercises.map((exercise, index) => (
                  <View key={index} style={styles.exerciseItemContainer}>
                    <Text style={styles.exerciseNameText}>{exercise.name}</Text>
                    <Text style={styles.bestSetText}>
                      {`Best Set: ${exercise.bestSet.weight} ${exercise.bestSet.weightUnit} x ${exercise.bestSet.reps} ${exercise.bestSet.repsUnit}`}
                    </Text>
                  </View>
              ))}
            </View>
            {item.mediaUrls && item.mediaUrls.length > 0 && (
                <View style={styles.imageContainer}>
                  <Swiper style={styles.swiper} showsPagination={true}>
                    {item.mediaUrls.map((mediaUrl, index) => (
                        <Image
                            key={`${item.id}_${index}`}
                            source={{ uri: mediaUrl }}
                            style={styles.postImage}
                        />
                    ))}
                  </Swiper>
                </View>
            )}

            {item.timestamp && <Text style={styles.timestampText}>{new Date(item.timestamp).toLocaleDateString()}</Text>}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity style={styles.actionButton} onPress={() => handleLike(item.id)}>
                <Icon name="heart-outline" size={25} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => handleComment(item.id)}>
                <Icon name="chatbubble-outline" size={25} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => handleShare(item.id)}>
                <Icon name="share-outline" size={25} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => handleSave(item.id)}>
                <Icon name="bookmark-outline" size={25} color="#000" />
              </TouchableOpacity>
            </View>
          </View>
      )
    } else {
      // Render highlight item (default case)
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
                        <Image
                            key={`${item.id}_${index}`}
                            source={{ uri: mediaUrl }}
                            style={styles.postImage}
                        />
                    ))}
                  </Swiper>
                </View>
            )}
            {item.timestamp && <Text style={styles.timestampText}>{new Date(item.timestamp).toLocaleDateString()}</Text>}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity style={styles.actionButton} onPress={() => handleLike(item.id)}>
                <Icon name="heart-outline" size={25} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => handleComment(item.id)}>
                <Icon name="chatbubble-outline" size={25} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => handleShare(item.id)}>
                <Icon name="share-outline" size={25} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => handleSave(item.id)}>
                <Icon name="bookmark-outline" size={25} color="#000" />
              </TouchableOpacity>
            </View>
          </View>
      );
    }
  }, []);
  const handleLike = (postId) => {
    // Handle like action
  };

  const handleComment = (postId) => {
    // Handle comment action
  };

  const handleShare = (postId) => {
    // Handle share action
  };

  const handleSave = (postId) => {
    // Handle save action
  };

  if (loading && !refreshing) {
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
      <FlatList
          data={highlights}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          onEndReached={() => {
            if (!loadingMore) {
              fetchHighlights();
            }
          }}          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refreshHighlights} />
          }
          ListFooterComponent={loadingMore && <ActivityIndicator size="large" color="#0000ff" />}
      />
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
    fontWeight: 'bold',
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
    paddingHorizontal: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'black',
    fontSize: 16,
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
    fontWeight: 'bold',
    marginVertical: 5,
    color: '#333',
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  metricText: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: '600',
  },
  exerciseHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  exerciseNamesContainer: {
    marginBottom: 15,
  },
  exerciseItemContainer: {
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderRadius: 5,
    marginBottom: 5,
  },
  exerciseNameText: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: 'bold',
    marginBottom: 3,
  },
  bestSetText: {
    fontSize: 14,
    color: '#555',
    marginTop: 2,
  },
  imageContainer: {
    marginTop: 10,
  },
  postImage: {
    width: '100%',
    height: 300,
    borderRadius: 10,
  },
  timestampText: {
    fontSize: 12,
    color: '#888',
    marginTop: 10,
    alignSelf: 'flex-end',
  },
});

export default FeedPage;
/*Current Problem, loads top 10 posts of each user instead of top 10 posts overalllem, loads top 10 posts of each user instead of top 10 posts overall */