import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
    View,
    Text,
    Image,
    Button,
    FlatList,
    StyleSheet,
    ScrollView,
    Alert,
    TextInput,
    TouchableOpacity,
    ActivityIndicator
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { db, firebase_auth,storage} from '../../../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import { useWorkout } from '../../contexts/WorkoutContext';
import * as Location from 'expo-location';
import {Camera, CameraView, CameraType} from 'expo-camera';
import {getDownloadURL, ref as storageRef, uploadBytes} from "firebase/storage";
import {addDoc, Timestamp} from "@firebase/firestore";

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
    const [showOptions, setShowOptions] = useState(true); // New state for workout/check-in choice
    const [locationServicesEnabled, setLocationServicesEnabled] = useState(false);
    const [gymName, setGymName] = useState(null); // Gym name from Places API
    const GOOGLE_PLACES_API_KEY = "AIzaSyCMogbDFxjNsReLGGKAo4AwE-6DdNUPRJI";
    const [cameraPermission, setCameraPermission] = useState(null);
    const cameraRef = useRef<Camera | null>(null);
    const [photo, setPhoto] = useState(null);
    const [facing, setFacing] = useState<CameraType>('back');
    const [loading, setLoading] = useState(false);

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

    const takePhoto = async () => {
        if (cameraRef) {
            const photoData = await cameraRef.current.takePictureAsync();
            setPhoto(photoData);
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

    function toggleCameraFacing() {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
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

    const requestCameraPermissions = async () => {
        const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
        console.log('camera status: ', cameraStatus);
        setCameraPermission(cameraStatus === 'granted');
    };


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

    const retakePhoto = () => {
        setPhoto(null);
    };

    const handleCheckIn = async () => {
        if (!location) {
            Alert.alert('Error', 'Location is not available.');
            return;
        }

        try {
            // Get the current user's UID
            const userId = firebase_auth.currentUser?.uid;
            if (!userId) {
                Alert.alert('Error', 'User not authenticated.');
                return;
            }

            // Reference to the Firestore collection
            const checkInsRef = collection(db, 'userProfiles', userId, 'checkIns');

            // Data to save
            const checkInData = {
                gymName: gymName || 'Unknown Gym',
                location: {
                    latitude: location.latitude,
                    longitude: location.longitude,
                },
                photoURL: "", // Placeholder for photo URL
                timestamp: Timestamp.now() // Save current timestamp
            };

            // If a photo is available, upload it to Firebase Storage and get the URL
            if (photo) {
                setLoading(true);
                const fileName = `${userId}_${Date.now()}.jpg`; // Unique file name
                const photoRef = storageRef(storage, `checkIns/${fileName}`);
                const response = await fetch(photo.uri);
                if (!response.ok) {
                    throw new Error('Failed to fetch the photo.');
                }
                const blob = await response.blob();
                console.log('Uploading photo...');
                await uploadBytes(photoRef, blob); // Upload to Firebase Storage

                const photoURL = await getDownloadURL(photoRef); // Retrieve the download URL
                checkInData.photoURL = photoURL;
                console.log('Photo uploaded successfully:', photoURL);
            }

            // Add the check-in data to Firestore
            await addDoc(checkInsRef, checkInData);

            Alert.alert('Check-In Successful', 'Your check-in has been recorded.');

            // Reset the check-in state
            setPhoto(null);
            setGymName(null);
            setLocation(null);
            setIsCheckingIn(false);
            setShowOptions(true);
            setLoading(false);
            navigation.goBack();
        } catch (error) {
            console.error('Error saving check-in:', error);
            Alert.alert('Error', 'Failed to record your check-in. Please try again.');
            setLoading(false);
        }
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
                <Text style={[styles.title, {marginTop: 50}]}>Workout Log</Text>
                <View style={{alignItems: 'center', marginVertical: 10}}>
                    <Button title="Track Workout" color="#016e03" onPress={() => setShowOptions(false)} />
                </View>
                <View style={{alignItems: 'center', marginVertical: 10, marginBottom: 20}}>
                    <Button title="Check In" color="#016e03" onPress={ () => {
                        setIsCheckingIn(true);
                        setShowOptions(false);
                        fetchLocationAndGym();
                        requestCameraPermissions();
                    }} />
                <Text style={{color: '#aaaeb0', textAlign:'center'}}>Maintain your consistency streak without workout tracking.</Text>
                </View>
                <Button title="Cancel" color='#CE2029' onPress={() => navigation.goBack()} />
            </View>
        );
    }

    if (isCheckingIn) {
        // Show Check-In Page

        return (
            <ScrollView style={styles.container}>
                <Text style={[styles.checkInTitle, {marginTop: 50}]}>Check In</Text>
                <Text style={{color: '#aaaeb0', textAlign:'center', marginBottom: 10}}>Just showing up is already a win!</Text>
                <Text style={styles.infoText}>
                    {gymName
                        ? `Gym: ${gymName}`
                        : location
                            ? 'No nearby gym found.'
                            : 'Fetching location...'}
                </Text>
                {photo ? (
                    <View style={styles.camera}>
                        <Image source={{uri: photo.uri}} style={styles.imagePreview} />
                        <TouchableOpacity style={styles.retakeButton} onPress={retakePhoto}>
                            <Text style={styles.retakeText}>Retake</Text>
                        </TouchableOpacity>
                    </View>
                ) : (cameraPermission? (
                    <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
                        <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
                            <Text style={styles.flipText}>🔄</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.captureButton} onPress={takePhoto} />
                    </CameraView>
                ):
                    (<Text style={styles.errorText}>Camera access denied.</Text>))}
                {loading && <ActivityIndicator size="large" color="#0000ff" />}
                {!loading && <Button title="Check In" color="#016e03" onPress={handleCheckIn} disabled={!gymName} />}
                {!loading && <Button
                    title="Cancel"
                    color="#CE2029"
                    onPress={() => {
                        setShowOptions(true);
                        setIsCheckingIn(false);
                        navigation.goBack();
                    }}
                />}
            </ScrollView>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={[styles.title, {marginTop:30}]}>Select a Template</Text>
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
    checkInTitle: {
        paddingTop: 40,
        paddingBottom: 10,
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
    errorText: {
        color: 'red',
        fontSize: 16,
        marginBottom: 10,
    },
    camera: {
        width: '100%',
        height: 500,
        marginBottom: 20,
    },
    photoPreview: {
        width: 200,
        height: 200,
        marginBottom: 20,
        borderRadius: 10,
    },
    buttonContainer: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: 'transparent',
        margin: 64,
    },
    button: {
        flex: 1,
        alignSelf: 'flex-end',
        alignItems: 'center',
    },
    text: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    flipButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 25,
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    flipText: {
        fontSize: 24,
        color: 'white',
    },
    captureButton: {
        position: 'absolute',
        bottom: 30,
        alignSelf: 'center',
        backgroundColor: 'white',
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 5,
        borderColor: 'black',
    },
    imagePreview: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    retakeButton: {
        position: 'absolute',
        bottom: 30,
        alignSelf: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 25,
    },
    retakeText: {
        fontSize: 18,
        color: 'white',
    },
});

export default TemplateScreen;

