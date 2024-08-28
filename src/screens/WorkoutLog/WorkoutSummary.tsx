import React, {useEffect, useLayoutEffect, useState} from 'react';
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
import { db, firebase_auth, storage } from '../../../firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import DropDownPicker from "react-native-dropdown-picker";
import { useWorkout } from "../../contexts/WorkoutContext";
import {addDoc, collection} from "@firebase/firestore";
import Video from "react-native-video";
import * as ImagePicker from "expo-image-picker";
import { getDownloadURL, ref as storageRef, uploadBytes } from "@firebase/storage";
import {getDocs} from "firebase/firestore";

const WorkoutSummaryScreen = ({ route }) => {
    const [visibilityItems, setVisibilityItems] = useState([
        { label: 'Public', value: 'public' },
        { label: 'Followers', value: 'followers' },
        { label: 'Private', value: 'private' }
    ]);
    const [visibility, setVisibility] = useState('public');
    const [open, setOpen] = useState(false);
    const { workoutState, resetWorkout, startTime, elapsedTime, finishWorkout, resumeWorkout, isPaused, loadedFromTemplate} = useWorkout();
    const navigation = useNavigation();
    const previousScreen = route.params?.previousScreen;
    const [description, setDescription] = useState('');
    const [media, setMedia] = useState([]);
    const [selectedMedia, setSelectedMedia] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [title, setTitle] = useState('');
    const [templateModalVisible, setTemplateModalVisible] = useState(false);
    const [isTemplateSaveChecked, setIsTemplateSaveChecked] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');


    useEffect(() => {
        finishWorkout();
    }, []);


    const calculate1RM = (weight, reps) => {
        return weight * (1 + 0.0333 * reps);
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

    const toggleTemplateModal = () => {
        setTemplateModalVisible(!templateModalVisible);
    };

    const handleResumeWorkout = () => {
        resumeWorkout();
        setTimeout(() => {
            navigation.goBack();
        }, 100); // Adding a small delay to ensure state is updated
    };


    const templateCheck = async () => {
        try {
            const userId = firebase_auth.currentUser.uid;
            const templateRef = collection(db, "userProfiles", userId, "templates");
            const querySnapshot = await getDocs(templateRef);
            const existingTemplates = querySnapshot.docs.map(doc => doc.data().templateName.toLowerCase());

            if (!newTemplateName.trim()) {
                Alert.alert("Error", "Please provide a name for the template.");
                return false;
            }

            if (existingTemplates.includes(newTemplateName.trim().toLowerCase())) {
                Alert.alert("Error", "A template with this name already exists. Please choose a different name.");
                return false;
            }

            setIsTemplateSaveChecked(true);
            return true;

        }catch (error){
           Alert.alert('error processing', error);
           return false
        }
    };

    useEffect(() => {
        console.log('isPaused state changed:', isPaused);
    }, [isPaused]);

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
                let weight = parseFloat(set.weight);
                // Standardize weight to kg if it's in lbs
                if (exercise.weightUnit === 'lbs') {
                    weight = weight * 0.453592; // Convert lbs to kg
                }
                return exerciseTotal + (weight * parseInt(set.reps, 10));
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

    const saveWorkout = async () => {
        if (!firebase_auth.currentUser || !workoutState) return false;

        const userId = firebase_auth.currentUser.uid;

        if (!loadedFromTemplate && !isTemplateSaveChecked){
            console.log('run here');
            toggleTemplateModal();
            return false;
        }

        try {
            const filteredExercises = workoutState.exercises.map(ex => ({
                id: camelCase(ex.name),
                name: ex.name,
                sets: ex.sets.filter(set => (set.weight !== '' || ex.weightConfig === 'bodyWeight') && (set.reps !== '')).map(set => ({
                    ...set,
                    weight: set.weight,
                    reps: set.reps,
                    key: set.key,
                })),
                isSuperset: ex.isSuperset,
                supersetExercise: ex.supersetExercise,
                weightUnit: ex.weightUnit,
                repsUnit: ex.repsUnit,
            })).filter(ex => ex.sets.length > 0);


             if (isTemplateSaveChecked && newTemplateName) {
                 const templateRef = collection(db, "userProfiles", userId, "templates");

                 const templateExercises = workoutState.exercises.map(ex => ({
                         id: camelCase(ex.name),
                         name: ex.name,
                         setsKeys: ex.sets.length,
                         supersetExercise: ex.supersetExercise,
                         isSuperset: ex.isSuperset,
                     }));

                     await addDoc(templateRef, {
                         templateName: newTemplateName.trim(),
                         exercises: templateExercises,
                         createdAt: new Date()
                     });

             }


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

            await addDoc(collection(db, "userProfiles", userId, "workouts"), {
                exercises: filteredExercises,
                createdAt: startTime,
                totalWorkoutTime: elapsedTime,
                title: title || 'New Workout',
                description: description || '',
                mediaUrls: uploadedMediaUrls,
                visibility: visibility,
            });

        } catch (error) {
            console.error("Error adding document: ", error);
            Alert.alert("Error", "Failed to save workouts.");
            return false;
        }

        return true;

    };

    const saveWorkoutAndNavigate = async () => {
        const workoutSaved = await saveWorkout();
        if (workoutSaved){
            resetWorkout();
            navigation.navigate(previousScreen);
        }
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
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={handleResumeWorkout}>
                    <Text style={styles.headerButtonText}>Resume</Text>
                </TouchableOpacity>
                <Text style={styles.heading}>Workout Summary</Text>
            </View>
            <ScrollView>
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
                <View style={styles.summaryHeaderContainer}>
                    <Text style={styles.summaryHeaderText}>
                        Total Weight Lifted: {calculateTotalWeightLifted(workoutState.exercises).toFixed(2)} kg
                    </Text>
                    <Text style={styles.summaryHeaderText}>
                        Total Sets Done: {calculateTotalSetsDone(workoutState.exercises)}
                    </Text>
                </View>
            {workoutState.exercises
                .filter(exercise => exercise.completed)
                .map((exercise, index) => {
                const bestAttempt = getBestAttempts(exercise);
                const predicted1RM = calculate1RM(getBestAttempts(exercise).weight, getBestAttempts(exercise).reps)
                return (
                    <View key={index} style={styles.exerciseContainer}>
                        <Text style={styles.exerciseName}>{exercise.name}</Text>
                        {exercise.sets && exercise.sets.map((set, setIndex) => (
                            <Text key={setIndex} style={styles.setText}>{`Set ${setIndex + 1}: ${set.weight} ${set.weightUnit} x ${set.reps}`}</Text>
                        ))}
                        {bestAttempt && bestAttempt.reps !== '' && bestAttempt.weight !== '' && (
                            <>
                                <Text style={styles.bestAttemptText}>{`Best Attempt: ${bestAttempt.weight} ${bestAttempt.weightUnit} x ${bestAttempt.reps}`}</Text>
                                <Text style={styles.predicted1RMText}>{`Predicted 1RM: ${predicted1RM.toFixed(2)} ${bestAttempt.weightUnit}`}</Text>
                            </> )}
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
            </ScrollView>

            <Modal
                animationType="slide"
                transparent={true}
                visible={templateModalVisible}
                onRequestClose={toggleTemplateModal}
            >
                <View style={styles.templateModalContainer}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>Save as Template</Text>
                        <Text style={styles.modalText}>Would you like to save this workout as a template for future use?</Text>

                        <TextInput
                            style={styles.textInput}
                            placeholder="Template Name"
                            value={newTemplateName}
                            onChangeText={setNewTemplateName}
                        />

                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={async () => {
                                const asyncWait = await templateCheck();

                                if (isTemplateSaveChecked && asyncWait){
                                    toggleTemplateModal();
                                    await saveWorkoutAndNavigate();
                                }
                            }}
                        >
                            <Text style={styles.saveButtonText}>Save</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.dontSaveButton}
                            onPress={async () => {
                                if (isTemplateSaveChecked){
                                    toggleTemplateModal();
                                    await saveWorkoutAndNavigate();
                                }
                            }}
                        >
                            <Text style={styles.saveButtonText}>Don't Save</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={toggleTemplateModal}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <TouchableOpacity style={styles.saveButton} onPress={saveWorkoutAndNavigate}>
                <Text style={styles.saveButtonText}>Save Summary</Text>
            </TouchableOpacity>
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
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#333',
        paddingTop: 15,
        alignSelf: 'center',
        marginLeft: 25,
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
    dontSaveButton: {
        backgroundColor: '#4295f5',
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
        paddingHorizontal: 10,
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
    templateModalContainer: {
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
    headerButtonText: {
        color: 'black',
        fontSize: 17,
        marginTop: 10,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderColor: 'gray',
        borderWidth: 1,
        marginRight: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxTick: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    checkboxLabel: {
        fontSize: 16,
    },
    cancelButton: {
        backgroundColor: '#d9534f',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        paddingHorizontal: 10,
    },
    summaryHeaderContainer: {
        marginBottom: 20,
        padding: 10,
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    summaryHeaderText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
});

export default WorkoutSummaryScreen;
