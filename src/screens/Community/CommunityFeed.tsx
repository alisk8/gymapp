import React, { useState, useEffect, useCallback } from 'react';
import {View, FlatList, TouchableOpacity, Text, StyleSheet, Image, ScrollView} from 'react-native';
import { db, firebase_auth } from "../../../firebaseConfig";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { useFocusEffect } from "@react-navigation/native";

const Feed: React.FC = ({ navigation }) => {
  const [communities, setCommunities] = useState([]);
  const [userEvents, setUserEvents] = useState([]);


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

  const fetchUserEvents = async () => {
    try {
      const userDoc = await getDoc(doc(db, "userProfiles", firebase_auth.currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const eventIds = userData.events || [];

        const eventPromises = eventIds.map(eventId =>
            getDoc(doc(db, "events", eventId))
        );
        const eventDocs = await Promise.all(eventPromises);

        const currentTimestamp = Date.now(); // Get current time

        const eventsList = eventDocs
            .filter(eventDoc => eventDoc.exists())
            .map(eventDoc => ({ ...eventDoc.data(), id: eventDoc.id }))
            .filter(event => event.date.seconds * 1000 > currentTimestamp);

        setUserEvents(eventsList);
      }
    } catch (error) {
      console.error("Error fetching user events: ", error);
    }
  };

  useFocusEffect(
      useCallback(() => {
        fetchCommunities();
        fetchUserEvents();
      }, [])
  );

  const renderEventsHeader = () => (
      <View>
        <Text style={styles.eventsTitle}>Events</Text>
        <TouchableOpacity
            style={styles.createEventButton}
            onPress={() =>
                navigation.navigate("CreateEventScreen")
            }
        >
          <Text style={styles.createEventText}>Add a lift</Text>
        </TouchableOpacity>
        {userEvents.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.eventsContainer}>
              {userEvents.map(event => {
                const isUserJoined = event.joinedUsers?.includes(firebase_auth.currentUser.uid);
                return (
                    <TouchableOpacity key={event.id} onPress={() => navigation.navigate('EventDetailScreen', { eventId: event.id })}>
                      <View style={styles.eventCard}>
                        <View style={styles.eventDateContainer}>
                          <Text style={styles.eventDay}>{new Date(event.date.seconds * 1000).getDate()}</Text>
                          <Text style={styles.eventMonth}>{new Date(event.date.seconds * 1000).toLocaleString('default', { month: 'short' })}</Text>
                        </View>
                        <View style={styles.eventDetailContainer}>
                          <Text style={styles.eventName}>{event.name}</Text>
                          <Text style={styles.eventDetails}>{event.workoutFocus || ''}</Text>
                          <Text style={styles.eventDetails}>{`People: ${event.joinedUsers?.length || 0}`}</Text>
                          <Text style={styles.eventStatus}>
                            {isUserJoined ? 'Joined' : 'Invited'}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                );
              })}
            </ScrollView>
        ) : (
            <Text>No events available.</Text>
        )}
        <Text style={styles.eventsTitle}>Groups</Text>
      </View>
  );

  return (
      <View>
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
          ListHeaderComponent={renderEventsHeader}
      />
      </View>
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
  eventsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 5,
    padding: 5,
  },
  eventsContainer: {
    paddingVertical: 2,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  eventDateContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
    padding: 5,
    marginTop: 10,
    marginRight: 5,
    marginBottom: 5,
    alignItems: 'center',
  },
  eventDay: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  eventMonth: {
    fontSize: 14,
    color: '#666',
  },
  eventDetailContainer: {
    alignItems: 'center',
  },
  eventName: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  eventDetails: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  eventStatus: {
    marginTop: 5,
    fontSize: 14,
    color: '#016e03', // You can adjust this color as needed
    fontWeight: 'bold',
  },
  createEventButton: {
    borderRadius: 10,
    padding: 3,
    margin: 5,
  },
  createEventText: {
    color: "grey",
    fontWeight: "bold",
  },
});

export default Feed;