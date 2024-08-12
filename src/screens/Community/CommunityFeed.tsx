import React, {useState, useEffect, useCallback} from 'react';
import {View, FlatList, ScrollView, TouchableOpacity, Text, StyleSheet, Image, Touchable} from 'react-native';
import Post from '../CommunityPage';
import { db } from "../../../firebaseConfig";
import { doc, setDoc, collection, getDocs } from "firebase/firestore";
import {useFocusEffect} from "@react-navigation/native";


const Feed: React.FC = ({navigation}) => {
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