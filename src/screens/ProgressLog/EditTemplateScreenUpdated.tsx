import React, {useState, useEffect, useRef} from 'react';
import {
    Button,
    StyleSheet,
    TextInput,
    View,
    Text,
    Alert,
    TouchableOpacity,
    Keyboard,
    Pressable,
    FlatList,
    Modal, KeyboardAvoidingView, Platform, Switch, ScrollView
} from 'react-native';
import { db, firebase_auth } from '../../../firebaseConfig';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { FontAwesome5 } from '@expo/vector-icons';
import { commonExercises } from '../../../exercisesList';
import { Checkbox } from 'react-native-paper';
import { GestureHandlerRootView, Swipeable, PanGestureHandler} from 'react-native-gesture-handler';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from "@react-native-picker/picker";
import Animated, {useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import { useWorkout } from '../../contexts/WorkoutContext';
import ExercisePickerModal from "../WorkoutLog/ExercisePickerModal";
import findLastIndex from "@react-navigation/stack/lib/typescript/src/utils/findLastIndex";
import axios from 'axios';
import FeedbackModal from "./FeedbackModal";
import {doc, updateDoc} from "@firebase/firestore";


export default function EditTemplateScreenUpdated({route}) {
    const nav = useNavigation();

    const [exercises, setExercises] = useState([]);
    const [userExercises, setUserExercises] = useState([]);
    const [exercisePresets, setExercisePresets] = useState({});
    const previousScreen = route.params?.previousScreen;
    const [showPreviousAttempts, setShowPreviousAttempts] = useState({});
    const [exercisePresetsLoaded, setExercisePresetsLoaded] = useState(false);
    const [userGoal, setUserGoal] = useState('');  // State to store the user goal
    const [feedback, setFeedback] = useState('');  // State to store the feedback from the server

    const [selectedExerciseIndex, setSelectedExerciseIndex] = useState(null);
    const [proceedWithSave, setProceedWithSave] = useState(false);
    const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
    const [pickerModalVisible, setPickerModalVisible] = useState(false);
    const [feedbackModalVisible, setFeedbackModalVisible] = useState(false); // Modal visibility
    const [template, setTemplate] = useState(route?.params?.template);
    const [feedbackLoaded, setFeedbackLoaded] = useState(false);
    const timerHeight = useSharedValue(120);


    const preprocessTemplate = () => {
        let result = '';

        exercises.forEach((exercise) => {
            const setsCount = exercise.sets.filter((set) => !set.key.includes('_dropset')).length;
            const dropSetsCount = exercise.sets.filter((set) => set.key.includes('_dropset')).length;
            let exerciseDescription = `${exercise.name}: ${setsCount} sets`;

            if (dropSetsCount > 0) {
                exerciseDescription += `, ${dropSetsCount} drop sets`;
            }

            if (exercise.isSuperset && exercise.supersetExercise) {
                const supersetExercise = template.exercises.find(ex => ex.id === exercise.supersetExercise);
                if (supersetExercise) {
                    const supersetSetsCount = supersetExercise.sets.filter((set) => !set.key.includes('_dropset')).length;
                    const supersetDropSetsCount = supersetExercise.key.filter((set) => set.key.includes('_dropset')).length;
                    let supersetDescription = `${supersetExercise.name}: ${supersetSetsCount} sets`;

                    if (supersetDropSetsCount > 0) {
                        supersetDescription += `, ${supersetDropSetsCount} drop sets`;
                    }

                    exerciseDescription += ` (superset with ${supersetDescription})`;
                }
            }

            result += `${exerciseDescription}\n`;
        });

        return result.trim();
    };



    const fetchLatestAttempt = async (exerciseName) => {
        if (!firebase_auth.currentUser) return;

        const userId = firebase_auth.currentUser.uid;
        const userWorkoutsRef = collection(db, 'userProfiles', userId, 'workouts');
        const querySnapshot = await getDocs(userWorkoutsRef);

        let latestAttempt = null;

        querySnapshot.forEach(doc => {
            const workout = doc.data();
            workout.exercises.forEach(ex => {
                if (ex.name === exerciseName) {
                    latestAttempt = ex.sets.map((set, index) => ({
                        key: set.key,
                        weight: set.weight,
                        reps: set.reps,
                        weightUnit: ex.weightUnit,
                        repsUnit: ex.repsUnit,
                    }));
                }
            });
        });

        return latestAttempt;
    };

    useEffect(() => {
        fetchExercisePresets();
    }, []);

    useEffect(() => {
        loadTemplate();
    }, [exercisePresets]);

    useEffect(() => {
        console.log('presets fetched again', exercisePresets)
    }, [exercisePresets]);


    const useTemplateFeedback = (newTemplate) => {
        console.log('old template', template);
        setTemplate(newTemplate);  // Add new template to existing templates
        console.log('new template', exercises);
        console.log('new exercises', exercises);
        setFeedbackLoaded(true);
    };

    useEffect(() => {
        loadTemplate();
    }, [feedbackLoaded]);

    useEffect(() => {
        nav.setOptions({
            title: 'Edit Template',  // Set your desired title here
        headerRight: () => (
            <TouchableOpacity onPress={() => {
                saveTemplate();
            }} style={styles.hideButton}>
                <Text style={styles.hideButtonText}>Save</Text>
            </TouchableOpacity>
        )
        });
    }, [nav]);

    const loadTemplate = async () => {
        try {
            const mappedExercises = await Promise.all(template.exercises.map(async ex => {
                console.log('exercise good', ex);
                console.log('repsconfig', exercisePresets[ex.name].repsConfig);
                return {
                    id: ex.id,
                    name: ex.name,
                    weightUnit: 'lbs', // can adjust to default weight unit preferred by user
                    repsUnit: exercisePresets[ex.name].repsConfig === 'R' ? 'reps' : 'time',
                    sets: ex.setsKeys.map((setKey, index) => {
                        return {
                            key: setKey,
                        };
                    }),
                    isSuperset: ex.isSuperset,
                    supersetExercise: ex.supersetExercise,
                    weightConfig: exercisePresets[ex.name].weightConfig || 'W',
                    repsConfig: exercisePresets[ex.name].repsConfig || 'R',
                };
            }));
            setExercises(mappedExercises);
            console.log('exerciceslist after loading', exercises);
        } catch (error) {
            console.log('Error loading template:', error);
            console.log('template when loading:', template);
        }
    };


    const fetchUserExercises = async () => {
        if (!firebase_auth.currentUser) return;

        const userId = firebase_auth.currentUser.uid;
        const userExercisesRef = collection(db, "userProfiles", userId, "exercises");
        const querySnapshot = await getDocs(userExercisesRef);
        const exercises = querySnapshot.docs.map(doc => doc.data().name);
        setUserExercises(exercises);
    };

    const fetchExercisePresets = async () => {
        const exercisePresetsRef = collection(db, "exercisePresets");
        const querySnapshot = await getDocs(exercisePresetsRef);
        const presets = {};
        querySnapshot.docs.forEach(doc => {
            const data = doc.data();
            presets[data.name] = {
                weightConfig: data.weightConfig,
                repsConfig: data.repsType
            };
        });

        console.log('presets fetched');
        setExercisePresets(presets);
        setExercisePresetsLoaded(true);
    };

    const getSuggestions = (text) => {
        const allExercises = [...new Set([...commonExercises, ...userExercises])];
        return allExercises.filter(ex => ex.toLowerCase().includes(text.toLowerCase()));
    };



    const addSet = (exerciseIndex) => {

        const existingSets = exercises[exerciseIndex].sets.filter(set => !set.key.includes('_dropset'));

        const newSets = [...exercises[exerciseIndex].sets, {
            key: `set${existingSets.length + 1}`,
            weight: '',
            reps: '',
            isFailure: null,
            completed: false
        }];
        const newExercises = [...exercises];
        newExercises[exerciseIndex].sets = newSets;
        setExercises(newExercises);
    };

    const updateSetData = (text, exerciseIndex, setIndex, type) => {
        const newExercises = [...exercises];

        if (type === 'weight') {
            newExercises[exerciseIndex].sets[setIndex][type] = parseFloat(text);
        } else if (type === 'reps') {
            newExercises[exerciseIndex].sets[setIndex][type] = parseInt(text);
        } else if (type === 'time') {
            newExercises[exerciseIndex].sets[setIndex]['reps'] = text; // Keep as string for time format (mm:ss)
        }

        setExercises(newExercises);
    };

    const updateWeightUnit = (exerciseIndex, unit) => {
        const newExercises = [...exercises];
        newExercises[exerciseIndex].weightUnit = unit;
        setExercises(newExercises);
    };

    const generateUniqueId =  () => {
        return `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    };

    const addExercise = async (selectedExercise, parentExerciseIndex = null) => {
        const newExercise = {
            id: generateUniqueId(),
            name: selectedExercise,
            sets: [{ key: 'set1', weight: '', reps: '', isFailure: null, completed: false}],
            weightUnit:'lbs',
            repsUnit: exercisePresets[selectedExercise].repsConfig === 'R'? 'reps': 'time',
            supersetExercise: '',
            weightConfig: exercisePresets[selectedExercise].weightConfig || 'W',
            repsConfig: exercisePresets[selectedExercise].repsConfig || 'R',
            isSuperset: parentExerciseIndex != null,
        };

        // Fetch the previous attempt for the new exercise
        const latestAttempt = await fetchLatestAttempt(selectedExercise);

        // Store the previous attempts in the showPreviousAttempts state
        if (latestAttempt) {
            setShowPreviousAttempts(prev => ({
                ...prev,
                [newExercise.id]: latestAttempt
            }));
            console.log("prev attempts", showPreviousAttempts);
        }

        const newExercises = [...exercises];
        if (parentExerciseIndex !== null && parentExerciseIndex >= 0 && parentExerciseIndex < newExercises.length) {
            // It's a superset, update the parent exercise
            newExercises[parentExerciseIndex].supersetExercise = newExercise.id;
            newExercises.push(newExercise);
            setExercises(newExercises);
        } else {
            // It's a regular exercise
            setExercises([...exercises, newExercise]);
        }
        setPickerModalVisible(false);
    };

    const deleteSet = (exerciseIndex, setIndex) => {
        const newExercises = [...exercises];
        newExercises[exerciseIndex].sets = newExercises[exerciseIndex].sets.filter((_, i) => i !== setIndex);
        setExercises(newExercises);
    };


    const deleteDropSet = (exerciseIndex, setIndex, dropSetIndex) => {
        const newExercises = [...exercises];
        newExercises[exerciseIndex].sets[setIndex].dropSets = newExercises[exerciseIndex].sets[setIndex].dropSets.filter((_, i) => i !== dropSetIndex);

        setExercises(newExercises);
    };

    const calculateTotalWeight = (weight, weightConfig, unit) => {
        let totalWeight;
        switch (weightConfig) {
            case 'weightPerSide':
                totalWeight = weight * 2;
                break;
            case 'weightPerSideBarbell':
                if (unit === 'lbs') {
                    totalWeight = (weight * 2) + 45;
                } else {
                    totalWeight = (weight * 2) + 20;
                }
                break;
            case 'bodyWeight':
                totalWeight = 'BW';
                break;
            case 'extraWeightBodyWeight':
                totalWeight = `BW + ${weight} ${unit}`;
                break;
            default:
                totalWeight = weight;
        }
        return totalWeight;
    };



    const loadPreviousAttempt = (exerciseIndex, setIndex, previousSet, prevWeightUnit) => {
        const newExercises = [...exercises];

        // Handling parent exercise sets
        const exercise = newExercises[exerciseIndex];

        const conversionFactor = prevWeightUnit === 'lbs' && exercise.weightUnit === 'kgs' ? 0.453592 : (prevWeightUnit === 'kgs' && exercise.weightUnit === 'lbs' ? 2.20462 : 1);
        const convertedValue = previousSet.weight * conversionFactor;

        exercise.sets[setIndex].weight = convertedValue;
        exercise.sets[setIndex].reps = previousSet.reps;

        console.log('update', exercise)

        setExercises(newExercises);
    };




    const renderSets = (sets, exerciseIndex) => {
        const exercise = exercises[exerciseIndex];
        const exerciseId = exercise.id;

        return (
            <View>
                {sets.map((set, setIndex) => {
                    const isDropSet = set.key.includes('_dropset');
                    const parentSetIndex = isDropSet ? set.key.split('_')[0].replace('set', '') : null;
                    let indicator = '';
                    const previousSet = showPreviousAttempts[exerciseId]?.find(prevSet => prevSet.key === set.key) || {};
                    const repsAreTimed = exercise.repsConfig === 'H' || exercise.repsConfig === 'C';
                    const repsString = repsAreTimed? 'Time': 'Reps';

                    if (isDropSet) {
                        indicator = 'D'; // Dropset indicator
                    } else {
                        // Extract the set number from the key, assuming it's in the format 'setX'
                        const setNumber = set.key.match(/set(\d+)/);
                        indicator = setNumber ? setNumber[1] : '';
                    }

                    const isWeightDisabled = exercise.weightConfig === 'BW';


                    return (
                        <GestureHandlerRootView key={set.key}>
                            <Swipeable
                                renderLeftActions={() => (
                                    <TouchableOpacity
                                        style={styles.deleteButton}
                                        onPress={() => deleteSet(exerciseIndex, setIndex)}
                                    >
                                        <Text style={styles.deleteButtonText}>Delete</Text>
                                    </TouchableOpacity>
                                )}
                                renderRightActions={() => (
                                    <TouchableOpacity
                                        style={styles.addButton}
                                        onPress={() => addDropSet(exerciseIndex, setIndex)}
                                    >
                                        <Text style={styles.deleteButtonText}>Add Drop Set</Text>
                                    </TouchableOpacity>
                                )}
                            >
                                <View style={styles.setRow}>
                                    <Text style={styles.setIndicator}>{indicator}</Text>
                                    <View style={styles.previousAttemptContainer}>
                                        {previousSet && (previousSet.weight || previousSet.reps) ? (
                                            <TouchableOpacity
                                                onPress={() => loadPreviousAttempt(exerciseIndex, setIndex, previousSet, showPreviousAttempts[exerciseId].weightUnit)}
                                                style={styles.previousAttemptRow}
                                            >
                                                <Text>{`${previousSet?.weight || ''} x ${previousSet?.reps || ''}`}</Text>
                                            </TouchableOpacity>
                                        ) : (
                                            <View style={styles.previousAttemptRow}>
                                                <Text style={styles.indicatorText}>-- x --</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.weightInput}></Text>
                                    <Text style={styles.repsInput}></Text>
                                </View>
                            </Swipeable>
                        </GestureHandlerRootView>
                    );
                })}
            </View>
        );
    };


    const addDropSet = (exerciseIndex, parentSetIndex) => {
        const parentSetKey = `set${parentSetIndex}`;
        const existingDropSets = exercises[exerciseIndex].sets.filter(set => set.key.startsWith(`${parentSetKey}_dropset`));
        const dropSetOrder = existingDropSets.length + 1; // Determine the next order for the dropset
        const dropSetKey = `set${parentSetIndex}_dropset${dropSetOrder}`;

        const newDropSet = {
            key: dropSetKey,
            weight: '',
            reps: '',
            weightUnit: 'lbs',
            repsUnit: 'reps',
            isFailure: null,
            completed: false,
        };

        const newExercises = [...exercises];
        newExercises[exerciseIndex].sets.splice(parentSetIndex + 1, 0, newDropSet);
        setExercises(newExercises);
    };




    const deleteExercise = (index) => {
        // Helper function to recursively delete exercises
        const deleteExerciseRecursively = (exerciseId, exercisesList) => {
            const exerciseIndex = exercisesList.findIndex(ex => ex.id === exerciseId);

            if (exerciseIndex !== -1) {
                const exerciseToDelete = exercisesList[exerciseIndex];
                exercisesList = exercisesList.filter((_, i) => i !== exerciseIndex);

                if (exerciseToDelete.supersetExercise) {
                    exercisesList = deleteExerciseRecursively(exerciseToDelete.supersetExercise, exercisesList);
                }
            }

            return exercisesList;
        };

        // Helper function to reset supersetExercise property
        const resetSupersetExercise = (exercisesList, deletedExerciseId) => {
            return exercisesList.map(exercise => {
                if (exercise.supersetExercise === deletedExerciseId) {
                    return { ...exercise, supersetExercise: '' };
                }
                return exercise;
            });
        };

        // Get the exercise being deleted
        const deletedExercise = exercises[index];

        // Create a copy of the exercises array
        let newExercises = [...exercises];

        if (!deletedExercise.isSuperset) {
            // If the exercise is not a superset, delete it recursively
            newExercises = deleteExerciseRecursively(deletedExercise.id, newExercises);
        } else {
            // If the exercise is a superset, handle its deletion and connection
            const parentExerciseIndex = newExercises.findIndex(ex => ex.supersetExercise === deletedExercise.id);
            const childExerciseId = deletedExercise.supersetExercise;

            // Remove the superset exercise
            newExercises = newExercises.filter((_, i) => i !== index);

            if (parentExerciseIndex !== -1 && childExerciseId) {
                // Connect the parent to the child
                newExercises[parentExerciseIndex].supersetExercise = childExerciseId;
            } else if (parentExerciseIndex !== -1) {
                // Reset the parent supersetExercise if no child exists
                newExercises[parentExerciseIndex].supersetExercise = '';
            }
        }

        // Update the exercises list to reset supersetExercise property where needed
        const updatedExercises = resetSupersetExercise(newExercises, deletedExercise.id);

        setExercises(updatedExercises);
    };





    const saveTemplate = async () => {
        if (!firebase_auth.currentUser) {
            Alert.alert("Error", "You must be logged in to save the template.");
            return;
        }

        const userId = firebase_auth.currentUser.uid;

        const templateRef = collection(db, "userProfiles", userId, "templates");

        const templateExercises = exercises.map(ex => ({
            id: camelCase(ex.name),
            name: ex.name,
            setsKeys: ex.sets.map(set => set.key),
            supersetExercise: ex.supersetExercise,
            isSuperset: ex.isSuperset,
        }));

        const existingTemplateRef = doc(templateRef, template.id);

        await updateDoc(existingTemplateRef, {
            templateName: template.templateName,
            exercises: templateExercises,
            updatedAt: new Date()  // You can add an updatedAt field to track changes
        });

        Alert.alert('Template updated!');
        nav.goBack();

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




    const renderExerciseItem = ({ item, index, isSuperset = false}) => {

        const renderExercise = (exercise, exerciseIndex) => {


            const toggleWeightUnit = () => {
                const newExercises = [...exercises];
                const currentUnit = newExercises[exerciseIndex].weightUnit;
                newExercises[exerciseIndex].weightUnit = currentUnit === 'lbs' ? 'kgs' : 'lbs';
                setExercises(newExercises);
            };


            const toggleAllCompleted = () => {
                const newExercises = [...exercises];
                newExercises[exerciseIndex].sets = newExercises[exerciseIndex].sets.map(set => ({
                    ...set,
                    completed: true,
                }));
                setExercises(newExercises);
            };

            const toggleAllFailure = () => {
                const newExercises = [...exercises];
                newExercises[exerciseIndex].sets = newExercises[exerciseIndex].sets.map(set => ({
                    ...set,
                    isFailure: !set.isFailure,
                }));
                setExercises(newExercises);
            };

            const repsAreTimed = exercise.repsConfig === 'H' || exercise.repsConfig === 'C';

            return(
                <View key={exercise.id} style={isSuperset ? styles.supersetContainer : styles.exerciseContainer}>
                    <FontAwesome5
                        name="times"
                        onPress={() => deleteExercise(exerciseIndex)}
                        size={20}
                        color="black"
                        style={isSuperset ? styles.deleteSupersetButton : styles.deleteExerciseButton}
                    />

                    <Text style={styles.header}>{exercise.name}</Text>

                    <View style={styles.indicatorsRow}>
                        <Text style={[styles.setIndicator]}>Set</Text>
                        <Text style={[styles.previousAttemptHeader]}>Previous</Text>

                        <TouchableOpacity onPress={toggleWeightUnit} style={styles.weightToggleContainer}>
                            <Text style={styles.weightHeader}>
                                {exercise.weightConfig === 'BW'? '+': ''}{exercise.weightUnit}
                            </Text>
                        </TouchableOpacity>
                        <Text style={[styles.repsIndicatorText]}>{repsAreTimed? 'TIME': 'REPS'}</Text>
                    </View>

                    {renderSets(exercise.sets, exerciseIndex)}

                    <View style={styles.buttonsRow}>
                        <Button title="+ add set" onPress={() => addSet(exerciseIndex)} color='#016e03' />
                        {!item.supersetExercise && <Button title="+ add superset" color='#016e03' onPress={() => {
                            setSelectedExerciseIndex(exerciseIndex);
                            setPickerModalVisible(true);
                        }} />}
                    </View>
                    {item.supersetExercise && exercises.find((ex) => ex.id === item.supersetExercise) &&
                        renderExerciseItem({ item: exercises.find((ex) => ex.id === item.supersetExercise), index: exercises.findIndex((ex) => ex.id === item.supersetExercise),isSuperset: true })}
                </View>
            );
        };

        return (
            <View key={item.id}>
                {renderExercise(item, index)}
            </View>
        );
    };



    const generatePickerItems = (range) => {
        return Array.from({ length: range }, (_, i) => ({ label: `${i}`, value: i }));
    };

    const animatedStyle = useAnimatedStyle(() => {
        return {
            height: withTiming(timerHeight.value, { duration: 300 }),
        };
    });


    const openFeedbackModal = () => {
        setFeedbackLoaded(false);
        setFeedbackModalVisible(true);
    };

    const closeFeedbackModal = () => {
        setFeedbackModalVisible(false);
    };




    return (
        <GestureHandlerRootView style={styles.fullScreenContainer}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1}}
            >
                <FlatList
                    data={exercises.filter(exercise => !exercise.isSuperset)}
                    renderItem={renderExerciseItem}
                    keyExtractor={(item) => item.id}
                    ListFooterComponent={() => (
                        <View>
                            <Button title="Add Exercise" color='#016e03' onPress={() => {
                                setSelectedExerciseIndex(null);
                                setPickerModalVisible(true);
                            }} />
                        </View>
                    )}
                    keyboardShouldPersistTaps="handled"
                    style={{ zIndex: 1, flex: 1, height: '80%' }}
                    nestedScrollEnabled={true}
                />
                    <Button title="Customize with AI" onPress={openFeedbackModal} color='#016e03'/>
            </KeyboardAvoidingView>

            <ExercisePickerModal
                visible={pickerModalVisible}
                onClose={() => setPickerModalVisible(false)}
                onSelectExercise={(exerciseName) => addExercise(exerciseName, selectedExerciseIndex)}
                onCustomExercise={(customPreset) => {
                    exercisePresets[customPreset.name] = {
                        weightConfig: customPreset.weightConfig,
                        repsConfig: customPreset.repsType
                    };
                    addExercise(customPreset.name, selectedExerciseIndex)
                }}
            />

            <FeedbackModal
                visible={feedbackModalVisible}
                onClose={closeFeedbackModal}
                useTemplateFeedback={useTemplateFeedback}
                exercises={exercises}  // Pass exercises state to the modal
                template={template}    // Pass template to the modal
            />

        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    fullScreenContainer: {
        flex: 1,
        padding: 10,
        backgroundColor: '#f8f9fa',
        width: '100%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 30,
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        marginVertical: 20,
    },
    headerText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    hideButton: {
        padding: 10,
        backgroundColor: '#016e03',
        borderRadius: 5,
    },
    hideButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    exercisesContainer: {
        marginBottom: 20,
        paddingBottom: 20,
    },
    exerciseContainer: {
        marginBottom: 20,
        padding: 5,
        backgroundColor: '#fff',
        borderRadius: 7,
        position: 'relative',
        paddingTop: 60, // Adjust padding to make space for the edit button
        shadowColor: '#000000',
        shadowOffset: {
            width: 1,
            height: 1
        },
        shadowRadius: 2,
        shadowOpacity: 0.5
    },
    header: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        paddingVertical: 3,
    },
    setRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    weightInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        marginRight: 5,
        borderRadius: 5,
        backgroundColor: '#fff',
    },
    repsInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        borderRadius: 5,
        backgroundColor: '#fff',
    },
    buttonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    buttonContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 20,
    },
    saveButton: {
        backgroundColor: '#007bff',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 8,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    deleteExerciseButton: {
        position: 'absolute',
        top: 15, // Adjust to properly align the button
        right: 10,
        padding: 10,
        borderRadius: 5,
        zIndex: 1, // Ensure it stays above other elements
    },
    deleteSupersetButton: {
        position: 'absolute',
        top: 15, // Adjust to properly align the button
        right: 10,
        padding: 10,
        borderRadius: 5,
        zIndex: 1, // Ensure it stays above other elements
    },
    unitButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 10,
    },
    unitButton: {
        height: 40,
        justifyContent: 'center',
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: 'gray',
        borderRadius: 8,
        marginHorizontal: 4,
    },
    unitButtonSelected: {
        backgroundColor: 'blue',
    },
    unitButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    unitButtonSelectedText: {
        color: 'white',
    },
    unitButtonUnselectedText: {
        color: 'black',
    },
    suggestionsContainer: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        marginTop: 5,
        maxHeight: 200,
        backgroundColor: '#fff',
        zIndex: 1000,
        overflow: 'scroll',
    },
    suggestionItem: {
        borderBottomColor: '#ccc',
        borderBottomWidth: 1,
    },
    suggestionItemText: {
        fontSize: 16,
        padding: 10,
    },
    checkboxLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        left: 10,
    },
    saveTemplateText:{
        alignSelf: 'flex-start',
    },
    templateNameInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        marginLeft: 10,
        borderRadius: 5,
        backgroundColor: '#fff',
        flex: 1,
    },
    supersetContainer: {
        marginTop: 5,
        paddingTop: 60, // Adjust padding to make space for the edit button
        position: 'relative',
    },
    deleteButton: {
        backgroundColor: 'red',
        justifyContent: 'center',
        alignItems: 'center',
        width: 75,
        height: '100%',
        borderRadius: 8,
        marginHorizontal: 4,
    },
    deleteButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        marginBottom: 10,
    },
    modalSubTitle: {
        fontSize: 16,
        marginVertical: 10,
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        width: 200,
        textAlign: 'center',
        marginBottom: 10,
        borderRadius: 5,
    },
    configContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    configColumn: {
        flex: 1,
        marginHorizontal: 10,
    },
    configOption: {
        padding: 10,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        marginBottom: 10,
        textAlign: 'center',
        backgroundColor: '#f8f9fa',
    },
    configOptionSelected: {
        backgroundColor: '#016e03',
        color: '#fff',
    },
    timerContainer: {
        position: 'absolute',
        bottom: 60,
        width: '100%',
        backgroundColor: 'white',
        paddingBottom: 60,
        paddingTop: 20,
        paddingHorizontal: 20,
        alignItems: 'center',
        zIndex: 5,
        alignSelf: 'center',
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    timerText: {
        fontSize: 30,
        color: 'blue',
        fontWeight: 'bold',
    },
    addButton: {
        backgroundColor: 'green',
        justifyContent: 'center',
        alignItems: 'center',
        width: 100,
        height: '100%',
        borderRadius: 8,
        marginHorizontal: 4,
    },
    adjustTimeButton: {
        borderRadius: 8,
    },
    adjustTimeButtonText: {
        fontSize: 18,
        color: 'blue',
        fontWeight: 'bold',
        padding: 10
    },
    bottomTab: {
        bottom: 10,
        width: '100%',
        backgroundColor: '#fff',
        padding: 20,
        paddingBottom: 30,
        borderTopWidth: 1,
        borderTopColor: '#ccc',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10,
        position: 'absolute',
        alignSelf: 'center'
    },
    setTimerButton: {
        backgroundColor: '#016e03',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 8,
        alignItems: 'center',
    },
    setTimerButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    swipeBarContainer: {
        position: 'absolute',
        top: 10,
        left: '50%',
        zIndex: 10,
    },
    swipeBar: {
        width: 50,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: '#ccc',
        marginBottom: 10,
    },
    resetButton: {
        backgroundColor: 'red',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 8,
        alignItems: 'center',
    },
    resetButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    editButton: {
        position: 'absolute',
        top: 15, // Adjust to properly align the button
        left: 10,
        padding: 10,
        borderRadius: 5,
        zIndex: 1, // Ensure it stays above other elements
    },
    editButtonText: {
        color: 'blue',
        fontSize: 12,
        fontWeight: 'bold',
    },
    pickerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,

    },
    pickerSeparator: {
        fontSize: 24,
        fontWeight: 'bold',
        marginHorizontal: 10,
    },
    dropSetsContainer: {
        marginLeft: 20,
    },
    dropSetRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginBottom: 10,
        marginRight: 50,
    },
    extraMove: {
        marginRight: 100,
    },
    previousAttemptButton: {
        backgroundColor: 'blue',
        justifyContent: 'center',
        alignItems: 'center',
        width: 150,
        height: '100%',
    },
    previousAttemptContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    previousAttemptText: {
        fontSize: 14,
        color: 'gray',
    },
    compareButton: {
        position: 'absolute',
        top: 15, // Adjust to properly align the button
        left: 50, // Adjust position next to ellipsis
        padding: 10,
        borderRadius: 5,
        zIndex: 1, // Ensure it stays above other elements
    },
    previousAttemptRow: {
        backgroundColor: '#e0e0e0',
        padding: 5,
        marginVertical: 2,
        borderRadius: 5,
    },
    indicatorText: {
        color: '#aaa',
        fontStyle: 'italic',
    },
    blueIcon: {
        fontSize:13,
        color: 'blue',
        fontWeight: 'bold',
        marginVertical: 2,
    },
    blackIcon: {
        fontSize:13,
        color: 'black',
        fontWeight: 'bold',
        marginVertical: 2,
    },
    dropSetIcon: {
        marginRight: 10,
        color: 'black', // You can change the color as needed
    },
    addAllPreviousButton: {
        padding: 8,
        backgroundColor: '#e0e0e0',
        borderRadius: 5,
        marginBottom: 5,
        marginLeft: 15,
        width: '23%',
    },
    addAllPreviousButtonText: {
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 13,
    },
    failureButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'black',
        marginLeft: 10,
    },
    failureButtonActive: {
        backgroundColor: 'red',
    },
    failureButtonText: {
        color: 'black',
        fontWeight: 'bold',
    },
    failureButtonTextActive: {
        color: 'white',
    },
    workoutTimeText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#016e03',
    },
    toggleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
    },
    toggleLabel: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    templateCheckContainer: {
        marginLeft: 10,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    checkboxContainer: {
        flex: 0.5, // Adjust according to the space needed for the checkbox
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 5,
    },
    checkboxUnchecked: {
        width: 40,
        height: 40,
        borderWidth: 2,
        borderColor: 'green',
        borderRadius: 12,
        justifyContent: 'center',
    },
    checkboxChecked: {
        width: 40,
        height: 40,
        borderWidth: 2,
        borderColor: 'green',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'green',
    },
    checkboxText: {
        color: 'white',
        fontWeight: 'bold',
    },
    toggleButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 10,
        alignItems: 'center',
    },
    indicatorsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    indicatorIcon: {
        flex: 1,
        textAlign: 'center',
    },
    repsIndicatorText: {
        flex: 2, // Adjust according to the space needed for reps input
        textAlign: 'center',
        color: '#aaa',
        fontStyle: 'italic',
    },
    allCheckboxContainer: {
        paddingHorizontal: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    allCheckboxChecked: {
        width: 40,
        height: 40,
        borderWidth: 2,
        borderColor: 'green',
        alignItems: 'center',
        borderRadius: 12,
        justifyContent: 'center',
        backgroundColor: 'green',
    },
    allFailureButton: {
        alignItems: 'center',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'black',
        marginLeft: 10,
        right: 10,
    },
    adjustButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#016e03',
    },
    adjustButtonText: {
        fontSize: 30,
        color: 'white',
    },
    adjustText: {
        fontSize: 24,
        marginHorizontal: 20,
    },
    adjustContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '80%',
        marginBottom: 20,
    },
    adjustInput: {
        fontSize: 24,
        marginHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        textAlign: 'center',
        width: 100,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    unitText: {
        fontSize: 24,
        marginLeft: 5,
    },
    unitSwitcher: {
        marginLeft: 5,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        backgroundColor: '#f8f9fa',
    },
    inputText: {
        fontSize: 14,
        color: '#000',
    },
    setIndicator: {
        fontSize: 17,
        fontWeight: 'bold',
        alignSelf: 'center',
        paddingLeft: 5,
        color: '#016e03', // Customize as needed
        marginRight: 15, // Space between the indicator and the input fields
    },
    columnHeader: {
        flex: 1, // Ensure each column takes up an equal portion of the row
        textAlign: 'center',
    },
    previousAttemptHeader: {
        color: '#aaa',
        fontStyle: 'italic',
    },
    weightHeader: {
        flex: 2, // Adjust according to the space needed for weight input
        textAlign: 'center',
        fontWeight: "bold",
        fontSize: 16,
        fontStyle: 'italic',
        padding: 10,
        color: '#4E5760',
    },
    weightToggleContainer: {
        flex: 1,
        paddingLeft: 30,
        alignItems: 'center',
        justifyContent: 'center'
    },
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        marginTop: 10,
        marginBottom: 10,
    },
});

const pickerSelectStyles = StyleSheet.create({
    picker: {
        width: 200,
        height: 150,
    },
    inputIOS: {
        fontSize: 18,
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        color: 'black',
        paddingRight: 30,
    },
    inputAndroid: {
        fontSize: 18,
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        color: 'black',
        paddingRight: 30,
    },
});

export default EditTemplateScreenUpdated;
