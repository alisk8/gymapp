import React, { useState } from "react";
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert
} from "react-native";
import { firebase_auth, db } from "../../../firebaseConfig";
import { doc, collection, addDoc, Timestamp } from "firebase/firestore";
import {getDocs, query, setDoc, where} from "@firebase/firestore";

const EditExerciseModal = ({
                               isVisible,
                               onClose,
                               selectedExercise,
                               latestAttempt,
                               refreshTrackedExercises,
                           }) => {
    const [weight, setWeight] = useState(latestAttempt?.weight || "");
    const [reps, setReps] = useState(latestAttempt?.reps || "");
    const [dropSets, setDropSets] = useState(latestAttempt?.dropSets || []);
    const [weightUnit, setWeightUnit] = useState(latestAttempt?.weightUnit || "lbs");
    const [repsUnit, setRepsUnit] = useState(latestAttempt?.repsUnit || "reps");

    const toggleWeightUnit = () => {
        setWeightUnit((prevUnit) => (prevUnit === "lbs" ? "kgs" : "lbs"));
    };

    const camelCase = (str) => {
        return str
            .replace(/\s(.)/g, function (match, group1) {
                return group1.toUpperCase();
            })
            .replace(/\s/g, '')
            .replace(/^(.)/, function (match, group1) {
                return group1.toLowerCase();
            });
    };

    const saveExercise = async () => {
        if (
            weight === "" ||
            reps === ""
        ) {
            Alert.alert("Error", "Please fill in all info.");
            return;
        }

        const user = firebase_auth.currentUser;
        if (user) {
            const uid = user.uid;
            const userRef = doc(db, "userProfiles", uid);
            const exercisesRef = collection(userRef, "exercises");
            const exerciseId = camelCase(selectedExercise);
            const exerciseDocRef = doc(exercisesRef, exerciseId);


            if(!latestAttempt) {
                await setDoc(exerciseDocRef, {
                    name: selectedExercise,
                    id: exerciseId,
                    initializedAt: Timestamp.fromDate(new Date()),
                });
            }

            if (
                parseFloat(latestAttempt?.weight) === parseFloat(weight) &&
                parseInt(latestAttempt?.reps) === parseInt(reps)
            ) {
                Alert.alert("Error", "This entry is the same as your latest entry.");
                return;
            }

            const currentDate = new Date().toDateString();

            // Check if the date of the latest attempt is the same as the current date
            if (latestAttempt && latestAttempt.createdAt.toDate().toDateString() === currentDate) {
                Alert.alert("Error", "An entry for this exercise already exists today.");
                return;
            }


            //add entry
            const entriesRef = collection(exerciseDocRef, "entries");
            const newEntry = {
                weight: parseFloat(weight),
                reps: parseInt(reps),
                weightUnit: weightUnit,
                repsUnit: repsUnit,
                createdAt: Timestamp.fromDate(new Date()),
            };

            await addDoc(entriesRef, newEntry);
            Alert.alert("Success", "Saved successfully!");
            refreshTrackedExercises();
            onClose();
        } else {
            Alert.alert("Error", "No user is logged in");
        }
    };

    return (
        <Modal
            visible={isVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalHeading}>
                        Add Entry: {selectedExercise}
                    </Text>
                    <View style={styles.weightInputContainer}>
                        <TextInput
                            style={[styles.input, { flex: 1 }]}
                            placeholder="Enter Weight"
                            value={weight}
                            onChangeText={setWeight}
                            keyboardType="numeric"
                        />
                        <TouchableOpacity
                            style={styles.unitToggleButton}
                            onPress={toggleWeightUnit}
                        >
                            <Text style={styles.unitToggleText}>
                                {weightUnit}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter Reps"
                        value={reps}
                        onChangeText={setReps}
                        keyboardType="numeric"
                    />
                    {/* Additional fields for drop sets, units, etc. */}
                    <View style={styles.modalButtons}>
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={saveExercise}
                        >
                            <Text style={styles.modalButtonText}>Save</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={onClose}
                        >
                            <Text style={styles.modalButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default EditExerciseModal;

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalContent: {
        width: 300,
        padding: 20,
        backgroundColor: "#fff",
        borderRadius: 10,
    },
    modalHeading: {
        fontSize: 18,
        fontWeight: "bold",
        color: "black",
        textAlign: "center",
        marginBottom: 20,
    },
    input: {
        height: 40,
        borderColor: "#ccc",
        borderWidth: 1,
        marginBottom: 10,
        padding: 10,
        borderRadius: 5,
    },
    modalButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    modalButton: {
        backgroundColor: "black",
        padding: 10,
        borderRadius: 5,
        alignItems: "center",
        width: "48%",
    },
    modalButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    unitToggleButton: {
        backgroundColor: "black",
        padding: 10,
        borderRadius: 5,
        marginLeft: 10,
        marginBottom: 10,
    },
    unitToggleText: {
        color: "#fff",
        fontWeight: "bold",
    },
    weightInputContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
});
