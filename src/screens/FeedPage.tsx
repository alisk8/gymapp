import React, { useEffect, useState, useRef } from 'react';
import { ScrollView, FlatList, View, Text, StyleSheet, ActivityIndicator, Image, Dimensions, Alert } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import Swiper from 'react-native-swiper';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../firebaseConfig';
import { collection, getDocs, query, orderBy, limit, startAfter } from '@firebase/firestore';

const { width: screenWidth } = Dimensions.get('window');

const FeedPage = () => {
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
              userName: userProfileData.name,
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
        <Text style={styles.userNameText}>{item.userName}</Text>
        {item.caption && <Text style={styles.captionText}>{item.caption}</Text>}
        {item.description && <Text style={styles.descriptionText}>{item.description}</Text>}

        <View style={styles.imageContainer}>
          <Swiper style={styles.swiper}>
            {item.mediaUrls && item.mediaUrls.map((mediaUrl, index) => {
              console.log('Rendering media:', mediaUrl);
              const mediaType = item.mediaType || 'image'; // Default to image if mediaType is not specified
              return (
                mediaType === 'image' ? (
                  <Image 
                    key={`${item.id}_${index}`} 
                    source={{ uri: mediaUrl }} 
                    style={{ 
                      width: screenWidth, 
                      height: item.originalWidth && item.originalHeight 
                        ? calculateMediaHeight(item.originalWidth, item.originalHeight) 
                        : screenWidth // fallback if dimensions are not available
                    }} 
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
                    style={{ 
                      width: screenWidth, 
                      height: item.originalWidth && item.originalHeight 
                        ? calculateMediaHeight(item.originalWidth, item.originalHeight) 
                        : screenWidth // fallback if dimensions are not available
                    }}
                  />
                )
              );
            })}
          </Swiper>
        </View>

        {item.timestamp && <Text style={styles.timestampText}>{item.timestamp.toString()}</Text>}
        {item.type && <Text style={styles.typeText}>{item.type}</Text>}
        {item.userId && <Text style={styles.userIdText}>{item.userId}</Text>}
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  userNameText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  captionText: {
    fontSize: 14,
    marginBottom: 5,
  },
  descriptionText: {
    fontSize: 14,
    marginBottom: 5,
  },
  imageContainer: {
    position: 'relative',
  },
  swiper: {
    height: screenWidth,
  },
  timestampText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 5,
  },
  typeText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 5,
  },
  userIdText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 5,
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
