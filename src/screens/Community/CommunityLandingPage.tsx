import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Image,
  StyleSheet,
  FlatList,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Avatar, Card, Input, Button } from "react-native-elements";
import { db, app } from "../../../firebaseConfig"; // Adjust the import path based on your project structure
import {
  doc,
  getDoc,
  collection,
  getDocs,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import {useFocusEffect, useNavigation} from "@react-navigation/native";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import Icon from "react-native-vector-icons/FontAwesome";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import DropDownPicker from "react-native-dropdown-picker";
import {center} from "@shopify/react-native-skia";
import CommunityUserModal from "./CommunityUserModal"; // Import dropdown picker


const auth = getAuth(app);

const useAuth = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  return user;
};

const CommunityLandingPage = ({ route, navigation }) => {
  const { communityId } = route.params;
  const nav = useNavigation();
  const [communityData, setCommunityData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [commentText, setCommentText] = useState({});
  const [events, setEvents] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userProfiles, setUserProfiles] = useState({});
  const [selectedLeaderboardExercise, setSelectedLeaderboardExercise] = useState(null); // For selected exercise
  const [openExerciseSelector, setOpenExerciseSelector] = useState(false); // Dropdown state
  const [members, setMembers] = useState([]);
  const [isUsersModalVisible, setIsUsersModalVisible] = useState(false);


  const user = useAuth();
  const userId = user?.uid; // Fetch the userId of the logged-in user

  useFocusEffect(
    useCallback(() => {
      const fetchAllData = async () => {
        await fetchCommunityData(communityId); // Ensure this completes before fetching events
        console.log(communityData.events);
      };

      fetchAllData();
    }, [])
  );

  const handleOpenUsersModal = async () => {
    const fetchedMembers = await fetchMembers(); // Fetch the members
    setMembers(fetchedMembers);
    setIsUsersModalVisible(true);
  };

  const handleCloseUsersModal = () => {
    setIsUsersModalVisible(false);
  };


  useEffect(() => {
    if (communityData) {
      fetchCommunityPosts(communityId);
      fetchCommunityEvents(); // Now fetch events after community data is available
    }
  }, [communityData]); // Run when communityData changes



  useEffect(() => {
    nav.setOptions({
      headerRight: () => (
          <TouchableOpacity onPress={() => navigation.navigate("NewCommunity", {community: communityData, isEdit: true, communityId: communityId})}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
      )
    });
  }, [nav, communityData]);


  // Function to fetch user profiles
  const fetchUserProfiles = async (userIds) => {
    const profiles = {};
    const userDocPromises = userIds.map((userId) =>
      getDoc(doc(db, "userProfiles", userId))
    );
    const userDocs = await Promise.all(userDocPromises);

    userDocs.forEach((docSnapshot) => {
      if (docSnapshot.exists()) {
        profiles[docSnapshot.id] = docSnapshot.data();
      }
    });

    setUserProfiles((prevProfiles) => ({ ...prevProfiles, ...profiles }));
  };

  const fetchMembers = async () => {
    try {
      const memberPromises = communityData.members.map((memberId) =>
          getDoc(doc(db, "userProfiles", memberId))
      );
      const memberDocs = await Promise.all(memberPromises);

      const membersList = memberDocs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return membersList;
    } catch (error) {
      console.error("Error fetching members: ", error);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    return `${hours > 0 ? `${hours}:` : ''}${hours > 0 ? minutes.toString().padStart(2, '0') : minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatTimeMilliseconds = (milliseconds) => {
    // Convert milliseconds to total seconds
    const totalSeconds = Math.floor(milliseconds / 1000);

    // Calculate minutes and remaining seconds
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    // Format the time as mm:ss, ensuring two digits for minutes and seconds
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
  };


  const fetchCommunityData = async (id) => {
    try {
      const communityDoc = await getDoc(doc(db, "communities", id));
      if (communityDoc.exists()) {
        setCommunityData(communityDoc.data());
        console.log(communityDoc.data()); // Log the data fetched
        console.log(communityData.bannerImageUrl);
      } else {
        console.log("No such document!");
      }
    } catch (error) {
      console.error("Error fetching community data: ", error);
    }
  };

  useEffect(() => {
    const loadLeaderboard = async () => {
      if (selectedLeaderboardExercise) {
        const data = await fetchExerciseLeaderboard(selectedLeaderboardExercise);
        setLeaderboard(data);
      }
    };

    loadLeaderboard();
  }, [selectedLeaderboardExercise, communityData]);


  const fetchExerciseLeaderboard = async (exerciseName) => {
    if (!communityData || !communityData.members) {
      return;
    }

    try {
      const leaderboardData = [];
      console.log('exercise name', exerciseName);

      if(exerciseName.toLowerCase() === "consistency"){
        // Fetch each member's consistency streak data
        console.log('im here');
        for (let userId of communityData.members) {
          const userProfileDoc = await getDoc(doc(db, "userProfiles", userId));
          if (userProfileDoc.exists()) {
            const userProfileData = userProfileDoc.data();
            const consistencyStreak = userProfileData.consistencyStreak || 0; // Default to 0 if not present

            leaderboardData.push({
              userId,
              consistencyStreak,
              userName: `${userProfileData.firstName} ${userProfileData.lastName}`,
            });
          }
        }

        // Sort the leaderboard by consistencyStreak
        leaderboardData.sort((a, b) => b.consistencyStreak - a.consistencyStreak);

        console.log('leaderboard', leaderboardData);
        return leaderboardData.map((item, index) => ({
          ...item,
          rank: index + 1,
        }));
      }
      else{
      // Fetch each member's bench press data
      for (let userId of communityData.members) {
        const userProfileDoc = await getDoc(doc(db, "userProfiles", userId));
        if (userProfileDoc.exists()) {
          const userProfileData = userProfileDoc.data();
          const workoutsCollection = collection(
              db,
              "userProfiles",
              userId,
              "workouts"
          );
          const workoutsSnapshot = await getDocs(workoutsCollection);

          let latestExercise = null;

          workoutsSnapshot.forEach((workoutDoc) => {
            const workoutData = workoutDoc.data();
            const exercise = workoutData.exercises.find(
                (exercise) => exercise.name.toLowerCase() === exerciseName.toLowerCase()
            );
            if (exercise && exercise.sets) {
              let estimated1RM = 0;

              if (exercise.sets[0].reps) {
                estimated1RM = exercise.sets[0].weight * (1 + 0.0333 * exercise.sets[0].reps);
                console.log('1rm at reps', estimated1RM);

              }
              if (exercise.sets[0].time) {
                const weight = exercise.sets[0].weight || 0;
                estimated1RM = weight ? exercise.sets[0].weight * (1 + 0.0333 * exercise.sets[0].time) : (1 + 0.0333 * exercise.sets[0].time);
                console.log('1rm at time', estimated1RM);
              }

              if (!latestExercise || workoutDoc.id > latestExercise.date) {
                latestExercise = {
                  userId,
                  ...exercise.sets[0],
                  estimated1RM,
                  date: workoutDoc.id,
                  userName: `${userProfileData.firstName} ${userProfileData.lastName}`,
                };
              }
            }
          });

          if (latestExercise) {
            leaderboardData.push(latestExercise);
          }
        }
      }

        // Sort the data by estimated 1RM
        leaderboardData.sort((a, b) => b.estimated1RM - a.estimated1RM);

        return leaderboardData;
    }
    } catch (error) {
      console.error("Error fetching leaderboard data: ", error);
    }
  };

  const fetchCommunityPosts = async (id) => {
    try {
      const postsSnapshot = await getDocs(
        collection(db, "communities", id, "posts")
      );
      const postsList = postsSnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setPosts(postsList);
    } catch (error) {
      console.error("Error fetching community posts: ", error);
    }
  };

  /**
    const fetchCommunityEvents = async (id) => {
        try {
            const eventsSnapshot = await getDocs(collection(db, "communities", id, "events"));
            const eventsList = eventsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setEvents(eventsList);

            const userIds = [...new Set(eventsList.map(event => event.owner))]; // Get unique user IDs
            await fetchUserProfiles(userIds);
        } catch (error) {
            console.error("Error fetching community events: ", error);
        }
    };
        **/

  const fetchCommunityEvents = async () => {
    if (!communityData || !communityData.events) {
      console.error("No community data or events found.");
      return;
    }

    try {
      const eventPromises = communityData.events.map((eventId) =>
        getDoc(doc(db, "events", eventId))
      );
      const eventDocs = await Promise.all(eventPromises);

      const eventsList = eventDocs
        .filter((eventDoc) => eventDoc.exists())
        .map((eventDoc) => ({ ...eventDoc.data(), id: eventDoc.id }));

      setEvents(eventsList);

      const userIds = [...new Set(eventsList.map((event) => event.owner))]; // Get unique user IDs
      await fetchUserProfiles(userIds);
    } catch (error) {
      console.error("Error fetching community events:", error);
    }
  };

  const handleLike = async (postId) => {
    try {
      const postRef = doc(db, "communities", communityId, "posts", postId);
      const postDoc = await getDoc(postRef);

      if (postDoc.exists()) {
        const postData = postDoc.data();
        if (postData.likes && postData.likes.includes(userId)) {
          await updateDoc(postRef, {
            likes: arrayRemove(userId),
          });
        } else {
          await updateDoc(postRef, {
            likes: arrayUnion(userId),
          });
        }
        fetchCommunityPosts(communityId); // Refresh the posts after liking/unliking
      }
    } catch (error) {
      console.error("Error updating likes: ", error);
    }
  };

  const handleComment = async (postId) => {
    try {
      const postRef = doc(db, "communities", communityId, "posts", postId);
      await updateDoc(postRef, {
        comments: arrayUnion({
          userId: "exampleUserId", // Replace with the actual user ID
          text: commentText[postId],
          timestamp: new Date(),
        }),
      });
      setCommentText({ ...commentText, [postId]: "" }); // Clear the comment input
      fetchCommunityPosts(communityId); // Refresh the posts after commenting
    } catch (error) {
      console.error("Error commenting on post: ", error);
    }
  };

  if (!communityData) {
    return <Text>Loading...</Text>;
  }

  const visibility = communityData.private ? "Private" : "Public";
  const membersCount = communityData.members ? communityData.members.length : 0;

  return (
    <View style={styles.container}>
      <ScrollView keyboardShouldPersistTaps="handled"
      >
        {communityData.bannerImageUrl ? (
          <Image
            source={{ uri: communityData.bannerImageUrl }}
            style={styles.bannerImage}
          />
        ) : (
          <View style={styles.bannerPlaceholder} />
        )}
        <Avatar
          source={{ uri: communityData.imageUrl }}
          rounded
          size="large"
          containerStyle={styles.profileImage}
        />
        <Text style={styles.communityName}>{communityData.name}</Text>
        <TouchableOpacity onPress={handleOpenUsersModal}>
        <Text style={styles.communityDetails}>
          {visibility} · {membersCount} Members
        </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.createEventButton}
          onPress={() =>
            navigation.navigate("CreateEventScreen", {
              communityId,
              communityName: communityData.name,
            })
          }
        >
          <Text style={styles.createEventText}>Add a group lift</Text>
        </TouchableOpacity>

        {events.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.eventsContainer}
          >
            {events.map((event) => (
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("EventDetailScreen", {
                    eventId: event.id,
                    communityId,
                  })
                }
              >
                <View key={event.id} style={styles.eventCard}>
                  <View style={styles.eventDateContainer}>
                    <Text style={styles.eventDay}>
                      {new Date(event.date.seconds * 1000).getDate()}
                    </Text>
                    <Text style={styles.eventMonth}>
                      {new Date(event.date.seconds * 1000).toLocaleString(
                        "default",
                        { month: "short" }
                      )}
                    </Text>
                  </View>
                  <View
                    style={{ paddingLeft: 10, flex: 1, alignItems: "center" }}
                  >
                    <View style={styles.eventDetailContainer}>
                      <Icon name="user" size={20} color="#333" />
                      <Text
                        style={[styles.eventDetail, { fontWeight: "bold" }]}
                      >
                        {userProfiles[event.owner]
                          ? `${userProfiles[event.owner].firstName} ${
                              userProfiles[event.owner].lastName
                            }`
                          : "Loading..."}
                      </Text>
                    </View>
                    <View style={styles.eventDetailContainer}>
                      <MaterialCommunityIcons
                        name="dumbbell"
                        size={20}
                        color="#333"
                      />
                      <Text style={styles.eventDetail}>
                        {event.muscleTarget} Day
                      </Text>
                    </View>
                    <Text style={styles.eventDetail}>
                      {event.workoutFocus ? event.workoutFocus : ""}
                    </Text>
                    <Text style={styles.eventMembers}>
                      People: {event.joinedUsers?.length || 0}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <Text style={styles.leaderboardTitle}>{selectedLeaderboardExercise ? `${selectedLeaderboardExercise} Leaderboard` : "Leaderboard"}</Text>
        <View style={{paddingHorizontal: 30,justifyContent: 'center', flex: 1}}>
          <DropDownPicker
              zIndex={100000}
              open={openExerciseSelector}
              value={selectedLeaderboardExercise}
              items={communityData.leaderboardExercises.map((exercise) => ({
                label: exercise,
                value: exercise,
              }))}
              setOpen={setOpenExerciseSelector}
              setValue={setSelectedLeaderboardExercise}
              placeholder="Select a leaderboard"
              style={styles.dropdownPicker}
              containerStyle={styles.dropdownContainerStyle}
              dropDownContainerStyle={styles.dropDownContainerStyle}
              textStyle={styles.dropdownTextStyle}
              labelStyle={styles.dropdownLabelStyle}
              arrowIconStyle={styles.arrowIconStyle}
              placeholderStyle={styles.placeholderStyle}
              selectedItemLabelStyle={styles.selectedItemLabelStyle}
          />
          {leaderboard ? (
            <FlatList
              data={leaderboard}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item, index }) => (
                <View style={styles.leaderboardItem}>
                  <Text style={styles.leaderboardRank}>{index + 1}.</Text>
                  <Text style={styles.leaderboardName}>{item.userName}</Text>
                  <Text style={styles.leaderboardDetails}>
                    {item.consistencyStreak? item.consistencyStreak: ''}
                    {item.consistencyStreak && item.consistencyStreak > 1? ' days': ''}
                    {item.consistencyStreak && item.consistencyStreak === 1? ' day': ''}
                    {item.weight? item.weight: ''}
                    {item.weightUnit? item.weightUnit: ''} {item.weight? "x": ""}
                    {item.reps? item.reps: ''} {item.reps? "reps": ""}
                    {item.time? formatTimeMilliseconds(item.time): ''}
                  </Text>
                </View>
              )}
            />
          ) : (
            <Text>No leaderboard data available.</Text>
          )}
        </View>
        <View style={{zIndex: -1, }}>
        <TouchableOpacity
          style={styles.createPostButton}
          onPress={() =>
            navigation.navigate("CommunityPostScreen", {
              communityId,
              communityName: communityData.name,
            })
          }
        >
          <Text style={styles.createPostText}>Post an announcement...</Text>
        </TouchableOpacity>
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card containerStyle={styles.cardContainer}>
              <Card.Title>{item.title}</Card.Title>
              <Card.Divider />
              <Text>{item.content}</Text>
              {item.image && (
                <Image source={{ uri: item.image }} style={styles.postImage} />
              )}
              <View style={styles.postActions}>
                <TouchableOpacity onPress={() => handleLike(item.id)}>
                  <Icon
                    name={
                      item.likes && item.likes.includes(userId)
                        ? "thumbs-up"
                        : "thumbs-o-up"
                    }
                    size={24}
                    color={
                      item.likes && item.likes.includes(userId)
                        ? "blue"
                        : "gray"
                    }
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleComment(item.id)}
                  style={styles.actionButton}
                >
                  <Icon name="comment" size={24} color="gray" />
                </TouchableOpacity>
              </View>
            </Card>
          )}
          contentContainerStyle={styles.feed}
        />
        </View>
      </ScrollView>
      <CommunityUserModal
          visible={isUsersModalVisible}
          onClose={handleCloseUsersModal}
          members={members}
      />

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  bannerImage: {
    width: "100%",
    height: 200,
  },
  bannerPlaceholder: {
    width: "100%",
    height: 200,
    backgroundColor: "#cccccc", // Placeholder color
  },
  profileImage: {
    position: "absolute",
    top: 150,
    left: 20,
    borderWidth: 3,
    borderColor: "#fff",
  },
  feed: {
    paddingHorizontal: 10,
  },
  communityImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 50,
  },
  communityName: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 35,
    marginBottom: 10,
  },
  communityDetails: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginVertical: 5,
  },
  createPostButton: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 15,
    marginTop: 40,
    backgroundColor: "#fff",
    marginBottom: 40,
    zIndex: 1,
  },
  postActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  createPostText: {
    color: "#999",
  },
  postImage: {
    width: "100%",
    height: 200,
    marginVertical: 10,
    borderRadius: 5,
  },
  cardContainer: {
    borderRadius: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  createEventButton: {
    borderRadius: 10,
    padding: 15,
    margin: 10,
  },
  createEventText: {
    color: "grey",
    fontWeight: "bold",
  },
  eventsContainer: {
    paddingVertical: 5,
  },
  eventCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    flexDirection: "row",
  },
  eventDateContainer: {
    backgroundColor: "#f5f5f5",
    borderRadius: 5,
    padding: 5,
    marginBottom: 10,
    alignItems: "center",
  },
  eventDay: {
    fontSize: 24,
    fontWeight: "bold",
  },
  eventMonth: {
    fontSize: 14,
    color: "#666",
  },
  eventName: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  eventDetail: {
    fontSize: 14,
    color: "#333",
    textAlign: "center",
  },
  eventMembers: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  eventDetailContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  leaderboardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 10,
    marginTop: 20,
  },
  leaderboardItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",

  },
  leaderboardRank: {
    fontSize: 16,
    fontWeight: "bold",
  },
  leaderboardName: {
    fontSize: 16,
  },
  leaderboardDetails: {
    fontSize: 16,
    color: "#666",
  },
  dropdownContainer: {
    paddingHorizontal: 15,
    marginTop: 20,
  },
  dropdownPicker: {
    backgroundColor: "#fff",
    borderColor: "#ccc", // Border color
    borderRadius: 10, // Rounded corners
    height: 50, // Height of the dropdown
    marginBottom: 10,
    zIndex: 1000,
  },
  dropdownContainerStyle: {
    height: 50, // Adjust the height of the picker container
    borderColor: "#ccc", // Same border color as dropdown picker
    zIndex: 1000, // Ensure it is on top when open
  },
  dropDownContainerStyle: {
    backgroundColor: "#fafafa", // Background for the dropdown options
    borderColor: "#ccc", // Same border color as the picker
    borderRadius: 10, // Rounded corners
    marginBottom: 5,
    zIndex: 1000,
    position: 'absolute'
  },
  dropdownTextStyle: {
    fontSize: 16,
    color: "#333", // Text color
    zIndex: 1000,
  },
  dropdownLabelStyle: {
    fontSize: 16,
    color: "#333", // Label text color
    zIndex: 1000,
  },
  arrowIconStyle: {
    width: 20,
    height: 20, // Arrow icon size
    zIndex: 1000,
  },
  placeholderStyle: {
    fontSize: 16,
    color: "#aaa", // Placeholder color
  },
  selectedItemLabelStyle: {
    fontWeight: "bold", // Highlight selected item
  },
  hideButton: {
    padding: 10,
    backgroundColor: '#016e03',
    borderRadius: 5,
  },
  hideButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  editButtonText: {
    color: '#016e03',
    fontWeight: 'bold',
    fontSize: 16
  },
});

export default CommunityLandingPage;
