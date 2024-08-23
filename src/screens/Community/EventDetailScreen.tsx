import React, { useState, useEffect } from 'react';
import {View, Text, Button, StyleSheet, ScrollView, Alert, FlatList, Image} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import {doc, getDoc, updateDoc, arrayUnion, arrayRemove} from "firebase/firestore";
import { db } from '../../../firebaseConfig';
import { getAuth } from "firebase/auth";
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

const auth = getAuth();

const EventDetailScreen = ({ route, navigation }) => {
    const { eventId, communityId } = route.params;
    const [event, setEvent] = useState(null);
    const [ownerName, setOwnerName] = useState('');
    const [user, setUser] = useState(null);
    const [attendees, setAttendees] = useState([]);


    useEffect(() => {
        const fetchEvent = async () => {
            const eventDoc = await getDoc(doc(db,  "events", eventId));
            if (eventDoc.exists()) {
                setEvent(eventDoc.data());
                const ownerDoc = await getDoc(doc(db, "userProfiles", eventDoc.data().owner));
                if (ownerDoc.exists()) {
                    setOwnerName(`${ownerDoc.data().firstName} ${ownerDoc.data().lastName}`);
                }

                const attendeesData = await Promise.all(
                    eventDoc.data().joinedUsers.map(async (userId) => {
                        const userDoc = await getDoc(doc(db, "userProfiles", userId));
                        return userDoc.exists() ? userDoc.data() : null;
                    })
                );
                setAttendees(attendeesData.filter(Boolean));
            }
        };

        fetchEvent();

        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                setUser(user);
            }
        });

        return () => unsubscribe();
    }, [eventId, communityId]);

    useEffect(() => {
        if (event && user && event.owner === user.uid) {
            navigation.setOptions({
                headerRight: () => (
                    <Button
                        title="Edit"
                        onPress={() => navigation.navigate('CreateEventScreen', { event, isEdit: true })}
                    />
                ),
            });
        }
    }, [navigation, event, user]);



    const handleJoin = async () => {
        if (!user) return;

        try {
            const eventRef = doc(db, "events", eventId);

            if (event.joinedUsers.includes(user.uid)) {
                // User has joined, so unjoin
                await updateDoc(eventRef, {
                    joinedUsers: arrayRemove(user.uid)
                });
                Alert.alert("You have successfully unjoined the event.");
            } else {
                // User has not joined, so join
                if (event.joinedUsers.length >= event.maxPeople) {
                    Alert.alert("This event is full.");
                    return;
                }

                await updateDoc(eventRef, {
                    joinedUsers: arrayUnion(user.uid)
                });
                Alert.alert("You have successfully joined the event.");
            }

            // Refresh the event data after updating
            const updatedEventDoc = await getDoc(eventRef);
            if (updatedEventDoc.exists()) {
                setEvent(updatedEventDoc.data());
            }
        } catch (error) {
            console.error("Error updating event: ", error);
            Alert.alert("Error updating event. Please try again.");
        }
    };

    if (!event) {
        return <Text>Loading...</Text>;
    }

    const userHasJoined = user && event.joinedUsers.includes(user.uid);

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>{event.name}</Text>
            <View style={styles.detailContainer}>
                <Icon name="user" size={20} color="#333" />
                <Text style={styles.detailText}>{ownerName}</Text>
            </View>
            <View style={styles.detailContainer}>
                <Icon name="calendar" size={20} color="#333" />
                <Text style={styles.detailText}>{new Date(event.date.seconds * 1000).toLocaleString()}</Text>
            </View>
            <View style={styles.detailContainer}>
                <Icon name="clock-o" size={20} color="#333" />
                <Text style={styles.detailText}>{new Date(event.time.seconds * 1000).toLocaleTimeString()}</Text>
            </View>
            <View style={styles.detailContainer}>
                <Icon name="map-marker" size={20} color="#333" />
                <Text style={styles.detailText}>{event.location.name}</Text>
            </View>
            <MapView
                style={styles.map}
                initialRegion={{
                    latitude: event.location.latitude,
                    longitude: event.location.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }}
            >
                <Marker
                    coordinate={{
                        latitude: event.location.latitude,
                        longitude: event.location.longitude,
                    }}
                    title={event.location.name}
                />
            </MapView>
            <View style={styles.detailContainer}>
                <MaterialCommunityIcons name="dumbbell" size={20} color="#333" />
                <Text style={styles.detailText}>Muscle Target: {event.muscleTarget}</Text>
            </View>
            <View style={styles.detailContainer}>
                <Icon name="bullseye" size={20} color="#333" />
                <Text style={styles.detailText}>Workout Focus: {event.workoutFocus}</Text>
            </View>
            <View style={styles.detailContainer}>
                <Icon name="star" size={20} color="#333" />
                <Text style={styles.detailText}>Level: {event.level}</Text>
            </View>
            <View style={styles.detailContainer}>
                <Icon name="users" size={20} color="#333" />
                <Text style={styles.detailText}>Joined Users: {event.joinedUsers.length}/{event.maxPeople}</Text>
            </View>

            <Text style={styles.attendeesTitle}>Attendees</Text>
            <FlatList
                data={attendees}
                keyExtractor={(item) => item.uid}
                renderItem={({ item }) => (
                    <View style={styles.attendeeItem}>
                        {item.profilePicture && (
                            <Image source={{ uri: item.profilePicture }} style={styles.attendeeImage} />
                        )}
                        <Text style={styles.attendeeName}>{item.firstName} {item.lastName}</Text>
                    </View>
                )}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.attendeesList}
            />

            <Text style={styles.description}>{event.description}</Text>
            <Button
                title={userHasJoined ? "Unjoin Session" : "Join Session"}
                onPress={handleJoin}
                disabled={event.joinedUsers.length >= event.maxPeople && !userHasJoined}
                color={userHasJoined ? "#FF6347" : "#32CD32"} // Red for unjoin, green for join
            />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    detailContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    detailText: {
        fontSize: 16,
        marginLeft: 8,
    },
    map: {
        width: '100%',
        height: 200,
        marginBottom: 16,
        borderRadius: 8, // Rounded corners
    },
    description: {
        fontSize: 16,
        marginVertical: 16,
    },
    attendeesTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 10,
    },
    attendeesList: {
        paddingVertical: 10,
    },
    attendeeItem: {
        alignItems: 'center',
        marginRight: 10,
    },
    attendeeImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginBottom: 5,
    },
    attendeeName: {
        fontSize: 14,
        fontWeight: 'bold',
    },
});

export default EventDetailScreen;
