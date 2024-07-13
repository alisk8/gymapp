import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    FlatList,
    Image,
    Modal,
    TextInput,
    ScrollView
} from 'react-native';
import { db, firebase_auth, storage } from '../../firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import DropDownPicker from "react-native-dropdown-picker";
import { useWorkout } from "../contexts/WorkoutContext";
import {addDoc, collection} from "@firebase/firestore";
import Video from "react-native-video";
import * as ImagePicker from "expo-image-picker";
import { getDownloadURL, ref as storageRef, uploadBytes } from "@firebase/storage";

const WorkoutSummaryScreen = ({ route }) => {
    const [visibilityItems, setVisibilityItems] = useState([
        { label: 'Public', value: 'public' },
        { label: 'Followers', value: 'followers' },
        { label: 'Private', value: 'private' }
    ]);
    const [visibility, setVisibility] = useState('public');
    const [open, setOpen] = useState(false);
    const { workoutState, resetWorkout, startTime, elapsedTime, finishWorkout, } = useWorkout();
    const navigation = useNavigation();
    const previousScreen = route.params?.previousScreen;
    const [description, setDescription] = useState('');
    const [media, setMedia] = useState([]);
    const [selectedMedia, setSelectedMedia] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [title, setTitle] = useState('');

    useEffect(() => {
        finishWorkout();
    }, []);

    const calculate1RM = (weight, reps) => {
        return weight * (1 + 0.0333 * reps);
    };

    const getBestAttempts = (exercise) => {
        return exercise.sets.reduce((best, set) => {
            const weight = parseFloat(set.weight);
            const reps = parseInt(set.reps, 10);
            const predicted1RM = calculate1RM(weight, reps);

            if (!best || predicted1RM > best.predicted1RM) {
                return { ...set, predicted1RM };
            }
            return best;
        }, null);
    };

    const calculateTotalWeightLifted = (exercises) => {
        return exercises.reduce((totalWeight, exercise) => {
            const exerciseWeight = exercise.sets.reduce((exerciseTotal, set) => {
                return exerciseTotal + (parseFloat(set.weight) * parseInt(set.reps, 10));
            }, 0);
            return totalWeight + exerciseWeight;
        }, 0);
    };

    const calculateTotalSetsDone = (exercises) => {
        return exercises.reduce((totalSets, exercise) => {
            return totalSets + exercise.sets.length;
        }, 0);
    };

    const formatTotalWorkoutTime = (totalTime) => {
        const minutes = Math.floor(totalTime / 60);
        const seconds = totalTime % 60;
        return `${minutes} mins ${seconds} secs`;
    };

    const formatStartTime = (startTime) => {
        const date = new Date(startTime);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const saveSummaryAsHighlight = async () => {
        if (!firebase_auth.currentUser || !workoutState) return;

        const userId = firebase_auth.currentUser.uid;

        const mediaUploadPromises = media.map(async (mediaItem, index) => {
            if (!mediaItem.uri) {
                throw new Error(`Media item at index ${index} is missing a URI.`);
            }

            const fileName = `${userId}_${Date.now()}_${index}`; // A unique file name for the upload
            const fileRef = storageRef(storage, `media/${fileName}`);

            const response = await fetch(mediaItem.uri);
            if (!response.ok) {
                throw new Error(`Failed to fetch media item at URI ${mediaItem.uri}`);
            }
            const blob = await response.blob();

            // Ensure the blob is valid
            if (!blob) {
                throw new Error(`Failed to create a valid blob for media item at index ${index}`);
            }

            // Log the blob information
            console.log('Uploading blob:', blob);

            // Upload the media file to Firebase Storage
            const snapshot = await uploadBytes(fileRef, blob);
            const downloadURL = await getDownloadURL(snapshot.ref); // Get the URL of the uploaded file
            console.log('Download URL:', downloadURL);
            return downloadURL;
        });

        const uploadedMediaUrls = await Promise.all(mediaUploadPromises);

        const summary = {
            userId,
            timestamp: new Date(),
            exercises: workoutState.exercises.map(ex => ({
                name: ex.name,
                bestAttempt: getBestAttempts(ex),
                predicted1RM: calculate1RM(getBestAttempts(ex).weight, getBestAttempts(ex).reps)
            })),
            totalWorkoutTime: elapsedTime,
            description: description,
            mediaUrls: uploadedMediaUrls,
            visibility: visibility,
            totalSets: calculateTotalSetsDone(workoutState.exercises),
            totalWeightLifted: calculateTotalWeightLifted(workoutState.exercises),
            caption: title,
        };

        await addDoc(collection(db, 'userProfiles',userId,"highlights"), summary);

        Alert.alert("Success", "Workout summary posted to your feed!");
        resetWorkout();
        navigation.navigate(previousScreen);
    };

    const handlePickMedia = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsMultipleSelection: true,  // Enable multiple selection
        });

        console.log('Media Picker Result:', result);

        if (!result.canceled && result.assets) {
            setMedia([...media, ...result.assets]);  // Add selected media to the state
        } else {
            console.log('No media selected or operation canceled');
        }
    };

    const handleLongPressMedia = (item) => {
        setSelectedMedia(item);
        setModalVisible(true);
    };

    const handleDeleteMedia = () => {
        setMedia(media.filter(item => item.uri !== selectedMedia.uri));
        setModalVisible(false);
    };

    if (!workoutState) {
        console.log('No workout state available');
        return (
            <View style={styles.container}>
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    useEffect(() => {
        console.log('im here bro');
    }, []);



    return (
        <View style={styles.container}>
            <ScrollView>
            <Text style={styles.heading}>Workout Summary</Text>
            <View style={styles.mediaContainer}>
                <FlatList
                    data={[...media, { addNew: true }]}
                    horizontal
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => {
                        if (item.addNew) {
                            return (
                                <TouchableOpacity style={styles.addMediaBox} onPress={handlePickMedia}>
                                    <Text style={styles.addMediaText}>Add Media</Text>
                                </TouchableOpacity>
                            );
                        } else {
                            return (
                                <TouchableOpacity
                                    style={styles.mediaBox}
                                    onLongPress={() => handleLongPressMedia(item)}
                                >
                                    {item.type === 'image' ? (
                                        <Image source={{ uri: item.uri }} style={styles.mediaThumbnail} />
                                    ) : (
                                        <Video source={{ uri: item.uri }} style={styles.mediaThumbnail} resizeMode="contain" paused={true} />
                                    )}
                                </TouchableOpacity>
                            );
                        }
                    }}
                />
            </View>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                    setModalVisible(!modalVisible);
                }}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalText}>Do you want to delete this media?</Text>
                        <View style={styles.modalButtonContainer}>
                            <TouchableOpacity
                                style={[styles.button, styles.buttonClose]}
                                onPress={handleDeleteMedia}
                            >
                                <Text style={styles.textStyle}>Delete</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, styles.buttonCancel]}
                                onPress={() => setModalVisible(!modalVisible)}
                            >
                                <Text style={styles.textStyle}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Text style={styles.subheading}>Date: {new Date().toLocaleDateString()}</Text>
            <Text style={styles.subheading}>Start Time: {formatStartTime(startTime)}</Text>
            <Text style={styles.subheading}>Total Workout Time: {formatTotalWorkoutTime(elapsedTime)}</Text>
            {workoutState.exercises.map((exercise, index) => {
                const bestAttempt = getBestAttempts(exercise);
                const predicted1RM = calculate1RM(getBestAttempts(exercise).weight, getBestAttempts(exercise).reps)
                return (
                    <View key={index} style={styles.exerciseContainer}>
                        <Text style={styles.exerciseName}>{exercise.name}</Text>
                        {exercise.sets.map((set, setIndex) => (
                            <Text key={setIndex} style={styles.setText}>{`Set ${setIndex + 1}: ${set.weight} ${exercise.weightUnit} x ${set.reps}`}</Text>
                        ))}
                        {bestAttempt && (
                            <>
                                <Text style={styles.bestAttemptText}>{`Best Attempt: ${bestAttempt.weight} ${exercise.weightUnit} x ${bestAttempt.reps}`}</Text>
                                <Text style={styles.predicted1RMText}>{`Predicted 1RM: ${predicted1RM.toFixed(2)} ${exercise.weightUnit}`}</Text>
                            </>                )}
                    </View>
                );
            })}
            <Text style={styles.header}>Title</Text>
            <TextInput style={styles.textInput} placeholder="Title your workout!" value={title} onChangeText={setTitle} />
            <Text style={styles.header}>Description</Text>
            <TextInput style={[styles.textInput, styles.descriptionInput]} placeholder="How did your gym session go?" value={description} onChangeText={setDescription} />
            <DropDownPicker
                open={open}
                value={visibility}
                items={visibilityItems}
                setOpen={setOpen}
                setValue={setVisibility}
                setItems={setVisibilityItems}
                style={styles.picker}
                dropDownContainerStyle={styles.dropdownStyle}
            />
            <TouchableOpacity style={styles.saveButton} onPress={saveSummaryAsHighlight}>
                <Text style={styles.saveButtonText}>Save Summary</Text>
            </TouchableOpacity>
            </ScrollView>
        </View>

    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: 'white',
        width: '100%',
    },
    heading: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
        paddingTop: 15,
    },
    subheading: {
        fontSize: 18,
        marginBottom: 10,
        color: '#666',
    },
    exerciseContainer: {
        marginBottom: 15,
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    exerciseName: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#007bff',
    },
    setText: {
        fontSize: 16,
        color: '#333',
    },
    bestAttemptText: {
        fontSize: 16,
        color: '#007bff',
        marginTop: 10,
        fontWeight: 'bold',
    },
    backButton: {
        backgroundColor: '#007bff',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 5,
        marginTop: 20,
    },
    backButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    loadingText: {
        fontSize: 18,
        color: '#666',
        textAlign: 'center',
        marginTop: 20,
    },
    picker: {
        borderColor: 'gray',
        borderRadius: 8,
        marginBottom: 16,
    },
    dropdownStyle: {
        borderColor: 'gray',
    },
    saveButton: {
        backgroundColor: '#28a745',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 5,
        marginTop: 20,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    mediaContainer: {
        flexDirection: 'row',
        padding: 8,
    },
    addMediaBox: {
        width: 100,
        height: 100,
        borderWidth: 2,
        borderColor: '#ddd',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        backgroundColor: '#f8f9fa',
    },
    addMediaText: {
        textAlign: 'center',
        color: '#6c757d',
    },
    mediaBox: {
        width: 100,
        height: 100,
        marginRight: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mediaThumbnail: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalText: {
        marginBottom: 15,
        textAlign: 'center',
    },
    modalButtonContainer: {
        flexDirection: 'row',
    },
    button: {
        borderRadius: 10,
        padding: 10,
        elevation: 2,
        marginHorizontal: 10,
    },
    buttonClose: {
        backgroundColor: '#d9534f',
    },
    buttonCancel: {
        backgroundColor: '#007bff',
    },
    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    textInput: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        paddingLeft: 8,
        borderRadius: 8,
        marginBottom: 16,
    },
    descriptionInput: {
        height: 80,
    },
    header: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    predicted1RMText: {
        fontSize: 16,
        color: '#007bff',
        marginTop: 5,
        fontStyle: 'italic',
    },
});

export default WorkoutSummaryScreen;
