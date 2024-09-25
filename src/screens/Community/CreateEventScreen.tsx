import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Alert,
  FlatList,
  Modal,
  ActivityIndicator
} from "react-native";
import { db, app } from "../../../firebaseConfig"; // Adjust the import path based on your project structure
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import DateTimePicker from "@react-native-community/datetimepicker";
import GPSModal from "../../screens/Community/GPSModal";
import { Picker } from "@react-native-picker/picker";
import CustomPickerModal from "./CustomPickerModal";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Checkbox } from "react-native-paper";
import InviteModal from "./InviteModal";
import { useFocusEffect } from "@react-navigation/native";

const muscleTargets = [
  "Push",
  "Pull",
  "Legs",
  "Upper Body",
  "Lower Body",
  "Full Body",
  "Core",
  "Abs",
  "Arms",
  "Chest",
  "Back",
  "Shoulders",
]; // Replace with your data source

const levels = ["Beginner", "Intermediate", "Advanced"]; // Example levels
const trainingFocuses = ["Volume", "Intensity", "None"]; // Example training focuses

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

const CreateEventScreen = ({ route, navigation }) => {
  const { communityId, event, isEdit } = route.params || {};
  const [eventName, setEventName] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDate, setEventDate] = useState(new Date());
  const [eventTime, setEventTime] = useState(new Date());
  const [location, setLocation] = useState(null);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [workoutFocus, setWorkoutFocus] = useState("");
  const [level, setLevel] = useState("");
  const [trainingFocus, setTrainingFocus] = useState("");
  const [muscleTarget, setMuscleTarget] = useState("");
  const [maxPeople, setMaxPeople] = useState(null);

  const [levelPickerVisible, setLevelPickerVisible] = useState(false);
  const [trainingFocusPickerVisible, setTrainingFocusPickerVisible] =
    useState(false);
  const [muscleTargetPickerVisible, setMuscleTargetPickerVisible] =
    useState(false);

  //specify invite location
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [selectedCommunities, setSelectedCommunities] = useState([]);
  const [selectedFollowers, setSelectedFollowers] = useState([]);
  const [userCommunities, setUserCommunities] = useState([]);
  const [mutualFollowers, setMutualFollowers] = useState([]);
  const [loading, setLoading] = useState(false); // Loading state


  const user = useAuth();

  const handleCreateEvent = async () => {
    if (maxPeople > 4) {
      Alert.alert("no more than 4 people maximum!");
    }

    if (!eventDate || !eventTime || !location) {
      Alert.alert("Error", "Date, time, and location are required.");
      return;
    }

    // Auto-generate event name if empty and muscleTarget is filled
    if (!eventName && muscleTarget) {
      setEventName(`${muscleTarget} day`);
    } else {
      setEventName("Workout");
    }

    try {
      const eventData = {
        name: eventName,
        description: eventDescription,
        date: eventDate,
        time: eventTime,
        location: location,
        workoutFocus: workoutFocus || null,
        level: level || null,
        muscleTarget: muscleTarget || null,
        trainingFocus: trainingFocus || null,
        maxPeople: maxPeople,
        joinedUsers: [user?.uid],
        owner: user?.uid,
        invitedCommunities: selectedCommunities,
        invitedPeople: selectedFollowers,
      }

      if (isEdit) {
        await updateDoc(doc(db, "events", event.id), eventData);
        Alert.alert("Event updated successfully.");
      } else {

        const eventRef = await addDoc(collection(db, "events"), eventData);

        const communityUpdatePromises = selectedCommunities.map((communityId) =>
          updateDoc(doc(db, "communities", communityId), {
            events: arrayUnion(eventRef.id),
          })
        );
        await Promise.all(communityUpdatePromises);

        const followersUpdatePromises = selectedFollowers.map((communityId) =>
          updateDoc(doc(db, "userProfiles", communityId), {
            events: arrayUnion(eventRef.id),
          })
        );
        await Promise.all(communityUpdatePromises);

        //the creator of the event
        await updateDoc(doc(db, "userProfiles", user?.uid), {
          events: arrayUnion(eventRef.id),
        });
      }

      navigation.goBack(); // Go back to the previous screen after creating the event
    } catch (error) {
      console.error("Error creating event: ", error);
    }
  };

  useEffect(() => {
    if (isEdit && event) {
      setEventName(event.name || "");
      setEventDescription(event.description || "");
      setEventDate(new Date(event.date.seconds * 1000) || new Date());
      setEventTime(new Date(event.time.seconds * 1000) || new Date());
      setLocation(event.location || null);
      setWorkoutFocus(event.workoutFocus || "");
      setLevel(event.level || "");
      setTrainingFocus(event.trainingFocus || "");
      setMuscleTarget(event.muscleTarget || "");
      setMaxPeople(event.maxPeople || null);
      setSelectedCommunities(event.invitedCommunities || []);
      setSelectedFollowers(event.invitedPeople || []);
    }
  }, [isEdit, event]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: "Lifting Session",
      headerLeft: () => (
        <Button
          style={styles.backButton}
          title="Cancel"
          onPress={() => navigation.goBack()}
        />
      ),
    });
  }, [navigation]);

  const handleSelectLocation = (selectedLocation) => {
    setLocation(selectedLocation);
    setLocationModalVisible(false);
  };

  const generateRandomId = (length) => {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    return result;
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch the user's profile document once
        const userProfileDoc = await getDoc(doc(db, "userProfiles", user?.uid));

        if (userProfileDoc.exists()) {
          const userProfileData = userProfileDoc.data();

          // Fetch communities the user is part of
          const communityIds = userProfileData?.communities || [];
          const communities = await Promise.all(
            communityIds.map(async (communityId) => {
              const communityDoc = await getDoc(
                doc(db, "communities", communityId)
              );
              return communityDoc.exists()
                ? { id: communityDoc.id, ...communityDoc.data() }
                : null;
            })
          );
          setUserCommunities(communities.filter(Boolean)); // Filter out any null values

          // Fetch mutual followers
          const followers = userProfileData?.followers || [];
          const following = userProfileData?.following || [];

          const mutualFollowersIds = followers.filter((followerId) =>
            following.includes(followerId)
          );
          const mutualFollowersData = await Promise.all(
            mutualFollowersIds.map(async (followerId) => {
              const followerDoc = await getDoc(
                doc(db, "userProfiles", followerId)
              );
              return followerDoc.exists()
                ? { id: followerDoc.id, ...followerDoc.data() }
                : null;
            })
          );
          setMutualFollowers(mutualFollowersData.filter(Boolean)); // Filter out any null values
        } else {
          console.error("User profile not found.");
          setUserCommunities([]);
          setMutualFollowers([]);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        // Optionally, you could update the state to reflect the error or show a message to the user
        // setError("Failed to fetch user data. Please try again later.");
      }
    };

    if (user) {
      fetchUserData();
    }
  }, [user]);

  useFocusEffect(
    React.useCallback(() => {
      console.log("Selected Communities:", selectedCommunities);
      console.log("Selected Followers:", selectedFollowers);

      // Return a cleanup function if necessary
      return () => {
        console.log("Screen unfocused");
      };
    }, [selectedCommunities, selectedFollowers])
  );

  const getSelectedDetails = (selectedIds, allItems) => {
    return selectedIds
      .map((id) => allItems.find((item) => item.id === id))
      .filter(Boolean);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>Details</Text>
        <TextInput
          style={styles.input}
          value={eventName}
          onChangeText={setEventName}
          placeholder={"Event name"}
        />
        <TextInput
          style={styles.input}
          value={eventDescription}
          onChangeText={setEventDescription}
          placeholder={"add a description!"}
        />
        <Text style={styles.label}>Start Date*</Text>
        <DateTimePicker
          value={eventDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) =>
            setEventDate(selectedDate || eventDate)
          }
        />
        <Text style={styles.label}>Start Time*</Text>
        <DateTimePicker
          value={eventTime}
          mode="time"
          display="default"
          onChange={(event, selectedTime) =>
            setEventTime(selectedTime || eventTime)
          }
        />
        <Text style={styles.label}>Location</Text>
        <TouchableOpacity
          style={{ zIndex: 10 }}
          onPress={() => {
            console.log("TouchableOpacity pressed");
            setLocationModalVisible(true);
          }}
        >
          <TouchableWithoutFeedback
            onPress={() => {
              console.log("Inner TouchableWithoutFeedback pressed");
              setLocationModalVisible(true);
            }}
          >
            <View pointerEvents="none">
              <TextInput
                style={styles.input}
                value={location ? location.name : ""}
                editable={false}
                placeholder="Select a location"
              />
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
        <Text style={styles.label}>Workout Focus</Text>
        <TextInput
          style={styles.input}
          value={workoutFocus}
          onChangeText={setWorkoutFocus}
          placeholder="e.g. Calisthenics, Powerlifting, Bodybuilding"
        />
        <Text style={styles.label}>Level</Text>
        <TouchableOpacity onPress={() => setLevelPickerVisible(true)}>
          <View pointerEvents="none">
            <TextInput
              style={styles.input}
              value={level}
              editable={false}
              placeholder="Select Level"
            />
          </View>
        </TouchableOpacity>
        <Text style={styles.label}>Training Focus</Text>
        <TouchableOpacity onPress={() => setTrainingFocusPickerVisible(true)}>
          <View pointerEvents="none">
            <TextInput
              style={styles.input}
              value={trainingFocus}
              editable={false}
              placeholder="Select Training Focus"
            />
          </View>
        </TouchableOpacity>
        <Text style={styles.label}>Muscle Target</Text>
        <TouchableOpacity onPress={() => setMuscleTargetPickerVisible(true)}>
          <View pointerEvents="none">
            <TextInput
              style={styles.input}
              value={muscleTarget}
              editable={false}
              placeholder="Select Muscle Target"
            />
          </View>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={maxPeople}
          onChangeText={setMaxPeople}
          placeholder="How many people can join? 4 maximum"
          keyboardType={"number-pad"}
        />

        <TouchableOpacity
          style={styles.selectedContainer}
          onPress={() => setInviteModalVisible(true)}
        >
          {selectedCommunities.length > 0 && (
            <Text style={styles.selectedLabel}>Selected Communities:</Text>
          )}
          {getSelectedDetails(selectedCommunities, userCommunities).map(
            (community) => (
              <Text key={community.id} style={styles.selectedItem}>
                {community.name}
              </Text>
            )
          )}

          {selectedFollowers.length > 0 && (
            <Text style={styles.selectedLabel}>Selected Followers:</Text>
          )}
          {getSelectedDetails(selectedFollowers, mutualFollowers).map(
            (follower) => (
              <Text key={follower.id} style={styles.selectedItem}>
                {follower.firstName} {follower.lastName}
              </Text>
            )
          )}

          {selectedCommunities.length === 0 &&
            selectedFollowers.length === 0 && (
              <Text style={styles.selectedItem}>
                No invites selected. Tap to choose.
              </Text>
            )}
        </TouchableOpacity>

        {loading ? (
            <ActivityIndicator size="large" color="#0000ff" /> // Display loader
        ) : (
            <Button
                title={isEdit ? "Update Event" : "Create Event"}
                onPress={handleCreateEvent}
                disabled={loading} // Disable button during loading
            />
        )}

        <GPSModal
          isVisible={locationModalVisible}
          onClose={() => setLocationModalVisible(false)}
          onSelectLocation={handleSelectLocation}
        />
        <CustomPickerModal
          visible={levelPickerVisible}
          options={levels}
          selectedValue={level}
          onValueChange={(itemValue) => setLevel(itemValue)}
          onClose={() => setLevelPickerVisible(false)}
        />
        <CustomPickerModal
          visible={trainingFocusPickerVisible}
          options={trainingFocuses}
          selectedValue={trainingFocus}
          onValueChange={(itemValue) => setTrainingFocus(itemValue)}
          onClose={() => setTrainingFocusPickerVisible(false)}
        />
        <CustomPickerModal
          visible={muscleTargetPickerVisible}
          options={muscleTargets}
          selectedValue={muscleTarget}
          onValueChange={(itemValue) => setMuscleTarget(itemValue)}
          onClose={() => setMuscleTargetPickerVisible(false)}
        />
        <InviteModal
          isVisible={inviteModalVisible}
          onClose={() => setInviteModalVisible(false)}
          onSave={(communities, followers) => {
            setSelectedCommunities(communities);
            setSelectedFollowers(followers);
          }}
          userCommunities={userCommunities}
          mutualFollowers={mutualFollowers}
          selectedCommunities={selectedCommunities}
          selectedFollowers={selectedFollowers}
        />

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: "#fff",
    paddingBottom: 100, // Add some padding to the bottom
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    marginBottom: 16,
    borderRadius: 4,
  },
  backButton: {
    fontWeight: "bold",
    fontSize: 16,
  },
  searchResults: {
    backgroundColor: "#fff",
    marginBottom: 16,
  },
  map: {
    width: "100%",
    height: 200,
    marginBottom: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    marginBottom: 16,
  },
  modalContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  selectedContainer: {
    padding: 10,
    marginVertical: 10,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  selectedLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  selectedItem: {
    fontSize: 14,
    color: "#555",
    marginBottom: 2,
  },
});

export default CreateEventScreen;
