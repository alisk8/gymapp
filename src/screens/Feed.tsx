import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import firestore from '@react-native-firebase/firestore';

const Feed = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userProfilesSnapshot = await firestore().collection('userProfiles').get();
        const userProfilesData = [];

        for (const doc of userProfilesSnapshot.docs) {
          const userProfile = doc.data();
          const highlightsSnapshot = await firestore().collection('userProfiles').doc(doc.id).collection('highlights').get();
          const diaryEntriesSnapshot = await firestore().collection('userProfiles').doc(doc.id).collection('diaryEntries').get();

          const highlights = highlightsSnapshot.docs.map(highlightDoc => highlightDoc.data());
          const diaryEntries = diaryEntriesSnapshot.docs.map(diaryEntryDoc => diaryEntryDoc.data());

          userProfilesData.push({ userProfile, highlights, diaryEntries });
        }

        setData(userProfilesData);
      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    };

    fetchData();
  }, []);

  return (
    <ScrollView style={styles.container}>
      {data.map((item, index) => (
        <View key={index} style={styles.userProfileContainer}>
          <Text style={styles.userProfileText}>User Profile: {JSON.stringify(item.userProfile)}</Text>
          {item.highlights.length > 0 && (
            <View style={styles.collectionContainer}>
              <Text style={styles.collectionTitle}>Highlights:</Text>
              {item.highlights.map((highlight, highlightIndex) => (
                <Text key={highlightIndex} style={styles.collectionText}>{JSON.stringify(highlight)}</Text>
              ))}
            </View>
          )}
          {item.diaryEntries.length > 0 && (
            <View style={styles.collectionContainer}>
              <Text style={styles.collectionTitle}>Diary Entries:</Text>
              {item.diaryEntries.map((entry, entryIndex) => (
                <Text key={entryIndex} style={styles.collectionText}>{JSON.stringify(entry)}</Text>
              ))}
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  userProfileContainer: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  userProfileText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  collectionContainer: {
    marginTop: 8,
  },
  collectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
  },
  collectionText: {
    fontSize: 12,
  },
});

export default Feed;
