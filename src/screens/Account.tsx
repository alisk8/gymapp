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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { firebase_auth, db } from "../../firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  User,
} from "firebase/auth";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import useMarkedDates from "../../hooks/setMarkedDates";

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
  followers: string[];
  following: string[];
};

export default function Account({ navigation }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [signingUp, setSigningUp] = useState(false);
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
    followers: [],
    following: [],
  });
  const [showMenu, setShowMenu] = useState(false);

  const { clearMarkedDates } = useMarkedDates(); // use the custom hook

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

  const signUp = async () => {
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
      clearMarkedDates(); // clear marked dates upon signup
    } catch (error) {
      console.error("Signup Error:", error);
      Alert.alert("Error", "Error creating account");
    }
  };

  const handleSignOut = async () => {
    await auth.signOut();
    setUser(null);
    clearMarkedDates(); // clear marked dates upon sign out
  };

  const handleFieldUpdate = (field: string, value: any) => {
    setAdditionalInfo((prevInfo) => ({
      ...prevInfo,
      [field]: value,
    }));
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

  return (
    <ScrollView style={styles.container}>
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
        </View>
      )}
      {!user && (
        <View style={styles.profileContainer}>
          <Text style={styles.title}>{signingUp ? "Sign Up" : "Log In"}</Text>
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
                placeholder="Height (e.g., 6'1)"
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
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 15,
  },
  settingsIcon: {
    padding: 10,
    marginRight: 10,
  },
  menu: {
    position: "absolute",
    top: 50,
    right: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    zIndex: 10,
  },
  menuItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  menuItemText: {
    fontSize: 16,
  },
  profileContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    marginVertical: 10,
  },
  statsText: {
    marginHorizontal: 20,
    fontSize: 16,
    fontWeight: "bold",
  },
  bio: {
    fontSize: 16,
    fontStyle: "italic",
    textAlign: "center",
    marginVertical: 10,
    paddingHorizontal: 20,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginVertical: 10,
  },
  chip: {
    backgroundColor: "#b1b6bd",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 15,
    margin: 5,
  },
  chipText: {
    color: "#fff",
    fontSize: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  input: {
    width: "90%",
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
    width: "90%",
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
});
