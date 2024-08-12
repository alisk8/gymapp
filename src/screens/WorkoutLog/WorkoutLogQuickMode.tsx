import React, {useState, useEffect, useRef, useCallback} from 'react';
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
import { v4 as uuidv4 } from 'uuid';



export default function WorkoutLogQuickMode({route}) {
    const nav = useNavigation();

    const [exercises, setExercises] = useState([
        { id: 'exercise1', name: 'Exercise 1', setsNum: 3, bestSet: { key: 'set1', weight: '', reps: '', dropSets: [], weightUnit: 'lbs', repsUnit: 'reps'}, supersetExercise: '', weightConfig: 'W', repsConfig: 'reps', isSuperset: false, completed: false}
    ]);
    const [suggestions, setSuggestions] = useState([]);
    const [userExercises, setUserExercises] = useState([]);
    const [exercisePresets, setExercisePresets] = useState({});
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(null);
    const [isTemplate, setIsTemplate] = useState(false);
    const [templateName, setTemplateName] = useState('');
    const [timerModalVisible, setTimerModalVisible] = useState(false);
    const [countdownMinutes, setCountdownMinutes] = useState(0);
    const [countdownSeconds, setCountdownSeconds] = useState(0);
    const [initialTime, setInitialTime] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState(null);
    const [timerRunning, setTimerRunning] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editExerciseIndex, setEditExerciseIndex] = useState(null);
    const [weightConfig, setWeightConfig] = useState('totalWeight');
    const [repsConfig, setRepsConfig] = useState('reps');
    const [timerConfigured, setTimerConfigured] = useState(false); // New state variable
    const [comparisonModalVisible, setComparisonModalVisible] = useState(false);
    const [selectedExercise, setSelectedExercise] = useState(null);
    const { isPaused, workoutState, setWorkoutState, resetWorkout, startWorkoutLog, stopWorkoutLog, startTime, elapsedTime, setElapsedTime, pauseWorkoutLog, finishWorkout, workoutFinished, pauseWorkout} = useWorkout();
    const previousScreen = route.params?.previousScreen;
    const [showPreviousAttempts, setShowPreviousAttempts] = useState({});
    const [isFailureTracking, setIsFailureTracking] = useState(false);
    const [currentSetsExerciseIndex, setCurrentSetsExerciseIndex] = useState(null); // New state variable for current exercise index for sets
    const [setsModalVisible, setSetsModalVisible] = useState(false); // New state variable for sets modal

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedExerciseIndex, setSelectedExerciseIndex] = useState(null);
    const [selectedSetIndex, setSelectedSetIndex] = useState(null);
    const [selectedDropSetIndex, setSelectedDropSetIndex] = useState(null);
    const [selectedType, setSelectedType] = useState(''); // 'weight' or 'reps'
    const [tempWeight, setTempWeight] = useState(0);
    const [tempReps, setTempReps] = useState(0);
    const [weightUnit, setWeightUnit] = useState('lbs'); // Default to 'lbs'
    const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
    const [proceedWithSave, setProceedWithSave] = useState(false);


    const timerHeight = useSharedValue(120);

    const template = route?.params?.template;
    const exercisesRef = useRef(exercises);
    const typingTimeoutRef = useRef(null);


    /**
    useEffect(() => {
        let timer;
        if (startTime && !workoutFinished) {
            timer = setInterval(() => {
                const currentTime = new Date();
                const updatedElapsedTime = Math.floor((currentTime - startTime) / 1000);
                setElapsedTime(updatedElapsedTime);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [startTime, workoutFinished]);
     **/

    /** reset if needed
    useFocusEffect(() => {
        resetWorkout();
        console.log('after reset:',exercises);
    });
     **/

    useFocusEffect(
        useCallback(() => {
            console.log('isPaused state changed:', isPaused);
        }, [isPaused])
    );

    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;

        return `${hours > 0 ? `${hours}:` : ''}${hours > 0 ? minutes.toString().padStart(2, '0') : minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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
                        setNumber: index + 1,
                        weight: set.weight,
                        reps: set.reps,
                        dropSets: set.dropSets
                    }));
                }
            });
        });
        console.log('here', latestAttempt)

        return latestAttempt;
    };

    useEffect(() => {
        fetchExercisePresets();
        fetchUserExercises();
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
            setSuggestions([]);
        });

        return () => {
            keyboardDidHideListener.remove();
        };
    }, []);

    useEffect(() => {
        if (template) {
            const mappedExercises = template.exercises.map(ex => ({
                ...ex,
                weightUnit: 'lbs', // can adjust to default weight unit preferred by user
                sets: ex.sets.map((set, index) => ({
                    key: `set${index + 1}`,
                    weight: '',
                    reps: '',
                    dropSets: Array.from({ length: set.dropSetsCount }, (_, dropIndex) => ({ key: `dropset${dropIndex + 1}`, weight: '', reps: '' }))
                })),
                supersets: (ex.supersets || []).map(superset => ({
                    ...superset,
                    weightUnit: 'lbs',
                    sets: superset.sets.map((set, index) => ({
                        key: `set${index + 1}`,
                        weight: '',
                        reps: '',
                        dropSets: Array.from({ length: set.dropSetsCount }, (_, dropIndex) => ({ key: `dropset${dropIndex + 1}`, weight: '', reps: '' }))
                    }))
                }))
            }));
            setExercises(mappedExercises);
        }
    }, [template]);

    useEffect(() => {
        let timer;
        if (timerRunning && timeRemaining > 0) {
            timer = setInterval(() => {
                setTimeRemaining(prevTime => prevTime - 1);
            }, 1000);
        } else if (timeRemaining === 0) {
            setTimerRunning(false);
            Alert.alert("Time's up!");
        }

        return () => clearInterval(timer);
    }, [timerRunning, timeRemaining]);

    const startTimer = () => {
        const timeInSeconds = (parseInt(countdownMinutes) * 60) + parseInt(countdownSeconds);
        setInitialTime(timeInSeconds);
        setTimeRemaining(timeInSeconds);
        setTimerRunning(true);
        setTimerModalVisible(false);
        setTimerConfigured(true);
    };

    const toggleTimer = () => {
        setTimerRunning(prev => !prev);
    };

    const resetTimer = () => {
        setTimeRemaining(initialTime);
        setTimerRunning(false);
    };

    const adjustTime = (amount) => {
        setTimeRemaining(prevTime => Math.max(0, prevTime + amount));
    };

    const convertWeight = (weight, fromUnit, toUnit) => {
        if (fromUnit === toUnit) return weight;
        if (fromUnit === 'lbs' && toUnit === 'kgs') return weight * 0.453592;
        if (fromUnit === 'kgs' && toUnit === 'lbs') return weight / 0.453592;
        return weight;
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
                repsConfig: data.repsConfig
            };
        });
        setExercisePresets(presets);
    };

    const getSuggestions = (text) => {
        const allExercises = [...new Set([...commonExercises, ...userExercises])];
        return allExercises.filter(ex => ex.toLowerCase().includes(text.toLowerCase()));
    };


    const handleExerciseNameChange = (text, index) => {
        setCurrentExerciseIndex(index);
        const newExercises = [...exercises];
        const oldId = newExercises[index].id;
        newExercises[index].name = text;
        setExercises(newExercises);
        setSuggestions(getSuggestions(text));

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            const updatedExercises = [...newExercises];
            setExercises(updatedExercises);
        }, 1500);
    };




    const updateSetData = (text, exerciseIndex, setIndex, type) => {
        const newExercises = [...exercises];
        newExercises[exerciseIndex].sets[setIndex][type] = text;
        setExercises(newExercises);
    };

    const updateWeightUnit = (exerciseIndex, unit) => {
        const newExercises = [...exercises];
        newExercises[exerciseIndex].weightUnit = unit;
        setExercises(newExercises);
    };

    const generateUniqueId = () => {
        return `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    };

    const addExercise = (parentExerciseIndex = null) => {
        const newExercise = {
            id: generateUniqueId(),
            name: 'New Exercise',
            bestSet: { key: 'set1', weight: '', reps: '', isFailure: null, dropSets: [], weightUnit: 'lbs'},
            supersetExercise: '',
            weightConfig: 'W',
            repsConfig: 'reps',
            isSuperset: parentExerciseIndex != null,
            completed: false,
            setsNum: 3,
        };

        console.log('is superset', newExercise.isSuperset);
        console.log('parent exercise index',parentExerciseIndex);

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

    const reverseCalculateWeight = (totalWeight, weightConfig, targetUnit) => {
        let weight = '';

        const weightParts = totalWeight.split(' ');
        const numericValue = parseFloat(weightParts[0]);
        const storedUnit = weightParts[1];

        const conversionFactor = storedUnit === 'lbs' && targetUnit === 'kgs' ? 0.453592 : (storedUnit === 'kgs' && targetUnit === 'lbs' ? 2.20462 : 1);
        const convertedValue = numericValue * conversionFactor;

        switch (weightConfig) {
            case 'weightPerSide':
                weight = (Math.floor(totalWeight / 2)).toString();
                break;
            case 'weightPerSideBarbell':
                weight = targetUnit === 'lbs' ? (Math.floor((convertedValue - 45) / 2)).toString() : (Math.floor((convertedValue - 20) / 2)).toString();
                break;
            case 'extraWeightBodyWeight':
                if (totalWeight.startsWith('BW + ')) {
                    weight = totalWeight.replace('BW + ', '').replace(` ${targetUnit}`, '');
                }
                break;
            case 'bodyWeight':
                return '';
            default:
                weight = totalWeight;
        }

        return weight;
    };

    const renderTotalWeightMessage = (exercise, sets) => {
        // Find the last set with a filled-in weight and its index
        let lastFilledSet = null;
        let lastFilledIndex = null;

        for (let i = sets.length - 1; i >= 0; i--) {
            if (sets[i].weight && !isNaN(parseFloat(sets[i].weight))) {
                lastFilledSet = sets[i];
                lastFilledIndex = i + 1; // +1 to display human-readable index (1-based)
                break;
            }
        }

        if (!lastFilledSet) {
            return null; // If no filled-in set is found, return null immediately
        }

        const weight = parseFloat(lastFilledSet.weight);
        if (exercise.weightConfig === 'totalWeight' || exercise.weightConfig === 'bodyWeight') {
            return null;
        }

        const totalWeight = calculateTotalWeight(weight, exercise.weightConfig, exercise.weightUnit);
        if (totalWeight !== null) {
            return (
                <Text key={lastFilledSet.key} style={styles.totalWeightMessage}>
                    {`Lifting ${totalWeight} total ${exercise.weightUnit} for set ${lastFilledIndex}`}
                </Text>
            );
        }

        return null;
    };

    const loadPreviousAttempt = (exerciseIndex, setIndex, previousSet, isDropSet = false, dropSetIndex = null) => {
        const newExercises = [...exercises];

        // Handling parent exercise sets
        const exercise = newExercises[exerciseIndex];

        if (isDropSet) {
            const dropSetKey = `dropset${dropSetIndex + 1}`;
            let currentSet = exercise.sets[setIndex];

            if (!currentSet.dropSets.find(d => d.key === dropSetKey)) {
                currentSet.dropSets.push({ key: dropSetKey, weight: '', reps: '' });
            }
            currentSet.dropSets[dropSetIndex].weight = reverseCalculateWeight(previousSet.weight, exercise.weightConfig, exercise.weightUnit);
            currentSet.dropSets[dropSetIndex].reps = previousSet.reps;
        } else {
            exercise.sets[setIndex].weight = reverseCalculateWeight(previousSet.weight, exercise.weightConfig, exercise.weightUnit);
            exercise.sets[setIndex].reps = previousSet.reps;
        }

        setExercises(newExercises);
    };
    const loadAllPreviousAttempts = (exerciseIndex) => {
        const exercise =  exercises[exerciseIndex];
        const previousSets = showPreviousAttempts[exercise.id];

        if (previousSets) {
            previousSets.forEach((previousSet, setIndex) => {
                if (previousSet) {
                    loadPreviousAttempt(exerciseIndex, setIndex, previousSet, false, null);
                    previousSet.dropSets?.forEach((dropSet, dropSetIndex) => {
                        loadPreviousAttempt(exerciseIndex, setIndex, dropSet, true, dropSetIndex);
                    });
                }
            });
        }
    };


    const renderSets = (exerciseIndex) => {
        const exercise = exercises[exerciseIndex];
        const { bestSet, weightConfig } = exercise;

        const weightPlaceholder = (() => {
            switch (weightConfig) {
                case 'W':
                    return 'Weight Lifted';
                case 'BW':
                    return 'Body Weight';
                case 'BW+':
                    return 'BW + Extra Weight';
                default:
                    return 'Weight Lifted';
            }
        })();

        const repsPlaceholder = (() => {
            switch (repsConfig) {
                case 'Reps':
                    return 'Reps';
                case 'Hold':
                    return 'Time (seconds)';
                case 'Cardio':
                    return 'Time (minutes)';
                default:
                    return 'Reps';
            }
        })();

        const isWeightDisabled = weightConfig === 'BW';


        if (!bestSet.dropSets) {
            bestSet.dropSets = [];
        }

        return (
            <View>
                <GestureHandlerRootView key={bestSet.key}>
                    <Swipeable
                        renderRightActions={() => (
                            <TouchableOpacity
                                style={styles.addButton}
                                onPress={() => addDropSet(exerciseIndex)}
                            >
                                <Text style={styles.deleteButtonText}>Add Drop Set</Text>
                            </TouchableOpacity>
                        )}
                    >
                        <View style={styles.setRow}>
                            <Text style={{ fontWeight: 'bold', fontSize: 12, paddingRight: 5, paddingVertical: 10 }}>Max: </Text>
                            <TouchableOpacity
                                style={styles.weightInput}
                                onPress={() => {
                                    setModalVisible(true);
                                    setSelectedExerciseIndex(exerciseIndex);
                                    setSelectedSetIndex(null); // No set index since there's only one set
                                    setSelectedDropSetIndex(null);
                                    setSelectedType('weight');
                                    const value = bestSet.weight;
                                    const unit = bestSet.weightUnit;
                                    setTempWeight(parseFloat(value) || 0);
                                    setWeightUnit(unit || 'lbs');
                                }}
                            >
                                <Text style={styles.inputText}>{bestSet.weight !== ''? `${bestSet.weight} ${weightUnit}`: `${weightPlaceholder} (${weightUnit})`}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.repsInput}
                                onPress={() => {
                                    setModalVisible(true);
                                    setSelectedExerciseIndex(exerciseIndex);
                                    setSelectedSetIndex(null); // No set index since there's only one set
                                    setSelectedDropSetIndex(null);
                                    setSelectedType('reps');
                                    setTempReps(parseFloat(bestSet.reps) || 0);
                                }}
                            >
                                <Text style={styles.inputText}>{bestSet.reps !== '' ? `${bestSet.reps}` : `Enter ${repsPlaceholder}`}</Text>
                            </TouchableOpacity>
                        </View>
                    </Swipeable>
                    {renderDropSets(bestSet.dropSets, exerciseIndex)}
                </GestureHandlerRootView>
                {renderTotalWeightMessage(exercise, bestSet)}
            </View>
        );
    };


    const updateDropSetData = (text, exerciseIndex, setIndex, dropSetIndex, type) => {
        const newExercises = [...exercises];
        newExercises[exerciseIndex].sets[setIndex].dropSets[dropSetIndex][type] = text;
        setExercises(newExercises);
    };

    const addDropSet = (exerciseIndex) => {
        const newExercises = [...exercises];
        const exercise =  newExercises[exerciseIndex];

        const newDropSet = {
            key: `dropset${exercise.bestSet.dropSets.length + 1}`,
            weight: '',
            weightUnit: 'lbs',
            reps: '',
        };

        newExercises[exerciseIndex].bestSet.dropSets.push(newDropSet);
        setExercises(newExercises);
    };

    const renderDropSets = (dropSets, exerciseIndex, setIndex) => {
        const exercise = exercises[exerciseIndex];

        const weightPlaceholder = (() => {
            switch (weightConfig) {
                case 'W':
                    return 'Weight Lifted';
                case 'BW':
                    return 'Body Weight';
                case 'BW+':
                    return 'BW + Extra Weight';
                default:
                    return 'Weight Lifted';
            }
        })();

        const repsPlaceholder = (() => {
            switch (repsConfig) {
                case 'Reps':
                    return 'Reps';
                case 'Hold':
                    return 'Time (seconds)';
                case 'Cardio':
                    return 'Time (minutes)';
                default:
                    return 'Reps';
            }
        })();

        const isWeightDisabled = exercise.weightConfig === 'BW';

        return (
            <View style={styles.dropSetsContainer}>
                {dropSets.map((dropSet, dropSetIndex) => (
                    <Swipeable
                        key={dropSet.key}
                        renderLeftActions={() => (
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => deleteDropSet(exerciseIndex, setIndex, dropSetIndex)}
                            >
                                <Text style={styles.deleteButtonText}>Delete</Text>
                            </TouchableOpacity>
                        )}
                    >
                        <View style={[styles.dropSetRow, isFailureTracking && styles.extraMove]}>
                            <FontAwesome5 name="arrow-down" size={16} style={styles.dropSetIcon}/>
                            <TouchableOpacity
                                style={styles.weightInput}
                                onPress={() => {
                                    setModalVisible(true);
                                    setSelectedExerciseIndex(exerciseIndex);
                                    setSelectedSetIndex(setIndex);
                                    setSelectedDropSetIndex(dropSetIndex);
                                    setSelectedType('weight');
                                    const value = dropSet.weight;
                                    const unit = dropSet.weightUnit;
                                    setTempWeight(parseFloat(value) || 0);
                                    setWeightUnit(unit || 'lbs');
                                }}
                            >
                                <Text style={styles.inputText}>{ dropSet.weight !== ''? `${dropSet.weight} ${dropSet.weightUnit}` : `Enter Weight (${weightUnit})`}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.repsInput}
                                onPress={() => {
                                    setModalVisible(true);
                                    setSelectedExerciseIndex(exerciseIndex);
                                    setSelectedSetIndex(setIndex);
                                    setSelectedDropSetIndex(dropSetIndex);
                                    setSelectedType('reps');
                                    setTempReps(parseFloat(dropSet.reps) || 0);
                                }}
                            >
                                <Text style={styles.inputText}>{dropSet.reps !== ''?`${dropSet.reps} `: 'Enter Reps'}</Text>
                            </TouchableOpacity>
                        </View>
                    </Swipeable>
                ))}
            </View>
        );
    };


    const renderSuggestions = (exerciseIndex) => (
        suggestions.length > 0 && (currentExerciseIndex === exerciseIndex) && (
            <FlatList
                data={suggestions}
                renderItem={({ item }) => (
                    <Pressable onPress={() => {
                        Keyboard.dismiss();
                        handleSuggestionSelect(item, exerciseIndex);
                    }} style={styles.suggestionItem}>
                        <Text style={styles.suggestionItemText}>{item}</Text>
                    </Pressable>
                )}
                keyExtractor={(item, index) => index.toString()}
                style={styles.suggestionsContainer}
                scrollEnabled={true}
            />
        )
    );

    const handleSuggestionSelect = (suggestion, exerciseIndex) => {
        const newExercises = [...exercises];
        newExercises[exerciseIndex].name = suggestion;

        // Check if the exercise has presets and set weightConfig and repsConfig accordingly
        if (exercisePresets[suggestion]) {
            newExercises[exerciseIndex].weightConfig = exercisePresets[suggestion].weightConfig;
            newExercises[exerciseIndex].repsConfig = exercisePresets[suggestion].repsConfig;
        }

        setExercises(newExercises);
        setSuggestions([]);
        setCurrentExerciseIndex(null);
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





    const saveWorkout = async (isTemplate) => {
        if (!firebase_auth.currentUser) {
            Alert.alert("Error", "You must be logged in to save workouts.");
            return;
        }

        const incompleteExercises = exercises.some(ex => !ex.completed);

        if (incompleteExercises && !proceedWithSave) {
            setConfirmationModalVisible(true);
            return;
        }
        const userId = firebase_auth.currentUser.uid;

        const filteredExercises = exercises.map(ex => {
            const bestSet = ex.bestSet;

            // Filter and validate the bestSet
            if (
                (bestSet.weight !== '' || ex.weightConfig === 'BW') &&
                bestSet.reps !== '' &&
                ex.completed
            ) {
                return {
                    id: camelCase(ex.name),
                    name: ex.name,
                    supersetExercise: ex.supersetExercise,
                    isSuperset: ex.isSuperset,
                };
            }

            // If bestSet is not valid, return null to filter it out later
            return null;
        }).filter(ex => ex !== null); // Filter out exercises with no valid bestSet

        if (filteredExercises.length === 0) {
            Alert.alert("Error", "Please add reps/failure to all sets and mark completed.");
            return;
        }

         try {

            /**
            await addDoc(collection(db, "userProfiles", userId, "workouts"), {
                exercises: filteredExercises,
                createdAt: new Date()
            });
            **/


            pauseWorkout();

            nav.navigate('WorkoutSummaryScreen', {previousScreen});

        } catch (error) {
            console.error("Error adding document: ", error);
            Alert.alert("Error", "Failed to save workouts.");
        }
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

            const toggleCompleted = () => {
                const newExercises = [...exercises];
                newExercises[exerciseIndex].completed = !newExercises[exerciseIndex].completed;
                setExercises(newExercises);
            };

            return(
                <View key={exercise.id} style={isSuperset ? styles.supersetContainer : styles.exerciseContainer}>
                    <FontAwesome5
                        name="times"
                        onPress={() => deleteExercise(exerciseIndex)}
                        size={20}
                        color="black"
                        style={isSuperset ? styles.deleteSupersetButton : styles.deleteExerciseButton}
                    />
                    <TouchableOpacity onPress={() => openEditModal(exerciseIndex)} style={styles.editButton}>
                        <FontAwesome5 name="ellipsis-h" size={20} color="black" />
                    </TouchableOpacity>


                    <View style={styles.indicatorsRow}>
                        <TouchableOpacity
                            onPress={() => {
                                setCurrentSetsExerciseIndex(exerciseIndex);
                                setSetsModalVisible(true);
                            }}
                            style={styles.setsButton}
                        >
                            <Text style={styles.setsButtonText}>{exercise.setsNum}</Text>
                        </TouchableOpacity>
                        <TextInput
                            style={styles.header}
                            onChangeText={(text) => handleExerciseNameChange(text, exerciseIndex)}
                            value={exercise.name}
                        />
                        <TouchableOpacity onPress={toggleCompleted} style={styles.checkboxContainer}>
                            {exercise.completed ? (
                                <View style={styles.checkboxChecked}>
                                    <Text style={styles.checkboxText}>✓</Text>
                                </View>
                            ) : (
                                <View style={styles.checkboxUnchecked} />
                            )}
                        </TouchableOpacity>
                    </View>
                    {renderSuggestions(exerciseIndex)}
                    {renderSets(exerciseIndex)}

                    <View style={styles.buttonsRow}>
                        {!item.supersetExercise && <Button title="+ add superset" onPress={() => addExercise(exerciseIndex)} />}
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


    const openEditModal = (exerciseIndex) => {
        const exercise = exercises[exerciseIndex];
        const currentConfig =  exercise;
        setWeightConfig(currentConfig.weightConfig);
        setRepsConfig(currentConfig.repsConfig);
        setEditExerciseIndex(exerciseIndex);
        setEditModalVisible(true);
    };

    const saveConfig = () => {
        const newExercises = [...exercises];
        newExercises[editExerciseIndex].weightConfig = weightConfig;
        newExercises[editExerciseIndex].repsConfig = repsConfig;
        setExercises(newExercises);
        setEditModalVisible(false);
    };

    const generatePickerItems = (range) => {
        return Array.from({ length: range }, (_, i) => ({ label: `${i}`, value: i }));
    };

    const animatedStyle = useAnimatedStyle(() => {
        return {
            height: withTiming(timerHeight.value, { duration: 300 }),
        };
    });

    const handleGesture = (event) => {
        const { translationY } = event.nativeEvent;
        if (translationY < -50) {
            timerHeight.value = 120; // Show timer fully
        } else if (translationY > 50) {
            timerHeight.value = 60; // Hide timer to the bottom
        }
    };

    useEffect(() => {
        exercisesRef.current = exercises;
    }, [exercises]);

    useFocusEffect(
        React.useCallback(() => {
            let isActive = true;

            if (isActive && workoutState && workoutState.exercises.length > 0) {
                setExercises(workoutState.exercises);
            }

            return () => {
                if (isActive) {
                    // Save workout state to context when screen is unfocused
                    setWorkoutState({ exercises: exercisesRef.current });
                }
                isActive = false;
            };
        }, [])
    );

    useEffect(() => {
        console.log("Exercises state updated: ", JSON.stringify(exercises, null, 2));
    }, [exercises]);

    useEffect(() => {
        startWorkoutLog();
        return () => stopWorkoutLog();
    }, []);



    return (
        <GestureHandlerRootView style={styles.fullScreenContainer}>
            <View style={styles.modalHeader}>
                <Text style={styles.headerText}>Workout</Text>
                <Text style={styles.workoutTimeText}>
                    {formatTime(elapsedTime)}
                </Text>
                <TouchableOpacity onPress={() => {
                    if (previousScreen) {
                        console.log(workoutState);
                        nav.navigate(previousScreen);
                    } else {
                        nav.goBack();
                    }
                }} style={styles.hideButton}>
                    <Text style={styles.hideButtonText}>Hide</Text>
                </TouchableOpacity>
            </View>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <FlatList
                    data={exercises.filter(exercise => !exercise.isSuperset)}
                    renderItem={renderExerciseItem}
                    keyExtractor={(item) => item.id}
                    ListFooterComponent={() => (
                        <View>
                            <Button title="Add Exercise" onPress={() => addExercise()} />
                            <Button title="Save Workouts" onPress={() => saveWorkout(isTemplate)} />
                            <View style={{height: 200}}/>
                        </View>
                    )}
                    keyboardShouldPersistTaps="handled"
                    style={{ zIndex: 1 }}
                    nestedScrollEnabled={true}
                />
            </KeyboardAvoidingView>
            <Modal
                animationType="slide"
                transparent={true}
                visible={timerModalVisible}
                onRequestClose={() => setTimerModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Set Countdown Timer</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={countdownMinutes}
                                onValueChange={(itemValue) => setCountdownMinutes(itemValue)}
                                style={pickerSelectStyles.picker}
                            >
                                {generatePickerItems(60).map(item => (
                                    <Picker.Item key={item.value} label={String(item.value)} value={item.value} />
                                ))}
                            </Picker>
                            <Text style={styles.pickerSeparator}>:</Text>
                            <Picker
                                selectedValue={countdownSeconds}
                                onValueChange={(itemValue) => setCountdownSeconds(itemValue)}
                                style={pickerSelectStyles.picker}
                            >
                                {generatePickerItems(60).map(item => (
                                    <Picker.Item key={item.value} label={String(item.value)} value={item.value} />
                                ))}
                            </Picker>
                        </View>
                        <Button title="Start Timer" onPress={startTimer} />
                        <Button title="Cancel" onPress={() => setTimerModalVisible(false)} />
                    </View>
                </View>
            </Modal>
            <Modal
                animationType="slide"
                transparent={true}
                visible={editModalVisible}
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit Exercise Configuration</Text>
                        <View style={styles.configContainer}>
                            <View style={styles.configColumn}>
                                <Text style={styles.modalSubTitle}>Weight Exercise</Text>
                                <TouchableOpacity onPress={() => setWeightConfig('totalWeight')}>
                                    <Text style={[styles.configOption, weightConfig === 'totalWeight' && styles.configOptionSelected]}>
                                        Total Weight
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setWeightConfig('weightPerSide')}>
                                    <Text style={[styles.configOption, weightConfig === 'weightPerSide' && styles.configOptionSelected]}>
                                        Weight Per Side
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setWeightConfig('weightPerSideBarbell')}>
                                    <Text style={[styles.configOption, weightConfig === 'weightPerSideBarbell' && styles.configOptionSelected]}>
                                        Weight Per Side + Standard Barbell (45lb)
                                    </Text>
                                </TouchableOpacity>
                                <Text style={styles.modalSubTitle}>Calisthenics Exercise</Text>
                                <TouchableOpacity onPress={() => setWeightConfig('bodyWeight')}>
                                    <Text style={[styles.configOption, weightConfig === 'bodyWeight' && styles.configOptionSelected]}>
                                        Body Weight
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setWeightConfig('extraWeightBodyWeight')}>
                                    <Text style={[styles.configOption, weightConfig === 'extraWeightBodyWeight' && styles.configOptionSelected]}>
                                        Extra Weight + Body Weight
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.configColumn}>
                                <Text style={styles.modalSubTitle}>Reps Configuration</Text>
                                <TouchableOpacity onPress={() => setRepsConfig('reps')}>
                                    <Text style={[styles.configOption, repsConfig === 'reps' && styles.configOptionSelected]}>
                                        Reps
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setRepsConfig('time')}>
                                    <Text style={[styles.configOption, repsConfig === 'time' && styles.configOptionSelected]}>
                                        Time
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <Button title="Save" onPress={saveConfig} />
                        <Button title="Cancel" onPress={() => setEditModalVisible(false)} />
                    </View>
                </View>
            </Modal>
            <Modal
                animationType="slide"
                transparent={true}
                visible={setsModalVisible}
                onRequestClose={() => setSetsModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Number of Sets</Text>
                        <ScrollView style={styles.scrollView}>
                            {[...Array(11).keys()].map((i) => (
                                <TouchableOpacity
                                    key={i}
                                    onPress={() => {
                                        const newExercises = [...exercises];
                                        const currentExercise = newExercises[currentSetsExerciseIndex];
                                        currentExercise.setsNum = i;
                                        setExercises(newExercises);
                                        setSetsModalVisible(false);
                                    }}
                                    style={styles.scrollViewItem}
                                >
                                    <Text style={styles.scrollViewItemText}>{i}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <Button title="Cancel" onPress={() => setSetsModalVisible(false)} />
                    </View>
                </View>
            </Modal>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select {selectedType === 'weight' ? 'Weight' : 'Reps'}</Text>
                        <View style={styles.adjustContainer}>
                            <TouchableOpacity
                                style={styles.adjustButton}
                                onPress={() => {
                                    if (selectedType === 'weight') {
                                        setTempWeight(tempWeight - (weightUnit === 'lbs' ? 5 : 2));
                                    } else {
                                        setTempReps(tempReps - 1);
                                    }
                                }}
                            >
                                <Text style={styles.adjustButtonText}>-</Text>
                            </TouchableOpacity>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.adjustInput}
                                    keyboardType="numeric"
                                    value={selectedType === 'weight' ? tempWeight.toString() : tempReps.toString()}
                                    onChangeText={(value) => {
                                        if (selectedType === 'weight') {
                                            setTempWeight(parseFloat(value) || 0);
                                        } else {
                                            setTempReps(parseInt(value) || 0);
                                        }
                                    }}
                                />
                                {selectedType === 'weight' && (
                                    <TouchableOpacity
                                        style={styles.unitSwitcher}
                                        onPress={() => {
                                            setWeightUnit(prevUnit => prevUnit === 'lbs' ? 'kgs' : 'lbs');
                                        }}
                                    >
                                        <Text style={styles.unitText}>{weightUnit}</Text>
                                    </TouchableOpacity>
                                )}
                                {selectedType === 'reps' && (
                                    <Text style={styles.unitText}>reps</Text>
                                )}
                            </View>
                            <TouchableOpacity
                                style={styles.adjustButton}
                                onPress={() => {
                                    if (selectedType === 'weight') {
                                        setTempWeight(tempWeight + (weightUnit === 'lbs' ? 5 : 2));
                                    } else {
                                        setTempReps(tempReps + 1);
                                    }
                                }}
                            >
                                <Text style={styles.adjustButtonText}>+</Text>
                            </TouchableOpacity>
                        </View>
                        <Button
                            title="Save"
                            onPress={() => {
                                const newExercises = [...exercises];
                                if (selectedDropSetIndex !== null) {
                                    if (selectedType === 'weight') {
                                        newExercises[selectedExerciseIndex].bestSet.dropSets[selectedDropSetIndex].weight = tempWeight;
                                        newExercises[selectedExerciseIndex].bestSet.dropSets[selectedDropSetIndex].weightUnit = `${weightUnit}`;
                                    } else {
                                        newExercises[selectedExerciseIndex].bestSet.dropSets[selectedDropSetIndex].reps = tempReps;
                                        //add reps unit change in the future
                                    }
                                } else {
                                    if (selectedType === 'weight') {
                                        newExercises[selectedExerciseIndex].bestSet.weight = tempWeight;
                                        newExercises[selectedExerciseIndex].bestSet.weightUnit = `${weightUnit}`;
                                    } else {
                                        newExercises[selectedExerciseIndex].bestSet.reps = tempReps;
                                    }
                                }
                                setExercises(newExercises);
                                setModalVisible(false);
                            }}
                        />
                        <Button title="Cancel" onPress={() => setModalVisible(false)} />
                    </View>
                </View>
            </Modal>

            <Modal
                animationType="slide"
                transparent={true}
                visible={confirmationModalVisible}
                onRequestClose={() => setConfirmationModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Incomplete Exercises</Text>
                        <Text style={{ marginBottom: 20 }}>Some exercises are not marked as completed. Do you want to proceed?</Text>
                        <Button
                            title="Yes, Proceed"
                            onPress={() => {
                                setProceedWithSave(true);
                                setConfirmationModalVisible(false);
                                saveWorkout(isTemplate); // Recursively call saveWorkout
                            }}
                        />
                        <Button title="No, Go Back" onPress={() => setConfirmationModalVisible(false)} />
                    </View>
                </View>
            </Modal>


            {timeRemaining !== null && (
                <PanGestureHandler onGestureEvent={handleGesture}>
                    <Animated.View style={[styles.timerContainer, animatedStyle]}>
                        <View style={styles.swipeBarContainer}>
                            <View style={styles.swipeBar} />
                        </View>
                        <TouchableOpacity style={styles.adjustTimeButton} onPress={() => adjustTime(15)}>
                            <Text style={styles.adjustTimeButtonText}>+15</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={toggleTimer}>
                            <Text style={styles.timerText}>
                                {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.adjustTimeButton} onPress={() => adjustTime(-15)}>
                            <Text style={styles.adjustTimeButtonText}>-15</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </PanGestureHandler>
            )}
            <View style={styles.bottomTab}>
                <TouchableOpacity style={styles.setTimerButton} onPress={() => setTimerModalVisible(true)}>
                    <Text style={styles.setTimerButtonText}>Set Timer</Text>
                </TouchableOpacity>
                {timerConfigured && (
                    <TouchableOpacity style={styles.resetButton} onPress={resetTimer}>
                        <Text style={styles.resetButtonText}>Reset</Text>
                    </TouchableOpacity>
                )}
            </View>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    fullScreenContainer: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f8f9fa',
        width: '100%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
        backgroundColor: '#007bff',
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
        marginBottom: 10,
        padding: 20,
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
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        paddingVertical: 10,
        paddingHorizontal: 5,
        flex: 1,
    },
    setsNum: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        paddingVertical: 10,
        width: 30,
        marginRight: 5,
    },
    setRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    weightInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        marginRight: 5,
        borderRadius: 5,
        backgroundColor: '#fff',
        flex: 0.5
    },
    repsInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        borderRadius: 5,
        backgroundColor: '#fff',
        flex: 0.5,
        marginRight: 50,
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
        backgroundColor: '#007bff',
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
        backgroundColor: '#007bff',
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
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 5,
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
        color: '#007bff',
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
        marginLeft: 10,
        marginBottom: 13,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
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
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    indicatorIcon: {
        flex: 1,
        textAlign: 'center',
    },
    repsIndicatorText: {
        flex: 1,
        textAlign: 'center',
        fontSize: 16,
        color: '#aaa',
        fontStyle: 'italic',
        right: 10,
    },
    allCheckboxContainer: {
        alignItems: 'center',
        alignSelf: 'flex-end',
        marginLeft: 10,
        marginBottom: 14,
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
    setsButton: {
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        paddingVertical: 10,
        width: 30,
        marginRight: 5,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#007bff',
    },
    setsButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
    },
    scrollView: {
        width: '100%',
        maxHeight: 300,
        marginBottom: 20,
    },
    scrollViewItem: {
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        alignItems: 'center',
    },
    scrollViewItemText: {
        fontSize: 18,
    },
    inputText: {
        fontSize: 14,
        color: '#000',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    scrollViewContent: {
        alignItems: 'center',
    },
    adjustButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#007bff',
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

export default WorkoutLogQuickMode;
