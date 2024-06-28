import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { firebase_auth, db } from "../../firebaseConfig";
import { doc, collection, getDocs } from "firebase/firestore";

type RouteParams = {
  TrackedExercise: {
    exercise: {
      id: string;
      name: string;
    };
  };
};

const TrackedExercise = () => {
  const route = useRoute<RouteProp<RouteParams, "TrackedExercise">>();
  const { exercise } = route.params;
  const [exerciseData, setExerciseData] = useState([]);

  useEffect(() => {
    fetchExerciseData();
  }, []);

  const fetchExerciseData = async () => {
    const user = firebase_auth.currentUser;
    if (user) {
      const uid = user.uid;
      const userRef = doc(db, "userProfiles", uid);
      const exerciseRef = collection(
        userRef,
        "trackedExercises",
        exercise.id,
        "data"
      );
      const snapshot = await getDocs(exerciseRef);
      const data = snapshot.docs.map((doc) => doc.data());
      setExerciseData(data);
    } else {
      Alert.alert("Error", "No user is logged in");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>{exercise.name}</Text>
      {exerciseData.length > 0 ? (
        exerciseData.map((data, index) => (
          <View key={index} style={styles.dataCard}>
            <Text style={styles.dataText}>
              Date: {new Date(data.date.seconds * 1000).toLocaleDateString()}
            </Text>
            <Text style={styles.dataText}>Reps: {data.reps}</Text>
            <Text style={styles.dataText}>Weight: {data.weight}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.noDataText}>
          No data available for this exercise.
        </Text>
      )}
    </ScrollView>
  );
};

export default TrackedExercise;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  heading: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  dataCard: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    marginVertical: 5,
  },
  dataText: {
    fontSize: 16,
    color: "#555",
  },
  noDataText: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginTop: 20,
  },
});
