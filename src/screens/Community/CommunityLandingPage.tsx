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
          <TouchableOpacity onPress={() => navigation.navigate("NewCommunity", {community: communityData, isEdit: true})} style={styles.hideButton}>
            <Text style={styles.hideButtonText}>Edit</Text>
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

          let latestBenchPress = null;

          workoutsSnapshot.forEach((workoutDoc) => {
            const workoutData = workoutDoc.data();
            const exercise = workoutData.exercises.find(
              (exercise) => exercise.name.toLowerCase() === exerciseName.toLowerCase()
            );
            if (exercise && exercise.sets) {
              console.log('bench',exercise);
              const estimated1RM =
                exercise.sets[0].weight * (1 + 0.0333 * exercise.sets[0].reps);

              if (!latestBenchPress || workoutDoc.id > latestBenchPress.date) {
                latestBenchPress = {
                  userId,
                  ...exercise.sets[0],
                  estimated1RM,
                  date: workoutDoc.id,
                  userName: `${userProfileData.firstName} ${userProfileData.lastName}`,
                };
              }
            }
          });

          if (latestBenchPress) {
            leaderboardData.push(latestBenchPress);
          }
        }
      }

      // Sort the data by estimated 1RM
      leaderboardData.sort((a, b) => b.estimated1RM - a.estimated1RM);

      return leaderboardData;
    } catch (error) {
      console.error("Error fetching bench press data: ", error);
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
        <View style={{paddingHorizontal: 30,justifyContent: 'center'}}>
          <DropDownPicker
              open={openExerciseSelector}
              value={selectedLeaderboardExercise}
              items={communityData.leaderboardExercises.map((exercise) => ({
                label: exercise,
                value: exercise,
              }))}
              setOpen={setOpenExerciseSelector}
              setValue={setSelectedLeaderboardExercise}
              placeholder="Select an exercise"
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
                    {item.weight}
                    {item.weightUnit} x {item.reps} reps
                  </Text>
                </View>
              )}
            />
          ) : (
            <Text>No exercise data available.</Text>
          )}
        </View>
        <View>
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
  },
  dropdownContainerStyle: {
    height: 50, // Adjust the height of the picker container
    borderColor: "#ccc", // Same border color as dropdown picker
  },
  dropDownContainerStyle: {
    backgroundColor: "#fafafa", // Background for the dropdown options
    borderColor: "#ccc", // Same border color as the picker
    borderRadius: 10, // Rounded corners
  },
  dropdownTextStyle: {
    fontSize: 16,
    color: "#333", // Text color
  },
  dropdownLabelStyle: {
    fontSize: 16,
    color: "#333", // Label text color
  },
  arrowIconStyle: {
    width: 20,
    height: 20, // Arrow icon size
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
});

export default CommunityLandingPage;
