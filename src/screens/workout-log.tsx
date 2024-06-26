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
    Modal, KeyboardAvoidingView, Platform
} from 'react-native';
import { db, firebase_auth } from '../../firebaseConfig';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { FontAwesome5 } from '@expo/vector-icons';
import { commonExercises } from '../../exercisesList';
import { Checkbox } from 'react-native-paper';
import { GestureHandlerRootView, Swipeable, PanGestureHandler} from 'react-native-gesture-handler';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from "@react-native-picker/picker";
import Animated, {useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useWorkout } from '../contexts/WorkoutContext';


export default function WorkoutLogScreen({route}) {
    const navigation = useNavigation();

    const [exercises, setExercises] = useState([
        { id: 'exercise1', name: 'Exercise 1', sets: [{ key: 'set1', weight: '', reps: '', dropSets: []}], weightUnit: 'lbs', supersets: [], weightConfig: 'totalWeight', repsConfig: 'reps' }
    ]);
    const [suggestions, setSuggestions] = useState([]);
    const [userExercises, setUserExercises] = useState([]);
    const [exercisePresets, setExercisePresets] = useState({});
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(null);
    const [currentSupersetIndex, setCurrentSupersetIndex] = useState(null);
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
    const [editSupersetIndex, setEditSupersetIndex] = useState(null);
    const [weightConfig, setWeightConfig] = useState('totalWeight');
    const [repsConfig, setRepsConfig] = useState('reps');
    const [timerConfigured, setTimerConfigured] = useState(false); // New state variable
    const { workoutState, setWorkoutState, resetWorkout, startWorkoutLog, stopWorkoutLog } = useWorkout();
    const previousScreen = route.params?.previousScreen;

    const timerHeight = useSharedValue(120);

    const template = route?.params?.template;
    const exercisesRef = useRef(exercises);


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
                weightUnit: 'lbs', //can adjust to default weight unit preferred by user
                sets: Array.from({ length: ex.setsCount }, (_, index) => ({ key: `set${index + 1}`, weight: '', reps: '' })),
                supersets: (ex.supersets || []).map(superset => ({
                    ...superset,
                    weightUnit: 'lbs',
                    sets: Array.from({ length: superset.setsCount }, (_, index) => ({ key: `set${index + 1}`, weight: '', reps: '' }))
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
        setCurrentSupersetIndex(null);
        const newExercises = [...exercises];
        newExercises[index].name = text;
        setExercises(newExercises);
        setSuggestions(getSuggestions(text));
    };

    const handleSupersetNameChange = (text, exerciseIndex, supersetIndex) => {
        setCurrentExerciseIndex(exerciseIndex);
        setCurrentSupersetIndex(supersetIndex);
        const newExercises = [...exercises];
        newExercises[exerciseIndex].supersets[supersetIndex].name = text;
        setExercises(newExercises);
        setSuggestions(getSuggestions(text));
    };

    const addSet = (exerciseIndex) => {
        const newSets = [...exercises[exerciseIndex].sets, {
            key: `set${exercises[exerciseIndex].sets.length + 1}`,
            weight: '',
            reps: ''
        }];
        const newExercises = [...exercises];
        newExercises[exerciseIndex].sets = newSets;
        setExercises(newExercises);
    };

    const addSuperset = (exerciseIndex) => {
        const newExercises = [...exercises];
        const newSuperset = {
            id: `superset${newExercises[exerciseIndex].supersets.length + 1}`,
            name: 'New Superset Exercise',
            sets: [{ key: 'set1', weight: '', reps: '' }],
            weightUnit: 'lbs',
            weightConfig: 'totalWeight',
            repsConfig: 'reps'
        };
        newExercises[exerciseIndex].supersets.push(newSuperset);
        setExercises(newExercises);
    };

    const updateSetData = (text, exerciseIndex, setIndex, type, supersetIndex = null) => {
        const newExercises = [...exercises];
        if (supersetIndex === null) {
            newExercises[exerciseIndex].sets[setIndex][type] = text;
        } else {
            newExercises[exerciseIndex].supersets[supersetIndex].sets[setIndex][type] = text;
        }
        setExercises(newExercises);
    };

    const updateWeightUnit = (exerciseIndex, unit) => {
        const newExercises = [...exercises];
        newExercises[exerciseIndex].weightUnit = unit;
        setExercises(newExercises);
    };

    const updateWeightUnitSuperset = (exerciseIndex, supersetIndex, unit) => {
        const newExercises = [...exercises];
        newExercises[exerciseIndex].supersets[supersetIndex].weightUnit = unit;
        setExercises(newExercises);
    };

    const addExercise = () => {
        const newExercise = {
            id: `exercise${exercises.length + 1}`,
            name: 'New Exercise',
            sets: [{ key: 'set1', weight: '', reps: '' }],
            weightUnit: 'lbs',
            supersets: [],
            weightConfig: 'totalWeight',
            repsConfig: 'reps'
        };
        setExercises([...exercises, newExercise]);
    };

    const deleteSet = (exerciseIndex, setIndex, supersetIndex = null) => {
        const newExercises = [...exercises];
        if (supersetIndex === null) {
            newExercises[exerciseIndex].sets = newExercises[exerciseIndex].sets.filter((_, i) => i !== setIndex);
        } else {
            newExercises[exerciseIndex].supersets[supersetIndex].sets = newExercises[exerciseIndex].supersets[supersetIndex].sets.filter((_, i) => i !== setIndex);
        }
        setExercises(newExercises);
    };

    const deleteSuperset = (exerciseIndex, supersetIndex) => {
        const newExercises = [...exercises];
        newExercises[exerciseIndex].supersets = newExercises[exerciseIndex].supersets.filter((_, i) => i !== supersetIndex);
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

    const renderSets = (sets, exerciseIndex, supersetIndex = null) => (
        <View>
            {sets.map((set, setIndex) => {
                const exercise = supersetIndex === null
                    ? exercises[exerciseIndex]
                    : exercises[exerciseIndex].supersets[supersetIndex];

                const weightPlaceholder = (() => {
                    switch (exercise.weightConfig) {
                        case 'totalWeight':
                            return 'Total Weight';
                        case 'weightPerSide':
                        case 'weightPerSideBarbell':
                            return 'Weight Per Side';
                        case 'bodyWeight':
                            return 'Bodyweight';
                        case 'extraWeightBodyWeight':
                            return 'Extra Weight';
                        default:
                            return 'Weight';
                    }
                })();

                const repsPlaceholder = (() => {
                    switch (exercise.repsConfig) {
                        case 'reps':
                            return 'Reps';
                        case 'time':
                            return 'Time (seconds)';
                        default:
                            return 'Reps';
                    }
                })();

                const isWeightDisabled = exercise.weightConfig === 'bodyWeight';

                if (!set.dropSets) {
                    set.dropSets = [];
                }

                return (
                    <GestureHandlerRootView key={set.key}>
                        <Swipeable
                            renderLeftActions={() => (
                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={() => deleteSet(exerciseIndex, setIndex, supersetIndex)}
                                >
                                    <Text style={styles.deleteButtonText}>Delete</Text>
                                </TouchableOpacity>
                            )}

                            renderRightActions={() => (
                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={() => addDropSet(exerciseIndex, setIndex)}
                                >
                                    <Text style={styles.deleteButtonText}>Add Drop Set</Text>
                                </TouchableOpacity>
                            )}
                        >
                            <View style={styles.setRow}>
                                <TextInput
                                    placeholder={weightPlaceholder}
                                    keyboardType="numeric"
                                    style={styles.weightInput}
                                    onChangeText={(text) => updateSetData(text, exerciseIndex, setIndex, 'weight', supersetIndex)}
                                    value={set.weight}
                                    editable={!isWeightDisabled}
                                />
                                <TextInput
                                    placeholder={repsPlaceholder}
                                    keyboardType="numeric"
                                    style={styles.repsInput}
                                    onChangeText={(text) => updateSetData(text, exerciseIndex, setIndex, 'reps', supersetIndex)}
                                    value={set.reps}
                                />
                            </View>
                        </Swipeable>
                        {renderDropSets(set.dropSets, exerciseIndex, setIndex)}
                    </GestureHandlerRootView>
                );
            })}
            {renderTotalWeightMessage(
                supersetIndex === null ? exercises[exerciseIndex] : exercises[exerciseIndex].supersets[supersetIndex],
                sets
            )}
        </View>
    );

    const updateDropSetData = (text, exerciseIndex, setIndex, dropSetIndex, type) => {
        const newExercises = [...exercises];
        newExercises[exerciseIndex].sets[setIndex].dropSets[dropSetIndex][type] = text;
        setExercises(newExercises);
    };

    const addDropSet = (exerciseIndex, setIndex) => {
        const newExercises = [...exercises];
        const newDropSet = { key: `dropset${newExercises[exerciseIndex].sets[setIndex].dropSets.length + 1}`, weight: '', reps: '' };
        newExercises[exerciseIndex].sets[setIndex].dropSets.push(newDropSet);
        setExercises(newExercises);
    };
    const renderDropSets = (dropSets, exerciseIndex, setIndex) => (
        <View style={styles.dropSetsContainer}>
            {dropSets.map((dropSet, dropSetIndex) => (
                <View key={dropSet.key} style={styles.dropSetRow}>
                    <TextInput
                        placeholder="Drop Set Weight"
                        keyboardType="numeric"
                        style={styles.weightInput}
                        onChangeText={(text) => updateDropSetData(text, exerciseIndex, setIndex, dropSetIndex, 'weight')}
                        value={dropSet.weight}
                    />
                    <TextInput
                        placeholder="Drop Set Reps"
                        keyboardType="numeric"
                        style={styles.repsInput}
                        onChangeText={(text) => updateDropSetData(text, exerciseIndex, setIndex, dropSetIndex, 'reps')}
                        value={dropSet.reps}
                    />
                </View>
            ))}
        </View>
    );

    const renderSuggestions = (exerciseIndex, supersetIndex = null) => (
        suggestions.length > 0 && (
            (currentExerciseIndex === exerciseIndex && currentSupersetIndex === null) ||
            (currentExerciseIndex === exerciseIndex && currentSupersetIndex === supersetIndex)
        ) && (
            <FlatList
                data={suggestions}
                renderItem={({ item }) => (
                    <Pressable onPress={() => {
                        Keyboard.dismiss();
                        if (supersetIndex === null) {
                            handleSuggestionSelect(item, exerciseIndex);
                        } else {
                            handleSupersetSuggestionSelect(item, exerciseIndex, supersetIndex);
                        }
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

    const handleSupersetSuggestionSelect = (suggestion, exerciseIndex, supersetIndex) => {
        const newExercises = [...exercises];
        newExercises[exerciseIndex].supersets[supersetIndex].name = suggestion;

        // Check if the exercise has presets and set weightConfig and repsConfig accordingly
        if (exercisePresets[suggestion]) {
            newExercises[exerciseIndex].supersets[supersetIndex].weightConfig = exercisePresets[suggestion].weightConfig;
            newExercises[exerciseIndex].supersets[supersetIndex].repsConfig = exercisePresets[suggestion].repsConfig;
        }

        setExercises(newExercises);
        setSuggestions([]);
        setCurrentExerciseIndex(null);
        setCurrentSupersetIndex(null);
    };

    const deleteExercise = (index) => {
        const newExercises = exercises.filter((_, i) => i !== index);
        setExercises(newExercises);
    };

    const saveWorkouts = async (isTemplate) => {
        if (!firebase_auth.currentUser) {
            Alert.alert("Error", "You must be logged in to save workouts.");
            return;
        }

        const userId = firebase_auth.currentUser.uid;
        const filteredExercises = exercises.map(ex => ({
            id: camelCase(ex.name),
            name: ex.name,
            sets: ex.sets.filter(set => (set.weight !== '' || ex.weightConfig === 'bodyWeight') && set.reps !== '').map(set => ({
                ...set,
                weight: ex.weightConfig === 'bodyWeight'
                    ? 'BW'
                    : ex.weightConfig === 'extraWeightBodyWeight'
                        ? `BW + ${set.weight} ${ex.weightUnit}`
                        : `${calculateTotalWeight(parseFloat(set.weight), ex.weightConfig, ex.weightUnit)} ${ex.weightUnit}`,
                reps: ex.repsConfig === 'time' ? `${set.reps} secs` : `${set.reps} reps`
            })),
            supersets: ex.supersets.map(superset => ({
                id: camelCase(superset.name),
                name: superset.name,
                sets: superset.sets.filter(set => set.weight !== '' && set.reps !== '').map(set => ({
                    ...set,
                    weight: superset.weightConfig === 'bodyWeight'
                        ? 'BW'
                        : superset.weightConfig === 'extraWeightBodyWeight'
                            ? `BW + ${set.weight} ${superset.weightUnit}`
                            : `${calculateTotalWeight(parseFloat(set.weight), superset.weightConfig, superset.weightUnit)} ${superset.weightUnit}`,
                    reps: superset.repsConfig === 'time' ? `${set.reps} secs` : `${set.reps} reps`
                })),
                weightConfig: superset.weightConfig,
                repsConfig: superset.repsConfig
            })).filter(superset => superset.sets.length > 0),
            weightConfig: ex.weightConfig,
            repsConfig: ex.repsConfig
        })).filter(ex => ex.sets.length > 0 || ex.supersets.length > 0);

        console.log(filteredExercises);

        if (filteredExercises.length === 0) {
            Alert.alert("Error", "Please fill in all the required fields.");
            return;
        }

        try {
            const templateRef = collection(db, "userProfiles", userId, "templates");
            const querySnapshot = await getDocs(templateRef);
            const existingTemplates = querySnapshot.docs.map(doc => doc.data().templateName.toLowerCase());

            if (isTemplate) {
                if (!templateName.trim()) {
                    Alert.alert("Error", "Please provide a name for the template.");
                    return;
                }

                if (existingTemplates.includes(templateName.trim().toLowerCase())) {
                    Alert.alert("Error", "A template with this name already exists. Please choose a different name.");
                    return;
                }

                const templateExercises = exercises.map(ex => ({
                    id: camelCase(ex.name),
                    name: ex.name,
                    setsCount: ex.sets.length,
                    weightConfig: ex.weightConfig,
                    repsConfig: ex.repsConfig,
                    supersets: ex.supersets.map(superset => ({
                        id: camelCase(superset.name),
                        name: superset.name,
                        setsCount: superset.sets.length,
                        weightConfig: superset.weightConfig,
                        repsConfig: superset.repsConfig
                    }))
                }));

                await addDoc(templateRef, {
                    templateName: templateName.trim(),
                    exercises: templateExercises,
                    createdAt: new Date()
                });
            }

            await addDoc(collection(db, "userProfiles", userId, "workouts"), {
                exercises: filteredExercises,
                createdAt: new Date()
            });

            Alert.alert("Success", "Workouts saved successfully!");
            navigation.goBack();
            resetWorkout();
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

    const renderSupersets = (supersets, exerciseIndex) => (
        supersets.map((superset, supersetIndex) => (
            <View key={superset.id} style={styles.supersetContainer}>
                <FontAwesome5
                    name="times"
                    onPress={() => deleteSuperset(exerciseIndex, supersetIndex)}
                    size={20}
                    color="black"
                    style={styles.deleteSupersetButton}
                />
                <TouchableOpacity onPress={() => openEditModal(exerciseIndex, supersetIndex)} style={styles.editButton}>
                    <FontAwesome5 name="ellipsis-h" size={20} color="black" />
                </TouchableOpacity>
                <TextInput
                    style={styles.header}
                    onChangeText={(text) => handleSupersetNameChange(text, exerciseIndex, supersetIndex)}
                    value={superset.name}
                />
                {renderSuggestions(exerciseIndex, supersetIndex)}
                {renderSets(superset.sets, exerciseIndex, supersetIndex)}
                <View style={styles.buttonsRow}>
                    <Button title="+ add set" onPress={() => addSetToSuperset(exerciseIndex, supersetIndex)} />
                </View>
                <View style={styles.unitButtonsContainer}>
                    <TouchableOpacity
                        style={[styles.unitButton, superset.weightUnit === 'lbs' && styles.unitButtonSelected]}
                        onPress={() => updateWeightUnitSuperset(exerciseIndex, supersetIndex, 'lbs')}
                    >
                        <Text
                            style={[styles.unitButtonText, superset.weightUnit === 'lbs' ? styles.unitButtonSelectedText : styles.unitButtonUnselectedText]}>lbs</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.unitButton, superset.weightUnit === 'kgs' && styles.unitButtonSelected]}
                        onPress={() => updateWeightUnitSuperset(exerciseIndex, supersetIndex, 'kgs')}
                    >
                        <Text
                            style={[styles.unitButtonText, superset.weightUnit === 'kgs' ? styles.unitButtonSelectedText : styles.unitButtonUnselectedText]}>kgs</Text>
                    </TouchableOpacity>
                </View>
            </View>
        ))
    );

    const addSetToSuperset = (exerciseIndex, supersetIndex) => {
        const newExercises = [...exercises];
        const newSets = [...newExercises[exerciseIndex].supersets[supersetIndex].sets, {
            key: `set${newExercises[exerciseIndex].supersets[supersetIndex].sets.length + 1}`,
            weight: '',
            reps: ''
        }];
        newExercises[exerciseIndex].supersets[supersetIndex].sets = newSets;
        setExercises(newExercises);
    };

    const renderExerciseItem = ({ item, index }) => (
        <View key={item.id} style={styles.exerciseContainer}>
            <FontAwesome5
                name="times"
                onPress={() => deleteExercise(index)}
                size={20}
                color="black"
                style={styles.deleteExerciseButton}
            />
            <TouchableOpacity onPress={() => openEditModal(index)} style={styles.editButton}>
                <FontAwesome5 name="ellipsis-h" size={20} color='black' />
            </TouchableOpacity>
            <TextInput
                style={styles.header}
                onChangeText={(text) => handleExerciseNameChange(text, index)}
                value={item.name}
            />
            {renderSuggestions(index)}
            {renderSets(item.sets, index)}
            <View style={styles.unitButtonsContainer}>
                <TouchableOpacity
                    style={[styles.unitButton, item.weightUnit === 'lbs' && styles.unitButtonSelected]}
                    onPress={() => updateWeightUnit(index, 'lbs')}
                >
                    <Text
                        style={[styles.unitButtonText, item.weightUnit === 'lbs' ? styles.unitButtonSelectedText : styles.unitButtonUnselectedText]}>lbs</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.unitButton, item.weightUnit === 'kgs' && styles.unitButtonSelected]}
                    onPress={() => updateWeightUnit(index, 'kgs')}
                >
                    <Text
                        style={[styles.unitButtonText, item.weightUnit === 'kgs' ? styles.unitButtonSelectedText : styles.unitButtonUnselectedText]}>kgs</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.buttonsRow}>
                <Button title="+ add set" onPress={() => addSet(index)} />
                <Button title="+ add superset" onPress={() => addSuperset(index)} />
            </View>
            {renderSupersets(item.supersets, index)}
        </View>
    );

    const openEditModal = (exerciseIndex, supersetIndex = null) => {
        const exercise = exercises[exerciseIndex];
        const currentConfig = supersetIndex === null ? exercise : exercise.supersets[supersetIndex];
        setWeightConfig(currentConfig.weightConfig);
        setRepsConfig(currentConfig.repsConfig);
        setEditExerciseIndex(exerciseIndex);
        setEditSupersetIndex(supersetIndex);
        setEditModalVisible(true);
    };

    const saveConfig = () => {
        const newExercises = [...exercises];
        if (editSupersetIndex === null) {
            newExercises[editExerciseIndex].weightConfig = weightConfig;
            newExercises[editExerciseIndex].repsConfig = repsConfig;
        } else {
            newExercises[editExerciseIndex].supersets[editSupersetIndex].weightConfig = weightConfig;
            newExercises[editExerciseIndex].supersets[editSupersetIndex].repsConfig = repsConfig;
        }
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
            // Load workout state from context when screen is focused
            if (workoutState && workoutState.exercises.length > 0) {
                console.log("structure here", JSON.stringify(workoutState.exercises, null, 2));
                setExercises(workoutState.exercises);
            }

            return () => {
                // Save workout state to context when screen is unfocused
                setWorkoutState({ exercises: exercisesRef.current });
                console.log('sshizzy', exercisesRef.current);
            };
        }, [workoutState])
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
                <Text style={styles.headerText}>Workout Log</Text>
                <TouchableOpacity onPress={() => {
                    if (previousScreen) {
                        console.log(workoutState);
                        navigation.navigate(previousScreen);
                    } else {
                        navigation.goBack();
                    }
                }} style={styles.hideButton}>
                    <Text style={styles.hideButtonText}>Hide</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.checkboxContainer}>
                <Checkbox.Item
                    label="Save as Template"
                    status={isTemplate ? 'checked' : 'unchecked'}
                    onPress={() => setIsTemplate(!isTemplate)}
                    labelStyle={styles.checkboxLabel}
                />
                {isTemplate && (
                    <TextInput
                        style={styles.templateNameInput}
                        placeholder="Template Name"
                        value={templateName}
                        onChangeText={setTemplateName}
                    />
                )}
            </View>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
            <FlatList
                data={exercises}
                renderItem={renderExerciseItem}
                keyExtractor={(item) => item.id}
                ListFooterComponent={() => (
                    <View>
                        <Button title="Add Exercise" onPress={addExercise} />
                        <Button title="Save Workouts" onPress={() => saveWorkouts(isTemplate)} />
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
        marginBottom: 20,
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 5,
        position: 'relative',
        borderWidth: 1,
        borderColor: '#ccc',
        paddingTop: 60, // Adjust padding to make space for the edit button
    },
    header: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        borderRadius: 5,
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
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 10,
    },
    checkboxLabel: {
        fontSize: 16,
        fontWeight: 'bold',
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
        marginLeft: 20,
        marginTop: 10,
        paddingTop: 60, // Adjust padding to make space for the edit button
        borderLeftWidth: 2,
        borderLeftColor: '#ccc',
        paddingLeft: 10,
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

export default WorkoutLogScreen;





































