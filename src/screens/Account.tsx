import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { firebase_auth, db } from "../../firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  User,
} from "firebase/auth";
import useMarkedDates from "../../hooks/setMarkedDates";
import Swiper from "react-native-swiper";
import {
  doc,
  getDocs,
  collection,
  onSnapshot,
  setDoc,
} from "firebase/firestore";

type AdditionalInfo = {
  firstName: string;
  lastName: string;
  height: string;
  weight: string;
  age: string;
  sex: string;
  location: string;
  gym_interests: string[];
  bio: string;
  profilePicture: string;
  followers: string[];
  following: string[];
  favoriteExercises: string;
  experienceLevel: string;
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
    favoriteExercises: "",
    experienceLevel: "",
  });
  const [showMenu, setShowMenu] = useState(false);
  const [posts, setPosts] = useState([]);

  const { clearMarkedDates } = useMarkedDates();

  const auth = firebase_auth;

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);
        const userRef = doc(db, "userProfiles", user.uid);
        const unsubscribeSnapshot = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            setAdditionalInfo(doc.data() as AdditionalInfo);
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
      alert("Passwords do not match!");
      return;
    }
    try {
      const response = await createUserWithEmailAndPassword(
        auth,
        username,
        password
      );
      setUser(response.user);
      const userProfileRef = doc(db, "userProfiles", response.user.uid);
      await setDoc(userProfileRef, {
        email: username,
        ...additionalInfo,
        followers: [],
        following: [],
      });
      Alert.alert("Success", "Account Created");
      navigation.navigate("Feed");
      clearMarkedDates();
    } catch (error) {
      console.error("Signup Error:", error);
      Alert.alert("Error", "Error creating account");
    }
  };

  const handleSignOut = async () => {
    await auth.signOut();
    setUser(null);
    clearMarkedDates();
  };

  const handlePostPress = (postIndex) => {
    navigation.navigate("PostDetails", { posts, postIndex, userId: user.uid });
  };

  const handleFieldUpdate = (field: string, value: any) => {
    setAdditionalInfo((prevInfo) => ({
      ...prevInfo,
      [field]: value,
    }));
  };

  const handleNextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const handlePrevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const isStepOneComplete = additionalInfo.firstName && additionalInfo.lastName;
  const isStepTwoComplete = username && password && confirmPassword;
  const isStepThreeComplete =
    additionalInfo.location &&
    additionalInfo.favoriteExercises &&
    additionalInfo.experienceLevel;

  const toggleMenu = () => {
    setShowMenu((prev) => !prev);
  };

  const navigateToList = (type: "followers" | "following") => {
    navigation.navigate("UserList", {
      userIds: additionalInfo[type],
      title: type.charAt(0).toUpperCase() + type.slice(1),
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.headerContainer}>
          {user && (
            <TouchableOpacity style={styles.settingsIcon} onPress={toggleMenu}>
              <Ionicons name="settings-outline" size={24} color="#007BFF" />
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
                  userId: user.uid,
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
        {user && (
          <View style={styles.profileContainer}>
            {additionalInfo.profilePicture ? (
              <Image
                source={{ uri: additionalInfo.profilePicture }}
                style={styles.profileImage}
              />
            ) : (
              <Image
                source={require("../../assets/placeholder.jpeg")}
                style={styles.profileImage}
              />
            )}
            <Text style={styles.name}>
              {additionalInfo.firstName} {additionalInfo.lastName}
            </Text>
            <View style={styles.statsContainer}>
              <TouchableOpacity onPress={() => navigateToList("followers")}>
                <Text style={styles.statsText}>
                  {additionalInfo.followers?.length} Followers
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigateToList("following")}>
                <Text style={styles.statsText}>
                  {additionalInfo.following?.length} Following
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.bio}>{additionalInfo.bio}</Text>
            <View style={styles.chipsContainer}>
              {additionalInfo.gym_interests.map((interest, index) => (
                <View key={index} style={styles.chip}>
                  <Text style={styles.chipText}>{interest}</Text>
                </View>
              ))}
            </View>

            <View style={styles.postsContainer}>
              {posts?.length > 0 ? (
                posts.map((post, index) => (
                  <View key={index} style={styles.postWrapper}>
                    {index % 3 === 0 && <View style={styles.row} />}
                    <TouchableOpacity
                      style={styles.card}
                      onPress={() => handlePostPress(index)}
                    >
                      {post.type === "workout" ? (
                        <View style={styles.imageContainer}>
                          <Image
                            source={{
                              uri: "https://cdn.pixabay.com/photo/2018/05/28/13/14/dumbell-3435990_1280.jpg",
                            }}
                            style={styles.postImage}
                          />
                          <View style={styles.overlay}>
                            <Text style={styles.workoutTitle}>Workout</Text>
                          </View>
                        </View>
                      ) : post.mediaUrls ? (
                        <Swiper
                          autoplay
                          autoplayTimeout={4}
                          showsPagination={false}
                          style={styles.swiperContainer}
                          removeClippedSubviews={false}
                        >
                          {post.mediaUrls.map((url, i) => (
                            <View key={i} style={styles.slide}>
                              <Image
                                source={{ uri: url }}
                                style={styles.postImage}
                              />
                            </View>
                          ))}
                        </Swiper>
                      ) : (
                        <View style={styles.imageContainer}>
                          <Image
                            source={{
                              uri: "https://cdn.pixabay.com/photo/2017/06/23/19/17/muscle-2435161_1280.jpg",
                            }}
                            style={styles.postImage}
                          />
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>
                  No Posts. Start tracking your workouts today!
                </Text>
              )}
            </View>
          </View>
        )}

        {!user && (
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
                      <TextInput
                        placeholder="Location"
                        value={additionalInfo.location}
                        onChangeText={(text) =>
                          handleFieldUpdate("location", text)
                        }
                        style={styles.input}
                      />
                      <TextInput
                        placeholder="Favorite Exercise"
                        value={additionalInfo.favoriteExercises}
                        onChangeText={(text) =>
                          handleFieldUpdate("favoriteExercises", text)
                        }
                        style={styles.input}
                      />
                      <Text style={styles.label}>Experience Level:</Text>
                      <View style={styles.experienceLevelContainer}>
                        <TouchableOpacity
                          style={[
                            styles.experienceButton,
                            additionalInfo.experienceLevel === "Beginner" &&
                              styles.selectedExperienceButton,
                          ]}
                          onPress={() =>
                            handleFieldUpdate("experienceLevel", "Beginner")
                          }
                        >
                          <Text
                            style={[
                              styles.experienceButtonText,
                              additionalInfo.experienceLevel === "Beginner" &&
                                styles.selectedExperienceButtonText,
                            ]}
                          >
                            Beginner
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.experienceButton,
                            additionalInfo.experienceLevel === "Intermediate" &&
                              styles.selectedExperienceButton,
                          ]}
                          onPress={() =>
                            handleFieldUpdate("experienceLevel", "Intermediate")
                          }
                        >
                          <Text
                            style={[
                              styles.experienceButtonText,
                              additionalInfo.experienceLevel ===
                                "Intermediate" &&
                                styles.selectedExperienceButtonText,
                            ]}
                          >
                            Intermediate
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.experienceButton,
                            additionalInfo.experienceLevel === "Advanced" &&
                              styles.selectedExperienceButton,
                          ]}
                          onPress={() =>
                            handleFieldUpdate("experienceLevel", "Advanced")
                          }
                        >
                          <Text
                            style={[
                              styles.experienceButtonText,
                              additionalInfo.experienceLevel === "Advanced" &&
                                styles.selectedExperienceButtonText,
                            ]}
                          >
                            Advanced
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.button,
                          !isStepThreeComplete && styles.disabledButton,
                        ]}
                        onPress={isStepThreeComplete ? handleSignUp : null}
                        disabled={!isStepThreeComplete}
                      >
                        <Text style={styles.buttonText}>Create Account</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.button, styles.backButton]}
                        onPress={handlePrevStep}
                      >
                        <Text style={styles.buttonText}>Back</Text>
                      </TouchableOpacity>
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
                  <TouchableOpacity style={styles.button} onPress={handleLogin}>
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
  },
  settingsIcon: {
    marginRight: 15,
    marginTop: 10,
  },
  menu: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  menuItem: {
    padding: 10,
  },
  menuItemText: {
    fontSize: 16,
  },
  profileContainer: {
    alignItems: "center",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "60%",
    marginBottom: 10,
  },
  statsText: {
    fontSize: 16,
    fontWeight: "600",
  },
  bio: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 10,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 20,
  },
  chip: {
    backgroundColor: "#007BFF",
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 15,
    margin: 5,
  },
  chipText: {
    color: "#FFFFFF",
  },
  postsContainer: {
    width: "100%",
  },
  postWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
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
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 5,
  },
  workoutTitle: {
    color: "#FFFFFF",
    textAlign: "center",
  },
  swiperContainer: {
    height: 200,
  },
  slide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  button: {
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  switchContainer: {
    marginTop: 10,
  },
  switchText: {
    color: "#007BFF",
  },
  pageHeading: {
    fontSize: 30,
    marginBottom: 50,
  },
  label: {
    fontSize: 16,
    color: "#555",
    marginBottom: 10,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    alignItems: "center",
  },
  dropdownText: {
    fontSize: 16,
    color: "#333",
  },
  backButton: {
    marginTop: 10,
  },
  experienceLevelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  experienceButton: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    width: "30%",
    alignItems: "center",
  },
  selectedExperienceButton: {
    backgroundColor: "#007BFF",
  },
  experienceButtonText: {
    color: "#333",
  },
  selectedExperienceButtonText: {
    color: "#FFFFFF",
  },
  disabledButton: {
    backgroundColor: "#cccccc",
  },
});
