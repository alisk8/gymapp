import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  Alert,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  Switch,
  FlatList, ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import {db, storage} from "../../firebaseConfig";
import {
  doc,
  updateDoc,
  getDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";
import {getDownloadURL, ref as storageRef, uploadBytes} from "firebase/storage";

type AdditionalInfo = {
  firstName: string;
  lastName: string;
  height: string;
  weight: string;
  age: string;
  sex: string;
  gym_interests: string;
  bio: string;
  profilePicture: string;
  favoriteExercises: string[];
  experienceLevel: string;
  favoriteGym: string;
  location: string;
  displaySettings: Record<string, boolean>;
};

const defaultDisplaySettings = {
  height: true,
  weight: true,
  age: true,
  sex: true,
  gym_interests: true,
  bio: true,
  favoriteExercises: true,
  experienceLevel: true,
  favoriteGym: true,
  location: true,
};

export default function Settings({ route, navigation }) {
  const { userId } = route.params;
  const [additionalInfo, setAdditionalInfo] = useState<AdditionalInfo>({
    firstName: "",
    lastName: "",
    height: "",
    weight: "",
    age: "",
    sex: "",
    gym_interests: "",
    bio: "",
    profilePicture: "",
    favoriteExercises: [],
    experienceLevel: "",
    favoriteGym: "",
    location: "",
    displaySettings: { ...defaultDisplaySettings },
  });
  const [tempInfo, setTempInfo] = useState<AdditionalInfo>({
    firstName: "",
    lastName: "",
    height: "",
    weight: "",
    age: "",
    sex: "",
    gym_interests: "",
    bio: "",
    profilePicture: "",
    favoriteExercises: [],
    experienceLevel: "",
    favoriteGym: "",
    location: "",
    displaySettings: { ...defaultDisplaySettings },
  });
  const [exerciseInput, setExerciseInput] = useState("");
  const [exerciseSuggestions, setExerciseSuggestions] = useState<string[]>([]);
  const [exercisePresets, setExercisePresets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const fetchData = async () => {
      try {
        await fetchUserData();
        await fetchExercisePresets();
      } catch (error) {
        console.error("Error fetching data:", error);
      }finally{
        setLoading(false);
      }
    };

    fetchData();
    return()=>{

    }
  }, []);

  useEffect(() => {
    // Log after the state is updated
    console.log('exercisePresets in effect:', exercisePresets);
  }, [exercisePresets]);

  useEffect(()=>{
    console.log('userData', tempInfo);
  }, [tempInfo]);
  const fetchUserData = async () => {
    try {
      const docRef = doc(db, "userProfiles", userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as AdditionalInfo;
        setAdditionalInfo({
          ...data,
          displaySettings: {
            ...defaultDisplaySettings,
            ...data.displaySettings,
          },
        });
        setTempInfo({
          ...data,
          displaySettings: {
            ...defaultDisplaySettings,
            ...data.displaySettings,
          },
        });
      } else {
        console.log("No such document!");
      }
    } catch (error) {
      console.error("Error fetching user data: ", error);
    }
  };

  const fetchExercisePresets = async () => {
    try {
      const presetsRef = collection(db, "exercisePresets");
      const snapshot = await getDocs(presetsRef);
      const exercises = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
      }));
      setExercisePresets(exercises);
    } catch (error) {
      console.error("Error fetching exercise presets: ", error);
    }
  };

  const handleUpdateField = (field: string, value: any) => {
    setTempInfo((prevInfo) => ({ ...prevInfo, [field]: value }));
  };

  const handleToggleDisplaySetting = (field: string) => {
    setTempInfo((prevInfo) => ({
      ...prevInfo,
      displaySettings: {
        ...prevInfo.displaySettings,
        [field]: !prevInfo.displaySettings[field],
      },
    }));
  };

  const timeout = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const confirmUpdateProfile = async () => {
    Alert.alert(
      "Confirm Update",
      "Are you sure you want to update your profile?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "OK",
          onPress: async () => {
            try {
              const docRef = doc(db, "userProfiles", userId);

              await updateDoc(docRef, tempInfo);
              setAdditionalInfo(tempInfo);
              Alert.alert("Success", "Profile updated successfully");
              navigation.goBack();
            } catch (error) {
              console.error("Error updating document: ", error);
              Alert.alert("Error", "Error updating profile. Please try again.");
            }
          },
        },
      ]
    );
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

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 4],
      quality: 1,
    });

    if (!result.canceled) {
      const updatedProfilePicture = await uploadImage(result.assets[0].uri, 'profilePictures');
      handleUpdateField("profilePicture", updatedProfilePicture);
    }
  };

  const handleExerciseInput = (text: string) => {
    setExerciseInput(text);
    const suggestions = exercisePresets
      .filter((exercise) =>
        exercise.name.toLowerCase().includes(text.toLowerCase())
      )
      .map((exercise) => exercise.name);
    setExerciseSuggestions(suggestions);
  };

  const handleAddExercise = (exercise: string) => {
    if (!tempInfo.favoriteExercises.includes(exercise)) {
      handleUpdateField("favoriteExercises", [
        ...tempInfo.favoriteExercises,
        exercise,
      ]);
      setExerciseInput("");
      setExerciseSuggestions([]);
    }
  };

  const handleRemoveExercise = (exercise: string) => {
    const updatedExercises = tempInfo.favoriteExercises.filter(
      (ex) => ex !== exercise
    );
    handleUpdateField("favoriteExercises", updatedExercises);
  };

  const displayLabels = {
    height: "Show Height on Profile",
    weight: "Show Weight on Profile",
    age: "Show Age on Profile",
    sex: "Show Sex on Profile",
    gym_interests: "Show Gym Interests on Profile",
    bio: "Show Bio on Profile",
    favoriteExercises: "Show Favorite Exercises on Profile",
    experienceLevel: "Show Experience Level on Profile",
    favoriteGym: "Show Favorite Gym on Profile",
    location: "Show Location on Profile",
  };

  if (loading) {
    return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007BFF" />
        </View>
    );
  }

  if(!loading) {
    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoidingView}
        >
          <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Edit Profile</Text>
            <TouchableOpacity onPress={pickImage}>
              {tempInfo.profilePicture ? (
                  <Image
                      source={{uri: tempInfo.profilePicture}}
                      style={styles.profileImage}
                  />
              ) : (
                  <Text style={styles.uploadText}>Upload Profile Picture</Text>
              )}
            </TouchableOpacity>
            {[
              {label: "First Name", field: "firstName"},
              {label: "Last Name", field: "lastName"},
              {label: "Height (e.g., 6'1\")", field: "height"},
              {label: "Weight (lbs)", field: "weight", keyboardType: "numeric"},
              {label: "Age", field: "age", keyboardType: "numeric"},
              {label: "Sex", field: "sex"},
              {label: "Gym Interests (comma-separated)", field: "gym_interests"},
              {label: "Bio", field: "bio"},
              {label: "Experience Level", field: "experienceLevel"},
              {label: "Favorite Gym", field: "favoriteGym"},
              {label: "Location", field: "location"},
            ].map(({label, field, keyboardType}) => (
                <View key={field} style={styles.inputGroup}>
                  <View style={styles.labelContainer}>
                    <Text style={styles.label}>{label}</Text>
                    {field in tempInfo.displaySettings && (
                        <View style={styles.checkboxContainer}>
                          <Text style={styles.checkboxLabel}>
                            {displayLabels[field]}
                          </Text>
                          <Switch
                              value={tempInfo.displaySettings[field]}
                              onValueChange={() => handleToggleDisplaySetting(field)}
                          />
                        </View>
                    )}
                  </View>
                  <TextInput
                      style={styles.input}
                      placeholder={label}
                      value={tempInfo[field] || ""}
                      onChangeText={(text) => handleUpdateField(field, text)}
                  />
                </View>
            ))}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Favorite Exercises</Text>
                <View style={styles.checkboxContainer}>
                  <Text style={styles.checkboxLabel}>
                    {displayLabels["favoriteExercises"]}
                  </Text>
                  <Switch
                      value={tempInfo.displaySettings["favoriteExercises"]}
                      onValueChange={() =>
                          handleToggleDisplaySetting("favoriteExercises")
                      }
                  />
                </View>
              </View>
              <TextInput
                  style={styles.input}
                  placeholder="Add Exercise"
                  value={exerciseInput}
                  onChangeText={handleExerciseInput}
              />
              {exerciseSuggestions.length > 0 && (
                  <FlatList
                      data={exerciseSuggestions}
                      keyExtractor={(item) => item}
                      renderItem={({item}) => (
                          <TouchableOpacity
                              style={styles.suggestion}
                              onPress={() => handleAddExercise(item)}
                          >
                            <Text>{item}</Text>
                          </TouchableOpacity>
                      )}
                  />
              )}
              <View style={styles.selectedExercisesContainer}>
                {Array.isArray(tempInfo.favoriteExercises) && tempInfo.favoriteExercises.map((exercise) => (
                    <View key={exercise} style={styles.selectedExercise}>
                      <Text>{exercise}</Text>
                      <TouchableOpacity
                          onPress={() => handleRemoveExercise(exercise)}
                      >
                        <Ionicons name="close" size={16} color="black"/>
                      </TouchableOpacity>
                    </View>
                ))}
              </View>
            </View>
            <TouchableOpacity style={styles.button} onPress={confirmUpdateProfile}>
              <Text style={styles.buttonText}>Update Profile</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
    );
  }
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  inputGroup: {
    width: "100%",
    marginBottom: 15,
  },
  labelContainer: {
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  input: {
    width: "100%",
    height: 50,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
    borderRadius: 5,
    fontSize: 16,
  },
  button: {
    width: "100%",
    height: 50,
    backgroundColor: "#007BFF",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 5,
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 20,
  },
  uploadText: {
    color: "#007BFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  checkboxContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  checkboxLabel: {
    fontSize: 14,
    marginRight: 10,
    color: "#333",
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
