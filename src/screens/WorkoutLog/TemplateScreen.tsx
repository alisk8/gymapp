import React, {useState, useEffect, useCallback} from 'react';
import {View, Text, Button, FlatList, StyleSheet, ScrollView, Alert, TextInput} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { db, firebase_auth } from '../../../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import { useWorkout } from '../../contexts/WorkoutContext';
import * as Location from 'expo-location';


const TemplateScreen = ({ route }) => {
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState([]);
    const navigation = useNavigation();
    const [previousScreen, setPreviousScreen] = useState(null);
    const {workoutState, setWorkoutState, resetWorkout, handleWorkoutMode} = useWorkout();
    const [isCheckingIn, setIsCheckingIn] =  useState(null);
    const [location, setLocation] = useState(null); // User's location
    const [description, setDescription] = useState(''); // Description for check-in
    const [showOptions, setShowOptions] = useState(true); // New state for workout/check-in choice
    const [locationServicesEnabled, setLocationServicesEnabled] = useState(false);
    const [gymName, setGymName] = useState(null); // Gym name from Places API
    const GOOGLE_PLACES_API_KEY = "AIzaSyCMogbDFxjNsReLGGKAo4AwE-6DdNUPRJI";

    useEffect(() => {
        fetchTemplates();
        const unsubscribe = navigation.addListener('focus', () => {
            setPreviousScreen(route.params?.previousScreen || null);
        });

        return unsubscribe;
    }, []);


    const fetchTemplates = async () => {
        if (!firebase_auth.currentUser) return;

        try {
            const userId = firebase_auth.currentUser.uid;
            const templateRef = collection(db, "userProfiles", userId, "templates");
            const querySnapshot = await getDocs(templateRef);
            const templatesList = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return { id: doc.id, label: data.templateName, value: doc.id, ...data };
            });

            setTemplates(templatesList);
            setItems(templatesList.map(template => ({ label: template.templateName, value: template.id })));
        } catch (error) {
            console.error('Error fetching templates:', error);
        }
    };

    const handleLoadTemplate = () => {
        const selected = templates.find(template => template.id === selectedTemplate);
        if (selected) {
            navigation.navigate('WorkoutLog', { template: selected, previousScreen});
        } else {
            Alert.alert('No template selected');
        }
    };

    const startNewWorkout = () => {
          navigation.navigate('WorkoutLog', {previousScreen});
    }

    const checkIfLocationEnabled= async ()=>{
        let enabled = await Location.hasServicesEnabledAsync();       //returns true or false
        if(!enabled){                     //if not enable
            Alert.alert('Location not enabled', 'Please enable your Location', [
                {
                    text: 'Cancel',
                    onPress: () => console.log('Cancel Pressed'),
                    style: 'cancel',
                },
                {text: 'OK', onPress: () => console.log('OK Pressed')},
            ]);
        }else{
            setLocationServicesEnabled(enabled)         //store true into state
        }
    }

    const fetchLocationAndGym = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Location permission is required for check-in.');
            return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = loc.coords;

        setLocation({ latitude, longitude });

        // Query Google Places API for nearby gyms
        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=20&type=gym&key=${GOOGLE_PLACES_API_KEY}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data.results && data.results.length > 0) {
                // Find the nearest gym
                const nearestGym = data.results[0];
                setGymName(nearestGym.name); // Store gym name
            } else {
                setGymName(null); // No gyms nearby
            }
        } catch (error) {
            console.error('Error fetching nearby gyms:', error);
            Alert.alert('Error', 'Failed to identify nearby gyms.');
        }
    };

    const handleCheckIn = async () => {
        if (!location) {
            Alert.alert('Error', 'Location is not available.');
            return;
        }

        // Save check-in details to Firestore or any backend if needed
        Alert.alert('Check-In Successful', 'Your check-in has been recorded.');
    };


    const renderExercise = (exercise, exercises) => {
        const sets = exercise.setsKeys.filter((setKey) => !setKey.includes('_dropset')).length;
        const dropSets = exercise.setsKeys.filter((setKey) => setKey.includes('_dropset')).length;

        return(
            <View key={exercise.id} style={exercise.isSuperset ? styles.supersetContainer : styles.previewItem}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.setsCount}>Sets: {sets}</Text>
                {dropSets > 0 && (
                    <Text style={styles.setItem}>
                        Drop Sets: {dropSets}
                    </Text>
                )}
                {exercise.isSuperset && exercises.find(ex => ex.id === exercise.supersetExercise) &&
                    renderExercise(exercises.find(ex => ex.id === exercise.supersetExercise), exercises)}
            </View>
        )};


    if (showOptions) {
        // Show initial "Work Out" or "Check In" options
        return (
            <View style={styles.container}>
                <Text style={[styles.title, {marginTop: 50}]}>What would you like to do?</Text>
                <Button title="Work Out" color="#016e03" onPress={() => setShowOptions(false)} />
                <Button title="Check In" color="#016e03" onPress={ () => {
                    setIsCheckingIn(true);
                    setShowOptions(false);
                    fetchLocationAndGym();
                }} />
                <Button title="Cancel" color='#CE2029' onPress={() => navigation.goBack()} />
            </View>
        );
    }

    if (isCheckingIn) {
        // Show Check-In Page
        return (
            <View style={styles.container}>
                <Text style={[styles.title, {marginTop: 50}]}>Check In</Text>
                <Text style={styles.infoText}>
                    {gymName
                        ? `Gym: ${gymName}`
                        : location
                            ? 'No nearby gym found.'
                            : 'Fetching location...'}
                </Text>
                <TextInput
                    style={styles.textInput}
                    placeholder="Add a description (optional)"
                    value={description}
                    onChangeText={setDescription}
                />
                <Button title="Check In" color="#016e03" onPress={handleCheckIn} disabled={!gymName} />
                <Button
                    title="Cancel"
                    color="#CE2029"
                    onPress={() => {
                        setShowOptions(true);
                        setIsCheckingIn(false);
                        navigation.goBack();
                    }}
                />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Select a Template</Text>
            <DropDownPicker
                open={open}
                value={selectedTemplate}
                items={items}
                setOpen={setOpen}
                setValue={setSelectedTemplate}
                setItems={setItems}
                placeholder="Select a template"
                containerStyle={styles.dropdownContainer}
                style={styles.dropdown}
                dropDownStyle={styles.dropdown}
            />
            {selectedTemplate && (
                <ScrollView style={styles.templatePreview}>
                    <Text style={styles.previewTitle}>Template Preview:</Text>
                    <ScrollView style={styles.templatePreview}>
                        {templates.find(template => template.id === selectedTemplate)?.exercises.map((exercise, index, exercises) => {
                            if (!exercise.isSuperset) {
                                return renderExercise(exercise, exercises);
                            }
                            return null;
                        })}
                    </ScrollView>
                </ScrollView>
            )}


            <Button title="Load Template" color='#016e03' onPress={handleLoadTemplate} />
            <Button title="Start New Workout" color='#016e03' onPress={startNewWorkout} />
            <Button title="Cancel" color='#CE2029' onPress={() => navigation.goBack()} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: 'white',
    },
    title: {
        paddingTop: 40,
        paddingBottom: 20,
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    dropdownContainer: {
        marginBottom: 20,
    },
    dropdown: {
        backgroundColor: '#fafafa',
    },
    templatePreview: {
        marginTop: 20,
        maxHeight: '90%',
        paddingHorizontal: 10,
    },
    previewTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    previewItem: {
        marginBottom: 15,
        backgroundColor: '#f0f0f0',
        padding: 10,
        borderRadius: 5,
    },
    exerciseName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    setsCount: {
        fontSize: 16,
        marginTop: 5,
    },
    supersetContainer: {
        marginTop: 10,
        paddingLeft: 10,
        borderLeftWidth: 2,
        borderLeftColor: '#ccc',
    },
    supersetTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    supersetItemText: {
        fontSize: 16,
        marginTop: 5,
    },
    setItem: {
        fontSize: 16,
        marginTop: 5,
        paddingLeft: 10,
    },
    supersetItem: {
        marginTop: 10,
    },
    infoText: {
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center',
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#cccccc',
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
    },
});

export default TemplateScreen;

