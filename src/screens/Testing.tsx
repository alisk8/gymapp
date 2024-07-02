import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { db } from '../../firebaseConfig';
import { doc, getDoc } from '@firebase/firestore';

const Testing = () => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const highlightDoc = await getDoc(doc(db, 'userProfiles', 'AqtaMOEWVmYGgnk5ajoRdwyhpkM2', 'highlights', 'dWLrmUkaed6jGFOw6qfQ'));

        if (highlightDoc.exists()) {
          const highlightData = highlightDoc.data();
          if (highlightData.mediaUrls && highlightData.mediaUrls.length > 0) {
            setImageUrl(highlightData.mediaUrls[0]);
          } else {
            setError('No mediaUrls found');
          }
        } else {
          setError('Document does not exist');
        }
      } catch (error) {
        console.error('Error fetching image: ', error);
        setError('Failed to load image');
      } finally {
        setLoading(false);
      }
    };

    fetchImage();
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
    <View style={styles.container}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} />
      ) : (
        <Text style={styles.errorText}>Image not available</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
});

export default Testing;
