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
    ScrollView,
    KeyboardAvoidingView, Platform
} from 'react-native';
import { db, firebase_auth, storage } from '../../../firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import DropDownPicker from "react-native-dropdown-picker";
import { useWorkout } from "../../contexts/WorkoutContext";
import {addDoc, arrayUnion, collection, getDoc, limit, orderBy, query, updateDoc} from "@firebase/firestore";
import Video from "react-native-video";
import * as ImagePicker from "expo-image-picker";
import { getDownloadURL, ref as storageRef, uploadBytes } from "@firebase/storage";
import {doc, getDocs} from "firebase/firestore";

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

    const [expandedExercises, setExpandedExercises] = useState({});



    const toggleExpandExercise = (exerciseIndex) => {
        setExpandedExercises(prevState => ({
            ...prevState,
            [exerciseIndex]: !prevState[exerciseIndex]
        }));
    };

    useEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

    const calculate1RM = (weight, reps) => {
        return weight * (1 + 0.0333 * reps);
    };

    const convertLbs = (weight, unit) => {
        if (unit === "kgs"){
            return Math.floor(weight * 2.204);
        }
        return weight;
    }

    const convertReps = (reps, repsUnit) => {
        if (repsUnit === "time"){
            return convertTimeToMilliseconds(reps) / 1000;
        }

        return reps;
    }

    const scoreWorkout = () => {
        const timeScore = Math.floor(elapsedTime / 60);
        const experienceScore = 0.833;

        let exerciseWeightScore = 0;
        let totalSets = 0;
        let cardioScore = 0;

        workoutState.exercises.forEach(exercise => {

            // Only process if the weight is tracked
            if (exercise.repsConfig === "Cardio"){
                console.log('before converting time', exercise.sets[0].reps);
                cardioScore += convertTimeToMilliseconds(exercise.sets[0].reps) / 100;
            }
            else if (exercise.weightConfig === "Weight") {
                // Iterate through each set
                exercise.sets.forEach(set => {
                    if (set.completed) {
                        // Calculate weight * reps for each set and add to totalWeight
                        exerciseWeightScore += convertLbs(set.weight, exercise.weightUnit) * convertReps(set.reps, exercise.repsUnit);
                    }
                });
            }
            else if (exercise.weightConfig === "Bodyweight"){
                exercise.sets.forEach(set => {
                    if (set.completed) {
                            // Calculate weight * reps for each set and add to totalWeight
                      exerciseWeightScore += 50 * convertReps(set.reps, exercise.repsUnit);
                    }
                });
            }
            console.log(exercise.name);
            console.log('each exercise score:', exerciseWeightScore);

            // Add to total sets regardless of weight tracking
            totalSets += exercise.sets.length;
        });

        const weightsScore = (timeScore * experienceScore * exerciseWeightScore * totalSets) / 800;

        console.log('cardio score', cardioScore / 275);
        console.log('weights score', weightsScore);
        console.log('combined', Math.floor(weightsScore + cardioScore/275));
        return Math.floor(weightsScore + cardioScore/275);

    }

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

    const getBestAttempts = (exercise) => {

        return exercise.sets.reduce((best, set) => {
            const weight = set.weight;
            const reps = set.reps;
            const predicted1RM = calculate1RM(weight, reps);

            if (!best || predicted1RM > best.predicted1RM) {
                return { ...set, predicted1RM };
            }
            return best;
        }, null);
    };

    const calculateTotalWeightLifted = (exercises) => {
        return exercises.filter((exercise) => exercise.weightConfig === "Weight").reduce((totalWeight, exercise) => {
            const exerciseWeight = exercise.sets.reduce((exerciseTotal, set) => {
                let weight = parseFloat(set.weight);
                // Standardize weight to kg if it's in lbs
                if (exercise.weightUnit === 'kgs') {
                    weight = weight * 2.20462; // Convert lbs to kg
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

    const convertTimeToMilliseconds = (timeString) => {
        const [minutes, seconds] = timeString.split(':').map(Number);
        return (minutes * 60 * 1000) + (seconds * 1000);
    };

    const saveWorkout = async () => {
        if (!firebase_auth.currentUser || !workoutState) return false;

        const userId = firebase_auth.currentUser.uid;

        const userDocRef = doc(db, "userProfiles", userId);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data();
        const newXp = userData.xp +scoreWorkout();

        if (!loadedFromTemplate && !isTemplateSaveChecked){
            console.log('run here');
            toggleTemplateModal();
            return false;
        }

        try {
            console.log('workout currently', workoutState);
            const filteredExercises = workoutState.exercises.map(ex => ({
                id: camelCase(ex.name),
                name: ex.name,
                sets: ex.sets.filter(set => (set.weight !== '' || ex.weightConfig === 'BW' || ex.repsConfig === "Cardio") && (set.reps !== '' || set.time !== '')).map(({key, weight, reps}) => {
                    if (ex.repsUnit === 'time') {
                        // For time-based exercises, store `time` instead of `reps`
                        const time = convertTimeToMilliseconds(reps);
                        return {
                            key,
                            weight,
                            time,  // Save the time instead of reps
                        };
                    } else {
                        // For rep-based exercises, store `reps`
                        return {
                            key,
                            weight,
                            reps,  // Save the reps as usual
                        };
                    }
                }),
                isSuperset: ex.isSuperset,
                supersetExercise: ex.supersetExercise,
                weightUnit: ex.weightUnit,
                repsUnit: ex.repsUnit,
            })).filter(ex => ex.sets.length > 0);

            console.log('exercises after filter', filteredExercises);

             if (isTemplateSaveChecked && newTemplateName) {
                 const templateRef = collection(db, "userProfiles", userId, "templates");

                 const templateExercises = workoutState.exercises.map(ex => ({
                         id: camelCase(ex.name),
                         name: ex.name,
                         setsKeys: ex.sets.map(set => set.key),
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
                addedExp: scoreWorkout()
            });

            await updateDoc(userDocRef, {
                xp: newXp, //add from scoreWorkout() to this existing field
            });

            await updateStreak(userId);

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

    const updateStreak = async (userId: string) => {
        const userRef = doc(db, "userProfiles", userId);

        // Fetch the most recent workout
        const workoutRef = collection(db, "userProfiles", userId, "workouts");
        const recentWorkouts = await getDocs(query(workoutRef, orderBy("createdAt", "desc"), limit(1)));

        let streak = 1; // Start a new streak by default
        const now = new Date();

        if (!recentWorkouts.empty) {
            const lastWorkoutDate = recentWorkouts.docs[0].data().createdAt.toDate();
            const timeDifference = now.getTime() - lastWorkoutDate.getTime();
            const dayDifference = timeDifference / (1000 * 3600 * 24);

            if (dayDifference <= 1) {
                const userDoc = await getDoc(userRef);
                const currentStreak = userDoc.data().consistencyStreak || 1;
                streak = currentStreak + 1; // Increment streak if workout is within 1 day
            }
        }

        // Update the consistency_streak field on the user profile
        await updateDoc(userRef, { consistencyStreak: streak });
    };

    if (!workoutState) {
        console.log('No workout state available');
        return (
            <View style={styles.container}>
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }


    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={handleResumeWorkout}>
                    <Text style={styles.headerButtonText}>Resume</Text>
                </TouchableOpacity>
                <Text style={styles.heading}>Workout Summary</Text>
            </View>
            <ScrollView>

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
                        Total Weight Lifted: {calculateTotalWeightLifted(workoutState.exercises).toFixed(2)} lbs
                    </Text>
                    <Text style={styles.summaryHeaderText}>
                        Total Sets Done: {calculateTotalSetsDone(workoutState.exercises)}
                    </Text>
                </View>
                {workoutState.exercises.map((exercise, index) => {
                    const bestAttempt = getBestAttempts(exercise);
                    const predicted1RM = calculate1RM(bestAttempt.weight, bestAttempt.reps);
                    const isWeightDisabled = exercise.repsConfig === "Cardio";

                    return (
                        <View key={index} style={styles.exerciseContainer}>
                            <TouchableOpacity
                                onPress={() => toggleExpandExercise(index)}
                                style={styles.dropdownButton}
                            >
                                <Text style={styles.dropdownIcon}>
                                    {expandedExercises[index] ? '▼' : '▶'}
                                </Text>
                                <View>
                                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                                    <Text style={styles.predicted1RMText}>
                                        {exercise.weightConfig === 'Weight'? `Predicted 1RM: ${predicted1RM.toFixed(2)} ${exercise.weightUnit}`: ''}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                            {expandedExercises[index] && (
                                <View style={styles.setsContainer}>
                                    {exercise.sets && exercise.sets.map((set, setIndex) => (
                                        <Text key={setIndex} style={styles.setText}>
                                            {`Set ${setIndex + 1}: ${set.weight} ${exercise.weightUnit} x ${set.reps}`}
                                        </Text>
                                    ))}
                                </View>
                            )}
                        </View>
                    );
                })}
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
                                setIsTemplateSaveChecked(true);
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
        fontWeight: 'bold',
        marginTop: 2,
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
    dropdownButton: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    dropdownIcon: {
        fontSize: 16,
        color: '#666',
        paddingRight: 40,
        paddingLeft: 10,
    },
    setsContainer: {
        marginTop: 10,
        paddingLeft: 10,
    },
});

export default WorkoutSummaryScreen;
