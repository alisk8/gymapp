import React, { useEffect, useState } from 'react';
import { FlatList, View, Text, StyleSheet, ActivityIndicator, Image, Dimensions, TouchableOpacity, RefreshControl } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import Swiper from 'react-native-swiper';
import { db, firebase_auth } from '../../firebaseConfig';
import { collection, getDocs, query, orderBy, limit, doc, getDoc } from '@firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');
const defaultProfilePicture = 'https://firebasestorage.googleapis.com/v0/b/gym-app-a79f9.appspot.com/o/media%2Fpfp.jpeg?alt=media&token=dd124ee9-6c61-48ad-b41c-97f3acc3350c';

const FeedPage = ({ navigation }) => {
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const batchSize = 10;

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (userProfile) {
      fetchHighlights();
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

  const fetchHighlights = async () => {
    setLoading(true);

    try {
      const following = userProfile.following || [];
      if (following.length === 0) {
        setLoading(false);
        return;
      }

      let allHighlights = [];

      for (const userId of following) {
        const userRef = doc(db, 'userProfiles', userId);
        const userDoc = await getDoc(userRef);
        const userProfileData = userDoc.data();

        let highlightsQuery = query(
          collection(db, 'userProfiles', userId, 'highlights'),
          orderBy('timestamp', 'desc'),
          limit(batchSize)
        );

        const highlightsSnapshot = await getDocs(highlightsQuery);

        if (highlightsSnapshot.docs.length > 0) {
          highlightsSnapshot.docs.forEach(doc => {
            const highlightData = doc.data();
            allHighlights.push({
              id: doc.id,
              ...highlightData,
              userId,
              firstName: userProfileData.firstName,
              lastName: userProfileData.lastName,
              profilePicture: userProfileData.profilePicture || defaultProfilePicture,
              timestamp: highlightData.timestamp ? highlightData.timestamp.toDate() : null,
            });
          });
        }
      }

      allHighlights.sort((a, b) => b.timestamp - a.timestamp);
      setHighlights(allHighlights);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching highlights: ', error);
      setError('Failed to load highlights');
      setLoading(false);
    }
  };

  const refreshHighlights = async () => {
    setRefreshing(true);
    await fetchHighlights();
    setRefreshing(false);
  };

  const calculateMediaHeight = (width, height) => {
    return (screenWidth / width) * height;
  };

  const timeSince = (date) => {
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    let interval = Math.floor(seconds / 31536000);

    if (interval > 1) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    interval = Math.floor(seconds / 604800);
    if (interval >= 1) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    interval = Math.floor(seconds / 86400);
    if (interval > 1) {
      return `${interval} days ago`;
    }
    interval = Math.floor(seconds / 3600);
    if (interval > 1) {
      return `${interval} hours ago`;
    }
    interval = Math.floor(seconds / 60);
    if (interval > 1) {
      return `${interval} minutes ago`;
    }
    return `just now`;
  };

  const handleProfilePress = (user) => {
    navigation.navigate('UserDetails', { user });
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

  const renderItem = ({ item }) => {
    return (
      <View style={styles.highlightContainer}>
        <View style={styles.userInfoContainer}>
          <TouchableOpacity onPress={() => handleProfilePress(item)}>
            <Image source={{ uri: item.profilePicture }} style={styles.profilePicture} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleProfilePress(item)}>
            <Text style={styles.userNameText}>{item.firstName} {item.lastName}</Text>
          </TouchableOpacity>
        </View>
        {item.caption && <Text style={styles.captionText}>{item.caption}</Text>}
        {item.description && <Text style={styles.descriptionText}>{item.description}</Text>}

        {item.mediaUrls && item.mediaUrls.length > 0 ? (
          <View style={styles.imageContainer}>
            <Swiper style={styles.swiper} showsPagination={true}>
              {item.mediaUrls.map((mediaUrl, index) => {
                const mediaType = item.mediaType || 'photo';
                return (
                  mediaType === 'photo' ? (
                    <Image 
                      key={`${item.id}_${index}`} 
                      source={{ uri: mediaUrl }} 
                      style={styles.media} 
                      resizeMode='contain' 
                    />
                  ) : (
                    <Video
                      key={`${item.id}_${index}`}
                      source={{ uri: mediaUrl }}
                      rate={1.0}
                      volume={1.0}
                      isMuted={false}
                      resizeMode={ResizeMode.CONTAIN} 
                      useNativeControls
                      style={styles.media}
                    />
                  )
                );
              })}
            </Swiper>
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="heart-outline" size={24} color="black" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="chatbubble-outline" size={24} color="black" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="share-outline" size={24} color="black" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="bookmark-outline" size={24} color="black" />
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {item.timestamp && <Text style={styles.timestampText}>{timeSince(item.timestamp)}</Text>}
        {item.weight && <Text style={styles.weightText}>{item.weight}</Text>}
      </View>
    );
  };

  return (
    <FlatList
      data={highlights}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refreshHighlights}
        />
      }
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
    height: screenWidth,
  },
  media: {
    width: '100%',
    height: undefined,
    aspectRatio: 1,
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
  weightText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 5,
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
