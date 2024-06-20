import React, { useEffect, useState } from 'react';
import { FlatList, View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { db } from '../../firebaseConfig';
import { collection, getDocs } from '@firebase/firestore';

const FeedPage = () => {
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHighlights = async () => {
      try {
        const userProfilesSnapshot = await getDocs(collection(db, 'userProfiles'));
        let allHighlights = [];

        for (const userProfile of userProfilesSnapshot.docs) {
          const userProfileData = userProfile.data();
          const highlightsSnapshot = await getDocs(collection(db, 'userProfiles', userProfile.id, 'highlights'));

          highlightsSnapshot.docs.forEach(doc => {
            allHighlights.push({
              id: doc.id,
              ...doc.data(),
              userName: userProfileData.name, // Assuming the user profile has a 'name' field
            });
          });
        }

        setHighlights(allHighlights);
      } catch (error) {
        console.error('Error fetching highlights: ', error);
        setError('Failed to load highlights');
      } finally {
        setLoading(false);
      }
    };

    fetchHighlights();
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

  const renderItem = ({ item }) => {
    return (
      <View style={styles.highlightContainer}>
        <Text style={styles.userNameText}>{item.userName}</Text>
        {item.caption && <Text style={styles.captionText}>{item.caption}</Text>}
        {item.description && <Text style={styles.descriptionText}>{item.description}</Text>}
        {item.mediaType === 'image' && item.mediaUrls && (
          <FlatList
            data={item.mediaUrls}
            keyExtractor={(url, index) => `${item.id}_${index}`}
            renderItem={({ item: imageUrl }) => (
              <Image source={{ uri: "https://firebasestorage.googleapis.com/v0/b/gym-app-a79f9.appspot.com/o/media%2FX1Nx52EQsHbEOz5mQyVmFum704X2_1717467425118_0?alt=media&token=ad8323af-63e0-4557-bcaa-8b56c79514fa" }} style={styles.image} />
            )}
            horizontal
            showsHorizontalScrollIndicator={false}
          />
        )}
        {item.mediaType === 'video' && item.mediaUrls && (
          <FlatList
            data={item.mediaUrls}
            keyExtractor={(url, index) => `${item.id}_${index}`}
            renderItem={({ item: videoUrl }) => (
              <Video
                source={{ uri: videoUrl }}
                rate={1.0}
                volume={1.0}
                isMuted={false}
                resizeMode={ResizeMode.CONTAIN}
                useNativeControls
                style={styles.video}
              />
            )}
            horizontal
            showsHorizontalScrollIndicator={false}
          />
        )}
        {item.timestamp && <Text style={styles.timestampText}>{item.timestamp.toDate().toString()}</Text>}
        {item.type && <Text style={styles.typeText}>{item.type}</Text>}
        {item.userId && <Text style={styles.userIdText}>{item.userId}</Text>}
        {item.weight && <Text style={styles.weightText}>{item.weight}</Text>}
      </View>
    );
  };

  return (
    <FlatList
      data={highlights}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
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
  image: {
    width: 200,
    height: 200,
    marginRight: 10,
  },
  video: {
    width: 200,
    height: 200,
    marginRight: 10,
  },
});

export default FeedPage;
