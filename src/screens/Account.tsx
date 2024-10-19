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
  ScrollView,
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
  setDoc,
} from "firebase/firestore";
import useMarkedDates from "../../hooks/setMarkedDates";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "@react-navigation/native";
import GPSModal from "./Community/GPSModal";
import * as ImageManipulator from "expo-image-manipulator";
import {getDownloadURL, ref as storageRef, uploadBytes} from "firebase/storage";

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
    gym_interests: "",
    bio: "",
    profilePicture: "",
    followers: [],
    following: [],
    favoriteExercises: [],
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

      const userProfileRef = doc(db, "userProfiles", response.user.uid);
      await setDoc(userProfileRef, {
        email: username,
        ...additionalInfo,
        height: combinedHeight,
        sex: finalSex,
        gym_interests: gymInterests || [],
        followers: [],
        following: [],
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
    if (step < 4) setStep(step + 1);
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

  const isStepFourComplete = additionalInfo.experienceLevel && additionalInfo.location;

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
      setAdditionalInfo((prev) => ({
        ...prev,
        profilePicture: pickerResult.assets[0].uri,
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
        <ScrollView style={styles.profileContainer}>
          <Image
              source={
                additionalInfo.profilePicture
                    ? { uri: additionalInfo.profilePicture }
                    : require("../../assets/placeholder.jpeg")
              }
              style={styles.profileImage}
          />
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
            <Text style={styles.sectionTitle}>Personal Info</Text>
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
            {displaySettings.favoriteExercises &&
                additionalInfo.favoriteExercises && (
                    <>
                      <Text style={styles.sectionTitle}>Favorite Exercises:</Text>
                      <Text style={styles.sectionContent}>
                        {additionalInfo.favoriteExercises.join(", ")}
                      </Text>
                    </>
                )}
            {displaySettings.gym_interests && additionalInfo.gym_interests.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Gym Interests:</Text>
                  <Text style={styles.sectionContent}>
                    {additionalInfo.gym_interests.join(', ')}
                  </Text>
                </>
            )}
          </View>
        </ScrollView>
    );
  };

  return (
      <TouchableWithoutFeedback onPress={dismissSuggestions}>
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView contentContainerStyle={styles.contentContainer}>
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
            {user ? (
                <>
                  {renderProfile()}
                  <View style={styles.postsContainer}>
                    {posts.length > 0 ? (
                        posts.map((post, index) => (
                            <View key={index} style={styles.postWrapper}>
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
                </>
            ) : (
                <View style={styles.authContainer}>
                  <Text style={styles.pageHeading}>
                    {signingUp ? "Create Account" : "Log In"}
                  </Text>
                  <View style={styles.formContainer}>
                    {signingUp ? (
                        <>
                          {step === 1 && (
                              <View>
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
                                      !isStepFourComplete && styles.disabledButton,
                                    ]}
                                    onPress={isStepFourComplete ? handleSignUp : null}
                                    disabled={!isStepFourComplete}
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
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
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
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 15,
  },
  sectionContent: {
    fontSize: 16,
    color: "#333",
    marginTop: 5,
  },
  postsContainer: {
    width: "100%",
    paddingTop: 50,
  },
  postWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  card: {
    flex: 1,
    marginHorizontal: 5,
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
});