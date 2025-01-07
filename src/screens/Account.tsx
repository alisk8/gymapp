import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  ScrollView, Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {firebase_auth, db, storage} from "../../firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  User,
} from "firebase/auth";
import {
  doc,
  getDocs,
  collection,
  onSnapshot,
  setDoc, updateDoc, arrayUnion,
} from "firebase/firestore";
import useMarkedDates from "../../hooks/setMarkedDates";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "@react-navigation/native";
import GPSModal from "./Community/GPSModal";
import * as ImageManipulator from "expo-image-manipulator";
import {getDownloadURL, ref as storageRef, uploadBytes} from "firebase/storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import {Timestamp} from "firebase/firestore";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

type AdditionalInfo = {
  firstName: string;
  lastName: string;
  height: string;
  weight: string;
  age: string;
  sex: string;
  location: string;
  gym_interests: [];
  bio: string;
  profilePicture: string;
  followers: string[];
  following: string[];
  favoriteExercises: string[];
  experienceLevel: string;
  favoriteGym: string;
  displaySettings: Record<string, boolean>;
  xp: number
  consistencyStreak: number,
};

export default function Account({ navigation }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [signingUp, setSigningUp] = useState(false);
  const [step, setStep] = useState(1);
  const [additionalInfo, setAdditionalInfo] = useState<AdditionalInfo>({
    firstName: "",
    lastName: "",
    height: "",
    weight: "",
    age: "",
    sex: "",
    location: "",
    gym_interests: [],
    bio: "",
    profilePicture: "",
    followers: [],
    following: [],
    favoriteExercises: [],
    //adding community for testing purposes
    communities: ["Sjj402aMI2s9wbmlzLig"],
    experienceLevel: "",
    favoriteGym: "",
     displaySettings: {
      height: true,
      weight: true,
      age: true,
      sex: true,
      location: true,
      gym_interests: true,
      bio: true,
      favoriteExercises: true,
      experienceLevel: true,
      favoriteGym: true,
    },
    xp: 0,
    consistencyStreak:0
  });
  const [heightFeet, setHeightFeet] = useState("");
  const [heightInches, setHeightInches] = useState("");
  const [sex, setSex] = useState("");
  const [otherSex, setOtherSex] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [posts, setPosts] = useState([]);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [exerciseInput, setExerciseInput] = useState("");
  const [exerciseSuggestions, setExerciseSuggestions] = useState<string[]>([]);
  const [gymInterestInput, setGymInterestInput] = useState("");
  const [gymInterests, setGymInterests] = useState<string[]>([]);
  const [exercisePresets, setExercisePresets] = useState([]);

  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [workoutTime, setWorkoutTime] = useState(""); // Store time as HH:mm
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [customGoal, setCustomGoal] = useState("");
  const [goals, setGoals] = useState([]);
  const { clearMarkedDates } = useMarkedDates();
  const auth = firebase_auth;

  useFocusEffect(
      React.useCallback(() => {
        fetchExercisePresets();
      }, [])
  );



  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);
        const userRef = doc(db, "userProfiles", user.uid);
        const unsubscribeSnapshot = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            const data = doc.data() as AdditionalInfo;
            setAdditionalInfo({
              ...data,
              displaySettings: data.displaySettings || {
                height: true,
                weight: true,
                age: true,
                sex: true,
                location: true,
                gym_interests: true,
                bio: true,
                favoriteExercises: true,
                xp: true,
                favoriteGym: true,
              },
            });
          } else {
            console.log("No such document!");
          }
        });
        return () => unsubscribeSnapshot();
      } else {
        setUser(null);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    fetchHighlightsAndWorkouts();
  }, [user?.uid]);

  const fetchHighlightsAndWorkouts = async () => {
    if (!user) return;
    const userRef = doc(db, "userProfiles", user.uid);

    const highlightsRef = collection(userRef, "highlights");
    const highlightsSnapshot = await getDocs(highlightsRef);
    const highlightsData = highlightsSnapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
      timestamp: doc.data().timestamp?.toDate().getTime() || Date.now(),
      type: "highlight",
      collection: "highlights",
    }));

    const workoutsRef = collection(userRef, "workouts");
    const workoutsSnapshot = await getDocs(workoutsRef);
    const workoutsData = workoutsSnapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
      timestamp: doc.data().timestamp?.toDate().getTime() || Date.now(),
      type: "workout",
      collection: "workouts",
    }));

    const combinedData = [...highlightsData, ...workoutsData].sort(
        (a, b) => a.timestamp - b.timestamp
    );

    setPosts(combinedData);
  };

  const generateUniqueFilename = () => {
    const timestamp = Date.now();
    const randomNumber = Math.floor(Math.random() * 1000000);
    return `${timestamp}_${randomNumber}`;
  };

  const uploadImage = async (uri, folder) => {
    try {
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }

      const blob = await response.blob();
      const resizedImage = await ImageManipulator.manipulateAsync(
          uri,
          [
            {
              resize: { width: 200, height: 200 }
            },
          ], // Resize to 200x200 pixels for profile, 1280x720 for banner
          { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );

      const resizedBlob = await (await fetch(resizedImage.uri)).blob();
      const uniqueFileName = generateUniqueFilename();
      const storageRefInstance = storageRef(
          storage,
          `${folder}/${uniqueFileName}`
      );
      await uploadBytes(storageRefInstance, resizedBlob);
      return await getDownloadURL(storageRefInstance);
    } catch (error) {
      console.error("Error uploading image: ", error);
      Alert.alert(
          "Image Upload Error",
          "Failed to upload the image. Please try again."
      );
      return null;
    }
  };

  const handleLogin = async () => {
    try {
      const response = await signInWithEmailAndPassword(
          auth,
          username,
          password
      );
      setUser(response.user);

      Alert.alert("Success", "Logged in Successfully");
      navigation.navigate("Home");
    } catch (error) {
      console.error("Login Error:", error);
      Alert.alert("Error", "User Not Found");
    }
  };

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match!");
      return;
    }

    const combinedHeight = `${heightFeet}' ${heightInches}"`;
    const finalSex = sex === "Other" ? otherSex : sex;

    try {
      const response = await createUserWithEmailAndPassword(
          auth,
          username,
          password
      );
      setUser(response.user);

      let imageUrl = "";
      if (additionalInfo.profilePicture) {
        imageUrl = await uploadImage(additionalInfo.profilePicture, "profilePictures");
        additionalInfo.profilePicture = imageUrl;
      }

      // Fetch all existing user IDs
      const userProfilesSnapshot = await getDocs(collection(db, "userProfiles"));
      const existingUserIds = userProfilesSnapshot.docs.map((doc) => doc.id);

      const userProfileRef = doc(db, "userProfiles", response.user.uid);

      const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const trimmedGoal = customGoal.trim();
      if (trimmedGoal && !goals.includes(trimmedGoal)) {
        setGoals( [...goals, trimmedGoal]); // Use functional form to avoid stale state
      }

      await setDoc(userProfileRef, {
        email: username,
        ...additionalInfo,
        height: combinedHeight,
        sex: finalSex,
        goals: goals,
        gym_interests: gymInterests || [],
        followers: existingUserIds,
        following: existingUserIds,
        workout_days: selectedDays || [],
        preferred_workout_time: Timestamp.fromDate(selectedTime),
        timeZone: userTimeZone,
      });

      // Update each existing user's profile
      const updatePromises = userProfilesSnapshot.docs.map((doc) => {
        const existingUserRef = doc.ref;
        return updateDoc(existingUserRef, {
          followers: arrayUnion(response.user.uid),
          following: arrayUnion(response.user.uid),
        });
      });

      await Promise.all(updatePromises);


      //for testing
      const chiCommunityRef = doc(db, "communities", '8UH3Vdfp1hnkhKvAa0MO');
      await updateDoc(chiCommunityRef, {
        members: arrayUnion(response.user.uid),
      });



      Alert.alert("Success", "Account Created");
      navigation.navigate("Feed");
      clearMarkedDates();
    } catch (error) {
      console.error("Signup Error:", error);
      Alert.alert("Error", "Error creating account " + error);
    }
  };

  const handleSignOut = async () => {
    await auth.signOut();
    setUser(null);
    clearMarkedDates();
  };

  const handlePostPress = (postIndex) => {
    navigation.navigate("PostDetails", { posts, postIndex, userId: user?.uid });
  };

  const handleFieldUpdate = (field: string, value: any) => {
    setAdditionalInfo((prevInfo) => ({
      ...prevInfo,
      [field]: value,
    }));
  };

  const handleNextStep = () => {
    if (step < 6) setStep(step + 1);
  };

  const handlePrevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const isStepOneComplete = additionalInfo.firstName && additionalInfo.lastName;

  const isStepTwoComplete =
      username && password && confirmPassword && password === confirmPassword;

  const isStepThreeComplete =
      heightFeet &&
      heightInches &&
      additionalInfo.age &&
      (sex !== "Other" || otherSex);

  const isStepFourComplete = goals.length > 0;

  const isStepSixComplete = additionalInfo.experienceLevel;

  const isStepFiveComplete = selectedDays.length > 0 && selectedTime;


  const handleSelectHomeGym = (selectedLocation) => {
    setAdditionalInfo((prev) => ({ ...prev, favoriteGym: selectedLocation.name }));
    setLocationModalVisible(false);
  };

  const handlePickProfilePicture = async () => {
    const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      alert("Permission to access camera roll is required!");
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (
        !pickerResult.canceled &&
        pickerResult.assets &&
        pickerResult.assets.length > 0
    ) {
      const updatedProfilePicture = await uploadImage(pickerResult.assets[0].uri, 'profilePictures');
      setAdditionalInfo((prev) => ({
        ...prev,
        profilePicture: updatedProfilePicture,
      }));
    }
  };

  const handleAddExercise = (exercise: string) => {
    if (!additionalInfo.favoriteExercises.includes(exercise)) {
      setAdditionalInfo((prev) => ({
        ...prev,
        favoriteExercises: [...prev.favoriteExercises, exercise],
      }));
      setExerciseInput("");
      setExerciseSuggestions([]);
    }
  };

  const handleRemoveExercise = (exercise: string) => {
    setAdditionalInfo((prev) => ({
      ...prev,
      favoriteExercises: prev.favoriteExercises.filter((ex) => ex !== exercise),
    }));
  };

  const fetchExercisePresets = async () => {
    const presetsRef = collection(db, "exercisePresets");
    const snapshot = await getDocs(presetsRef);
    const exercises = snapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name,
    }));
    setExercisePresets(exercises);
  };

  const handleExerciseInput = (text: string) => {
    setExerciseInput(text);

    const suggestions = exercisePresets.filter((exercise) => {
      return (
          typeof exercise.name === "string" &&
          exercise.name.toLowerCase().includes(text.toLowerCase()) &&
          !additionalInfo.favoriteExercises.includes(exercise.name)
      );
    });

    setExerciseSuggestions(suggestions);
  };

  const handleAddGymInterest = () => {
    if (gymInterestInput.trim()) {
      setGymInterests([...gymInterests, gymInterestInput.trim()]);
      setGymInterestInput("");
    }
  };

  const handleRemoveGymInterest = (interest: string) => {
    setGymInterests(gymInterests.filter((item) => item !== interest));
  };

  const toggleMenu = () => {
    setShowMenu((prev) => !prev);
  };

  const navigateToList = (type: "followers" | "following") => {
    navigation.navigate("UserList", {
      userIds: additionalInfo[type],
      title: type.charAt(0).toUpperCase() + type.slice(1),
    });
  };

  const dismissSuggestions = () => {
    setExerciseSuggestions([]);
  };

  const toggleDaySelection = (day: string) => {
    setSelectedDays((prevDays) =>
        prevDays.includes(day)
            ? prevDays.filter((d) => d !== day)
            : [...prevDays, day]
    );
  };


  const showTimePicker = () => {
    setTimePickerVisible(true);
  };

  const handleTimeChange = (event, selectedDate) => {
    if (event.type === "set" && selectedDate) {
      // Save the selected time but keep the picker open
      setSelectedTime(selectedDate);
    }
  };


  const renderProfile = () => {
    const displaySettings = additionalInfo.displaySettings || {
      height: true,
      weight: true,
      age: true,
      sex: true,
      location: true,
      gym_interests: true,
      bio: true,
      favoriteExercises: true,
      experienceLevel: true,
      favoriteGym: true,
    };

    return (
        <View>
          <View style={{width: '100%', justifyContent: 'center', alignItems: 'center'}}>
          <Image
              source={
                additionalInfo.profilePicture
                    ? { uri: additionalInfo.profilePicture }
                    : require("../../assets/placeholder.jpeg")
              }
              style={styles.profileImage2}
          />
          </View>
          <View style={styles.profileDetails}>
            <View style={styles.profileHeader}>
              <Text style={styles.name}>
                {additionalInfo.firstName} {additionalInfo.lastName}
              </Text>
              <View style={styles.scoreContainer}>
              <Text style={styles.scoreText}>
                XP: {additionalInfo.xp}
              </Text>
              {additionalInfo.consistencyStreak >0 && <Text style={styles.scoreText}>
                🔥 streak: {additionalInfo.consistencyStreak}
              </Text>
              }
              </View>
            </View>
            {displaySettings.bio && additionalInfo.bio && (
                <View style={styles.row}>
                <Text style={styles.bio}>{additionalInfo.bio}</Text>
                </View>
            )}
            <View style={styles.row}>
              {displaySettings.location && additionalInfo.location && (
                  <Text style={styles.location}>
                    {additionalInfo.location.split(",")[0]}
                  </Text>
              )}
              {displaySettings.experienceLevel &&
                  additionalInfo.experienceLevel && (
                      <Text style={styles.experience}>
                        {additionalInfo.experienceLevel} year lifter
                      </Text>
                  )}
            </View>
            <View style={styles.row}>
              {displaySettings.location && additionalInfo.location && (
                  <Text style={styles.favoriteGym}>
                    Home gym:  {additionalInfo.favoriteGym.split(",")[0]}
                  </Text>
              )}
            </View>
            <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Personal Info</Text>
            <View style={styles.row}>
              {displaySettings.height && additionalInfo.height && (
                  <Text style={styles.infoText}>
                    Height: {additionalInfo.height}
                  </Text>
              )}
              {displaySettings.weight && additionalInfo.weight && (
                  <Text style={styles.infoText}>
                    Weight: {additionalInfo.weight} lbs
                  </Text>
              )}
            </View>
            <View style={styles.row}>
              {displaySettings.sex && additionalInfo.sex && (
                  <Text style={styles.infoText}>Gender: {additionalInfo.sex}</Text>
              )}
              {displaySettings.age && additionalInfo.age && (
                  <Text style={styles.infoText}>Age: {additionalInfo.age}</Text>
              )}
            </View>
            </View>
            <View style={styles.favoriteContainer}>
              <View style={styles.favoriteSection}>
                <Text style={styles.favoritesTitle}>Favorite Exercises:</Text>
                {additionalInfo.favoriteExercises.map((exercise, index) => (
                    <Text key={index} style={styles.favoriteItem}>
                      {exercise}
                    </Text>
                ))}
              </View>
              <View style={styles.favoriteSection}>
                <Text style={styles.favoritesTitle}>Gym Interests:</Text>
                {additionalInfo.gym_interests.map((interest, index) => (
                    <Text key={index} style={styles.favoriteItem}>
                      {interest}
                    </Text>
                ))}
              </View>
            </View>
            </View>
        </View>
    );
  };


  return (
        <View style={{flex:1}}>
            {user ? (
                <>
                  <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
                              style={{backgroundColor: 'white'}}
                              contentContainerStyle={{flexGrow: 1}}>
                    <View style={styles.headerContainer}>
                      {user && (
                          <TouchableOpacity
                              style={styles.settingsIcon}
                              onPress={toggleMenu}
                          >
                            <Ionicons name="settings-outline" size={24} color="#000" />
                          </TouchableOpacity>
                      )}
                    </View>
                    {showMenu && (
                        <View style={styles.menu}>
                          <TouchableOpacity
                              style={styles.menuItem}
                              onPress={() => {
                                setShowMenu(false);
                                navigation.navigate("Settings", {
                                  userId: user?.uid,
                                  onFieldUpdate: handleFieldUpdate,
                                });
                              }}
                          >
                            <Text style={styles.menuItemText}>Edit Profile</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                              style={styles.menuItem}
                              onPress={() => {
                                setShowMenu(false);
                                navigation.navigate("Saved");
                              }}
                          >
                            <Text style={styles.menuItemText}>My Saved</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                              style={styles.menuItem}
                              onPress={() => {
                                setShowMenu(false);
                                handleSignOut();
                              }}
                          >
                            <Text style={styles.menuItemText}>Sign Out</Text>
                          </TouchableOpacity>
                        </View>
                    )}

                  {renderProfile()}
                  <View style={styles.postsContainer}>
                    {posts.length > 0 ? (
                        posts.map((post, index) => (
                            <View key={index} style={styles.postWrapper}>
                              {index % 3 === 0 && <View style={styles.infoRow} />}
                              <TouchableOpacity
                                  style={styles.card}
                                  onPress={() => handlePostPress(index)}
                              >
                                <View style={styles.imageContainer}>
                                  <Image
                                      source={{
                                        uri:
                                            post.type === "workout"
                                                ? "https://cdn.pixabay.com/photo/2018/05/28/13/14/dumbell-3435990_1280.jpg"
                                                : post.mediaUrls[0] || "",
                                      }}
                                      style={styles.postImage}
                                  />
                                </View>
                              </TouchableOpacity>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>
                          No Posts. Start tracking your workouts today!
                        </Text>
                    )}
                  </View>
                  </ScrollView>
                </>
            ) : (
                  <TouchableWithoutFeedback onPress={dismissSuggestions}>
                    <KeyboardAvoidingView
                        style={styles.container}
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                    >
                <View style={styles.contentContainer}>
                <View style={styles.authContainer}>
                  <Text style={styles.nameHeading}>{signingUp ? "" : "225"}</Text>
                  <Text style={styles.pageHeading}>
                    {signingUp ? "Create Account" : "Log In"}
                  </Text>
                  <View style={styles.formContainer}>
                    {signingUp ? (
                        <>
                          {step === 1 && (
                              <View>
                                <View style={{width: '100%', alignItems:'center'}}>
                                <Image
                                    source={
                                      additionalInfo.profilePicture
                                          ? { uri: additionalInfo.profilePicture }
                                          : require("../../assets/placeholder.jpeg")
                                    }
                                    style={styles.profileImage2}
                                />
                                </View>
                                <TextInput
                                    placeholder="First Name"
                                    value={additionalInfo.firstName}
                                    onChangeText={(text) =>
                                        handleFieldUpdate("firstName", text)
                                    }
                                    style={styles.input}
                                />
                                <TextInput
                                    placeholder="Last Name"
                                    value={additionalInfo.lastName}
                                    onChangeText={(text) =>
                                        handleFieldUpdate("lastName", text)
                                    }
                                    style={styles.input}
                                />
                                <TouchableOpacity
                                    style={styles.button}
                                    onPress={handlePickProfilePicture}
                                >
                                  <Text style={styles.buttonText}>
                                    Pick Profile Picture
                                  </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                      styles.button,
                                      !isStepOneComplete && styles.disabledButton,
                                    ]}
                                    onPress={isStepOneComplete ? handleNextStep : null}
                                    disabled={!isStepOneComplete}
                                >
                                  <Text style={styles.buttonText}>Next</Text>
                                </TouchableOpacity>
                              </View>
                          )}
                          {step === 2 && (
                              <View>
                                <TextInput
                                    placeholder="Email"
                                    value={username}
                                    onChangeText={setUsername}
                                    style={styles.input}
                                />
                                <TextInput
                                    placeholder="Password"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                    style={styles.input}
                                />
                                <TextInput
                                    placeholder="Confirm Password"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry
                                    style={styles.input}
                                />
                                {password !== confirmPassword && confirmPassword ? (
                                    <Text style={styles.errorText}>
                                      Passwords do not match!
                                    </Text>
                                ) : null}
                                <TouchableOpacity
                                    style={[
                                      styles.button,
                                      !isStepTwoComplete && styles.disabledButton,
                                    ]}
                                    onPress={isStepTwoComplete ? handleNextStep : null}
                                    disabled={!isStepTwoComplete}
                                >
                                  <Text style={styles.buttonText}>Next</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.button, styles.backButton]}
                                    onPress={handlePrevStep}
                                >
                                  <Text style={styles.buttonText}>Back</Text>
                                </TouchableOpacity>
                              </View>
                          )}
                          {step === 3 && (
                              <View>
                                <Text style={styles.label}>Gender</Text>
                                <View style={styles.sexOptionsContainer}>
                                  {["Male", "Female", "Other"].map((option) => (
                                      <TouchableOpacity
                                          key={option}
                                          style={[
                                            styles.sexOption,
                                            sex === option && styles.selectedSexOption,
                                          ]}
                                          onPress={() => setSex(option)}
                                      >
                                        <Text
                                            style={[
                                              styles.sexOptionText,
                                              sex === option &&
                                              styles.selectedSexOptionText,
                                            ]}
                                        >
                                          {option}
                                        </Text>
                                      </TouchableOpacity>
                                  ))}
                                </View>

                                {sex === "Other" && (
                                    <TextInput
                                        placeholder="Specify Sex"
                                        value={otherSex}
                                        onChangeText={setOtherSex}
                                        style={styles.input}
                                    />
                                )}

                                <View style={styles.heightContainer}>
                                  <TextInput
                                      placeholder="Height (Feet)"
                                      value={heightFeet}
                                      onChangeText={(text) => {
                                        const val = parseInt(text);
                                        if (
                                            text === "" ||
                                            (!isNaN(val) && val >= 0 && val <= 12)
                                        ) {
                                          setHeightFeet(text);
                                        }
                                      }}
                                      keyboardType="numeric"
                                      maxLength={2}
                                      style={[styles.input, styles.heightInput]}
                                  />
                                  <TextInput
                                      placeholder="Height (Inches)"
                                      value={heightInches}
                                      onChangeText={(text) => {
                                        const val = parseInt(text);
                                        if (
                                            text === "" ||
                                            (!isNaN(val) && val >= 0 && val <= 12)
                                        ) {
                                          setHeightInches(text);
                                        }
                                      }}
                                      keyboardType="numeric"
                                      maxLength={2}
                                      style={[styles.input, styles.heightInput]}
                                  />
                                </View>
                                <TextInput
                                    placeholder="Weight in lbs (optional)"
                                    value={additionalInfo.weight}
                                    onChangeText={(text) =>
                                        handleFieldUpdate("weight", text)
                                    }
                                    keyboardType="numeric"
                                    style={styles.input}
                                />
                                <TextInput
                                    placeholder="Age"
                                    value={additionalInfo.age}
                                    onChangeText={(text) =>
                                        handleFieldUpdate("age", text)
                                    }
                                    keyboardType="numeric"
                                    style={styles.input}
                                />
                                <TouchableOpacity
                                    style={[
                                      styles.button,
                                      !isStepThreeComplete && styles.disabledButton,
                                    ]}
                                    onPress={isStepThreeComplete ? handleNextStep : null}
                                    disabled={!isStepThreeComplete}
                                >
                                  <Text style={styles.buttonText}>Next</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.button, styles.backButton]}
                                    onPress={handlePrevStep}
                                >
                                  <Text style={styles.buttonText}>Back</Text>
                                </TouchableOpacity>
                              </View>
                          )}
                          {step === 4 && (
                              <View>
                                <Text style={styles.infoTitle}>What are your fitness goals?</Text>
                                <View style={styles.checklistContainer}>
                                  {[
                                    "Better academic performance",
                                    "Staying healthy/ improving mental health",
                                    "Improving body image",
                                    "Improving strength",
                                    "Social life/connecting with community",
                                  ].map((goal, index) => (
                                      <TouchableOpacity
                                          key={index}
                                          style={[
                                            styles.checklistItem,
                                            goals?.includes(goal) && styles.selectedChecklistItem,
                                          ]}
                                          onPress={() => {
                                            const newGoals = goals || [];
                                            if (newGoals.includes(goal)) {
                                              setGoals(newGoals.filter((g) => g !== goal));
                                            } else {
                                              setGoals([...newGoals, goal]);
                                            }
                                          }}
                                      >
                                        <Text
                                            style={[
                                              styles.checklistText,
                                              goals?.includes(goal) &&
                                              styles.selectedChecklistText,
                                            ]}
                                        >
                                          {goal}
                                        </Text>
                                      </TouchableOpacity>
                                  ))}
                                  <View style={styles.customGoalContainer}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Other (type your custom goal)"
                                        value={customGoal}
                                        onChangeText={setCustomGoal}
                                    />
                                  </View>
                                </View>
                                <TouchableOpacity
                                    style={[
                                      styles.button,
                                      goals.length > 0 ? null : styles.disabledButton,
                                    ]}
                                    onPress={() => {
                                      handleNextStep();
                                    }}
                                    disabled={!goals || goals.length === 0}
                                >
                                  <Text style={styles.buttonText}>Next</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.button, styles.backButton]}
                                    onPress={handlePrevStep}
                                >
                                  <Text style={styles.buttonText}>Back</Text>
                                </TouchableOpacity>
                              </View>
                          )}
                          {step === 5 && (
                              <View>
                                <Text style={styles.infoTitle}>Workout Preferences</Text>
                                <Text style={styles.label}>What days do you plan to work out?</Text>
                                <View style={styles.daysContainer}>
                                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                                      <TouchableOpacity
                                          key={day}
                                          style={[
                                            styles.dayButton,
                                            selectedDays.includes(day) && styles.selectedDayButton,
                                          ]}
                                          onPress={() => toggleDaySelection(day)}
                                      >
                                        <Text
                                            style={[
                                              styles.dayButtonText,
                                              selectedDays.includes(day) && styles.selectedDayButtonText,
                                            ]}
                                        >
                                          {day}
                                        </Text>
                                      </TouchableOpacity>
                                  ))}
                                </View>
                                <Text style={styles.label}>Preferred workout time:</Text>
                                <TouchableOpacity onPress={showTimePicker} style={styles.timeButton}>
                                  <Text style={styles.timeText}>
                                    {selectedTime
                                        ? `${selectedTime.getHours()}:${String(selectedTime.getMinutes()).padStart(2, "0")}`
                                        : "Select Time"}
                                  </Text>
                                </TouchableOpacity>
                                {timePickerVisible && (
                                    <Modal transparent={true} animationType="slide">
                                      <View style={styles.modalContainer}>
                                        <View style={styles.pickerWrapper}>
                                          <DateTimePicker
                                              value={selectedTime}
                                              mode="time"
                                              display="spinner"
                                              onChange={handleTimeChange}
                                          />
                                          <TouchableOpacity
                                              onPress={() => setTimePickerVisible(false)}
                                              style={styles.doneButton}
                                          >
                                            <Text style={styles.doneButtonText}>Done</Text>
                                          </TouchableOpacity>
                                        </View>
                                      </View>
                                    </Modal>
                                )}
                                <TouchableOpacity
                                    style={[
                                      styles.button,
                                      selectedDays.length > 0 && selectedTime ? null : styles.disabledButton,
                                    ]}
                                    onPress={isStepFiveComplete ? handleNextStep : null}
                                    disabled={!isStepFiveComplete}
                                >
                                  <Text style={styles.buttonText}>Next</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.button, styles.backButton]}
                                    onPress={handlePrevStep}
                                >
                                  <Text style={styles.buttonText}>Back</Text>
                                </TouchableOpacity>
                              </View>
                          )}
                          {step === 6 && (
                              <View>
                                <TextInput
                                    placeholder="Home city, state (required)"
                                    value={additionalInfo.location}
                                    onChangeText={(text) =>
                                        handleFieldUpdate("location", text)
                                    }
                                    style={styles.input}
                                />
                                <TextInput
                                    placeholder="Favorite Exercises"
                                    value={exerciseInput}
                                    onChangeText={handleExerciseInput}
                                    style={styles.input}
                                />
                                {exerciseSuggestions.length > 0 && (
                                    <FlatList
                                        data={exerciseSuggestions}
                                        keyExtractor={(item: any) => item.id}
                                        renderItem={({ item }) => (
                                            <TouchableOpacity
                                                onPress={() => handleAddExercise(item.name)}
                                            >
                                              <Text style={styles.suggestion}>
                                                {item.name}
                                              </Text>
                                            </TouchableOpacity>
                                        )}
                                    />
                                )}
                                <View style={styles.selectedExercisesContainer}>
                                  {additionalInfo.favoriteExercises.map((exercise) => (
                                      <View
                                          key={exercise}
                                          style={styles.selectedExercise}
                                      >
                                        <Text>{exercise}</Text>
                                        <TouchableOpacity
                                            onPress={() => handleRemoveExercise(exercise)}
                                        >
                                          <Ionicons
                                              name="close"
                                              size={16}
                                              color="black"
                                          />
                                        </TouchableOpacity>
                                      </View>
                                  ))}
                                </View>
                                <TextInput
                                    placeholder="Gym Interests (Separate with Return)"
                                    value={gymInterestInput}
                                    onChangeText={setGymInterestInput}
                                    style={styles.input}
                                    onSubmitEditing={handleAddGymInterest}
                                    returnKeyType="done"
                                />
                                <View style={styles.selectedExercisesContainer}>
                                  {gymInterests.map((interest) => (
                                      <View
                                          key={interest}
                                          style={styles.selectedExercise}
                                      >
                                        <Text>{interest}</Text>
                                        <TouchableOpacity
                                            onPress={() =>
                                                handleRemoveGymInterest(interest)
                                            }
                                        >
                                          <Ionicons
                                              name="close"
                                              size={16}
                                              color="black"
                                          />
                                        </TouchableOpacity>
                                      </View>
                                  ))}
                                </View>
                                <TouchableOpacity
                                    style={styles.input}
                                    onPress={() => setLocationModalVisible(true)}
                                >
                                  <Text>
                                    {additionalInfo.favoriteGym
                                        ? additionalInfo.favoriteGym
                                        : "Current Gym"}
                                  </Text>
                                </TouchableOpacity>
                                <TextInput
                                    placeholder="Years of Experience (required)"
                                    value={additionalInfo.experienceLevel}
                                    onChangeText={(text) =>
                                        handleFieldUpdate("experienceLevel", text)
                                    }
                                    keyboardType="numeric"
                                    maxLength={2}
                                    style={styles.input}
                                />
                                <TextInput
                                    placeholder="Bio"
                                    value={additionalInfo.bio}
                                    onChangeText={(text) =>
                                        handleFieldUpdate("bio", text)
                                    }
                                    style={styles.bioInput}
                                    multiline
                                />
                                <TouchableOpacity
                                    style={[
                                      styles.button,
                                      !isStepSixComplete && styles.disabledButton,
                                    ]}
                                    onPress={isStepSixComplete ? handleSignUp : null}
                                    disabled={!isStepSixComplete}
                                >
                                  <Text style={styles.buttonText}>Create Account</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.button, styles.backButton]}
                                    onPress={handlePrevStep}
                                >
                                  <Text style={styles.buttonText}>Back</Text>
                                </TouchableOpacity>

                                <GPSModal
                                    isVisible={locationModalVisible}
                                    onClose={() => setLocationModalVisible(false)}
                                    onSelectLocation={handleSelectHomeGym}
                                />

                              </View>
                          )}
                        </>
                    ) : (
                        <>
                          <TextInput
                              placeholder="Email"
                              value={username}
                              onChangeText={setUsername}
                              style={styles.input}
                          />
                          <TextInput
                              placeholder="Password"
                              value={password}
                              onChangeText={setPassword}
                              secureTextEntry
                              style={styles.input}
                          />
                          <TouchableOpacity
                              style={styles.button}
                              onPress={handleLogin}
                          >
                            <Text style={styles.buttonText}>Login</Text>
                          </TouchableOpacity>
                        </>
                    )}
                  </View>
                  <TouchableOpacity
                      style={styles.switchContainer}
                      onPress={() => setSigningUp((prev) => !prev)}
                  >
                    <Text style={styles.switchText}>
                      {signingUp
                          ? "Already have an account? Log in"
                          : "Don't have an account? Sign up"}
                    </Text>
                  </TouchableOpacity>
                </View>
                </View>
                    </KeyboardAvoidingView>
                  </TouchableWithoutFeedback>
            )}
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  contentContainer: {
    justifyContent: "center",
    paddingHorizontal: 20,
    flex:1,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingBottom: 10,
  },
  settingsIcon: {
    marginRight: 15,
  },
  menu: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    marginBottom: 15,
  },
  menuItem: {
    padding: 10,
  },
  menuItemText: {
    fontSize: 16,
  },
  profileContainer: {
    width: "100%",
    paddingBottom: 5,
  },
  profileImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
    marginBottom: 10,
  },
  profileDetails: {
    paddingHorizontal: 15,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },
  bio: {
    fontSize: 16,
    marginBottom: 10,
    color: "#666",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  location: {
    fontSize: 16,
    color: "#6A0DAD",
    fontWeight:'bold'
  },
  favoriteGym: {
    fontSize: 16,
    color: "#6A0DAD",
  },
  experience: {
    fontSize: 16,
    color: "#333",
  },
  infoText: {
    fontSize: 16,
    color: "#333",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "bold",
    marginTop: 15,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 10,
  },
  favoritesTitle: {
    fontSize: 15,
    fontWeight: "bold",
    marginTop: 15,
  },
  sectionContent: {
    fontSize: 16,
    color: "#333",
    marginTop: 5,
  },
  postsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
  },
  postWrapper: {
    width: "33%",
    padding: 5,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
    width: '80%',
    alignSelf:'center'
  },
  card: {
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    aspectRatio: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  postImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "#999999",
  },
  authContainer: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  formContainer: {
    width: "100%",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  bioInput: {
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    height: 100,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: '#016e03',
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 5,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  switchContainer: {
    marginTop: 10,
  },
  switchText: {
    color: '#016e03',
  },
  nameHeading: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  pageHeading: {
    fontSize: 30,
    marginBottom: 50,
  },
  firstRow: {
    marginTop: 10,
  },
  errorText: {
    color: "red",
    marginBottom: 10,
  },
  heightContainer: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  heightInput: {
    flex: 1,
    marginRight: 5,
  },
  sexOptionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
  },
  sexOption: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 10,
  },
  selectedSexOption: {
    backgroundColor: '#016e03',
  },
  sexOptionText: {
    color: "#333",
  },
  selectedSexOptionText: {
    color: "#FFFFFF",
  },
  suggestion: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  selectedExercisesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginVertical: 10,
  },
  selectedExercise: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    padding: 5,
    borderRadius: 5,
    margin: 5,
  },
  disabledButton: {
    backgroundColor: "#cccccc",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  backButton: {
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#016e03',
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  scoreText:{
    fontSize: 16,
    color: '#0170c7',
    fontWeight:'bold'
  },
  infoItem: {
    fontSize: 16,
    color: "#666",
    marginBottom: 5,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: 'space-between',
    width: '100%',
  },
  scoreContainer: {
    flexDirection: "column",
    alignItems: "flex-end",
    marginBottom: 3,
  },
  profileImage2: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 10,
  },
  favoriteContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  favoriteSection: {
    flex: 0.48,
    backgroundColor: "#fff", // Ensure a background color is set
    borderRadius: 8, // Rounded corners
    shadowColor: "#000",
    shadowOpacity: 0.2, // Shadow transparency
    shadowRadius: 4, // Shadow blur
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
  },
  infoSection: {
    backgroundColor: "#fff", // Ensure a background color is set
    borderRadius: 8, // Rounded corners
    shadowColor: "#000",
    shadowOpacity: 0.2, // Shadow transparency
    shadowRadius: 4, // Shadow blur
    paddingHorizontal: 10,
    marginVertical: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  favoriteItem: {
    fontSize: 15,
    color: "#333",
    marginVertical: 2,
  },
  daysContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    marginVertical: 10,
  },
  dayButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 8,
    marginBottom: 10,
    minWidth: "30%",
    alignItems: "center",
  },
  selectedDayButton: {
    backgroundColor: "#016e03",
  },
  dayButtonText: {
    color: "#333",
  },
  selectedDayButtonText: {
    color: "#FFFFFF",
  },
  timeButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 8,
    marginVertical: 10,
    alignItems: "center",
  },
  timeText: {
    fontSize: 16,
    color: "#333",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  pickerWrapper: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  doneButton: {
    marginTop: 10,
    backgroundColor: "#016e03",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  doneButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  checklistContainer: {
    marginVertical: 10,
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
  },
  selectedChecklistItem: {
    backgroundColor: "#016e03",
  },
  checklistText: {
    color: "#333",
    fontSize: 16,
  },
  selectedChecklistText: {
    color: "#fff",
  },
  customGoalContainer: {
    marginTop: 10,
  },
});