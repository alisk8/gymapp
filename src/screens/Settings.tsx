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
  KeyboardTypeOptions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { firebase_auth, db } from "../../firebaseConfig";
import { doc, updateDoc, getDoc } from "firebase/firestore";

type AdditionalInfo = {
  firstName: string;
  lastName: string;
  height: string;
  weight: string;
  age: string;
  sex: string;
  gym_interests: string[];
  bio: string;
  profilePicture: string;
};

export default function Settings({ route, navigation }) {
  const { userId, onFieldUpdate } = route.params;
  const [additionalInfo, setAdditionalInfo] = useState<AdditionalInfo>({
    firstName: "",
    lastName: "",
    height: "",
    weight: "",
    age: "",
    sex: "",
    gym_interests: [],
    bio: "",
    profilePicture: "",
  });
  const [tempInfo, setTempInfo] = useState<AdditionalInfo>({
    firstName: "",
    lastName: "",
    height: "",
    weight: "",
    age: "",
    sex: "",
    gym_interests: [],
    bio: "",
    profilePicture: "",
  });

  useEffect(() => {
    const fetchUserData = async () => {
      const docRef = doc(db, "userProfiles", userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as AdditionalInfo;
        setAdditionalInfo(data);
        setTempInfo(data);
      } else {
        console.log("No such document!");
      }
    };

    fetchUserData();
  }, [userId]);

  const handleUpdateField = (field: string, value: any) => {
    setTempInfo((prevInfo) => ({ ...prevInfo, [field]: value }));
  };

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
              Object.keys(tempInfo).forEach((field) => {
                onFieldUpdate(field, tempInfo[field]);
              });
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

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 4],
      quality: 1,
    });

    if (!result.canceled) {
      const updatedProfilePicture = result.assets[0].uri;
      handleUpdateField("profilePicture", updatedProfilePicture);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>
      <TouchableOpacity onPress={pickImage}>
        {tempInfo.profilePicture ? (
          <Image
            source={{ uri: tempInfo.profilePicture }}
            style={styles.profileImage}
          />
        ) : (
          <Text style={styles.uploadText}>Upload Profile Picture</Text>
        )}
      </TouchableOpacity>
      {[
        { label: "First Name", field: "firstName" },
        { label: "Last Name", field: "lastName" },
        { label: "Height (e.g., 6'1)", field: "height" },
        { label: "Weight (lbs)", field: "weight" },
        { label: "Age", field: "age", keyboardType: "numeric" },
        { label: "Sex", field: "sex" },
        { label: "Gym Interests (comma-separated)", field: "gym_interests" },
        { label: "Bio", field: "bio" },
      ].map(({ label, field, keyboardType }) => (
        <View key={field} style={styles.inputGroup}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            style={styles.input}
            placeholder={label}
            value={
              field === "gym_interests"
                ? tempInfo[field].join(", ")
                : tempInfo[field]
            }
            onChangeText={(text) => {
              const value = field === "gym_interests" ? text.split(", ") : text;
              handleUpdateField(field, value);
            }}
            keyboardType={keyboardType as KeyboardTypeOptions}
          />
        </View>
      ))}
      <TouchableOpacity style={styles.button} onPress={confirmUpdateProfile}>
        <Text style={styles.buttonText}>Update Profile</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
});
