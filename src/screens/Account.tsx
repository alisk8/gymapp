import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  Alert,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { firebase_auth, db } from "../../firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  UserCredential,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import useMarkedDates from "../../hooks/setMarkedDates";

type AdditionalInfo = {
  firstName: string;
  lastName: string;
  height: string;
  weight: string;
  age: string;
  sex: string;
  gym_interests: string[];
};

export default function Account({ navigation }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<UserCredential | null>(null);
  const [signingUp, setSigningUp] = useState(false);
  const [additionalInfo, setAdditionalInfo] = useState<AdditionalInfo>({
    firstName: "",
    lastName: "",
    height: "",
    weight: "",
    age: "",
    sex: "",
    gym_interests: [],
  });

  const { clearMarkedDates } = useMarkedDates(); // use the custom hook

  const auth = firebase_auth;

  useEffect(() => {
    if (!user) {
      // Reset the form when user logs out
      setAdditionalInfo({
        firstName: "",
        lastName: "",
        height: "",
        weight: "",
        age: "",
        sex: "",
        gym_interests: [],
      });
    }
  }, [user]);

  const handleLogin = async () => {
    try {
      const response = await signInWithEmailAndPassword(
        auth,
        username,
        password
      );
      setUser(response);
      fetchUserData(response.user.uid);
      Alert.alert("Success", "Logged in Successfully");
      navigation.navigate("Feed");
    } catch (error: any) {
      console.error("Login Error:", error);
      Alert.alert("Error", "User Not Found");
    }
  };

  const fetchUserData = async (uid: string) => {
    const docRef = doc(db, "userProfiles", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as AdditionalInfo;
      setAdditionalInfo(data);
    } else {
      console.log("No such document!");
    }
  };

  const signUp = async () => {
    try {
      const response = await createUserWithEmailAndPassword(
        auth,
        username,
        password
      );
      setUser(response);
      const userProfileRef = doc(db, "userProfiles", response.user.uid);
      await setDoc(userProfileRef, {
        email: username,
        ...additionalInfo,
      });
      Alert.alert("Success", "Account Created");
      navigation.navigate("Feed");
      clearMarkedDates(); // clear marked dates upon signup
    } catch (error: any) {
      console.error("Signup Error:", error);
      Alert.alert("Error", "Error creating account");
    }
  };

  const handleSignOut = () => {
    setUser(null);
    clearMarkedDates(); // clear marked dates upon sign out
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          {!user ? (
            <>
              <Text style={styles.title}>
                {signingUp ? "Sign Up" : "Log In"}
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your username"
                value={username}
                onChangeText={setUsername}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              {signingUp && (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="First Name"
                    value={additionalInfo.firstName}
                    onChangeText={(text) =>
                      setAdditionalInfo({ ...additionalInfo, firstName: text })
                    }
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Last Name"
                    value={additionalInfo.lastName}
                    onChangeText={(text) =>
                      setAdditionalInfo({ ...additionalInfo, lastName: text })
                    }
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Height (e.g., 6'1\)"
                    value={additionalInfo.height}
                    onChangeText={(text) =>
                      setAdditionalInfo({ ...additionalInfo, height: text })
                    }
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Weight (lbs)"
                    value={additionalInfo.weight}
                    onChangeText={(text) =>
                      setAdditionalInfo({ ...additionalInfo, weight: text })
                    }
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Age"
                    value={additionalInfo.age}
                    onChangeText={(text) =>
                      setAdditionalInfo({ ...additionalInfo, age: text })
                    }
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Sex"
                    value={additionalInfo.sex}
                    onChangeText={(text) =>
                      setAdditionalInfo({ ...additionalInfo, sex: text })
                    }
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Gym Interests (comma-separated)"
                    value={additionalInfo.gym_interests.join(", ")}
                    onChangeText={(text) =>
                      setAdditionalInfo({
                        ...additionalInfo,
                        gym_interests: text.split(", "),
                      })
                    }
                  />
                </>
              )}
              <TouchableOpacity
                style={styles.button}
                onPress={signingUp ? signUp : handleLogin}
              >
                <Text style={styles.buttonText}>
                  {signingUp ? "Submit Sign Up" : "Log In"}
                </Text>
              </TouchableOpacity>
              {!signingUp && (
                <TouchableOpacity onPress={() => setSigningUp(true)}>
                  <Text style={styles.switchText}>
                    Don't have an account? Sign Up
                  </Text>
                </TouchableOpacity>
              )}
              {signingUp && (
                <TouchableOpacity onPress={() => setSigningUp(false)}>
                  <Text style={styles.switchText}>
                    Already have an account? Log In
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              <Text style={styles.userInfo}>
                Welcome, {additionalInfo.firstName} {additionalInfo.lastName}
              </Text>
              <TouchableOpacity
                style={styles.button}
                onPress={() =>
                  navigation.navigate("PersonalDetails", { additionalInfo })
                }
              >
                <Text style={styles.buttonText}>Personal Details</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={handleSignOut}>
                <Text style={styles.buttonText}>Sign Out</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  input: {
    width: "100%",
    height: 50,
    padding: 10,
    marginBottom: 10,
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
  switchText: {
    marginTop: 20,
    color: "#007BFF",
    fontSize: 16,
  },
  userInfo: {
    fontSize: 18,
    marginBottom: 20,
  },
  label: {
    alignSelf: "stretch",
    marginLeft: 20,
    color: "#333",
    fontSize: 16,
    fontWeight: "bold",
  },
});
