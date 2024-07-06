import React, {useState, useEffect, useCallback} from 'react';
import {View, FlatList, ScrollView, TouchableOpacity, Text, StyleSheet, Image} from 'react-native';
import Post from './CommunityPage';
import { db } from "../../firebaseConfig";
import { doc, setDoc, collection, getDocs } from "firebase/firestore";
import {useFocusEffect} from "@react-navigation/native";


const Feed: React.FC = () => {
  const [communities, setCommunities] = useState([]);


  const fetchCommunities = async () => {
    try {
      const communitiesSnapshot = await getDocs(collection(db, "communities"));
      const communitiesList = communitiesSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setCommunities(communitiesList);
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
              <View style={styles.communityItem}>
                {item.imageUrl && <Image source={{ uri: item.imageUrl }} style={styles.communityImage} />}
                  <View style={styles.communityInfo}>
                    <Text style={styles.communityName}>{item.name}</Text>
                    <Text style={styles.communityDescription}>{item.description}</Text>
                    <Text style={styles.communityType}>{item.private ? "(Private)" : "(Public)"}</Text>
                  </View>
              </View>
          )}
      />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  backButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignSelf: 'center',
    marginVertical: 10,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  communityItem: {
    flexDirection: 'row',
    backgroundColor: '#007bff',
    padding: 10,
    marginVertical: 5,
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center', // Center the content horizontally
  },
  communityText: {
    color: 'white',
    fontWeight: 'bold',
  },
  communityImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 50,
  },
  communityInfo: {
    alignItems: 'center', // Center the content within the communityInfo
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