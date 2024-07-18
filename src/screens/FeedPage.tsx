import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { db, firebase_auth } from '../../firebaseConfig';
import { collection, getDocs, query, orderBy, limit, startAfter, doc, getDoc } from '@firebase/firestore';
import { InteractionManager } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Swiper from 'react-native-swiper';

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

  useEffect(() => {
    if (userProfile) {
      fetchHighlights(true);
    }
  }, [userProfile]);

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

        if (lastVisible[userId]) {
          highlightsQuery = query(highlightsQuery, startAfter(lastVisible[userId]));
        }

        const highlightsSnapshot = await getDocs(highlightsQuery);

        if (highlightsSnapshot.docs.length > 0) {
          newLastVisible[userId] = highlightsSnapshot.docs[highlightsSnapshot.docs.length - 1];
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
      }

      allHighlights.sort((a, b) => b.timestamp - a.timestamp);
      setHighlights(prevHighlights => {
        const mergedHighlights = isRefresh ? allHighlights : [...prevHighlights, ...allHighlights];
        return mergedHighlights.sort((a, b) => b.timestamp - a.timestamp);
      });
      setLastVisible(newLastVisible);
      setLoading(false);
      setLoadingMore(false);
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

  const renderItem = useCallback(({ item }) => {
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
      onEndReached={() => fetchHighlights()}
      onEndReachedThreshold={0.5}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refreshHighlights} />
      }
      ListFooterComponent={loadingMore && <ActivityIndicator size="large" color="#0000ff" />}
    />
  );
};

const styles = StyleSheet.create({
  highlightContainer: {
    padding: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginBottom: 10,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    paddingHorizontal: 10,
    paddingTop: 10,
  },
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
  captionText: {
    fontSize: 14,
    marginBottom: 5,
    paddingHorizontal: 10,
  },
  descriptionText: {
    fontSize: 14,
    marginBottom: 5,
    paddingHorizontal: 10,
  },
  imageContainer: {
    position: 'relative',
  },
  swiper: {
    height: 300,
  },
  postImage: {
    width: '100%',
    height: 300,
    borderRadius: 10,
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
  timestampText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 5,
    paddingHorizontal: 10,
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
});

export default FeedPage;
/*Current Problem, loads top 10 posts of each user instead of top 10 posts overall */