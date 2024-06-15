import React, { useEffect, useState } from 'react';
import { FlatList, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import firestore from '@react-native-firebase/firestore';

const Feed = () => {
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHighlights = async () => {
      try {
        const userProfilesSnapshot = await firestore().collection('userProfiles').get();
        let allHighlights = [];
        
        const highlightsPromises = userProfilesSnapshot.docs.map(async (userProfile) => {
          const highlightsSnapshot = await firestore()
            .collection('userProfiles')
            .doc(userProfile.id)
            .collection('highlights')
            .get();
          
          highlightsSnapshot.docs.forEach(doc => {
            allHighlights.push({ id: doc.id, ...doc.data() });
          });
        });

        await Promise.all(highlightsPromises);

        setHighlights(allHighlights);
      } catch (error) {
        console.error("Error fetching highlights: ", error);
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

  return (
    <FlatList
      data={highlights}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.highlightContainer}>
          <Text style={styles.highlightText}>{item.title}</Text>
          <Text>{item.description}</Text>
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  highlightContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  highlightText: {
    fontSize: 18,
    fontWeight: 'bold',
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

export default Feed;
