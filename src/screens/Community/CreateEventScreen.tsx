import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    Button,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TouchableWithoutFeedback, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import {db, firebaseApp} from '../../../firebaseConfig'; // Adjust the import path based on your project structure
import { collection, addDoc } from 'firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';
import GPSModal from '../../screens/Community/GPSModal';
import { Picker } from '@react-native-picker/picker';
import CustomPickerModal from "./CustomPickerModal";
import {getAuth, onAuthStateChanged} from "firebase/auth"; // Import the Picker component


const muscleTargets = ['Push', 'Pull', 'Legs', 'Upper Body', 'Lower Body', 'Full Body', 'Core', 'Abs', 'Arms', 'Chest', 'Back', 'Shoulders']; // Replace with your data source

const levels = ['Beginner', 'Intermediate', 'Advanced']; // Example levels
const trainingFocuses = ['Volume', 'Intensity', 'None']; // Example training focuses

const auth = getAuth(firebaseApp);

const useAuth = () => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUser(user);
            } else {
                setUser(null);
            }
        });

        return () => unsubscribe();
    }, []);

    return user;
};


const CreateEventScreen = ({ route, navigation }) => {
    const { communityId } = route.params;
    const [eventName, setEventName] = useState('');
    const [eventDescription, setEventDescription] = useState('');
    const [eventDate, setEventDate] = useState(new Date());
    const [eventTime, setEventTime] = useState(new Date());
    const [location, setLocation] = useState(null);
    const [locationModalVisible, setLocationModalVisible] = useState(false);
    const [workoutFocus, setWorkoutFocus] = useState('');
    const [level, setLevel] = useState('');
    const [trainingFocus, setTrainingFocus] = useState('');
    const [muscleTarget, setMuscleTarget] = useState('');
    const [maxPeople, setMaxPeople] = useState(null);


    const [levelPickerVisible, setLevelPickerVisible] = useState(false);
    const [trainingFocusPickerVisible, setTrainingFocusPickerVisible] = useState(false);
    const [muscleTargetPickerVisible, setMuscleTargetPickerVisible] = useState(false);

    const user = useAuth();


    const handleCreateEvent = async () => {

        if (maxPeople > 4){
            Alert.alert("no more than 4 people maximum!");
        }

        if (!eventDate || !eventTime || !location) {
            Alert.alert("Error", "Date, time, and location are required.");
            return;
        }

        // Auto-generate event name if empty and muscleTarget is filled
        if (!eventName && muscleTarget) {
            setEventName(`${muscleTarget} day`);
        }
        else{
            setEventName('Workout');
        }

        try {
            await addDoc(collection(db, "communities", communityId, "events"), {
                name: eventName,
                description: eventDescription,
                date: eventDate,
                time: eventTime,
                location: location,
                workoutFocus: workoutFocus || null,
                level: level || null,
                muscleTarget: muscleTarget || null,
                trainingFocus: trainingFocus || null,
                maxPeople: maxPeople,
                joinedUsers: [user?.uid],
                creator: user?.uid,
            });
            navigation.goBack(); // Go back to the previous screen after creating the event
        } catch (error) {
            console.error("Error creating event: ", error);
        }
    };

    useEffect(() => {
        navigation.setOptions({
            headerTitle: 'Lifting Session',
            headerLeft: () => (
                <Button style={styles.backButton} title="Cancel" onPress={() => navigation.goBack()} />
            ),
        });
    }, [navigation]);

    useEffect(() => {
        console.log("locationModalVisible:", locationModalVisible);
    }, [locationModalVisible]);


    const handleSelectLocation = (selectedLocation) => {
        setLocation(selectedLocation);
        setLocationModalVisible(false);
    };

    const generateRandomId = (length) => {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    };

    return (
 <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>

        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.label}>Details</Text>
            <TextInput
                style={styles.input}
                value={eventName}
                onChangeText={setEventName}
                placeholder={'Event name'}
            />
            <TextInput
                style={styles.input}
                value={eventDescription}
                onChangeText={setEventDescription}
                placeholder={'add a description!'}
            />
            <Text style={styles.label}>Start Date*</Text>
            <DateTimePicker
                value={eventDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => setEventDate(selectedDate || eventDate)}
            />
            <Text style={styles.label}>Start Time*</Text>
            <DateTimePicker
                value={eventTime}
                mode="time"
                display="default"
                onChange={(event, selectedTime) => setEventTime(selectedTime || eventTime)}
            />
            <Text style={styles.label}>Location</Text>
            <TouchableOpacity
                style={{ zIndex: 10, }}
                onPress={() => {
                console.log("TouchableOpacity pressed");
                setLocationModalVisible(true);
            }}>
                <TouchableWithoutFeedback onPress={() => { console.log("Inner TouchableWithoutFeedback pressed"); setLocationModalVisible(true); }}>
                    <View pointerEvents="none">
                        <TextInput
                            style={styles.input}
                            value={location ? location.name : ''}
                            editable={false}
                            placeholder="Select a location"
                        />
                    </View>
                </TouchableWithoutFeedback>
            </TouchableOpacity>
            <Text style={styles.label}>Workout Focus</Text>
            <TextInput
                style={styles.input}
                value={workoutFocus}
                onChangeText={setWorkoutFocus}
                placeholder="e.g. Calisthenics, Powerlifting, Bodybuilding"
            />
            <Text style={styles.label}>Level</Text>
            <TouchableOpacity onPress={() => setLevelPickerVisible(true)}>
                <View pointerEvents="none">
                    <TextInput
                        style={styles.input}
                        value={level}
                        editable={false}
                        placeholder="Select Level"
                    />
                </View>
            </TouchableOpacity>
            <Text style={styles.label}>Training Focus</Text>
            <TouchableOpacity onPress={() => setTrainingFocusPickerVisible(true)}>
                <View pointerEvents="none">
                    <TextInput
                        style={styles.input}
                        value={trainingFocus}
                        editable={false}
                        placeholder="Select Training Focus"
                    />
                </View>
            </TouchableOpacity>
            <Text style={styles.label}>Muscle Target</Text>
            <TouchableOpacity onPress={() => setMuscleTargetPickerVisible(true)}>
                <View pointerEvents="none">
                    <TextInput
                        style={styles.input}
                        value={muscleTarget}
                        editable={false}
                        placeholder="Select Muscle Target"
                    />
                </View>
            </TouchableOpacity>

            <TextInput
                style={styles.input}
                value={maxPeople}
                onChangeText={setMaxPeople}
                placeholder="How many people can join? 4 maximum"
                keyboardType={"number-pad"}
            />

            <Button title="Create Event" onPress={handleCreateEvent} />
            <GPSModal
                isVisible={locationModalVisible}
                onClose={() => setLocationModalVisible(false)}
                onSelectLocation={handleSelectLocation}
            />
            <CustomPickerModal
                visible={levelPickerVisible}
                options={levels}
                selectedValue={level}
                onValueChange={(itemValue) => setLevel(itemValue)}
                onClose={() => setLevelPickerVisible(false)}
            />
            <CustomPickerModal
                visible={trainingFocusPickerVisible}
                options={trainingFocuses}
                selectedValue={trainingFocus}
                onValueChange={(itemValue) => setTrainingFocus(itemValue)}
                onClose={() => setTrainingFocusPickerVisible(false)}
            />
            <CustomPickerModal
                visible={muscleTargetPickerVisible}
                options={muscleTargets}
                selectedValue={muscleTarget}
                onValueChange={(itemValue) => setMuscleTarget(itemValue)}
                onClose={() => setMuscleTargetPickerVisible(false)}
            />
        </ScrollView>
 </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 16,
        backgroundColor: '#fff',
        paddingBottom: 100, // Add some padding to the bottom
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 8,
        marginBottom: 16,
        borderRadius: 4,
    },
    backButton: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    searchResults: {
        backgroundColor: '#fff',
        marginBottom: 16,
    },
    map: {
        width: '100%',
        height: 200,
        marginBottom: 16,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        marginBottom: 16,
    },
});

export default CreateEventScreen;