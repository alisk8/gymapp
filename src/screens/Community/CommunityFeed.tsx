import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, TouchableOpacity, Text, StyleSheet, Image } from 'react-native';
import { db, firebase_auth } from "../../../firebaseConfig";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { useFocusEffect } from "@react-navigation/native";

const Feed: React.FC = ({ navigation }) => {
  const [communities, setCommunities] = useState([]);

  const fetchCommunities = async () => {
    try {
      const userId = firebase_auth.currentUser.uid; // Get the current user's ID
      const userDocRef = doc(db, "userProfiles", userId);
      const userDoc = await getDoc(userDocRef);
      const followedCommunities = userDoc.data().communities || []; // Get the list of followed communities

      if (followedCommunities.length > 0) {
        const communitiesSnapshot = await getDocs(collection(db, "communities"));
        const communitiesList = communitiesSnapshot.docs
            .map(doc => ({ ...doc.data(), id: doc.id }))
            .filter(community => followedCommunities.includes(community.id)); // Filter by followed communities

        setCommunities(communitiesList);
      } else {
        setCommunities([]); // Set empty if no followed communities
      }
    } catch (error) {
      console.error("Error fetching communities: ", error);
    }
  };

  useFocusEffect(
      useCallback(() => {
        fetchCommunities();
      }, [])
  );

  return (
      <FlatList
          data={communities}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
              <TouchableOpacity
                  style={styles.communityItem}
                  onPress={() => navigation.navigate('CommunityLandingPage', { communityId: item.id })}
              >
                {item.imageUrl && <Image source={{ uri: item.imageUrl }} style={styles.communityImage} />}
                <View style={styles.communityInfo}>
                  <Text style={styles.communityName}>{item.name}</Text>
                  <Text style={styles.communityDescription}>{item.description}</Text>
                  <Text style={styles.communityType}>{item.private ? "(Private)" : "(Public)"}</Text>
                </View>
              </TouchableOpacity>
          )}
          contentContainerStyle={styles.container}
      />
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f7f7f7',
    paddingVertical: 10,
  },
  communityItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 5,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    alignItems: 'center',
  },
  communityImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  communityInfo: {
    flex: 1,
  },
  communityName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  communityDescription: {
    fontSize: 14,
    color: "#666",
    marginVertical: 5,
  },
  communityType: {
    fontSize: 14,
    color: "#999",
  },
});

export default Feed;