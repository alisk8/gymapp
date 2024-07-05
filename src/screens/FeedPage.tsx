import React, { useEffect, useState } from 'react';
import { FlatList, View, Text, StyleSheet, ActivityIndicator, Image, Dimensions, TouchableOpacity } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import Swiper from 'react-native-swiper';
import { db } from '../../firebaseConfig';
import { collection, getDocs, query, orderBy, limit, startAfter } from '@firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');
const defaultProfilePicture = 'https://firebasestorage.googleapis.com/v0/b/gym-app-a79f9.appspot.com/o/media%2Fpfp.jpeg?alt=media&token=dd124ee9-6c61-48ad-b41c-97f3acc3350c'; // URL to a default profile picture

const FeedPage = ({ navigation }) => {
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastVisible, setLastVisible] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [allLoaded, setAllLoaded] = useState(false);
  const batchSize = 10;

  useEffect(() => {
    fetchHighlights();
  }, []);

  const fetchHighlights = async (loadMore = false) => {
    if (loadingMore || allLoaded) return;

    if (loadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      const userProfilesSnapshot = await getDocs(collection(db, 'userProfiles'));
      let allHighlights = [];

      for (const userProfile of userProfilesSnapshot.docs) {
        const userProfileData = userProfile.data();
        let highlightsQuery = query(collection(db, 'userProfiles', userProfile.id, 'highlights'), orderBy('timestamp', 'desc'), limit(batchSize));

        if (loadMore && lastVisible) {
          highlightsQuery = query(highlightsQuery, startAfter(lastVisible));
        }

        const highlightsSnapshot = await getDocs(highlightsQuery);

        if (highlightsSnapshot.docs.length === 0) {
          setAllLoaded(true);
        } else {
          highlightsSnapshot.docs.forEach(doc => {
            const highlightData = doc.data();
            allHighlights.push({
              id: doc.id,
              ...highlightData,
              firstName: userProfileData.firstName,
              lastName: userProfileData.lastName,
              profilePicture: userProfileData.profilePicture || defaultProfilePicture,
              timestamp: highlightData.timestamp ? highlightData.timestamp.toDate() : null,
            });
          });
          setLastVisible(highlightsSnapshot.docs[highlightsSnapshot.docs.length - 1]);
        }
      }

      allHighlights.sort((a, b) => b.timestamp - a.timestamp);

      if (loadMore) {
        setHighlights(prevHighlights => [...prevHighlights, ...allHighlights]);
        setLoadingMore(false);
      } else {
        setHighlights(allHighlights);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching highlights: ', error);
      setError('Failed to load highlights');
      setLoading(false);
      setLoadingMore(false);
    }
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

  const handleProfilePress = (userId) => {
    navigation.navigate('UserProfile', { userId });
  };

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

  const renderItem = ({ item }) => {
    return (
      <View style={styles.highlightContainer}>
        <View style={styles.userInfoContainer}>
          <TouchableOpacity onPress={() => handleProfilePress(item.userId)}>
            <Image source={{ uri: item.profilePicture }} style={styles.profilePicture} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleProfilePress(item.userId)}>
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
                      resizeMode='contain' // Changed from 'cover' to 'contain'
                    />
                  ) : (
                    <Video
                      key={`${item.id}_${index}`}
                      source={{ uri: mediaUrl }}
                      rate={1.0}
                      volume={1.0}
                      isMuted={false}
                      resizeMode={ResizeMode.CONTAIN} // Changed from 'cover' to 'contain'
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

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  };

  return (
    <FlatList
      data={highlights}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ListFooterComponent={renderFooter}
      onEndReached={() => fetchHighlights(true)}
      onEndReachedThreshold={0.5}
    />
  );
};

const styles = StyleSheet.create({
  highlightContainer: {
    padding: 0, // Remove padding
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
    width: '100%', // Ensure media covers 100% width
    height: undefined, // Ensure aspect ratio is maintained
    aspectRatio: 1, // Adjust as needed to ensure proper aspect ratio
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
    color: 'red',
    fontSize: 16,
  },
});

export default FeedPage;
