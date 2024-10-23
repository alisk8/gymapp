import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Switch,
  Alert,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { db, firebase_auth, storage } from "../../../firebaseConfig";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import {
  doc,
  setDoc,
  collection,
  getDocs,
  updateDoc,
  arrayUnion,
  query,
  where,
} from "@firebase/firestore";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import exercisePickerModal from "../WorkoutLog/ExercisePickerModal";
import ExercisePickerModal from "../WorkoutLog/ExercisePickerModal";
import { FontAwesome5 } from '@expo/vector-icons';
import EditTemplateScreenUpdated from "../ProgressLog/EditTemplateScreenUpdated";


const CreateCommunity = ({ route }) => {
  const {community, isEdit, communityId} = route.params || {};
  const communityNamePlaceholder = community? community.name : "";
  const communityDescriptionPlaceholder = community? community.description : "";
  const communityLeaderboardPlaceholder = community? community.leaderboardExercises : ["Consistency"];
  console.log('is edit', isEdit);
  const [communityName, setCommunityName] = useState(communityNamePlaceholder);
  const [communityDescription, setCommunityDescription] = useState(communityDescriptionPlaceholder);
  const [isPrivate, setIsPrivate] = useState(false);
  const [communities, setCommunities] = useState([]);
  const [image, setImage] = useState(community?.imageUrl || null);
  const [bannerImage, setBannerImage] = useState(community?.bannerImageUrl || null);
  const navigation = useNavigation();
  const [leaderboardExercises, setLeaderboardExercises] = useState(communityLeaderboardPlaceholder);
  const [pickerModalVisible, setPickerModalVisible] = useState(false);



  const handleCreate = async () => {
    if (!firebase_auth.currentUser) {
      alert("You must be logged in to add a community.");
      return;
    }

    const userId = firebase_auth.currentUser.uid;

    if (!communityName.trim()) {
      Alert.alert("Validation Error", "Please enter a community name.");
      return;
    }


    try {
      if (!isEdit) {
        // Check if community name already exists
        const communityQuery = query(
            collection(db, "communities"),
            where("name", "==", communityName)
        );
        const querySnapshot = await getDocs(communityQuery);

        if (!querySnapshot.empty) {
          Alert.alert(
              "Validation Error",
              "A community with this name already exists. Please choose a different name."
          );
          return;
        }
      }

      const newCommunityRef = doc(collection(db, "communities"));
      const newCommunityId = newCommunityRef.id;

      let imageUrl = null;
      if (image) {
        imageUrl = await uploadImage(image, "communityProfilePics");
      }

      let bannerImageUrl = null;
      if (bannerImage) {
        bannerImageUrl = await uploadImage(bannerImage, "communityBanners");
      }


      if (isEdit){

        console.log('community exercises', leaderboardExercises);
        console.log('community exercises', communityName);
        console.log('community description', communityDescription);
        console.log('community description', isPrivate);
        console.log(community.id);


        const communityData = {
          name: communityName,
          description: communityDescription || "",
          private: isPrivate,
          leaderboardExercises: leaderboardExercises
        }

        await updateDoc(doc(db, "communities", communityId), communityData);
        console.log('editing mode ');
        Alert.alert("Event updated successfully.");
      }else{

        const communityData = {
          name: communityName,
          description: communityDescription || "",
          private: isPrivate,
          owner: userId,
          members: [userId],
          imageUrl: imageUrl || "", // Add image URL to the community document
          bannerImageUrl: bannerImageUrl || "",
          leaderboardExercises: leaderboardExercises
        }

        await setDoc(newCommunityRef, communityData);

        // Add the new community ID to the user's document
        const userRef = doc(db, "userProfiles", userId);
        await updateDoc(userRef, {
          communities: arrayUnion(newCommunityId),
        });
        Alert.alert("Success", "Community created successfully!");

      }

      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Failed to create community.");
      console.error("Error with community: ", error);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Ensure the aspect ratio is 1:1 for a square image
      quality: 1,
    });

    if (!result.canceled) {
      console.log("Image URI:", result.assets[0].uri); // Log the selected image URI
      setImage(result.assets[0].uri);
    }
  };

  const pickBannerImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9], // Aspect ratio for a banner image
      quality: 1,
    });

    if (!result.canceled) {
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 1280, height: 720 } }],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );
      console.log("Banner Image URI:", manipulatedImage.uri); // Log the selected image URI
      setBannerImage(manipulatedImage.uri);
    }
  };

  const generateUniqueFilename = () => {
    const timestamp = Date.now();
    const randomNumber = Math.floor(Math.random() * 1000000);
    return `${timestamp}_${randomNumber}`;
  };

  const fetchCommunities = async () => {
    try {
      const communitiesSnapshot = await getDocs(collection(db, "communities"));
      const communitiesList = communitiesSnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
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
            resize:
              folder === "communityImages"
                ? { width: 200, height: 200 }
                : { width: 1280, height: 720 },
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

  const addExercise = async (selectedExercise, parentExerciseIndex = null) => {
    setLeaderboardExercises([...leaderboardExercises, selectedExercise]);
    setPickerModalVisible(false);
  };

  const deleteExercise = (index) => {
    const updatedExercises = leaderboardExercises.filter((_, i) => i !== index);
    setLeaderboardExercises(updatedExercises);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}> {isEdit? 'Edit': 'Create a New'} Community</Text>
      <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <Text style={styles.addImageText}>{isEdit?'Edit':'Pick an'} Image</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.bannerPickerButton}
        onPress={pickBannerImage}
      >
        {bannerImage ? (
          <Image source={{ uri: bannerImage }} style={styles.bannerImage} />
        ) : (
          <Text style={styles.addImageText}>{isEdit?'Edit':'Pick a'} Banner Image</Text>
        )}
      </TouchableOpacity>
      <TextInput
        style={styles.input}
        placeholder={isEdit ? "Edit Name":"Name your community"}
        value={communityName}
        onChangeText={setCommunityName}
      />
      <TextInput
        style={styles.input}
        placeholder={isEdit? "Edit description": "Describe your community"}
        value={communityDescription}
        onChangeText={setCommunityDescription}
      />

      <Text style={styles.leaderboardHeading}>Leaderboards</Text>

      <ScrollView style={styles.leaderboardScroll}>
        {leaderboardExercises.length > 0 ? (
            leaderboardExercises.map((exercise, index) => (
                <View key={index} style={styles.exerciseItem}>
                  <Text style={styles.exerciseName}>{exercise}</Text>
                  <FontAwesome5
                      name="times"
                      onPress={() => deleteExercise(index)}
                      size={20}
                      color="black"
                      style={styles.deleteExerciseButton}
                  />
                </View>
            ))
        ) : (
            <Text style={styles.noExerciseText}>No exercises added yet.</Text>
        )}
      </ScrollView>

      <TouchableOpacity
          style={styles.addExerciseButton}
          onPress={() => setPickerModalVisible(true)}
      >
        <Text style={styles.addExerciseText}>Add New Exercise</Text>
      </TouchableOpacity>

      <View style={styles.switchContainer}>
        <Text style={styles.label}>Private Group</Text>
        <Switch
          trackColor={{ false: "#767577", true: "#81b0ff" }}
          thumbColor={isPrivate ? "#f5dd4b" : "#f4f3f4"}
          ios_backgroundColor="#3e3e3e"
          onValueChange={() => setIsPrivate((previousState) => !previousState)}
          value={isPrivate}
        />
      </View>
      <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
        <Text style={styles.createButtonText}>{isEdit? "Edit": "Create"} Group</Text>
      </TouchableOpacity>

      <ExercisePickerModal
          visible={pickerModalVisible}
          onClose={() => setPickerModalVisible(false)}
          onSelectExercise={(exerciseName) => addExercise(exerciseName)}
      />
    </ScrollView>
  );
};

export default CreateCommunity;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
    padding: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
    textAlign: "center",
  },
  input: {
    height: 40,
    marginVertical: 12,
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    borderColor: "#ccc",
    backgroundColor: "#fff",
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 20,
  },
  label: {
    fontSize: 18,
    color: "#333",
  },
  createButton: {
    backgroundColor: '#016e03',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: "center",
    marginVertical: 10,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  communityItem: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginVertical: 8,
    borderColor: "#ddd",
    borderWidth: 1,
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
  imagePickerButton: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
    alignSelf: "center",
    marginBottom: 20,
  },
  addImageText: {
    color: "#6c757d",
    textAlign: "center",
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 8,
    position: "absolute",
    top: 0,
    left: 0,
  },
  bannerPickerButton: {
    width: "100%",
    height: 225, // Adjust the height to accommodate 16:9 aspect ratio
    borderWidth: 2,
    borderColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
    marginBottom: 20,
  },
  bannerImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    position: "absolute",
    top: 0,
    left: 0,
  },
  communityImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: "center",
    marginBottom: 10,
  },
  addExerciseButton: {
    backgroundColor: "#016e03",
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginHorizontal: 50,
    borderRadius: 25,
    alignItems: "center",
    marginVertical: 10,
  },
  addExerciseText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  leaderboardHeading: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    color: "#333",
  },
  leaderboardScroll: {
    maxHeight: 150, // Set a max height for the scroll area
    marginBottom: 10,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    borderColor: "#ddd",
    borderWidth: 1,
  },
  exerciseItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  exerciseName: {
    fontSize: 16,
    color: "#333",
  },
  noExerciseText: {
    fontSize: 14,
    color: "#999",
  },
  deleteExerciseButton: {
    borderRadius: 5,
    zIndex: 1, // Ensure it stays above other elements
  },
});
