import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { db, firebase_auth } from '../../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { useWorkout } from '../contexts/WorkoutContext';

const TemplateScreen = () => {
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const navigation = useNavigation();
    const { setWorkout } = useWorkout();

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        if (!firebase_auth.currentUser) return;

        try {
            const userId = firebase_auth.currentUser.uid;
            const templateRef = collection(db, "userProfiles", userId, "templates");
            const querySnapshot = await getDocs(templateRef);
            const templatesList = querySnapshot.docs.map(doc => {
                const data = doc.data();
                console.log('Fetched Template Data:', JSON.stringify(data, null, 2));
                return { id: doc.id, ...data };
            });

            setTemplates(templatesList);
        } catch (error) {
            console.error('Error fetching templates:', error);
        }
    };

    const handleLoadTemplate = () => {
        if (selectedTemplate) {
            console.log('Selected Template:', JSON.stringify(selectedTemplate, null, 2));
            console.log('Exercises:', JSON.stringify(selectedTemplate.exercises, null, 2));
            navigation.navigate('WorkoutLog', {template: selectedTemplate});
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Select a Template</Text>
                <Picker
                    selectedValue={selectedTemplate}
                    onValueChange={(itemValue) => setSelectedTemplate(itemValue)}
                    style={styles.picker}
                >
                    <Picker.Item label="Select a template..." value={null} />
                    {templates.map(template => (
                        <Picker.Item key={template.id} label={template.templateName} value={template} />
                    ))}
                </Picker>


                I currently have a workout log screen that connects to firebase with the following configuration.

                import React, { useState, useEffect } from 'react';
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
                import { useNavigation } from '@react-navigation/native';
                import { Picker } from "@react-native-picker/picker";
                import Animated, {useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

                export default function WorkoutLogScreen() {
                const navigation = useNavigation();

                const [exercises, setExercises] = useState([
            { id: 'bicepCurls', name: 'Bicep Curls', sets: [{ key: 'set1', weight: '', reps: '' }], weightUnit: 'lbs', supersets: [], weightConfig: 'totalWeight', repsConfig: 'reps' }
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

                const timerHeight = useSharedValue(120);

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
                key: set${exercises[exerciseIndex].sets.length + 1},
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
                id: superset${newExercises[exerciseIndex].supersets.length + 1},
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
                id: exercise${exercises.length + 1},
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
                totalWeight = BW + ${weight} ${unit};
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
                {Lifting ${totalWeight} total ${exercise.weightUnit} for set ${lastFilledIndex}}
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
                        </GestureHandlerRootView>
                    );
                })}
                {renderTotalWeightMessage(
                    supersetIndex === null ? exercises[exerciseIndex] : exercises[exerciseIndex].supersets[supersetIndex],
                    sets
                )}
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
            ? BW + ${set.weight} ${ex.weightUnit}
            : ${calculateTotalWeight(parseFloat(set.weight), ex.weightConfig, ex.weightUnit)} ${ex.weightUnit},
            reps: ex.repsConfig === 'time' ? ${set.reps} secs : ${set.reps} reps
            })),
            supersets: ex.supersets.map(superset => ({
            id: camelCase(superset.name),
            name: superset.name,
            sets: superset.sets.filter(set => set.weight !== '' && set.reps !== '').map(set => ({
            ...set,
            weight: superset.weightConfig === 'bodyWeight'
            ? 'BW'
            : superset.weightConfig === 'extraWeightBodyWeight'
            ? BW + ${set.weight} ${superset.weightUnit}
            : ${calculateTotalWeight(parseFloat(set.weight), superset.weightConfig, superset.weightUnit)} ${superset.weightUnit},
            reps: superset.repsConfig === 'time' ? ${set.reps} secs : ${set.reps} reps
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
            weightUnit: ex.weightUnit,
            supersets: ex.supersets.map(superset => ({
            id: camelCase(superset.name),
            name: superset.name,
            setsCount: superset.sets.length,
            weightUnit: superset.weightUnit,
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
            key: set${newExercises[exerciseIndex].supersets[supersetIndex].sets.length + 1},
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
            return Array.from({ length: range }, (_, i) => ({ label: ${i}, value: i }));
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

            return (
            <GestureHandlerRootView style={styles.fullScreenContainer}>
                <View style={styles.modalHeader}>
                    <Text style={styles.headerText}>Workout Log</Text>
                    <TouchableOpacity onPress={navigation.goBack} style={styles.hideButton}>
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
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}
                                      style = {{}}>
                    <FlatList
                        data={exercises}
                        renderItem={renderExerciseItem}
                        keyExtractor={(item) => item.id}
                        ListFooterComponent={() => (
                            <View>
                                <Button title="Add Exercise" onPress={addExercise} />
                                <Button title="Save Workouts" onPress={() => saveWorkouts(isTemplate)} />
                                <View style={{ height: 190 }} />
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
            backgroundColor: '#e9ecef',
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

            and here is the stack that navigates to the workout log screen

            function ProgressStack() {
            return (
            <Stack.Navigator initialRouteName='Progress'>
            <Stack.Screen name='Progress' component={Progress} options={screenOptions} />
    <Stack.Screen name='Notifications' component={Notifications} />
    <Stack.Screen
        name='WorkoutLog'
        component={WorkoutLogScreen}
        options={{
            headerShown: false,
            presentation: 'fullScreenModal',
        }}
    />
</Stack.Navigator>
);
}

I want to add functionality where when I press on the bottom tab button to open the workout log, it asks me beforehand if I want to load a presaved template. If I choose a template, it auto loads the exercise and number of sets into the workout log. Give me ideas, how can I do this?

ChatGPT
To add the functionality where the app asks if you want to load a presaved template before opening the Workout Log screen, you can follow these steps:

Create a modal for template selection: Create a modal that will appear when you press the button to open the Workout Log. This modal will list all the available templates for the user to select from.

Fetch templates: Ensure you fetch the templates from the Firebase database when the component mounts or the modal is opened.

Load selected template: Once a template is selected, load the corresponding exercises and sets into the Workout Log state.

Navigate to Workout Log with preloaded data: Pass the preloaded template data to the Workout Log screen via navigation parameters.

Step-by-Step Implementation
Create a modal for template selection:
In your main component where the bottom tab button is, add a modal to select templates:

jsx
Copy code
import React, { useState, useEffect } from 'react';
import { View, Text, Button, Modal, FlatList, TouchableOpacity } from 'react-native';
import { db, firebase_auth } from '../../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';

function MainComponent() {
    const [templateModalVisible, setTemplateModalVisible] = useState(false);
    const [templates, setTemplates] = useState([]);
    const navigation = useNavigation();

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        if (!firebase_auth.currentUser) return;

        const userId = firebase_auth.currentUser.uid;
        const templateRef = collection(db, "userProfiles", userId, "templates");
        const querySnapshot = await getDocs(templateRef);
        const templatesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTemplates(templatesList);
    };

    const openWorkoutLog = (template) => {
        setTemplateModalVisible(false);
        navigation.navigate('WorkoutLog', { template });
    };

    return (
        <View style={{ flex: 1 }}>
            <Button title="Open Workout Log" onPress={() => setTemplateModalVisible(true)} />
            <Modal
                visible={templateModalVisible}
                onRequestClose={() => setTemplateModalVisible(false)}
                animationType="slide"
                transparent={true}
            >
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                    <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10 }}>
                        <Text>Select a Template</Text>
                        <FlatList
                            data={templates}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity onPress={() => openWorkoutLog(item)}>
                                    <Text>{item.templateName}</Text>
                                </TouchableOpacity>
                            )}
                        />
                        <Button title="Cancel" onPress={() => setTemplateModalVisible(false)} />
                    </View>
                </View>
            </Modal>
        </View>
    );
}
Modify the WorkoutLogScreen to accept template data:
In your WorkoutLogScreen, update the component to accept navigation parameters and load the template data if available:

jsx
Copy code
export default function WorkoutLogScreen({ route }) {
    const navigation = useNavigation();
    const { template } = route.params || {};

    const [exercises, setExercises] = useState(template ? template.exercises.map(ex => ({
        id: ex.id,
        name: ex.name,
        sets: Array.from({ length: ex.setsCount }, (_, i) => ({ key: `set${i + 1}`, weight: '', reps: '' })),
        weightUnit: ex.weightUnit,
        supersets: ex.supersets.map(ss => ({
            id: ss.id,
            name: ss.name,
            sets: Array.from({ length: ss.setsCount }, (_, i) => ({ key: `set${i + 1}`, weight: '', reps: '' })),
            weightUnit: ss.weightUnit,
            weightConfig: ss.weightConfig,
            repsConfig: ss.repsConfig,
        })),
        weightConfig: ex.weightConfig,
        repsConfig: ex.repsConfig,
    })) : [{ id: 'bicepCurls', name: 'Bicep Curls', sets: [{ key: 'set1', weight: '', reps: '' }], weightUnit: 'lbs', supersets: [], weightConfig: 'totalWeight', repsConfig: 'reps' }]);

    // ... rest of your WorkoutLogScreen code
}
Update Navigation to pass parameters:
Ensure your navigation stack passes the template data to the WorkoutLogScreen:

jsx
Copy code
    <Stack.Screen
        name='WorkoutLog'
        component={WorkoutLogScreen}
        options={{
            headerShown: false,
            presentation: 'fullScreenModal',
        }}
    />
Modify the button to open the modal:
Update the button in your bottom tab to open the modal instead of navigating directly to the Workout Log:

jsx
Copy code
    <Button title="Open Workout Log" onPress={() => setTemplateModalVisible(true)} />
This approach ensures that when the user clicks the button to open the Workout Log, they are first asked to select a template. If they choose a template, it preloads the workout log with the template data. If they choose not to select a template, they can still proceed to the workout log without preloaded data.
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import Home from './src/screens/Home';
import Account from './src/screens/Account';
import Post from './src/screens/Post';
import Progress from './src/screens/Progress';
import Notifications from './src/screens/Notifications';
import PersonalDetails from './src/screens/PersonalDetails';
import WorkoutLogScreen from './src/screens/workout-log';
import SaveGymHighlightScreen from "./src/screens/save-gym-highlight";
import CustomTabBar from "./src/components/CustomTabBar";
import FeedPage from "./src/screens/FeedPage";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const screenOptions = ({ navigation }) => ({
    headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={24} color="black" style={{ marginRight: 15 }} />
        </TouchableOpacity>
    ),
        headerStyle: {
        paddingTop: 20,
            height: 80,
    },
});


function HomeStack() {
    return (
        <Stack.Navigator initialRouteName='Home'>
            <Stack.Screen
                name="Home"
                component={Home}
                options={({ navigation }) => ({
                    ...screenOptions({ navigation }),
                    title: "Home"
                })}
            />
            <Stack.Screen name='Notifications' component={Notifications} />
            <Stack.Screen
                name='WorkoutLog'
                component={WorkoutLogScreen}
                options={{
                    headerShown: false,
                    presentation: 'fullScreenModal',
                }}
            />
        </Stack.Navigator>
    );
}


function AccountStack() {
    return (
        <Stack.Navigator initialRouteName='Account'>
            <Stack.Screen name='Account' component={Account} options={screenOptions} />
            <Stack.Screen name='Notifications' component={Notifications} />
            <Stack.Screen options={{ title: "Personal Details" }} name='PersonalDetails' component={PersonalDetails} />
            <Stack.Screen
                name='WorkoutLog'
                component={WorkoutLogScreen}
                options={{
                    headerShown: false,
                    presentation: 'fullScreenModal',
                }}
            />
        </Stack.Navigator>
    );
}

function ProgressStack() {
    return (
        <Stack.Navigator initialRouteName='Progress'>
            <Stack.Screen name='Progress' component={Progress} options={screenOptions} />
            <Stack.Screen name='Notifications' component={Notifications} />
            <Stack.Screen
                name='WorkoutLog'
                component={WorkoutLogScreen}
                options={{
                    headerShown: false,
                    presentation: 'fullScreenModal',
                }}
            />
        </Stack.Navigator>
    );
}

function PostStack() {
    return (
        <Stack.Navigator initialRouteName='Post'>
            <Stack.Screen name='Save Highlight' component={SaveGymHighlightScreen} options={screenOptions} />
            <Stack.Screen name='Notifications' component={Notifications} />
            <Stack.Screen
                name='WorkoutLog'
                component={WorkoutLogScreen}
                options={{
                    headerShown: false,
                    presentation: 'fullScreenModal',
                }}
            />
        </Stack.Navigator>
    );
}

function FeedStack() {
    return (
        <Stack.Navigator initialRouteName='Feed'>
            <Stack.Screen name='Feed' component={FeedPage} />
            <Stack.Screen
                name='WorkoutLog'
                component={WorkoutLogScreen}
                options={{
                    headerShown: false,
                    presentation: 'fullScreenModal',
                }}
            />
        </Stack.Navigator>
    );
}

function App() {
    return (
        <NavigationContainer>
            <Tab.Navigator tabBar={props => <CustomTabBar {...props} />}>
                <Tab.Screen
                    name='HomeStack'
                    component={HomeStack}
                    options={{ headerShown: false, title: 'Home', tabBarIcon: { name: 'home-outline' } }}
                />
                <Tab.Screen
                    name='PostStack'
                    component={PostStack}
                    options={{ headerShown: false, title: 'Post', tabBarIcon: { name: 'create-outline' } }}
                />
                <Tab.Screen
                    name='ProgressStack'
                    component={ProgressStack}
                    options={{ headerShown: false, title: 'Progress', tabBarIcon: { name: 'trending-up-outline' } }}
                />
                <Tab.Screen
                    name='AccountStack'
                    component={AccountStack}
                    options={{ headerShown: false, title: 'Account', tabBarIcon: { name: 'person-outline' } }}
                />
                <Tab.Screen
                    name='FeedStack'
                    component={FeedStack}
                    options={{ headerShown: false, title: 'Feed', tabBarIcon: { name: 'person-outline' } }}
                />
            </Tab.Navigator>
        </NavigationContainer>
    );
}

export default App;

const styles = StyleSheet.create({
    container: {
        flex: 1,
            backgroundColor: '#fff',
            alignItems: 'center',
            justifyContent: 'center',
    },
});

here is my main component. How should I add the modal?

ChatGPT
To add the modal for selecting a template when opening the Workout Log, you can follow these steps:

Create a new component for the modal.
Integrate the modal in the appropriate stack navigator (e.g., ProgressStack).
Pass the selected template to the WorkoutLogScreen via navigation parameters.
Here's how you can do it:

1. Create a Modal Component
Create a new file TemplateModal.js for the modal component:

jsx
Copy code
// src/components/TemplateModal.js
import React, { useState, useEffect } from 'react';
import { View, Text, Button, Modal, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { db, firebase_auth } from '../../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

const TemplateModal = ({ visible, onClose, onSelectTemplate }) => {
    const [templates, setTemplates] = useState([]);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        if (!firebase_auth.currentUser) return;

        const userId = firebase_auth.currentUser.uid;
        const templateRef = collection(db, "userProfiles", userId, "templates");
        const querySnapshot = await getDocs(templateRef);
        const templatesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTemplates(templatesList);
    };

    return (
        <Modal
            visible={visible}
            onRequestClose={onClose}
            animationType="slide"
            transparent={true}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Select a Template</Text>
                    <FlatList
                        data={templates}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity onPress={() => onSelectTemplate(item)}>
                                <Text style={styles.templateItem}>{item.templateName}</Text>
                            </TouchableOpacity>
                        )}
                    />
                    <Button title="Cancel" onPress={onClose} />
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
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
    templateItem: {
        fontSize: 16,
            padding: 10,
            borderBottomWidth: 1,
            borderBottomColor: '#ccc',
    },
});

export default TemplateModal;
2. Integrate the Modal in the Stack Navigator
Update the ProgressStack to include the modal and handle the navigation to WorkoutLogScreen:

jsx
Copy code
import React, { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Progress from './src/screens/Progress';
import Notifications from './src/screens/Notifications';
import WorkoutLogScreen from './src/screens/workout-log';
import TemplateModal from './src/components/TemplateModal';

const Stack = createNativeStackNavigator();

function ProgressStack() {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    const handleOpenWorkoutLog = () => {
        setIsModalVisible(true);
    };

    const handleSelectTemplate = (template) => {
        setSelectedTemplate(template);
        setIsModalVisible(false);
    };

    return (
        <>
            <Stack.Navigator initialRouteName='Progress'>
                <Stack.Screen
                    name='Progress'
                    component={Progress}
                    options={({ navigation }) => ({
                        ...screenOptions({ navigation }),
                        title: "Progress",
                        headerRight: () => (
                            <TouchableOpacity onPress={handleOpenWorkoutLog}>
                                <Ionicons name="add-circle-outline" size={24} color="black" style={{ marginRight: 15 }} />
                            </TouchableOpacity>
                        ),
                    })}
                />
                <Stack.Screen name='Notifications' component={Notifications} />
                <Stack.Screen
                    name='WorkoutLog'
                    component={WorkoutLogScreen}
                    initialParams={{ template: selectedTemplate }}
                    options={{
                        headerShown: false,
                        presentation: 'fullScreenModal',
                    }}
                />
            </Stack.Navigator>
            <TemplateModal
                visible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                onSelectTemplate={handleSelectTemplate}
            />
        </>
    );
}

export default ProgressStack;
3. Modify the WorkoutLogScreen to Accept Template Data
Update the WorkoutLogScreen to accept navigation parameters and load the template data if available:

jsx
Copy code
export default function WorkoutLogScreen({ route }) {
    const { template } = route.params || {};

    const [exercises, setExercises] = useState(template ? template.exercises.map(ex => ({
        id: ex.id,
        name: ex.name,
        sets: Array.from({ length: ex.setsCount }, (_, i) => ({ key: `set${i + 1}`, weight: '', reps: '' })),
        weightUnit: ex.weightUnit,
        supersets: ex.supersets.map(ss => ({
            id: ss.id,
            name: ss.name,
            sets: Array.from({ length: ss.setsCount }, (_, i) => ({ key: `set${i + 1}`, weight: '', reps: '' })),
            weightUnit: ss.weightUnit,
            weightConfig: ss.weightConfig,
            repsConfig: ss.repsConfig,
        })),
        weightConfig: ex.weightConfig,
        repsConfig: ex.repsConfig,
    })) : [{ id: 'bicepCurls', name: 'Bicep Curls', sets: [{ key: 'set1', weight: '', reps: '' }], weightUnit: 'lbs', supersets: [], weightConfig: 'totalWeight', repsConfig: 'reps' }]);

    // ... rest of your WorkoutLogScreen code
}
4. Add Button to Other Stacks
Repeat the above steps for other stacks (HomeStack, AccountStack, PostStack, FeedStack) as needed, ensuring that each stack has the modal integrated and navigates to WorkoutLogScreen with the selected template data.

This approach will allow the user to select a template before opening the Workout Log, and the selected template data will be passed to the WorkoutLogScreen to prepopulate the exercises and sets.
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import Home from './src/screens/Home';
import Account from './src/screens/Account';
import Post from './src/screens/Post';
import Progress from './src/screens/Progress';
import Notifications from './src/screens/Notifications';
import PersonalDetails from './src/screens/PersonalDetails';
import WorkoutLogScreen from './src/screens/workout-log';
import SaveGymHighlightScreen from "./src/screens/save-gym-highlight";
import CustomTabBar from "./src/components/CustomTabBar";
import FeedPage from "./src/screens/FeedPage";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const screenOptions = ({ navigation }) => ({
    headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={24} color="black" style={{ marginRight: 15 }} />
        </TouchableOpacity>
    ),
        headerStyle: {
        paddingTop: 20,
            height: 80,
    },
});


function HomeStack() {
    return (
        <Stack.Navigator initialRouteName='Home'>
            <Stack.Screen
                name="Home"
                component={Home}
                options={({ navigation }) => ({
                    ...screenOptions({ navigation }),
                    title: "Home"
                })}
            />
            <Stack.Screen name='Notifications' component={Notifications} />
            <Stack.Screen
                name='WorkoutLog'
                component={WorkoutLogScreen}
                options={{
                    headerShown: false,
                    presentation: 'fullScreenModal',
                }}
            />
        </Stack.Navigator>
    );
}


function AccountStack() {
    return (
        <Stack.Navigator initialRouteName='Account'>
            <Stack.Screen name='Account' component={Account} options={screenOptions} />
            <Stack.Screen name='Notifications' component={Notifications} />
            <Stack.Screen options={{ title: "Personal Details" }} name='PersonalDetails' component={PersonalDetails} />
            <Stack.Screen
                name='WorkoutLog'
                component={WorkoutLogScreen}
                options={{
                    headerShown: false,
                    presentation: 'fullScreenModal',
                }}
            />
        </Stack.Navigator>
    );
}

function ProgressStack() {
    return (
        <Stack.Navigator initialRouteName='Progress'>
            <Stack.Screen name='Progress' component={Progress} options={screenOptions} />
            <Stack.Screen name='Notifications' component={Notifications} />
            <Stack.Screen
                name='WorkoutLog'
                component={WorkoutLogScreen}
                options={{
                    headerShown: false,
                    presentation: 'fullScreenModal',
                }}
            />
        </Stack.Navigator>
    );
}

function PostStack() {
    return (
        <Stack.Navigator initialRouteName='Post'>
            <Stack.Screen name='Save Highlight' component={SaveGymHighlightScreen} options={screenOptions} />
            <Stack.Screen name='Notifications' component={Notifications} />
            <Stack.Screen
                name='WorkoutLog'
                component={WorkoutLogScreen}
                options={{
                    headerShown: false,
                    presentation: 'fullScreenModal',
                }}
            />
        </Stack.Navigator>
    );
}

function FeedStack() {
    return (
        <Stack.Navigator initialRouteName='Feed'>
            <Stack.Screen name='Feed' component={FeedPage} />
            <Stack.Screen
                name='WorkoutLog'
                component={WorkoutLogScreen}
                options={{
                    headerShown: false,
                    presentation: 'fullScreenModal',
                }}
            />
        </Stack.Navigator>
    );
}

function App() {
    return (
        <NavigationContainer>
            <Tab.Navigator tabBar={props => <CustomTabBar {...props} />}>
                <Tab.Screen
                    name='HomeStack'
                    component={HomeStack}
                    options={{ headerShown: false, title: 'Home', tabBarIcon: { name: 'home-outline' } }}
                />
                <Tab.Screen
                    name='PostStack'
                    component={PostStack}
                    options={{ headerShown: false, title: 'Post', tabBarIcon: { name: 'create-outline' } }}
                />
                <Tab.Screen
                    name='ProgressStack'
                    component={ProgressStack}
                    options={{ headerShown: false, title: 'Progress', tabBarIcon: { name: 'trending-up-outline' } }}
                />
                <Tab.Screen
                    name='AccountStack'
                    component={AccountStack}
                    options={{ headerShown: false, title: 'Account', tabBarIcon: { name: 'person-outline' } }}
                />
                <Tab.Screen
                    name='FeedStack'
                    component={FeedStack}
                    options={{ headerShown: false, title: 'Feed', tabBarIcon: { name: 'person-outline' } }}
                />
            </Tab.Navigator>
        </NavigationContainer>
    );
}

export default App;

const styles = StyleSheet.create({
    container: {
        flex: 1,
            backgroundColor: '#fff',
            alignItems: 'center',
            justifyContent: 'center',
    },
});

since I can open my workout log from any page's stack, do I need to add the modal to all stacks instead of just the progress stack?

ChatGPT
Yes, if you want to provide the option to load a presaved template before opening the Workout Log from any page's stack, you will need to add the modal to all the stacks where the Workout Log can be accessed. This way, the user will always be prompted to select a template regardless of which stack they are navigating from.

Here's how you can do it:

Create the modal component as a reusable component.
Integrate the modal in all the stack navigators.
Pass the selected template to the Workout Log screen via navigation parameters.
1. Create a Reusable Modal Component
This step has already been covered, but let's ensure the modal is exported and ready to be reused across different stacks:

jsx
Copy code
// src/components/TemplateModal.js
import React, { useState, useEffect } from 'react';
import { View, Text, Button, Modal, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { db, firebase_auth } from '../../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

const TemplateModal = ({ visible, onClose, onSelectTemplate }) => {
    const [templates, setTemplates] = useState([]);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        if (!firebase_auth.currentUser) return;

        const userId = firebase_auth.currentUser.uid;
        const templateRef = collection(db, "userProfiles", userId, "templates");
        const querySnapshot = await getDocs(templateRef);
        const templatesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTemplates(templatesList);
    };

    return (
        <Modal
            visible={visible}
            onRequestClose={onClose}
            animationType="slide"
            transparent={true}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Select a Template</Text>
                    <FlatList
                        data={templates}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity onPress={() => onSelectTemplate(item)}>
                                <Text style={styles.templateItem}>{item.templateName}</Text>
                            </TouchableOpacity>
                        )}
                    />
                    <Button title="Cancel" onPress={onClose} />
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
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
    templateItem: {
        fontSize: 16,
            padding: 10,
            borderBottomWidth: 1,
            borderBottomColor: '#ccc',
    },
});

export default TemplateModal;
2. Integrate the Modal in All Stack Navigators
Here’s how you can modify each stack to include the modal and handle navigation to the WorkoutLogScreen:

Example for HomeStack

jsx
Copy code
import React, { useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Home from './src/screens/Home';
import Notifications from './src/screens/Notifications';
import WorkoutLogScreen from './src/screens/workout-log';
import TemplateModal from './src/components/TemplateModal';

const Stack = createNativeStackNavigator();

function HomeStack() {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    const handleOpenWorkoutLog = () => {
        setIsModalVisible(true);
    };

    const handleSelectTemplate = (template) => {
        setSelectedTemplate(template);
        setIsModalVisible(false);
    };

    return (
        <>
            <Stack.Navigator initialRouteName='Home'>
                <Stack.Screen
                    name="Home"
                    component={Home}
                    options={({ navigation }) => ({
                        ...screenOptions({ navigation }),
                        title: "Home",
                        headerRight: () => (
                            <TouchableOpacity onPress={handleOpenWorkoutLog}>
                                <Ionicons name="add-circle-outline" size={24} color="black" style={{ marginRight: 15 }} />
                            </TouchableOpacity>
                        ),
                    })}
                />
                <Stack.Screen name='Notifications' component={Notifications} />
                <Stack.Screen
                    name='WorkoutLog'
                    component={WorkoutLogScreen}
                    initialParams={{ template: selectedTemplate }}
                    options={{
                        headerShown: false,
                        presentation: 'fullScreenModal',
                    }}
                />
            </Stack.Navigator>
            <TemplateModal
                visible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                onSelectTemplate={handleSelectTemplate}
            />
        </>
    );
}

export default HomeStack;
Repeat the Above Steps for Other Stacks
You will need to follow the same pattern for AccountStack, ProgressStack, PostStack, and FeedStack.

Full Implementation
Below is how you can structure your entire App component with all stacks:

jsx
Copy code
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import Home from './src/screens/Home';
import Account from './src/screens/Account';
import Post from './src/screens/Post';
import Progress from './src/screens/Progress';
import Notifications from './src/screens/Notifications';
import PersonalDetails from './src/screens/PersonalDetails';
import WorkoutLogScreen from './src/screens/workout-log';
import SaveGymHighlightScreen from "./src/screens/save-gym-highlight";
import CustomTabBar from "./src/components/CustomTabBar";
import FeedPage from "./src/screens/FeedPage";
import TemplateModal from './src/components/TemplateModal';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const screenOptions = ({ navigation }) => ({
    headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={24} color="black" style={{ marginRight: 15 }} />
        </TouchableOpacity>
    ),
        headerStyle: {
        paddingTop: 20,
            height: 80,
    },
});

function HomeStack() {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    const handleOpenWorkoutLog = () => {
        setIsModalVisible(true);
    };

    const handleSelectTemplate = (template) => {
        setSelectedTemplate(template);
        setIsModalVisible(false);
    };

    return (
        <>
            <Stack.Navigator initialRouteName='Home'>
                <Stack.Screen
                    name="Home"
                    component={Home}
                    options={({ navigation }) => ({
                        ...screenOptions({ navigation }),
                        title: "Home",
                        headerRight: () => (
                            <TouchableOpacity onPress={handleOpenWorkoutLog}>
                                <Ionicons name="add-circle-outline" size={24} color="black" style={{ marginRight: 15 }} />
                            </TouchableOpacity>
                        ),
                    })}
                />
                <Stack.Screen name='Notifications' component={Notifications} />
                <Stack.Screen
                    name='WorkoutLog'
                    component={WorkoutLogScreen}
                    initialParams={{ template: selectedTemplate }}
                    options={{
                        headerShown: false,
                        presentation: 'fullScreenModal',
                    }}
                />
            </Stack.Navigator>
            <TemplateModal
                visible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                onSelectTemplate={handleSelectTemplate}
            />
        </>
    );
}

function AccountStack() {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    const handleOpenWorkoutLog = () => {
        setIsModalVisible(true);
    };

    const handleSelectTemplate = (template) => {
        setSelectedTemplate(template);
        setIsModalVisible(false);
    };

    return (
        <>
            <Stack.Navigator initialRouteName='Account'>
                <Stack.Screen name='Account' component={Account} options={screenOptions} />
                <Stack.Screen name='Notifications' component={Notifications} />
                <Stack.Screen options={{ title: "Personal Details" }} name='PersonalDetails' component={PersonalDetails} />
                <Stack.Screen
                    name='WorkoutLog'
                    component={WorkoutLogScreen}
                    initialParams={{ template: selectedTemplate }}
                    options={{
                        headerShown: false,
                        presentation: 'fullScreenModal',
                    }}
                />
            </Stack.Navigator>
            <TemplateModal
                visible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                onSelectTemplate={handleSelectTemplate}
            />
        </>
    );
}

function ProgressStack() {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    const handleOpenWorkoutLog = () => {
        setIsModalVisible(true);
    };

    const handleSelectTemplate = (template) => {
        setSelectedTemplate(template);
        setIsModalVisible(false);
    };

    return (
        <>
            <Stack.Navigator initialRouteName='Progress'>
                <Stack.Screen name='Progress' component={Progress} options={screenOptions} />
                <Stack.Screen name='Notifications' component={Notifications} />
                <Stack.Screen
                    name='WorkoutLog'
                    component={WorkoutLogScreen}
                    initialParams={{ template: selectedTemplate }}
                    options={{
                        headerShown: false,
                        presentation: 'fullScreenModal',
                    }}
                />
            </Stack.Navigator>
            <TemplateModal
                visible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                onSelectTemplate={handleSelectTemplate}
            />
        </>
    );
}

function PostStack() {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    const handleOpenWorkoutLog = () => {
        setIsModalVisible(true);
    };

    const handleSelectTemplate = (template) => {
        setSelectedTemplate(template);
        setIsModalVisible(false);
    };

    return (
        <>
            <Stack.Navigator initialRouteName='Post'>
                <Stack.Screen name='Save Highlight' component={SaveGymHighlightScreen} options={screenOptions} />
                <Stack.Screen name='Notifications' component={Notifications} />
                <Stack.Screen
                    name='WorkoutLog'
                    component={WorkoutLogScreen}
                    initialParams={{ template: selectedTemplate }}
                    options={{
                        headerShown: false,
                        presentation: 'fullScreenModal',
                    }}
                />
            </Stack.Navigator>
            <TemplateModal
                visible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                onSelectTemplate={handleSelectTemplate}
            />
        </>
    );
}

function FeedStack() {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    const handleOpenWorkoutLog = () => {
        setIsModalVisible(true);
    };

    const handleSelectTemplate = (template) => {
        setSelectedTemplate(template);
        setIsModalVisible(false);
    };

    return (
        <>
            <Stack.Navigator initialRouteName='Feed'>
                <Stack.Screen name='Feed' component={FeedPage} />
                <Stack.Screen
                    name='WorkoutLog'
                    component={WorkoutLogScreen}
                    initialParams={{ template: selectedTemplate }}
                    options={{
                        headerShown: false,
                        presentation: 'fullScreenModal',
                    }}
                />
            </Stack.Navigator>
            <TemplateModal
                visible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                onSelectTemplate={handleSelectTemplate}
            />
        </>
    );
}

function App() {
    return (
        <NavigationContainer>
            <Tab.Navigator tabBar={props => <CustomTabBar {...props} />}>
                <Tab.Screen
                    name='HomeStack'
                    component={HomeStack}
                    options={{ headerShown: false, title: 'Home', tabBarIcon: { name: 'home-outline' } }}
                />
                <Tab.Screen
                    name='PostStack'
                    component={PostStack}
                    options={{ headerShown: false, title: 'Post', tabBarIcon: { name: 'create-outline' } }}
                />
                <Tab.Screen
                    name='ProgressStack'
                    component={ProgressStack}
                    options={{ headerShown: false, title: 'Progress', tabBarIcon: { name: 'trending-up-outline' } }}
                />
                <Tab.Screen
                    name='AccountStack'
                    component={AccountStack}
                    options={{ headerShown: false, title: 'Account', tabBarIcon: { name: 'person-outline' } }}
                />
                <Tab.Screen
                    name='FeedStack'
                    component={FeedStack}
                    options={{ headerShown: false, title: 'Feed', tabBarIcon: { name: 'person-outline' } }}
                />
            </Tab.Navigator>
        </NavigationContainer>
    );
}

export default App;

const styles = StyleSheet.create({
    container: {
        flex: 1,
            backgroundColor: '#fff',
            alignItems: 'center',
            justifyContent: 'center',
    },
});
This implementation ensures that the modal is integrated into each stack navigator and allows the user to select a template before navigating to the Workout Log screen.
I use a custom tab bar to be able to navigate to my workout log from every page. Should I edit this to add the template modal in beforehand?

// src/components/CustomTabBar.js

import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const CustomTabBar = ({ state, descriptors, navigation }) => {
    const nav = useNavigation();

    return (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', height: 60 }}>
            {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];
                const isFocused = state.index === index;

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name);
                    }
                };

                const onLongPress = () => {
                    navigation.emit({
                        type: 'tabLongPress',
                        target: route.key,
                    });
                };

                let iconName;
                switch (route.name) {
                    case 'HomeStack':
                        iconName = 'home-outline';
                        break;
                    case 'PostStack':
                        iconName = 'create-outline';
                        break;
                    case 'SaveHighlightStack':
                        iconName = 'bookmark-outline';
                        break;
                    case 'ProgressStack':
                        iconName = 'trending-up-outline';
                        break;
                    case 'AccountStack':
                        iconName = 'person-outline';
                        break;
                    default:
                        iconName = 'ellipse-outline';
                        break;
                }

                return (
                    <TouchableOpacity
                        key={route.key}
                        onPress={onPress}
                        onLongPress={onLongPress}
                        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
                    >
                        <Ionicons
                            name={options.tabBarIcon?.name || 'ios-home'}
                            size={24}
                            color={isFocused ? '#673ab7' : '#222'}
                        />
                        <Text style={{ color: isFocused ? '#673ab7' : '#222' }}>
                            {options.title || route.name}
                        </Text>
                    </TouchableOpacity>
                );
            })}
            {/* Custom Workout Log Button */}
            <TouchableOpacity
                onPress={() => nav.navigate('WorkoutLog')}
                style={{ justifyContent: 'center', alignItems: 'center', padding: 10 }}
            >
                <Ionicons name="barbell-outline" size={24} color="#222" />
                <Text style={{ color: '#222' }}>Workout Log</Text>
            </TouchableOpacity>
        </View>
    );
};

export default CustomTabBar;

ChatGPT
Yes, integrating the template modal into your custom tab bar is a good approach. This will ensure that the user is always prompted to select a template before opening the Workout Log from any page.

Here’s how you can modify your CustomTabBar component to include the template modal:

Add state management for the modal visibility and the selected template.
Modify the custom button to handle opening the modal and navigating to the Workout Log screen with the selected template.
Updated CustomTabBar.js
jsx
Copy code
import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Modal, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { db, firebase_auth } from '../../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

const CustomTabBar = ({ state, descriptors, navigation }) => {
    const nav = useNavigation();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [templates, setTemplates] = useState([]);

    const handleOpenWorkoutLog = async () => {
        await fetchTemplates();
        setIsModalVisible(true);
    };

    const handleSelectTemplate = (template) => {
        setIsModalVisible(false);
        nav.navigate('WorkoutLog', { template });
    };

    const fetchTemplates = async () => {
        if (!firebase_auth.currentUser) return;

        const userId = firebase_auth.currentUser.uid;
        const templateRef = collection(db, "userProfiles", userId, "templates");
        const querySnapshot = await getDocs(templateRef);
        const templatesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTemplates(templatesList);
    };

    return (
        <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', height: 60 }}>
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    const onLongPress = () => {
                        navigation.emit({
                            type: 'tabLongPress',
                            target: route.key,
                        });
                    };

                    let iconName;
                    switch (route.name) {
                        case 'HomeStack':
                            iconName = 'home-outline';
                            break;
                        case 'PostStack':
                            iconName = 'create-outline';
                            break;
                        case 'SaveHighlightStack':
                            iconName = 'bookmark-outline';
                            break;
                        case 'ProgressStack':
                            iconName = 'trending-up-outline';
                            break;
                        case 'AccountStack':
                            iconName = 'person-outline';
                            break;
                        default:
                            iconName = 'ellipse-outline';
                            break;
                    }

                    return (
                        <TouchableOpacity
                            key={route.key}
                            onPress={onPress}
                            onLongPress={onLongPress}
                            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
                        >
                            <Ionicons
                                name={options.tabBarIcon?.name || 'ios-home'}
                                size={24}
                                color={isFocused ? '#673ab7' : '#222'}
                            />
                            <Text style={{ color: isFocused ? '#673ab7' : '#222' }}>
                                {options.title || route.name}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
                {/* Custom Workout Log Button */}
                <TouchableOpacity
                    onPress={handleOpenWorkoutLog}
                    style={{ justifyContent: 'center', alignItems: 'center', padding: 10 }}
                >
                    <Ionicons name="barbell-outline" size={24} color="#222" />
                    <Text style={{ color: '#222' }}>Workout Log</Text>
                </TouchableOpacity>
            </View>

            {/* Template Modal */}
            <Modal
                visible={isModalVisible}
                onRequestClose={() => setIsModalVisible(false)}
                animationType="slide"
                transparent={true}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select a Template</Text>
                        <FlatList
                            data={templates}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity onPress={() => handleSelectTemplate(item)}>
                                    <Text style={styles.templateItem}>{item.templateName}</Text>
                                </TouchableOpacity>
                            )}
                        />
                        <Button title="Cancel" onPress={() => setIsModalVisible(false)} />
                    </View>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
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
    templateItem: {
        fontSize: 16,
            padding: 10,
            borderBottomWidth: 1,
            borderBottomColor: '#ccc',
    },
});

export default CustomTabBar;
Adjust the Stack Navigator
Ensure the WorkoutLogScreen can handle the template parameter:

jsx
Copy code
export default function WorkoutLogScreen({ route }) {
    const { template } = route.params || {};

    const [exercises, setExercises] = useState(template ? template.exercises.map(ex => ({
        id: ex.id,
        name: ex.name,
        sets: Array.from({ length: ex.setsCount }, (_, i) => ({ key: `set${i + 1}`, weight: '', reps: '' })),
        weightUnit: ex.weightUnit,
        supersets: ex.supersets.map(ss => ({
            id: ss.id,
            name: ss.name,
            sets: Array.from({ length: ss.setsCount }, (_, i) => ({ key: `set${i + 1}`, weight: '', reps: '' })),
            weightUnit: ss.weightUnit,
            weightConfig: ss.weightConfig,
            repsConfig: ss.repsConfig,
        })),
        weightConfig: ex.weightConfig,
        repsConfig: ex.repsConfig,
    })) : [{ id: 'bicepCurls', name: 'Bicep Curls', sets: [{ key: 'set1', weight: '', reps: '' }], weightUnit: 'lbs', supersets: [], weightConfig: 'totalWeight', repsConfig: 'reps' }]);

    // ... rest of your WorkoutLogScreen code
}
This way, whenever you press the custom workout log button in your tab bar, it will open the modal to select a template before navigating to the WorkoutLogScreen. This ensures a consistent user experience across all screens.
I want to edit the app file, or the tab bar, so that my app keeps track of whether a current workout has been started or not. If it has not been started, pressing the 'workout log' button  would first lead to the loading template to optionally choose a template to start a workout from. If a workout has already been started, pressing the 'workout log' button would lead directly to the workout log screen. While an existing workout is running, save all the information currently entered in the text inputs on the workout log screen so that even if the user exits the screen and reenters the info is still there

ChatGPT
To achieve this functionality, you need to manage the workout state globally, ensure the state persists across app re-renders and navigation, and handle the conditional navigation logic based on whether a workout is in progress or not.

Step-by-Step Implementation
Setup global state management using React Context.
Save and retrieve workout state using AsyncStorage.
Modify CustomTabBar to handle conditional navigation based on workout state.
Ensure the workout data persists across sessions.
1. Setup Global State Management
First, create a context to manage the workout state.

WorkoutContext.js:

jsx
Copy code
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WorkoutContext = createContext();

export const WorkoutProvider = ({ children }) => {
    const [workout, setWorkout] = useState(null);

    useEffect(() => {
        const loadWorkout = async () => {
            try {
                const storedWorkout = await AsyncStorage.getItem('currentWorkout');
                if (storedWorkout) {
                    setWorkout(JSON.parse(storedWorkout));
                }
            } catch (error) {
                console.error('Failed to load workout from storage:', error);
            }
        };

        loadWorkout();
    }, []);

    useEffect(() => {
        const saveWorkout = async () => {
            try {
                if (workout) {
                    await AsyncStorage.setItem('currentWorkout', JSON.stringify(workout));
                } else {
                    await AsyncStorage.removeItem('currentWorkout');
                }
            } catch (error) {
                console.error('Failed to save workout to storage:', error);
            }
        };

        saveWorkout();
    }, [workout]);

    return (
        <WorkoutContext.Provider value={{ workout, setWorkout }}>
            {children}
        </WorkoutContext.Provider>
    );
};

export const useWorkout = () => useContext(WorkoutContext);
2. Modify App.js to Use the Workout Provider
Wrap your app in the WorkoutProvider.

App.js:

jsx
Copy code
import React from 'react';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import Home from './src/screens/Home';
import Account from './src/screens/Account';
import Post from './src/screens/Post';
import Progress from './src/screens/Progress';
import Notifications from './src/screens/Notifications';
import PersonalDetails from './src/screens/PersonalDetails';
import WorkoutLogScreen from './src/screens/workout-log';
import SaveGymHighlightScreen from "./src/screens/save-gym-highlight";
import CustomTabBar from "./src/components/CustomTabBar";
import FeedPage from "./src/screens/FeedPage";
import { WorkoutProvider } from './src/context/WorkoutContext'; // Import the provider

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const screenOptions = ({ navigation }) => ({
    headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={24} color="black" style={{ marginRight: 15 }} />
        </TouchableOpacity>
    ),
        headerStyle: {
        paddingTop: 20,
            height: 80,
    },
});

function HomeStack() {
    return (
        <Stack.Navigator initialRouteName='Home'>
            <Stack.Screen
                name="Home"
                component={Home}
                options={({ navigation }) => ({
                    ...screenOptions({ navigation }),
                    title: "Home"
                })}
            />
            <Stack.Screen name='Notifications' component={Notifications} />
            <Stack.Screen
                name='WorkoutLog'
                component={WorkoutLogScreen}
                options={{
                    headerShown: false,
                    presentation: 'fullScreenModal',
                }}
            />
        </Stack.Navigator>
    );
}

function AccountStack() {
    return (
        <Stack.Navigator initialRouteName='Account'>
            <Stack.Screen name='Account' component={Account} options={screenOptions} />
            <Stack.Screen name='Notifications' component={Notifications} />
            <Stack.Screen options={{ title: "Personal Details" }} name='PersonalDetails' component={PersonalDetails} />
            <Stack.Screen
                name='WorkoutLog'
                component={WorkoutLogScreen}
                options={{
                    headerShown: false,
                    presentation: 'fullScreenModal',
                }}
            />
        </Stack.Navigator>
    );
}

function ProgressStack() {
    return (
        <Stack.Navigator initialRouteName='Progress'>
            <Stack.Screen name='Progress' component={Progress} options={screenOptions} />
            <Stack.Screen name='Notifications' component={Notifications} />
            <Stack.Screen
                name='WorkoutLog'
                component={WorkoutLogScreen}
                options={{
                    headerShown: false,
                    presentation: 'fullScreenModal',
                }}
            />
        </Stack.Navigator>
    );
}

function PostStack() {
    return (
        <Stack.Navigator initialRouteName='Post'>
            <Stack.Screen name='Save Highlight' component={SaveGymHighlightScreen} options={screenOptions} />
            <Stack.Screen name='Notifications' component={Notifications} />
            <Stack.Screen
                name='WorkoutLog'
                component={WorkoutLogScreen}
                options={{
                    headerShown: false,
                    presentation: 'fullScreenModal',
                }}
            />
        </Stack.Navigator>
    );
}

function FeedStack() {
    return (
        <Stack.Navigator initialRouteName='Feed'>
            <Stack.Screen name='Feed' component={FeedPage} />
            <Stack.Screen
                name='WorkoutLog'
                component={WorkoutLogScreen}
                options={{
                    headerShown: false,
                    presentation: 'fullScreenModal',
                }}
            />
        </Stack.Navigator>
    );
}

function App() {
    return (
        <WorkoutProvider> {/* Wrap the app in the WorkoutProvider */}
            <NavigationContainer>
                <Tab.Navigator tabBar={props => <CustomTabBar {...props} />}>
                    <Tab.Screen
                        name='HomeStack'
                        component={HomeStack}
                        options={{ headerShown: false, title: 'Home', tabBarIcon: { name: 'home-outline' } }}
                    />
                    <Tab.Screen
                        name='PostStack'
                        component={PostStack}
                        options={{ headerShown: false, title: 'Post', tabBarIcon: { name: 'create-outline' } }}
                    />
                    <Tab.Screen
                        name='ProgressStack'
                        component={ProgressStack}
                        options={{ headerShown: false, title: 'Progress', tabBarIcon: { name: 'trending-up-outline' } }}
                    />
                    <Tab.Screen
                        name='AccountStack'
                        component={AccountStack}
                        options={{ headerShown: false, title: 'Account', tabBarIcon: { name: 'person-outline' } }}
                    />
                    <Tab.Screen
                        name='FeedStack'
                        component={FeedStack}
                        options={{ headerShown: false, title: 'Feed', tabBarIcon: { name: 'person-outline' } }}
                    />
                </Tab.Navigator>
            </NavigationContainer>
        </WorkoutProvider>
    );
}

export default App;

const styles = StyleSheet.create({
    container: {
        flex: 1,
            backgroundColor: '#fff',
            alignItems: 'center',
            justifyContent: 'center',
    },
});
3. Modify CustomTabBar to Handle Conditional Navigation
Update the CustomTabBar to handle the conditional navigation based on whether a workout is in progress or not:

CustomTabBar.js:

jsx
Copy code
import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Modal, FlatList, StyleSheet, Button } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { db, firebase_auth } from '../../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { useWorkout } from '../context/WorkoutContext'; // Import the context

const CustomTabBar = ({ state, descriptors, navigation }) => {
    const nav = useNavigation();
    const { workout, setWorkout } = useWorkout(); // Use the workout context
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [templates, setTemplates] = useState([]);

    const handleOpenWorkoutLog = async () => {
        if (workout) {
            nav.navigate('WorkoutLog');
        } else {
            await fetchTemplates();
            setIsModalVisible(true);
        }
    };

    const handleSelectTemplate = (template) => {
        setWorkout({ exercises: template.exercises });
        setIsModalVisible(false);
        nav.navigate('WorkoutLog', { template });
    };

    const fetchTemplates = async () => {
        if (!firebase_auth.currentUser) return;

        const userId = firebase_auth.currentUser.uid;
        const templateRef = collection(db, "userProfiles", userId, "templates");
        const querySnapshot = await getDocs(templateRef);
        const templatesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTemplates(templatesList);
    };

    return (
        <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', height: 60 }}>
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    const onLongPress = () => {
                        navigation.emit({
                            type: 'tabLongPress',
                            target: route.key,
                        });
                    };

                    let iconName;
                    switch (route.name) {
                        case 'HomeStack':
                            iconName = 'home-outline';
                            break;
                        case 'PostStack':
                            iconName = 'create-outline';
                            break;
                        case 'SaveHighlightStack':
                            iconName = 'bookmark-outline';
                            break;
                        case 'ProgressStack':
                            iconName = 'trending-up-outline';
                            break;
                        case 'AccountStack':
                            iconName = 'person-outline';
                            break;
                        default:
                            iconName = 'ellipse-outline';
                            break;
                    }

                    return (
                        <TouchableOpacity
                            key={route.key}
                            onPress={onPress}
                            onLongPress={onLongPress}
                            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
                        >
                            <Ionicons
                                name={options.tabBarIcon?.name || 'ios-home'}
                                size={24}
                                color={isFocused ? '#673ab7' : '#222'}
                            />
                            <Text style={{ color: isFocused ? '#673ab7' : '#222' }}>
                                {options.title || route.name}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
                {/* Custom Workout Log Button */}
                <TouchableOpacity
                    onPress={handleOpenWorkoutLog}
                    style={{ justifyContent: 'center', alignItems: 'center', padding: 10 }}
                >
                    <Ionicons name="barbell-outline" size={24} color="#222" />
                    <Text style={{ color: '#222' }}>Workout Log</Text>
                </TouchableOpacity>
            </View>

            {/* Template Modal */}
            <Modal
                visible={isModalVisible}
                onRequestClose={() => setIsModalVisible(false)}
                animationType="slide"
                transparent={true}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select a Template</Text>
                        <FlatList
                            data={templates}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity onPress={() => handleSelectTemplate(item)}>
                                    <Text style={styles.templateItem}>{item.templateName}</Text>
                                </TouchableOpacity>
                            )}
                        />
                        <Button title="Cancel" onPress={() => setIsModalVisible(false)} />
                    </View>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
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
    templateItem: {
        fontSize: 16,
            padding: 10,
            borderBottomWidth: 1,
            borderBottomColor: '#ccc',
    },
});

export default CustomTabBar;
4. Ensure Workout Data Persists in WorkoutLogScreen
Update WorkoutLogScreen to load and save the workout data using the context and AsyncStorage:

WorkoutLogScreen.js:

jsx
Copy code
import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, StyleSheet, FlatList, Text } from 'react-native';
import { useWorkout } from '../context/WorkoutContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function WorkoutLogScreen({ route }) {
    const { template } = route.params || {};
    const { workout, setWorkout } = useWorkout();
    const [exercises, setExercises] = useState(
        workout ? workout.exercises :
            (template ? template.exercises.map(ex => ({
                id: ex.id,
                name: ex.name,
                sets: Array.from({ length: ex.setsCount }, (_, i) => ({ key: `set${i + 1}`, weight: '', reps: '' })),
                weightUnit: ex.weightUnit,
                supersets: ex.supersets.map(ss => ({
                    id: ss.id,
                    name: ss.name,
                    sets: Array.from({ length: ss.setsCount }, (_, i) => ({ key: `set${i + 1}`, weight: '', reps: '' })),
                    weightUnit: ss.weightUnit,
                    weightConfig: ss.weightConfig,
                    repsConfig: ss.repsConfig,
                })),
                weightConfig: ex.weightConfig,
                repsConfig: ex.repsConfig,
            })) : [{ id: 'bicepCurls', name: 'Bicep Curls', sets: [{ key: 'set1', weight: '', reps: '' }], weightUnit: 'lbs', supersets: [], weightConfig: 'totalWeight', repsConfig: 'reps' }])
    );

    useEffect(() => {
        const saveWorkout = async () => {
            try {
                await AsyncStorage.setItem('currentWorkout', JSON.stringify({ exercises }));
            } catch (error) {
                console.error('Failed to save workout to storage:', error);
            }
        };

        saveWorkout();
    }, [exercises]);

    const handleUpdateExercise = (index, newExercise) => {
        const updatedExercises = [...exercises];
        updatedExercises[index] = newExercise;
        setExercises(updatedExercises);
        setWorkout({ exercises: updatedExercises });
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={exercises}
                keyExtractor={item => item.id}
                renderItem={({ item, index }) => (
                    <View key={item.id} style={styles.exerciseContainer}>
                        <Text>{item.name}</Text>
                        {item.sets.map((set, setIndex) => (
                            <View key={set.key} style={styles.setRow}>
                                <TextInput
                                    placeholder="Weight"
                                    value={set.weight}
                                    onChangeText={(text) => handleUpdateExercise(index, { ...item, sets: item.sets.map((s, i) => i === setIndex ? { ...s, weight: text } : s) })}
                                    style={styles.input}
                                />
                                <TextInput
                                    placeholder="Reps"
                                    value={set.reps}
                                    onChangeText={(text) => handleUpdateExercise(index, { ...item, sets: item.sets.map((s, i) => i === setIndex ? { ...s, reps: text } : s) })}
                                    style={styles.input}
                                />
                            </View>
                        ))}
                    </View>
                )}
            />
            <Button title="Save Workout" onPress={() => {/* Handle Save Workout Logic */}} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
            padding: 20,
    },
    exerciseContainer: {
        marginBottom: 20,
    },
    setRow: {
        flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 10,
    },
    input: {
        flex: 1,
            borderWidth: 1,
            borderColor: '#ccc',
            padding: 10,
            marginRight: 5,
            borderRadius: 5,
    },
});
Summary
With these changes, your app can now:

Keep track of whether a workout has been started or not.
Prompt the user to select a template if no workout is in progress.
Navigate directly to the Workout Log if a workout is already in progress.
Persist workout data across sessions using AsyncStorage.
This provides a seamless user experience where workout data is preserved and easily accessible.
this was the custom template modal you gave me. Is there anything I need to do to make it an actual screen, but sliding up like a modal?

// src/components/TemplateModal.js
import React, { useState, useEffect } from 'react';
import { View, Text, Button, Modal, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { db, firebase_auth } from '../../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

const TemplateModal = ({ visible, onClose, onSelectTemplate }) => {
    const [templates, setTemplates] = useState([]);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        if (!firebase_auth.currentUser) return;

        const userId = firebase_auth.currentUser.uid;
        const templateRef = collection(db, "userProfiles", userId, "templates");
        const querySnapshot = await getDocs(templateRef);
        const templatesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTemplates(templatesList);
    };

    return (
        <Modal
            visible={visible}
            onRequestClose={onClose}
            animationType="slide"
            transparent={true}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Select a Template</Text>
                    <FlatList
                        data={templates}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity onPress={() => onSelectTemplate(item)}>
                                <Text style={styles.templateItem}>{item.templateName}</Text>
                            </TouchableOpacity>
                        )}
                    />
                    <Button title="Cancel" onPress={onClose} />
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
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
    templateItem: {
        fontSize: 16,
            padding: 10,
            borderBottomWidth: 1,
            borderBottomColor: '#ccc',
    },
});

export default TemplateModal;

ChatGPT
To make the TemplateModal an actual screen while preserving the modal slide-up animation, you need to use React Navigation's modal presentation style. This can be achieved by defining it as a screen in your navigation stack with the appropriate options.

Here's how you can do it:

Define the TemplateModalScreen as a screen in your navigation stack.
Use React Navigation's modal presentation style to achieve the slide-up effect.
Step-by-Step Implementation
1. Convert TemplateModal to a Screen

First, let's convert the TemplateModal component to be used as a screen:

src/screens/TemplateModalScreen.js

jsx
Copy code
import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { db, firebase_auth } from '../../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';

const TemplateModalScreen = ({ route }) => {
    const { onSelectTemplate } = route.params;
    const [templates, setTemplates] = useState([]);
    const navigation = useNavigation();

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        if (!firebase_auth.currentUser) return;

        const userId = firebase_auth.currentUser.uid;
        const templateRef = collection(db, "userProfiles", userId, "templates");
        const querySnapshot = await getDocs(templateRef);
        const templatesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTemplates(templatesList);
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Select a Template</Text>
                <FlatList
                    data={templates}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => {
                            onSelectTemplate(item);
                            navigation.goBack();
                        }}>
                            <Text style={styles.templateItem}>{item.templateName}</Text>
                        </TouchableOpacity>
                    )}
                />
                <Button title="Cancel" onPress={() => navigation.goBack()} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    content: {
        backgroundColor: 'white',
            padding: 20,
            borderRadius: 10,
            alignItems: 'center',
    },
    title: {
        fontSize: 20,
            marginBottom: 10,
    },
    templateItem: {
        fontSize: 16,
            padding: 10,
            borderBottomWidth: 1,
            borderBottomColor: '#ccc',
    },
});

export default TemplateModalScreen;
2. Define the Screen in Your Stack Navigator

Next, add TemplateModalScreen to your stack navigator and set the presentation style to modal.

App.js

jsx
Copy code
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import Home from './src/screens/Home';
import Account from './src/screens/Account';
import Post from './src/screens/Post';
import Progress from './src/screens/Progress';
import Notifications from './src/screens/Notifications';
import PersonalDetails from './src/screens/PersonalDetails';
import WorkoutLogScreen from './src/screens/workout-log';
import SaveGymHighlightScreen from "./src/screens/save-gym-highlight";
import CustomTabBar from "./src/components/CustomTabBar";
import FeedPage from "./src/screens/FeedPage";
import TemplateModalScreen from './src/screens/TemplateModalScreen';
import { WorkoutProvider } from './src/context/WorkoutContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const screenOptions = ({ navigation }) => ({
    headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={24} color="black" style={{ marginRight: 15 }} />
        </TouchableOpacity>
    ),
        headerStyle: {
        paddingTop: 20,
            height: 80,
    },
});

function HomeStack() {
    return (
        <Stack.Navigator initialRouteName='Home'>
            <Stack.Screen
                name="Home"
                component={Home}
                options={({ navigation }) => ({
                    ...screenOptions({ navigation }),
                    title: "Home"
                })}
            />
            <Stack.Screen name='Notifications' component={Notifications} />
            <Stack.Screen
                name='WorkoutLog'
                component={WorkoutLogScreen}
                options={{
                    headerShown: false,
                    presentation: 'fullScreenModal',
                }}
            />
            <Stack.Screen
                name='TemplateModal'
                component={TemplateModalScreen}
                options={{
                    headerShown: false,
                    presentation: 'modal',
                }}
            />
        </Stack.Navigator>
    );
}

// Repeat similar changes for other stacks (AccountStack, ProgressStack, PostStack, FeedStack)

function App() {
    return (
        <WorkoutProvider>
            <NavigationContainer>
                <Tab.Navigator tabBar={props => <CustomTabBar {...props} />}>
                    <Tab.Screen
                        name='HomeStack'
                        component={HomeStack}
                        options={{ headerShown: false, title: 'Home', tabBarIcon: { name: 'home-outline' } }}
                    />
                    <Tab.Screen
                        name='PostStack'
                        component={PostStack}
                        options={{ headerShown: false, title: 'Post', tabBarIcon: { name: 'create-outline' } }}
                    />
                    <Tab.Screen
                        name='ProgressStack'
                        component={ProgressStack}
                        options={{ headerShown: false, title: 'Progress', tabBarIcon: { name: 'trending-up-outline' } }}
                    />
                    <Tab.Screen
                        name='AccountStack'
                        component={AccountStack}
                        options={{ headerShown: false, title: 'Account', tabBarIcon: { name: 'person-outline' } }}
                    />
                    <Tab.Screen
                        name='FeedStack'
                        component={FeedStack}
                        options={{ headerShown: false, title: 'Feed', tabBarIcon: { name: 'person-outline' } }}
                    />
                </Tab.Navigator>
            </NavigationContainer>
        </WorkoutProvider>
    );
}

export default App;

const styles = StyleSheet.create({
    container: {
        flex: 1,
            backgroundColor: '#fff',
            alignItems: 'center',
            justifyContent: 'center',
    },
});
3. Update CustomTabBar to Navigate to TemplateModalScreen

Modify the CustomTabBar to handle the conditional navigation:

CustomTabBar.js

jsx
Copy code
import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Button } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useWorkout } from '../context/WorkoutContext';

const CustomTabBar = ({ state, descriptors, navigation }) => {
    const nav = useNavigation();
    const { workout } = useWorkout();

    const handleOpenWorkoutLog = () => {
        if (workout) {
            nav.navigate('WorkoutLog');
        } else {
            nav.navigate('TemplateModal', {
                onSelectTemplate: (template) => {
                    setWorkout({ exercises: template.exercises });
                    nav.navigate('WorkoutLog', { template });
                },
            });
        }
    };

    return (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', height: 60 }}>
            {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];
                const isFocused = state.index === index;

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name);
                    }
                };

                const onLongPress = () => {
                    navigation.emit({
                        type: 'tabLongPress',
                        target: route.key,
                    });
                };

                let iconName;
                switch (route.name) {
                    case 'HomeStack':
                        iconName = 'home-outline';
                        break;
                    case 'PostStack':
                        iconName = 'create-outline';
                        break;
                    case 'SaveHighlightStack':
                        iconName = 'bookmark-outline';
                        break;
                    case 'ProgressStack':
                        iconName = 'trending-up-outline';
                        break;
                    case 'AccountStack':
                        iconName = 'person-outline';
                        break;
                    default:
                        iconName = 'ellipse-outline';
                        break;
                }

                return (
                    <TouchableOpacity
                        key={route.key}
                        onPress={onPress}
                        onLongPress={onLongPress}
                        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
                    >
                        <Ionicons
                            name={options.tabBarIcon?.name || 'ios-home'}
                            size={24}
                            color={isFocused ? '#673ab7' : '#
                                if I want to make a context for the workout, where is it conventionally stored? Is there usually a subfolder under the main app folder for contexts

                                ChatGPT
                                Yes, it's a common convention to store context files in a dedicated folder within your project structure. This keeps your context-related logic organized and easily accessible. You can create a folder named context or contexts under the main src folder (or wherever your main app logic resides) to store all your context providers.

                                Here's how you can organize your project structure:

                                lua
                                Copy code
                                src/
                                |-- components/
                                |-- context/
                                |   |-- WorkoutContext.js
                                |-- screens/
                                |-- navigation/
                                |-- App.js
                                |-- ...
                                Creating the WorkoutContext
                                Create the context file in the context folder.
                                src/context/WorkoutContext.js

                                jsx
                                Copy code
                                import React, { createContext, useState, useContext, useEffect } from 'react';
                                import AsyncStorage from '@react-native-async-storage/async-storage';

                                const WorkoutContext = createContext();

                                export const WorkoutProvider = ({ children }) => {
                                const [workout, setWorkout] = useState(null);

                                useEffect(() => {
                                const loadWorkout = async () => {
                                try {
                                const storedWorkout = await AsyncStorage.getItem('currentWorkout');
                                if (storedWorkout) {
                                setWorkout(JSON.parse(storedWorkout));
                            }
                            } catch (error) {
                                console.error('Failed to load workout from storage:', error);
                            }
                            };

                                loadWorkout();
                            }, []);

                                useEffect(() => {
                                const saveWorkout = async () => {
                                try {
                                if (workout) {
                                await AsyncStorage.setItem('currentWorkout', JSON.stringify(workout));
                            } else {
                                await AsyncStorage.removeItem('currentWorkout');
                            }
                            } catch (error) {
                                console.error('Failed to save workout to storage:', error);
                            }
                            };

                                saveWorkout();
                            }, [workout]);

                                return (
                                <WorkoutContext.Provider value={{ workout, setWorkout }}>
                            {children}
                        </WorkoutContext.Provider>
                        );
                        };

                        export const useWorkout = () => useContext(WorkoutContext);
                        Integrating the WorkoutProvider in the App
                        Wrap your app with the WorkoutProvider in App.js.
                        src/App.js

                        jsx
                        Copy code
                        import React from 'react';
                        import { StyleSheet, TouchableOpacity } from 'react-native';
                        import { NavigationContainer } from '@react-navigation/native';
                        import { createNativeStackNavigator } from '@react-navigation/native-stack';
                        import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
                        import { Ionicons } from '@expo/vector-icons';
                        import Home from './screens/Home';
                        import Account from './screens/Account';
                        import Post from './screens/Post';
                        import Progress from './screens/Progress';
                        import Notifications from './screens/Notifications';
                        import PersonalDetails from './screens/PersonalDetails';
                        import WorkoutLogScreen from './screens/workout-log';
                        import SaveGymHighlightScreen from "./screens/save-gym-highlight";
                        import CustomTabBar from "./components/CustomTabBar";
                        import FeedPage from "./screens/FeedPage";
                        import TemplateModalScreen from './screens/TemplateModalScreen';
                        import { WorkoutProvider } from './context/WorkoutContext';

                        const Stack = createNativeStackNavigator();
                        const Tab = createBottomTabNavigator();

                        const screenOptions = ({ navigation }) => ({
                        headerRight: () => (
                        <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
                            <Ionicons name="notifications-outline" size={24} color="black" style={{ marginRight: 15 }} />
                        </TouchableOpacity>
                        ),
                        headerStyle: {
                        paddingTop: 20,
                        height: 80,
                        },
                        });

                        function HomeStack() {
                        return (
                        <Stack.Navigator initialRouteName='Home'>
                            <Stack.Screen
                                name="Home"
                                component={Home}
                                options={({ navigation }) => ({
                                    ...screenOptions({ navigation }),
                                    title: "Home"
                                })}
                            />
                            <Stack.Screen name='Notifications' component={Notifications} />
                            <Stack.Screen
                                name='WorkoutLog'
                                component={WorkoutLogScreen}
                                options={{
                                    headerShown: false,
                                    presentation: 'fullScreenModal',
                                }}
                            />
                            <Stack.Screen
                                name='TemplateModal'
                                component={TemplateModalScreen}
                                options={{
                                    headerShown: false,
                                    presentation: 'modal',
                                }}
                            />
                        </Stack.Navigator>
                        );
                        }

                        // Repeat similar changes for other stacks (AccountStack, ProgressStack, PostStack, FeedStack)

                        function App() {
                        return (
                        <WorkoutProvider>
                            <NavigationContainer>
                                <Tab.Navigator tabBar={props => <CustomTabBar {...props} />}>
                                    <Tab.Screen
                                        name='HomeStack'
                                        component={HomeStack}
                                        options={{ headerShown: false, title: 'Home', tabBarIcon: { name: 'home-outline' } }}
                                    />
                                    <Tab.Screen
                                        name='PostStack'
                                        component={PostStack}
                                        options={{ headerShown: false, title: 'Post', tabBarIcon: { name: 'create-outline' } }}
                                    />
                                    <Tab.Screen
                                        name='ProgressStack'
                                        component={ProgressStack}
                                        options={{ headerShown: false, title: 'Progress', tabBarIcon: { name: 'trending-up-outline' } }}
                                    />
                                    <Tab.Screen
                                        name='AccountStack'
                                        component={AccountStack}
                                        options={{ headerShown: false, title: 'Account', tabBarIcon: { name: 'person-outline' } }}
                                    />
                                    <Tab.Screen
                                        name='FeedStack'
                                        component={FeedStack}
                                        options={{ headerShown: false, title: 'Feed', tabBarIcon: { name: 'person-outline' } }}
                                    />
                                </Tab.Navigator>
                            </NavigationContainer>
                        </WorkoutProvider>
                        );
                        }

                        export default App;

                        const styles = StyleSheet.create({
                        container: {
                        flex: 1,
                        backgroundColor: '#fff',
                        alignItems: 'center',
                        justifyContent: 'center',
                        },
                        });
                        3. Modify CustomTabBar to Handle Conditional Navigation
                        Ensure your CustomTabBar correctly navigates based on whether a workout is in progress or not:

                        src/components/CustomTabBar.js

                        jsx
                        Copy code
                        import React from 'react';
                        import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
                        import { Ionicons } from '@expo/vector-icons';
                        import { useNavigation } from '@react-navigation/native';
                        import { useWorkout } from '../context/WorkoutContext';

                        const CustomTabBar = ({ state, descriptors, navigation }) => {
                        const nav = useNavigation();
                        const { workout } = useWorkout();

                        const handleOpenWorkoutLog = () => {
                        if (workout) {
                        nav.navigate('WorkoutLog');
                        } else {
                        nav.navigate('TemplateModal', {
                        onSelectTemplate: (template) => {
                        setWorkout({ exercises: template.exercises });
                        nav.navigate('WorkoutLog', { template });
                        },
                        });
                        }
                        };

                        return (
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', height: 60 }}>
                            {state.routes.map((route, index) => {
                                const { options } = descriptors[route.key];
                                const isFocused = state.index === index;

                                const onPress = () => {
                                    const event = navigation.emit({
                                        type: 'tabPress',
                                        target: route.key,
                                        canPreventDefault: true,
                                    });

                                    if (!isFocused && !event.defaultPrevented) {
                                        navigation.navigate(route.name);
                                    }
                                };

                                const onLongPress = () => {
                                    navigation.emit({
                                        type: 'tabLongPress',
                                        target: route.key,
                                    });
                                };

                                let iconName;
                                switch (route.name) {
                                    case 'HomeStack':
                                        iconName = 'home-outline';
                                        break;
                                    case 'PostStack':
                                        iconName = 'create-outline';
                                        break;
                                    case 'SaveHighlightStack':
                                        iconName = 'bookmark-outline';
                                        break;
                                    case 'ProgressStack':
                                        iconName = 'trending-up-outline';
                                        break;
                                    case 'AccountStack':
                                        iconName = 'person-outline';
                                        break;
                                    default:
                                        iconName = 'ellipse-outline';
                                        break;
                                }

                                return (
                                    <TouchableOpacity
                                        key={route.key}
                                        onPress={onPress}
                                        onLongPress={onLongPress}
                                        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
                                    >
                                        <Ionicons
                                            name={options.tabBarIcon?.name || 'ios-home'}
                                            size={24}
                                            color={isFocused ? '#673ab7' : '#222'}
                                        />
                                        <Text style={{ color: isFocused ? '#673ab7' : '#222' }}>
                                            {options.title || route.name}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                            {/* Custom Workout Log Button */}
                            <TouchableOpacity
                                onPress={handleOpenWorkoutLog}
                                style={{ justifyContent: 'center', alignItems: 'center', padding: 10 }}
                            >
                                <Ionicons name="barbell-outline" size={24} color="#222" />
                                <Text style={{ color: '#222' }}>Workout Log</Text>
                            </TouchableOpacity>
                        </View>
                        );
                        };

                        const styles = StyleSheet.create({
                        // Add any styles you need here
                        });

                        export default CustomTabBar;
                        With these changes, your app will have a context for managing workout state, a modal screen for selecting workout templates, and logic to handle conditional navigation based on whether a workout is in progress. The context provider is stored in a dedicated context folder for better organization and maintainability.
                        import React, { useState, useEffect } from 'react';
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
                        import { useNavigation } from '@react-navigation/native';
                        import { Picker } from "@react-native-picker/picker";
                        import Animated, {useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

                        export default function WorkoutLogScreen() {
                        const navigation = useNavigation();

                        const [exercises, setExercises] = useState([
                        { id: 'bicepCurls', name: 'Bicep Curls', sets: [{ key: 'set1', weight: '', reps: '' }], weightUnit: 'lbs', supersets: [], weightConfig: 'totalWeight', repsConfig: 'reps' }
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

                        const timerHeight = useSharedValue(120);

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
                        key: set${exercises[exerciseIndex].sets.length + 1},
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
                        id: superset${newExercises[exerciseIndex].supersets.length + 1},
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
                        id: exercise${exercises.length + 1},
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
                        totalWeight = BW + ${weight} ${unit};
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
                            {Lifting ${totalWeight} total ${exercise.weightUnit} for set ${lastFilledIndex}}
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
                                    </GestureHandlerRootView>
                                );
                            })}
                            {renderTotalWeightMessage(
                                supersetIndex === null ? exercises[exerciseIndex] : exercises[exerciseIndex].supersets[supersetIndex],
                                sets
                            )}
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
                        ? BW + ${set.weight} ${ex.weightUnit}
                        : ${calculateTotalWeight(parseFloat(set.weight), ex.weightConfig, ex.weightUnit)} ${ex.weightUnit},
                        reps: ex.repsConfig === 'time' ? ${set.reps} secs : ${set.reps} reps
                        })),
                        supersets: ex.supersets.map(superset => ({
                        id: camelCase(superset.name),
                        name: superset.name,
                        sets: superset.sets.filter(set => set.weight !== '' && set.reps !== '').map(set => ({
                        ...set,
                        weight: superset.weightConfig === 'bodyWeight'
                        ? 'BW'
                        : superset.weightConfig === 'extraWeightBodyWeight'
                        ? BW + ${set.weight} ${superset.weightUnit}
                        : ${calculateTotalWeight(parseFloat(set.weight), superset.weightConfig, superset.weightUnit)} ${superset.weightUnit},
                        reps: superset.repsConfig === 'time' ? ${set.reps} secs : ${set.reps} reps
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
                        weightUnit: ex.weightUnit,
                        supersets: ex.supersets.map(superset => ({
                        id: camelCase(superset.name),
                        name: superset.name,
                        setsCount: superset.sets.length,
                        weightUnit: superset.weightUnit,
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
                        key: set${newExercises[exerciseIndex].supersets[supersetIndex].sets.length + 1},
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
                        return Array.from({ length: range }, (_, i) => ({ label: ${i}, value: i }));
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

                        return (
                        <GestureHandlerRootView style={styles.fullScreenContainer}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.headerText}>Workout Log</Text>
                                <TouchableOpacity onPress={navigation.goBack} style={styles.hideButton}>
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
                        backgroundColor: '#e9ecef',
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

                        this is my workout log screen. Information on how the template is saved to firebase is also present in that screen. How should I then process the template passed in by the previous templates page, to load into this workout screen?

                        ChatGPT
                        To load the template into the WorkoutLogScreen, you can make use of React Navigation's route parameters to pass the selected template from the TemplateModalScreen to the WorkoutLogScreen. Then, in the WorkoutLogScreen, you can check if a template is passed in and initialize the exercises state accordingly.

                        Here are the steps to achieve this:

                        Update the TemplateModalScreen to pass the selected template:
                        Ensure that the TemplateModalScreen passes the selected template back to the WorkoutLogScreen:

                        src/screens/TemplateModalScreen.js

                        jsx
                        Copy code
                        import React, { useState, useEffect } from 'react';
                        import { View, Text, Button, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
                        import { db, firebase_auth } from '../../firebaseConfig';
                        import { collection, getDocs } from 'firebase/firestore';
                        import { useNavigation } from '@react-navigation/native';

                        const TemplateModalScreen = ({ route }) => {
                        const { onSelectTemplate } = route.params;
                        const [templates, setTemplates] = useState([]);
                        const navigation = useNavigation();

                        useEffect(() => {
                        fetchTemplates();
                        }, []);

                        const fetchTemplates = async () => {
                        if (!firebase_auth.currentUser) return;

                        const userId = firebase_auth.currentUser.uid;
                        const templateRef = collection(db, "userProfiles", userId, "templates");
                        const querySnapshot = await getDocs(templateRef);
                        const templatesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        setTemplates(templatesList);
                        };

                        return (
                        <View style={styles.container}>
                            <View style={styles.content}>
                                <Text style={styles.title}>Select a Template</Text>
                                <FlatList
                                    data={templates}
                                    keyExtractor={item => item.id}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity onPress={() => {
                                            onSelectTemplate(item);
                                            navigation.navigate('WorkoutLog', { template: item });
                                        }}>
                                            <Text style={styles.templateItem}>{item.templateName}</Text>
                                        </TouchableOpacity>
                                    )}
                                />
                                <Button title="Cancel" onPress={() => navigation.goBack()} />
                            </View>
                        </View>
                        );
                        };

                        const styles = StyleSheet.create({
                        container: {
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        },
                        content: {
                        backgroundColor: 'white',
                        padding: 20,
                        borderRadius: 10,
                        alignItems: 'center',
                        },
                        title: {
                        fontSize: 20,
                        marginBottom: 10,
                        },
                        templateItem: {
                        fontSize: 16,
                        padding: 10,
                        borderBottomWidth: 1,
                        borderBottomColor: '#ccc',
                        },
                        });

                        export default TemplateModalScreen;
                        Update WorkoutLogScreen to load the exercises from the passed template:
                        Modify the WorkoutLogScreen to initialize the exercises state based on the passed template:

                        src/screens/workout-log.js

                        jsx
                        Copy code
                        import React, { useState, useEffect } from 'react';
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
                        import { useNavigation, useRoute } from '@react-navigation/native';
                        import { Picker } from "@react-native-picker/picker";
                        import Animated, {useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

                        export default function WorkoutLogScreen() {
                        const navigation = useNavigation();
                        const route = useRoute();
                        const { template } = route.params || {};

                        const [exercises, setExercises] = useState(() => {
                        if (template) {
                        return template.exercises.map(ex => ({
                        id: ex.id,
                        name: ex.name,
                        sets: Array.from({ length: ex.setsCount }, (_, i) => ({ key: `set${i + 1}`, weight: '', reps: '' })),
                        weightUnit: ex.weightUnit,
                        supersets: ex.supersets.map(ss => ({
                        id: ss.id,
                        name: ss.name,
                        sets: Array.from({ length: ss.setsCount }, (_, i) => ({ key: `set${i + 1}`, weight: '', reps: '' })),
                        weightUnit: ss.weightUnit,
                        weightConfig: ss.weightConfig,
                        repsConfig: ss.repsConfig,
                        })),
                        weightConfig: ex.weightConfig,
                        repsConfig: ex.repsConfig,
                        }));
                        }
                        return [
                        { id: 'bicepCurls', name: 'Bicep Curls', sets: [{ key: 'set1', weight: '', reps: '' }], weightUnit: 'lbs', supersets: [], weightConfig: 'totalWeight', repsConfig: 'reps' }
                        ];
                        });

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

                        const timerHeight = useSharedValue(120);

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
                                    </GestureHandlerRootView>
                                );
                            })}
                            {renderTotalWeightMessage(
                                supersetIndex === null ? exercises[exerciseIndex] : exercises[exerciseIndex].supersets[supersetIndex],
                                sets
                            )}
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
                        weightUnit: ex.weightUnit,
                        supersets: ex.supersets.map(superset => ({
                        id: camelCase(superset.name),
                        name: superset.name,
                        setsCount: superset.sets.length,
                        weightUnit: superset.weightUnit,
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
                            </
                                does this still function if no template is passed in? If not, make adjustments, if so, leave it as it is

                            ChatGPT
                            The provided WorkoutLogScreen component should function correctly even if no template is passed in. The initial state of the exercises array is set based on whether a template is provided or not. If no template is passed, it defaults to an array containing one exercise ("Bicep Curls").

                            Here's a quick review to ensure everything works as expected without a template:

                            Initialization of exercises State:

                            If a template is passed in, the exercises state is initialized with exercises from the template.
                            If no template is passed in, the exercises state is initialized with a default exercise.
                            Conditional Rendering and State Updates:

                            The component uses the useRoute hook to get the template parameter.
                            The useEffect hooks and other state management logic should work regardless of whether the template parameter is provided.
                            Here is the relevant part of the code again for clarity:

                            javascript
                            Copy code
                            const [exercises, setExercises] = useState(() => {
                            if (template) {
                            return template.exercises.map(ex => ({
                            id: ex.id,
                            name: ex.name,
                            sets: Array.from({ length: ex.setsCount }, (_, i) => ({ key: `set${i + 1}`, weight: '', reps: '' })),
                            weightUnit: ex.weightUnit,
                            supersets: ex.supersets.map(ss => ({
                            id: ss.id,
                            name: ss.name,
                            sets: Array.from({ length: ss.setsCount }, (_, i) => ({ key: `set${i + 1}`, weight: '', reps: '' })),
                            weightUnit: ss.weightUnit,
                            weightConfig: ss.weightConfig,
                            repsConfig: ss.repsConfig,
                        })),
                            weightConfig: ex.weightConfig,
                            repsConfig: ex.repsConfig,
                        }));
                        }
                            return [
                        { id: 'bicepCurls', name: 'Bicep Curls', sets: [{ key: 'set1', weight: '', reps: '' }], weightUnit: 'lbs', supersets: [], weightConfig: 'totalWeight', repsConfig: 'reps' }
                            ];
                        });
                            Conclusion:

                            The current implementation will work if no template is passed in, defaulting to a predefined exercise. Therefore, no further adjustments are needed.
                            property template doesn't exist on type {}

                            ChatGPT
                            The error you are encountering, "property template doesn't exist on type {}", indicates that TypeScript is enforcing type checking, and it doesn't recognize the template property on the route parameters object.

                            Here's how you can adjust the code to work correctly with TypeScript, ensuring that the template parameter is correctly typed and utilized:

                            Define the type for the route parameters:
                            Create an interface for the route parameters to explicitly define the type of template.

                            Update the WorkoutLogScreen component to use this type:
                            Ensure that the component correctly accesses the template parameter.

                            Here is how you can do it:

                            javascript
                            Copy code
                            import React, { useState, useEffect } from 'react';
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
                                Modal,
                                KeyboardAvoidingView,
                                Platform
                            } from 'react-native';
                            import { db, firebase_auth } from '../../firebaseConfig';
                            import { collection, addDoc, getDocs } from 'firebase/firestore';
                            import { FontAwesome5 } from '@expo/vector-icons';
                            import { commonExercises } from '../../exercisesList';
                            import { Checkbox } from 'react-native-paper';
                            import { GestureHandlerRootView, Swipeable, PanGestureHandler } from 'react-native-gesture-handler';
                            import { useNavigation, useRoute } from '@react-navigation/native';
                            import { Picker } from "@react-native-picker/picker";
                            import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

                            // Define the type for the template
                            interface Template {
                                exercises: {
                                id: string;
                                name: string;
                                setsCount: number;
                                weightUnit: string;
                                supersets: {
                                id: string;
                                name: string;
                                setsCount: number;
                                weightUnit: string;
                                weightConfig: string;
                                repsConfig: string;
                            }[];
                                weightConfig: string;
                                repsConfig: string;
                            }[];
                            }

                            // Define the type for the route parameters
                            interface RouteParams {
                                template?: Template;
                            }

                            export default function WorkoutLogScreen() {
                                const navigation = useNavigation();
                                const route = useRoute();
                                const { template } = route.params as RouteParams;

                                const [exercises, setExercises] = useState(() => {
                                if (template) {
                                return template.exercises.map(ex => ({
                                id: ex.id,
                                name: ex.name,
                                sets: Array.from({ length: ex.setsCount }, (_, i) => ({ key: `set${i + 1}`, weight: '', reps: '' })),
                                weightUnit: ex.weightUnit,
                                supersets: ex.supersets.map(ss => ({
                                id: ss.id,
                                name: ss.name,
                                sets: Array.from({ length: ss.setsCount }, (_, i) => ({ key: `set${i + 1}`, weight: '', reps: '' })),
                                weightUnit: ss.weightUnit,
                                weightConfig: ss.weightConfig,
                                repsConfig: ss.repsConfig,
                            })),
                                weightConfig: ex.weightConfig,
                                repsConfig: ex.repsConfig,
                            }));
                            }
                                return [
                            { id: 'bicepCurls', name: 'Bicep Curls', sets: [{ key: 'set1', weight: '', reps: '' }], weightUnit: 'lbs', supersets: [], weightConfig: 'totalWeight', repsConfig: 'reps' }
                                ];
                            });

                                // The rest of your component remains unchanged

                                // ... (rest of your code)
                            }
                            Explanation:

                            Interface Definition: Define the Template interface to describe the shape of the template object.
                            Route Parameters Type: Define the RouteParams interface to specify that the template parameter might be present.
                            Type Assertion: Use route.params as RouteParams to tell TypeScript the expected shape of route.params.
                            With these changes, your code should compile without errors, and it will correctly handle the case when no template is passed in.
                            how do I install react native async storage?

                            ChatGPT
                            To install React Native Async Storage, follow these steps:

                            Install the library:
                            Use either npm or yarn to install the @react-native-async-storage/async-storage package.

                            Using npm:

                            sh
                            Copy code
                            npm install @react-native-async-storage/async-storage
                            Using yarn:

                            sh
                            Copy code
                            yarn add @react-native-async-storage/async-storage
                            Link the library (for older versions of React Native):
                            If you are using React Native 0.60 or above, linking is handled automatically. However, if you are using an older version, you will need to link the library manually.

                            For React Native 0.59 and below:

                            sh
                            Copy code
                            react-native link @react-native-async-storage/async-storage
                            Install pods (for iOS):
                            If you are developing for iOS, navigate to the ios directory and run pod install.

                            sh
                            Copy code
                            cd ios
                            pod install
                            cd ..
                            Using Async Storage in your project:
                            Now you can use Async Storage in your React Native components.

                            Here's a simple example to demonstrate how to use Async Storage:

                            javascript
                            Copy code
                            import AsyncStorage from '@react-native-async-storage/async-storage';

                            const storeData = async (key, value) => {
                                try {
                                await AsyncStorage.setItem(key, value);
                            } catch (e) {
                                // saving error
                                console.error(e);
                            }
                            };

                            const getData = async (key) => {
                                try {
                                const value = await AsyncStorage.getItem(key);
                                if (value !== null) {
                                // value previously stored
                                return value;
                            }
                            } catch (e) {
                                // error reading value
                                console.error(e);
                            }
                            };

                            const removeData = async (key) => {
                                try {
                                await AsyncStorage.removeItem(key);
                            } catch (e) {
                                // remove error
                                console.error(e);
                            }
                            };

                            // Example usage
                            storeData('username', 'JohnDoe');
                            getData('username').then(value => console.log(value)); // JohnDoe
                            removeData('username');
                            Verify the installation:
                            To verify that Async Storage is installed correctly, you can run your React Native project and ensure there are no errors related to Async Storage.

                            sh
                            Copy code
                            npx react-native run-android   // for Android
                            npx react-native run-ios       // for iOS
                            By following these steps, you will have installed and configured React Native Async Storage in your project.
                            import React, { useState, useEffect } from 'react';
                            import { View, Text, Button, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
                            import { db, firebase_auth } from '../../firebaseConfig';
                            import { collection, getDocs } from 'firebase/firestore';
                            import { useNavigation } from '@react-navigation/native';

                            const TemplateScreen = ({ route }) => {
                                const { onSelectTemplate } = route.params;
                                const [templates, setTemplates] = useState([]);
                                const navigation = useNavigation();

                                useEffect(() => {
                                fetchTemplates();
                            }, []);

                                const fetchTemplates = async () => {
                                if (!firebase_auth.currentUser) return;

                                const userId = firebase_auth.currentUser.uid;
                                const templateRef = collection(db, "userProfiles", userId, "templates");
                                const querySnapshot = await getDocs(templateRef);
                                const templatesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                                setTemplates(templatesList);
                            };

                                return (
                                <View style={styles.container}>
                            <View style={styles.content}>
                                <Text style={styles.title}>Select a Template</Text>
                                <FlatList
                                    data={templates}
                                    keyExtractor={item => item.id}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity onPress={() => {
                                            onSelectTemplate(item);
                                            navigation.goBack();
                                        }}>
                                            <Text style={styles.templateItem}>{item.templateName}</Text>
                                        </TouchableOpacity>
                                    )}
                                />
                                <Button title="Cancel" onPress={() => navigation.goBack()} />
                            </View>
                        </View>
                        );
                        };

                        const styles = StyleSheet.create({
                        container: {
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    },
                        content: {
                        backgroundColor: 'white',
                        padding: 20,
                        borderRadius: 10,
                        alignItems: 'center',
                    },
                        title: {
                        fontSize: 20,
                        marginBottom: 10,
                    },
                        templateItem: {
                        fontSize: 16,
                        padding: 10,
                        borderBottomWidth: 1,
                        borderBottomColor: '#ccc',
                    },
                    });

                        export default TemplateScreen;


                        I get a render error - cannot read property 'onSelectTemplate' of undefined

                        ChatGPT
                        The error "cannot read property 'onSelectTemplate' of undefined" occurs because the route.params object does not contain an onSelectTemplate property. This can happen if the screen is not navigated to with the expected parameters.

                        To resolve this, ensure that you are passing the onSelectTemplate function correctly when navigating to the TemplateScreen. Here is a step-by-step solution:

                        Update the navigation to pass the onSelectTemplate parameter:

                        Ensure that when you navigate to the TemplateScreen, you pass the onSelectTemplate function as a parameter. Here's an example of how you might navigate from another screen:

                        javascript
                        Copy code
                        // Example navigation to TemplateScreen
                        navigation.navigate('TemplateScreen', {
                        onSelectTemplate: (selectedTemplate) => {
                        // Handle the selected template
                        console.log('Selected Template:', selectedTemplate);
                    }
                    });
                        Update the TemplateScreen component to handle the case when route.params is undefined:

                        Modify the TemplateScreen component to handle the case when route.params is undefined. This can be done by providing a default value for onSelectTemplate:

                        javascript
                        Copy code
                        import React, { useState, useEffect } from 'react';
                        import { View, Text, Button, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
                        import { db, firebase_auth } from '../../firebaseConfig';
                        import { collection, getDocs } from 'firebase/firestore';
                        import { useNavigation, useRoute } from '@react-navigation/native';

                        const TemplateScreen = () => {
                        const route = useRoute();
                        const navigation = useNavigation();
                        const { onSelectTemplate = () => {} } = route.params || {};
                        const [templates, setTemplates] = useState([]);

                        useEffect(() => {
                        fetchTemplates();
                    }, []);

                        const fetchTemplates = async () => {
                        if (!firebase_auth.currentUser) return;

                        const userId = firebase_auth.currentUser.uid;
                        const templateRef = collection(db, "userProfiles", userId, "templates");
                        const querySnapshot = await getDocs(templateRef);
                        const templatesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        setTemplates(templatesList);
                    };

                        return (
                        <View style={styles.container}>
                        <View style={styles.content}>
                            <Text style={styles.title}>Select a Template</Text>
                            <FlatList
                                data={templates}
                                keyExtractor={item => item.id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity onPress={() => {
                                        onSelectTemplate(item);
                                        navigation.goBack();
                                    }}>
                                        <Text style={styles.templateItem}>{item.templateName}</Text>
                                    </TouchableOpacity>
                                )}
                            />
                            <Button title="Cancel" onPress={() => navigation.goBack()} />
                        </View>
                    </View>
                );
            };

            const styles = StyleSheet.create({
                container: {
                    flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                },
                content: {
                    backgroundColor: 'white',
                        padding: 20,
                        borderRadius: 10,
                        alignItems: 'center',
                },
                title: {
                    fontSize: 20,
                        marginBottom: 10,
                },
                templateItem: {
                    fontSize: 16,
                        padding: 10,
                        borderBottomWidth: 1,
                        borderBottomColor: '#ccc',
                },
            });

            export default TemplateScreen;
            By following these steps, you should be able to navigate to the TemplateScreen and pass the onSelectTemplate function correctly, avoiding the "cannot read property 'onSelectTemplate' of undefined" error.
            here is my workout context

            import React, { createContext, useState, useContext, useEffect } from 'react';
            import AsyncStorage from '@react-native-async-storage/async-storage';

            const WorkoutContext = createContext();

            export const WorkoutProvider = ({ children }) => {
                const [workout, setWorkout] = useState(null);

                useEffect(() => {
                    const loadWorkout = async () => {
                        try {
                            const storedWorkout = await AsyncStorage.getItem('currentWorkout');
                            if (storedWorkout) {
                                setWorkout(JSON.parse(storedWorkout));
                            }
                        } catch (error) {
                            console.error('Failed to load workout from storage:', error);
                        }
                    };

                    loadWorkout();
                }, []);

                useEffect(() => {
                    const saveWorkout = async () => {
                        try {
                            if (workout) {
                                await AsyncStorage.setItem('currentWorkout', JSON.stringify(workout));
                            } else {
                                await AsyncStorage.removeItem('currentWorkout');
                            }
                        } catch (error) {
                            console.error('Failed to save workout to storage:', error);
                        }
                    };

                    saveWorkout();
                }, [workout]);

                return (
                    <WorkoutContext.Provider value={{ workout, setWorkout }}>
                        {children}
                    </WorkoutContext.Provider>
                );
            };

            export const useWorkout = () => useContext(WorkoutContext);

            my custom tab bar:

            // src/components/CustomTabBar.js

            import React, {useState} from 'react';
            import { View, TouchableOpacity, Text } from 'react-native';
            import { Ionicons } from '@expo/vector-icons';
            import { useNavigation } from '@react-navigation/native';
            import { useWorkout } from '../contexts/WorkoutContext';




            const CustomTabBar = ({ state, descriptors, navigation }) => {
                const nav = useNavigation();
                const { workout } = useWorkout();

                const handleOpenWorkoutLog = () => {
                    if (workout) {
                        nav.navigate('WorkoutLog');
                    } else {
                        nav.navigate('TemplateScreen', {
                            onSelectTemplate: (template) => {
                                setWorkout({ exercises: template.exercises });
                                nav.navigate('WorkoutLog', { template });
                            },
                        });
                    }
                };

                return (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', height: 60 }}>
                        {state.routes.map((route, index) => {
                            const { options } = descriptors[route.key];
                            const isFocused = state.index === index;

                            const onPress = () => {
                                const event = navigation.emit({
                                    type: 'tabPress',
                                    target: route.key,
                                    canPreventDefault: true,
                                });

                                if (!isFocused && !event.defaultPrevented) {
                                    navigation.navigate(route.name);
                                }
                            };

                            const onLongPress = () => {
                                navigation.emit({
                                    type: 'tabLongPress',
                                    target: route.key,
                                });
                            };

                            let iconName;
                            switch (route.name) {
                                case 'HomeStack':
                                    iconName = 'home-outline';
                                    break;
                                case 'PostStack':
                                    iconName = 'create-outline';
                                    break;
                                case 'SaveHighlightStack':
                                    iconName = 'bookmark-outline';
                                    break;
                                case 'ProgressStack':
                                    iconName = 'trending-up-outline';
                                    break;
                                case 'AccountStack':
                                    iconName = 'person-outline';
                                    break;
                                default:
                                    iconName = 'ellipse-outline';
                                    break;
                            }

                            return (
                                <TouchableOpacity
                                    key={route.key}
                                    onPress={onPress}
                                    onLongPress={onLongPress}
                                    style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
                                >
                                    <Ionicons
                                        name={options.tabBarIcon?.name || 'ios-home'}
                                        size={24}
                                        color={isFocused ? '#673ab7' : '#222'}
                                    />
                                    <Text style={{ color: isFocused ? '#673ab7' : '#222' }}>
                                        {options.title || route.name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                        {/* Custom Workout Log Button */}
                        <TouchableOpacity
                            onPress={() => nav.navigate('WorkoutLog')}
                            style={{ justifyContent: 'center', alignItems: 'center', padding: 10 }}
                        >
                            <Ionicons name="barbell-outline" size={24} color="#222" />
                            <Text style={{ color: '#222' }}>Workout Log</Text>
                        </TouchableOpacity>
                    </View>
                );
            };

            export default CustomTabBar;

            and my template screen:

            import React, { useState, useEffect } from 'react';
            import { View, Text, Button, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
            import { db, firebase_auth } from '../../firebaseConfig';
            import { collection, getDocs } from 'firebase/firestore';
            import { useNavigation } from '@react-navigation/native';

            const TemplateScreen = ({ route }) => {
                const { onSelectTemplate } = route.params;
                const [templates, setTemplates] = useState([]);
                const navigation = useNavigation();

                useEffect(() => {
                    fetchTemplates();
                }, []);

                const fetchTemplates = async () => {
                    if (!firebase_auth.currentUser) return;

                    const userId = firebase_auth.currentUser.uid;
                    const templateRef = collection(db, "userProfiles", userId, "templates");
                    const querySnapshot = await getDocs(templateRef);
                    const templatesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setTemplates(templatesList);
                };

                return (
                    <View style={styles.container}>
                        <View style={styles.content}>
                            <Text style={styles.title}>Select a Template</Text>
                            <FlatList
                                data={templates}
                                keyExtractor={item => item.id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity onPress={() => {
                                        onSelectTemplate(item);
                                        navigation.goBack();
                                    }}>
                                        <Text style={styles.templateItem}>{item.templateName}</Text>
                                    </TouchableOpacity>
                                )}
                            />
                            <Button title="Cancel" onPress={() => navigation.goBack()} />
                        </View>
                    </View>
                );
            };

            const styles = StyleSheet.create({
                container: {
                    flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                },
                content: {
                    backgroundColor: 'white',
                        padding: 20,
                        borderRadius: 10,
                        alignItems: 'center',
                },
                title: {
                    fontSize: 20,
                        marginBottom: 10,
                },
                templateItem: {
                    fontSize: 16,
                        padding: 10,
                        borderBottomWidth: 1,
                        borderBottomColor: '#ccc',
                },
            });

            export default TemplateScreen;


            When I initially log in, the 'workout log' button on my bottom tab should supposedly take me to the template screen first. However, I jump directly into the workout log. Help me diagnose this problem. Is it because the context automatically assumes a workout has already started ?

            ChatGPT
            The issue seems to stem from the way you are handling the navigation in the custom tab bar. Specifically, the handleOpenWorkoutLog function is not being called when you press the custom "Workout Log" button. Instead, the button directly navigates to the WorkoutLog screen.

            Let's update the custom tab bar to use the handleOpenWorkoutLog function correctly. Also, ensure that the useWorkout hook and context are correctly managing the state of the workout.

            Here's the updated CustomTabBar component:

            javascript
            Copy code
            // src/components/CustomTabBar.js

            import React from 'react';
            import { View, TouchableOpacity, Text } from 'react-native';
            import { Ionicons } from '@expo/vector-icons';
            import { useNavigation } from '@react-navigation/native';
            import { useWorkout } from '../contexts/WorkoutContext';

            const CustomTabBar = ({ state, descriptors, navigation }) => {
                const nav = useNavigation();
                const { workout, setWorkout } = useWorkout();

                const handleOpenWorkoutLog = () => {
                    if (workout) {
                        nav.navigate('WorkoutLog');
                    } else {
                        nav.navigate('TemplateScreen', {
                            onSelectTemplate: (template) => {
                                setWorkout({ exercises: template.exercises });
                                nav.navigate('WorkoutLog', { template });
                            },
                        });
                    }
                };

                return (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', height: 60 }}>
                        {state.routes.map((route, index) => {
                            const { options } = descriptors[route.key];
                            const isFocused = state.index === index;

                            const onPress = () => {
                                const event = navigation.emit({
                                    type: 'tabPress',
                                    target: route.key,
                                    canPreventDefault: true,
                                });

                                if (!isFocused && !event.defaultPrevented) {
                                    navigation.navigate(route.name);
                                }
                            };

                            const onLongPress = () => {
                                navigation.emit({
                                    type: 'tabLongPress',
                                    target: route.key,
                                });
                            };

                            let iconName;
                            switch (route.name) {
                                case 'HomeStack':
                                    iconName = 'home-outline';
                                    break;
                                case 'PostStack':
                                    iconName = 'create-outline';
                                    break;
                                case 'SaveHighlightStack':
                                    iconName = 'bookmark-outline';
                                    break;
                                case 'ProgressStack':
                                    iconName = 'trending-up-outline';
                                    break;
                                case 'AccountStack':
                                    iconName = 'person-outline';
                                    break;
                                default:
                                    iconName = 'ellipse-outline';
                                    break;
                            }

                            return (
                                <TouchableOpacity
                                    key={route.key}
                                    onPress={onPress}
                                    onLongPress={onLongPress}
                                    style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
                                >
                                    <Ionicons
                                        name={options.tabBarIcon?.name || 'ios-home'}
                                        size={24}
                                        color={isFocused ? '#673ab7' : '#222'}
                                    />
                                    <Text style={{ color: isFocused ? '#673ab7' : '#222' }}>
                                        {options.title || route.name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                        {/* Custom Workout Log Button */}
                        <TouchableOpacity
                            onPress={handleOpenWorkoutLog}
                            style={{ justifyContent: 'center', alignItems: 'center', padding: 10 }}
                        >
                            <Ionicons name="barbell-outline" size={24} color="#222" />
                            <Text style={{ color: '#222' }}>Workout Log</Text>
                        </TouchableOpacity>
                    </View>
                );
            };

            export default CustomTabBar;
            With this change, pressing the "Workout Log" button on the custom tab bar will call handleOpenWorkoutLog, which will check if a workout is in progress. If a workout is in progress, it navigates directly to the WorkoutLog screen. If not, it navigates to the TemplateScreen.

            Ensure that the WorkoutContext and useWorkout hook are set up correctly to provide and consume the workout state throughout your app. The context setup you provided looks good, so it should work as expected.

            Lastly, verify that you are navigating to the TemplateScreen correctly from your other screens if needed. The issue should be resolved with these adjustments.
            import React, { useState, useEffect } from 'react';
            import { View, Text, Button, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
            import { db, firebase_auth } from '../../firebaseConfig';
            import { collection, getDocs } from 'firebase/firestore';
            import { useNavigation } from '@react-navigation/native';

            const TemplateScreen = ({ route }) => {
                const { onSelectTemplate } = route.params;
                const [templates, setTemplates] = useState([]);
                const navigation = useNavigation();

                useEffect(() => {
                    fetchTemplates();
                }, []);

                const fetchTemplates = async () => {
                    if (!firebase_auth.currentUser) return;

                    const userId = firebase_auth.currentUser.uid;
                    const templateRef = collection(db, "userProfiles", userId, "templates");
                    const querySnapshot = await getDocs(templateRef);
                    const templatesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setTemplates(templatesList);
                };

                return (
                    <View style={styles.container}>
                        <View style={styles.content}>
                            <Text style={styles.title}>Select a Template</Text>
                            <FlatList
                                data={templates}
                                keyExtractor={item => item.id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity onPress={() => {
                                        onSelectTemplate(item);
                                        navigation.goBack();
                                    }}>
                                        <Text style={styles.templateItem}>{item.templateName}</Text>
                                    </TouchableOpacity>
                                )}
                            />
                            <Button title="Cancel" onPress={() => navigation.goBack()} />
                        </View>
                    </View>
                );
            };

            const styles = StyleSheet.create({
                container: {
                    flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                },
                content: {
                    backgroundColor: 'white',
                        padding: 20,
                        borderRadius: 10,
                        alignItems: 'center',
                },
                title: {
                    fontSize: 20,
                        marginBottom: 10,
                },
                templateItem: {
                    fontSize: 16,
                        padding: 10,
                        borderBottomWidth: 1,
                        borderBottomColor: '#ccc',
                },
            });

            export default TemplateScreen;

            Help me restructure the template screen in a couple of ways. Help me add a "start new workout" button that would simply open the workout log page and start a workout, without opening a template. Secondly, move all the available templates into a dropdown picker, and the selected template would have a preview of what the workout would be like in the space below. Add a 'load template' button above the 'start new workout' button that would then load this template into the workout log and open it. This might also mean adjusting the onSelectTemplate to now open the workout log when the 'load template' button is pressed instead.

            The structure for the templates I intend to have:

            Under a map titled 'exercises', each unit (as one exercise) has an id (eg. "pullUps"), a name (eg "Pull Ups"), a repsConfig eg "reps" or "time", a setsCount eg 1, 2, 3 etc. a WeightConfig eg "bodyWeight", and a sub map of "supersets" with each unit following the same structure as exercise. But for this screen, just display the exercises, superset exercises, and setsCount.


            ChatGPT
            To restructure your TemplateScreen with the new features and modifications, follow these steps:

            Add a "Start New Workout" button to directly open the workout log page without a template.
            Use a dropdown picker to list all the available templates.
            Display a preview of the selected template below the dropdown.
            Add a "Load Template" button to load the selected template and navigate to the workout log.
            Here's how you can achieve this:

            javascript
            Copy code
            import React, { useState, useEffect } from 'react';
            import { View, Text, Button, StyleSheet, TouchableOpacity } from 'react-native';
            import { Picker } from '@react-native-picker/picker';
            import { db, firebase_auth } from '../../firebaseConfig';
            import { collection, getDocs } from 'firebase/firestore';
            import { useNavigation } from '@react-navigation/native';

            const TemplateScreen = ({ route }) => {
                const { onSelectTemplate } = route.params;
                const [templates, setTemplates] = useState([]);
                const [selectedTemplate, setSelectedTemplate] = useState(null);
                const navigation = useNavigation();

                useEffect(() => {
                    fetchTemplates();
                }, []);

                const fetchTemplates = async () => {
                    if (!firebase_auth.currentUser) return;

                    const userId = firebase_auth.currentUser.uid;
                    const templateRef = collection(db, "userProfiles", userId, "templates");
                    const querySnapshot = await getDocs(templateRef);
                    const templatesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setTemplates(templatesList);
                };

                const handleLoadTemplate = () => {
                    if (selectedTemplate) {
                        onSelectTemplate(selectedTemplate);
                        navigation.navigate('WorkoutLog', { template: selectedTemplate });
                    }
                };

                return (
                    <View style={styles.container}>
                        <View style={styles.content}>
                            <Text style={styles.title}>Select a Template</Text>
                            <Picker
                                selectedValue={selectedTemplate}
                                onValueChange={(itemValue) => setSelectedTemplate(itemValue)}
                                style={styles.picker}
                            >
                                <Picker.Item label="Select a template..." value={null} />
                                {templates.map(template => (
                                    <Picker.Item key={template.id} label={template.templateName} value={template} />
                                ))}
                            </Picker>

                            {selectedTemplate && (
                                <View style={styles.templatePreview}>
                                    <Text style={styles.previewTitle}>Template Preview:</Text>
                                    {selectedTemplate.exercises.map((exercise, index) => (
                                        <View key={index} style={styles.previewItem}>
                                            <Text style={styles.previewItemText}>
                                                {exercise.name} - Sets: {exercise.setsCount}
                                            </Text>
                                            {exercise.supersets.length > 0 && (
                                                <View style={styles.supersetContainer}>
                                                    <Text style={styles.supersetTitle}>Supersets:</Text>
                                                    {exercise.supersets.map((superset, supersetIndex) => (
                                                        <Text key={supersetIndex} style={styles.supersetItemText}>
                                                            {superset.name} - Sets: {superset.setsCount}
                                                        </Text>
                                                    ))}
                                                </View>
                                            )}
                                        </View>
                                    ))}
                                </View>
                            )}

                            <Button title="Load Template" onPress={handleLoadTemplate} disabled={!selectedTemplate} />
                            <Button title="Start New Workout" onPress={() => navigation.navigate('WorkoutLog')} />
                            <Button title="Cancel" onPress={() => navigation.goBack()} />
                        </View>
                    </View>
                );
            };

            const styles = StyleSheet.create({
                container: {
                    flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                },
                content: {
                    backgroundColor: 'white',
                        padding: 20,
                        borderRadius: 10,
                        alignItems: 'center',
                        width: '80%',
                },
                title: {
                    fontSize: 20,
                        marginBottom: 10,
                },
                picker: {
                    width: '100%',
                        marginBottom: 20,
                },
                templatePreview: {
                    marginBottom: 20,
                        width: '100%',
                },
                previewTitle: {
                    fontSize: 18,
                        fontWeight: 'bold',
                        marginBottom: 10,
                },
                previewItem: {
                    marginBottom: 10,
                },
                previewItemText: {
                    fontSize: 16,
                },
                supersetContainer: {
                    marginLeft: 10,
                        marginTop: 5,
                },
                supersetTitle: {
                    fontSize: 16,
                        fontWeight: 'bold',
                },
                supersetItemText: {
                    fontSize: 14,
                        marginTop: 2,
                },
            });

            export default TemplateScreen;
            Explanation:

            Picker Component: The Picker component is used to list all available templates. When a template is selected, its details are stored in selectedTemplate.
            Template Preview: Below the picker, the selected template's details (exercises, supersets, and sets count) are displayed in a preview section.
            Buttons:
            "Load Template" button: Loads the selected template into the workout log and navigates to the WorkoutLog screen.
            "Start New Workout" button: Directly navigates to the WorkoutLog screen without using a template.
            "Cancel" button: Navigates back to the previous screen.
            This setup ensures that the TemplateScreen provides the user with options to either start a new workout or load a workout from a selected template, with a preview of the template's exercises.
            this is my custom tab bar, do I still need the onSelectTemplate function then? Should I edit or delete it

            // src/components/CustomTabBar.js

            import React, {useState} from 'react';
            import { View, TouchableOpacity, Text } from 'react-native';
            import { Ionicons } from '@expo/vector-icons';
            import { useNavigation } from '@react-navigation/native';
            import { useWorkout } from '../contexts/WorkoutContext';




            const CustomTabBar = ({ state, descriptors, navigation }) => {
                const nav = useNavigation();
                const { workout } = useWorkout();

                const handleOpenWorkoutLog = () => {
                    if (workout) {
                        nav.navigate('WorkoutLog');
                    } else {
                        nav.navigate('TemplateScreen', {
                            onSelectTemplate: (template) => {
                                setWorkout({ exercises: template.exercises });
                                nav.navigate('WorkoutLog', { template });
                            },
                        });
                    }
                };

                return (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', height: 60 }}>
                        {state.routes.map((route, index) => {
                            const { options } = descriptors[route.key];
                            const isFocused = state.index === index;

                            const onPress = () => {
                                const event = navigation.emit({
                                    type: 'tabPress',
                                    target: route.key,
                                    canPreventDefault: true,
                                });

                                if (!isFocused && !event.defaultPrevented) {
                                    navigation.navigate(route.name);
                                }
                            };

                            const onLongPress = () => {
                                navigation.emit({
                                    type: 'tabLongPress',
                                    target: route.key,
                                });
                            };

                            let iconName;
                            switch (route.name) {
                                case 'HomeStack':
                                    iconName = 'home-outline';
                                    break;
                                case 'PostStack':
                                    iconName = 'create-outline';
                                    break;
                                case 'SaveHighlightStack':
                                    iconName = 'bookmark-outline';
                                    break;
                                case 'ProgressStack':
                                    iconName = 'trending-up-outline';
                                    break;
                                case 'AccountStack':
                                    iconName = 'person-outline';
                                    break;
                                default:
                                    iconName = 'ellipse-outline';
                                    break;
                            }

                            return (
                                <TouchableOpacity
                                    key={route.key}
                                    onPress={onPress}
                                    onLongPress={onLongPress}
                                    style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
                                >
                                    <Ionicons
                                        name={options.tabBarIcon?.name || 'ios-home'}
                                        size={24}
                                        color={isFocused ? '#673ab7' : '#222'}
                                    />
                                    <Text style={{ color: isFocused ? '#673ab7' : '#222' }}>
                                        {options.title || route.name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                        {/* Custom Workout Log Button */}
                        <TouchableOpacity
                            onPress={() => handleOpenWorkoutLog()}
                            style={{ justifyContent: 'center', alignItems: 'center', padding: 10 }}
                        >
                            <Ionicons name="barbell-outline" size={24} color="#222" />
                            <Text style={{ color: '#222' }}>Workout Log</Text>
                        </TouchableOpacity>
                    </View>
                );
            };

            export default CustomTabBar;

            ChatGPT
            In the current setup, the onSelectTemplate function is being used within the handleOpenWorkoutLog function in the CustomTabBar component. However, since you want to handle the selection and loading of the template within the TemplateScreen itself, you can modify the handleOpenWorkoutLog function to navigate to the TemplateScreen without passing the onSelectTemplate function.

            Here's the updated CustomTabBar component:

            javascript
            Copy code
            // src/components/CustomTabBar.js

            import React from 'react';
            import { View, TouchableOpacity, Text } from 'react-native';
            import { Ionicons } from '@expo/vector-icons';
            import { useNavigation } from '@react-navigation/native';
            import { useWorkout } from '../contexts/WorkoutContext';

            const CustomTabBar = ({ state, descriptors, navigation }) => {
                const nav = useNavigation();
                const { workout } = useWorkout();

                const handleOpenWorkoutLog = () => {
                    if (workout) {
                        nav.navigate('WorkoutLog');
                    } else {
                        nav.navigate('TemplateScreen');
                    }
                };

                return (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', height: 60 }}>
                        {state.routes.map((route, index) => {
                            const { options } = descriptors[route.key];
                            const isFocused = state.index === index;

                            const onPress = () => {
                                const event = navigation.emit({
                                    type: 'tabPress',
                                    target: route.key,
                                    canPreventDefault: true,
                                });

                                if (!isFocused && !event.defaultPrevented) {
                                    navigation.navigate(route.name);
                                }
                            };

                            const onLongPress = () => {
                                navigation.emit({
                                    type: 'tabLongPress',
                                    target: route.key,
                                });
                            };

                            let iconName;
                            switch (route.name) {
                                case 'HomeStack':
                                    iconName = 'home-outline';
                                    break;
                                case 'PostStack':
                                    iconName = 'create-outline';
                                    break;
                                case 'SaveHighlightStack':
                                    iconName = 'bookmark-outline';
                                    break;
                                case 'ProgressStack':
                                    iconName = 'trending-up-outline';
                                    break;
                                case 'AccountStack':
                                    iconName = 'person-outline';
                                    break;
                                default:
                                    iconName = 'ellipse-outline';
                                    break;
                            }

                            return (
                                <TouchableOpacity
                                    key={route.key}
                                    onPress={onPress}
                                    onLongPress={onLongPress}
                                    style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
                                >
                                    <Ionicons
                                        name={options.tabBarIcon?.name || 'ios-home'}
                                        size={24}
                                        color={isFocused ? '#673ab7' : '#222'}
                                    />
                                    <Text style={{ color: isFocused ? '#673ab7' : '#222' }}>
                                        {options.title || route.name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                        {/* Custom Workout Log Button */}
                        <TouchableOpacity
                            onPress={handleOpenWorkoutLog}
                            style={{ justifyContent: 'center', alignItems: 'center', padding: 10 }}
                        >
                            <Ionicons name="barbell-outline" size={24} color="#222" />
                            <Text style={{ color: '#222' }}>Workout Log</Text>
                        </TouchableOpacity>
                    </View>
                );
            };

            export default CustomTabBar;
            In the TemplateScreen, you can handle the selection and loading of the template as described earlier:

            javascript
            Copy code
            import React, { useState, useEffect } from 'react';
            import { View, Text, Button, StyleSheet, TouchableOpacity } from 'react-native';
            import { Picker } from '@react-native-picker/picker';
            import { db, firebase_auth } from '../../firebaseConfig';
            import { collection, getDocs } from 'firebase/firestore';
            import { useNavigation } from '@react-navigation/native';
            import { useWorkout } from '../contexts/WorkoutContext';

            const TemplateScreen = () => {
                const [templates, setTemplates] = useState([]);
                const [selectedTemplate, setSelectedTemplate] = useState(null);
                const navigation = useNavigation();
                const { setWorkout } = useWorkout();

                useEffect(() => {
                    fetchTemplates();
                }, []);

                const fetchTemplates = async () => {
                    if (!firebase_auth.currentUser) return;

                    const userId = firebase_auth.currentUser.uid;
                    const templateRef = collection(db, "userProfiles", userId, "templates");
                    const querySnapshot = await getDocs(templateRef);
                    const templatesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setTemplates(templatesList);
                };

                const handleLoadTemplate = () => {
                    if (selectedTemplate) {
                        setWorkout({ exercises: selectedTemplate.exercises });
                        navigation.navigate('WorkoutLog', { template: selectedTemplate });
                    }
                };

                return (
                    <View style={styles.container}>
                        <View style={styles.content}>
                            <Text style={styles.title}>Select a Template</Text>
                            <Picker
                                selectedValue={selectedTemplate}
                                onValueChange={(itemValue) => setSelectedTemplate(itemValue)}
                                style={styles.picker}
                            >
                                <Picker.Item label="Select a template..." value={null} />
                                {templates.map(template => (
                                    <Picker.Item key={template.id} label={template.templateName} value={template} />
                                ))}
                            </Picker>

                            {selectedTemplate && (
                                <View style={styles.templatePreview}>
                                    <Text style={styles.previewTitle}>Template Preview:</Text>
                                    {selectedTemplate.exercises.map((exercise, index) => (
                                        <View key={index} style={styles.previewItem}>
                                            <Text style={styles.previewItemText}>
                                                {exercise.name} - Sets: {exercise.setsCount}
                                            </Text>
                                            {exercise.supersets.length > 0 && (
                                                <View style={styles.supersetContainer}>
                                                    <Text style={styles.supersetTitle}>Supersets:</Text>
                                                    {exercise.supersets.map((superset, supersetIndex) => (
                                                        <Text key={supersetIndex} style={styles.supersetItemText}>
                                                            {superset.name} - Sets: {superset.setsCount}
                                                        </Text>
                                                    ))}
                                                </View>
                                            )}
                                        </View>
                                    ))}
                                </View>
                            )}

                            <Button title="Load Template" onPress={handleLoadTemplate} disabled={!selectedTemplate} />
                            <Button title="Start New Workout" onPress={() => navigation.navigate('WorkoutLog')} />
                            <Button title="Cancel" onPress={() => navigation.goBack()} />
                        </View>
                    </View>
                );
            };

            const styles = StyleSheet.create({
                container: {
                    flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                },
                content: {
                    backgroundColor: 'white',
                        padding: 20,
                        borderRadius: 10,
                        alignItems: 'center',
                        width: '80%',
                },
                title: {
                    fontSize: 20,
                        marginBottom: 10,
                },
                picker: {
                    width: '100%',
                        marginBottom: 20,
                },
                templatePreview: {
                    marginBottom: 20,
                        width: '100%',
                },
                previewTitle: {
                    fontSize: 18,
                        fontWeight: 'bold',
                        marginBottom: 10,
                },
                previewItem: {
                    marginBottom: 10,
                },
                previewItemText: {
                    fontSize: 16,
                },
                supersetContainer: {
                    marginLeft: 10,
                        marginTop: 5,
                },
                supersetTitle: {
                    fontSize: 16,
                        fontWeight: 'bold',
                },
                supersetItemText: {
                    fontSize: 14,
                        marginTop: 2,
                },
            });

            export default TemplateScreen;
            With these changes, the CustomTabBar no longer needs to pass the onSelectTemplate function. The TemplateScreen handles the selection and loading of templates internally.
            render error on template screen: cannot read property 'map' of undefined at selectedTemplate.exercises.map..

            ChatGPT
            The error indicates that selectedTemplate or selectedTemplate.exercises is undefined. To fix this, you can add checks to ensure that these properties exist before attempting to map over them. Here’s the adjusted code for the TemplateScreen:

            javascript
            Copy code
            import React, { useState, useEffect } from 'react';
            import { View, Text, Button, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
            import { Picker } from '@react-native-picker/picker';
            import { db, firebase_auth } from '../../firebaseConfig';
            import { collection, getDocs } from 'firebase/firestore';
            import { useNavigation } from '@react-navigation/native';
            import { useWorkout } from '../contexts/WorkoutContext';

            const TemplateScreen = () => {
                const [templates, setTemplates] = useState([]);
                const [selectedTemplate, setSelectedTemplate] = useState(null);
                const navigation = useNavigation();
                const { setWorkout } = useWorkout();

                useEffect(() => {
                    fetchTemplates();
                }, []);

                const fetchTemplates = async () => {
                    if (!firebase_auth.currentUser) return;

                    const userId = firebase_auth.currentUser.uid;
                    const templateRef = collection(db, "userProfiles", userId, "templates");
                    const querySnapshot = await getDocs(templateRef);
                    const templatesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setTemplates(templatesList);
                };

                const handleLoadTemplate = () => {
                    if (selectedTemplate) {
                        setWorkout({ exercises: selectedTemplate.exercises });
                        navigation.navigate('WorkoutLog', { template: selectedTemplate });
                    }
                };

                return (
                    <View style={styles.container}>
                        <View style={styles.content}>
                            <Text style={styles.title}>Select a Template</Text>
                            <Picker
                                selectedValue={selectedTemplate}
                                onValueChange={(itemValue) => setSelectedTemplate(itemValue)}
                                style={styles.picker}
                            >
                                <Picker.Item label="Select a template..." value={null} />
                                {templates.map(template => (
                                    <Picker.Item key={template.id} label={template.templateName} value={template} />
                                ))}
                            </Picker>

                            {selectedTemplate && selectedTemplate.exercises && (
                                <View style={styles.templatePreview}>
                                    <Text style={styles.previewTitle}>Template Preview:</Text>
                                    {selectedTemplate.exercises.map((exercise, index) => (
                                        <View key={index} style={styles.previewItem}>
                                            <Text style={styles.previewItemText}>
                                                {exercise.name} - Sets: {exercise.setsCount}
                                            </Text>
                                            {exercise.supersets.length > 0 && (
                                                <View style={styles.supersetContainer}>
                                                    <Text style={styles.supersetTitle}>Supersets:</Text>
                                                    {exercise.supersets.map((superset, supersetIndex) => (
                                                        <Text key={supersetIndex} style={styles.supersetItemText}>
                                                            {superset.name} - Sets: {superset.setsCount}
                                                        </Text>
                                                    ))}
                                                </View>
                                            )}
                                        </View>
                                    ))}
                                </View>
                            )}

                            <Button title="Load Template" onPress={handleLoadTemplate} disabled={!selectedTemplate} />
                            <Button title="Start New Workout" onPress={() => navigation.navigate('WorkoutLog')} />
                            <Button title="Cancel" onPress={() => navigation.goBack()} />
                        </View>
                    </View>
                );
            };

            const styles = StyleSheet.create({
                container: {
                    flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                },
                content: {
                    backgroundColor: 'white',
                        padding: 20,
                        borderRadius: 10,
                        alignItems: 'center',
                        width: '80%',
                },
                title: {
                    fontSize: 20,
                        marginBottom: 10,
                },
                picker: {
                    width: '100%',
                        marginBottom: 20,
                },
                templatePreview: {
                    marginBottom: 20,
                        width: '100%',
                },
                previewTitle: {
                    fontSize: 18,
                        fontWeight: 'bold',
                        marginBottom: 10,
                },
                previewItem: {
                    marginBottom: 10,
                },
                previewItemText: {
                    fontSize: 16,
                },
                supersetContainer: {
                    marginLeft: 10,
                        marginTop: 5,
                },
                supersetTitle: {
                    fontSize: 16,
                        fontWeight: 'bold',
                },
                supersetItemText: {
                    fontSize: 14,
                        marginTop: 2,
                },
            });

            export default TemplateScreen;
            This code includes a check to ensure selectedTemplate and selectedTemplate.exercises are defined before attempting to map over them. This should prevent the render error you encountered.
            how do I reset the context on the app?

            ChatGPT
            To reset the context in your React Native app, you can create a function within your context provider that resets the state to its initial values. Then, you can call this function whenever you need to reset the context.

            Here's how you can do it with your WorkoutContext:

            Update the Context Provider:

            Add a resetWorkout function to your WorkoutProvider that sets the workout state back to its initial value (null in this case).

            javascript
            Copy code
            import React, { createContext, useState, useContext, useEffect } from 'react';
            import AsyncStorage from '@react-native-async-storage/async-storage';

            const WorkoutContext = createContext();

            export const WorkoutProvider = ({ children }) => {
                const [workout, setWorkout] = useState(null);

                useEffect(() => {
                    const loadWorkout = async () => {
                        try {
                            const storedWorkout = await AsyncStorage.getItem('currentWorkout');
                            if (storedWorkout) {
                                setWorkout(JSON.parse(storedWorkout));
                            }
                        } catch (error) {
                            console.error('Failed to load workout from storage:', error);
                        }
                    };

                    loadWorkout();
                }, []);

                useEffect(() => {
                    const saveWorkout = async () => {
                        try {
                            if (workout) {
                                await AsyncStorage.setItem('currentWorkout', JSON.stringify(workout));
                            } else {
                                await AsyncStorage.removeItem('currentWorkout');
                            }
                        } catch (error) {
                            console.error('Failed to save workout to storage:', error);
                        }
                    };

                    saveWorkout();
                }, [workout]);

                const resetWorkout = async () => {
                    try {
                        await AsyncStorage.removeItem('currentWorkout');
                        setWorkout(null);
                    } catch (error) {
                        console.error('Failed to reset workout:', error);
                    }
                };

                return (
                    <WorkoutContext.Provider value={{ workout, setWorkout, resetWorkout }}>
                        {children}
                    </WorkoutContext.Provider>
                );
            };

            export const useWorkout = () => useContext(WorkoutContext);
            Call resetWorkout When Needed:

            You can call resetWorkout from any component that uses the WorkoutContext. For example, you might want to add a button in your WorkoutLogScreen or another screen that calls resetWorkout to clear the current workout.

            javascript
            Copy code
            import React from 'react';
            import { View, Button, Text } from 'react-native';
            import { useWorkout } from '../contexts/WorkoutContext';

            const WorkoutLogScreen = () => {
                const { workout, resetWorkout } = useWorkout();

                return (
                    <View>
                        <Text>Workout Log</Text>
                        {/* Render your workout log here */}
                        <Button title="Reset Workout" onPress={resetWorkout} />
                    </View>
                );
            };

            export default WorkoutLogScreen;
            Reset the Context from Custom Tab Bar:

            If you want to reset the workout context from the custom tab bar, you can call resetWorkout from there too.

            javascript
            Copy code
            // src/components/CustomTabBar.js

            import React from 'react';
            import { View, TouchableOpacity, Text } from 'react-native';
            import { Ionicons } from '@expo/vector-icons';
            import { useNavigation } from '@react-navigation/native';
            import { useWorkout } from '../contexts/WorkoutContext';

            const CustomTabBar = ({ state, descriptors, navigation }) => {
                const nav = useNavigation();
                const { workout, resetWorkout } = useWorkout();

                const handleOpenWorkoutLog = () => {
                    if (workout) {
                        nav.navigate('WorkoutLog');
                    } else {
                        nav.navigate('TemplateScreen');
                    }
                };

                const handleResetWorkout = () => {
                    resetWorkout();
                    nav.navigate('WorkoutLog');
                };

                return (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', height: 60 }}>
                        {state.routes.map((route, index) => {
                            const { options } = descriptors[route.key];
                            const isFocused = state.index === index;

                            const onPress = () => {
                                const event = navigation.emit({
                                    type: 'tabPress',
                                    target: route.key,
                                    canPreventDefault: true,
                                });

                                if (!isFocused && !event.defaultPrevented) {
                                    navigation.navigate(route.name);
                                }
                            };

                            const onLongPress = () => {
                                navigation.emit({
                                    type: 'tabLongPress',
                                    target: route.key,
                                });
                            };

                            let iconName;
                            switch (route.name) {
                                case 'HomeStack':
                                    iconName = 'home-outline';
                                    break;
                                case 'PostStack':
                                    iconName = 'create-outline';
                                    break;
                                case 'SaveHighlightStack':
                                    iconName = 'bookmark-outline';
                                    break;
                                case 'ProgressStack':
                                    iconName = 'trending-up-outline';
                                    break;
                                case 'AccountStack':
                                    iconName = 'person-outline';
                                    break;
                                default:
                                    iconName = 'ellipse-outline';
                                    break;
                            }

                            return (
                                <TouchableOpacity
                                    key={route.key}
                                    onPress={onPress}
                                    onLongPress={onLongPress}
                                    style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
                                >
                                    <Ionicons
                                        name={options.tabBarIcon?.name || 'ios-home'}
                                        size={24}
                                        color={isFocused ? '#673ab7' : '#222'}
                                    />
                                    <Text style={{ color: isFocused ? '#673ab7' : '#222' }}>
                                        {options.title || route.name}
                                    </Text>
                                </TouchableOpacity>
                            );

                            TypeError: resetWorkout is not a function (it is undefined)

                            ChatGPT
                            The error resetWorkout is not a function indicates that the resetWorkout function is not being correctly retrieved from the context. To fix this, let's ensure that the WorkoutContext and useWorkout hook are correctly implemented and that the context provider is correctly wrapping your app. Here’s a step-by-step guide to resolving this issue:

                            Check the WorkoutContext Implementation:

                                Make sure the WorkoutContext and WorkoutProvider are implemented correctly.

                                javascript
                            Copy code
// src/contexts/WorkoutContext.js
                            import React, { createContext, useState, useContext, useEffect } from 'react';
                            import AsyncStorage from '@react-native-async-storage/async-storage';

                            const WorkoutContext = createContext();

                            export const WorkoutProvider = ({ children }) => {
                                const [workout, setWorkout] = useState(null);

                                useEffect(() => {
                                    const loadWorkout = async () => {
                                        try {
                                            const storedWorkout = await AsyncStorage.getItem('currentWorkout');
                                            if (storedWorkout) {
                                                setWorkout(JSON.parse(storedWorkout));
                                            }
                                        } catch (error) {
                                            console.error('Failed to load workout from storage:', error);
                                        }
                                    };

                                    loadWorkout();
                                }, []);

                                useEffect(() => {
                                    const saveWorkout = async () => {
                                        try {
                                            if (workout) {
                                                await AsyncStorage.setItem('currentWorkout', JSON.stringify(workout));
                                            } else {
                                                await AsyncStorage.removeItem('currentWorkout');
                                            }
                                        } catch (error) {
                                            console.error('Failed to save workout to storage:', error);
                                        }
                                    };

                                    saveWorkout();
                                }, [workout]);

                                const resetWorkout = async () => {
                                    try {
                                        await AsyncStorage.removeItem('currentWorkout');
                                        setWorkout(null);
                                    } catch (error) {
                                        console.error('Failed to reset workout:', error);
                                    }
                                };

                                return (
                                    <WorkoutContext.Provider value={{ workout, setWorkout, resetWorkout }}>
                                        {children}
                                    </WorkoutContext.Provider>
                                );
                            };

                            export const useWorkout = () => useContext(WorkoutContext);
                            Ensure the WorkoutProvider Wraps Your App:

                                Make sure the WorkoutProvider is wrapping your entire app in the entry point of your application.

                                javascript
                            Copy code
// App.js
                            import React from 'react';
                            import { NavigationContainer } from '@react-navigation/native';
                            import { createNativeStackNavigator } from '@react-navigation/native-stack';
                            import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
                            import { WorkoutProvider } from './src/contexts/WorkoutContext';
                            import HomeStack from './src/stacks/HomeStack';
                            import PostStack from './src/stacks/PostStack';
                            import ProgressStack from './src/stacks/ProgressStack';
                            import AccountStack from './src/stacks/AccountStack';
                            import FeedStack from './src/stacks/FeedStack';
                            import CustomTabBar from './src/components/CustomTabBar';

                            const Stack = createNativeStackNavigator();
                            const Tab = createBottomTabNavigator();

                            const App = () => {
                                return (
                                    <WorkoutProvider>
                                        <NavigationContainer>
                                            <Tab.Navigator tabBar={props => <CustomTabBar {...props} />}>
                                                <Tab.Screen
                                                    name="HomeStack"
                                                    component={HomeStack}
                                                    options={{ headerShown: false, title: 'Home', tabBarIcon: { name: 'home-outline' } }}
                                                />
                                                <Tab.Screen
                                                    name="PostStack"
                                                    component={PostStack}
                                                    options={{ headerShown: false, title: 'Post', tabBarIcon: { name: 'create-outline' } }}
                                                />
                                                <Tab.Screen
                                                    name="ProgressStack"
                                                    component={ProgressStack}
                                                    options={{ headerShown: false, title: 'Progress', tabBarIcon: { name: 'trending-up-outline' } }}
                                                />
                                                <Tab.Screen
                                                    name="AccountStack"
                                                    component={AccountStack}
                                                    options={{ headerShown: false, title: 'Account', tabBarIcon: { name: 'person-outline' } }}
                                                />
                                                <Tab.Screen
                                                    name="FeedStack"
                                                    component={FeedStack}
                                                    options={{ headerShown: false, title: 'Feed', tabBarIcon: { name: 'person-outline' } }}
                                                />
                                            </Tab.Navigator>
                                        </NavigationContainer>
                                    </WorkoutProvider>
                                );
                            };

                            export default App;
                            Correct Usage in CustomTabBar:

                            Ensure that the useWorkout hook is correctly used in CustomTabBar and the resetWorkout function is called properly.

                                javascript
                            Copy code
// src/components/CustomTabBar.js
                            import React from 'react';
                            import { View, TouchableOpacity, Text } from 'react-native';
                            import { Ionicons } from '@expo/vector-icons';
                            import { useNavigation } from '@react-navigation/native';
                            import { useWorkout } from '../contexts/WorkoutContext';

                            const CustomTabBar = ({ state, descriptors, navigation }) => {
                                const nav = useNavigation();
                                const { workout, resetWorkout } = useWorkout();

                                const handleOpenWorkoutLog = () => {
                                    if (workout) {
                                        nav.navigate('WorkoutLog');
                                    } else {
                                        nav.navigate('TemplateScreen');
                                    }
                                };

                                return (
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', height: 60 }}>
                                        {state.routes.map((route, index) => {
                                            const { options } = descriptors[route.key];
                                            const isFocused = state.index === index;

                                            const onPress = () => {
                                                const event = navigation.emit({
                                                    type: 'tabPress',
                                                    target: route.key,
                                                    canPreventDefault: true,
                                                });

                                                if (!isFocused && !event.defaultPrevented) {
                                                    navigation.navigate(route.name);
                                                }
                                            };

                                            const onLongPress = () => {
                                                navigation.emit({
                                                    type: 'tabLongPress',
                                                    target: route.key,
                                                });
                                            };

                                            let iconName;
                                            switch (route.name) {
                                                case 'HomeStack':
                                                    iconName = 'home-outline';
                                                    break;
                                                case 'PostStack':
                                                    iconName = 'create-outline';
                                                    break;
                                                case 'SaveHighlightStack':
                                                    iconName = 'bookmark-outline';
                                                    break;
                                                case 'ProgressStack':
                                                    iconName = 'trending-up-outline';
                                                    break;
                                                case 'AccountStack':
                                                    iconName = 'person-outline';
                                                    break;
                                                default:
                                                    iconName = 'ellipse-outline';
                                                    break;
                                            }

                                            return (
                                                <TouchableOpacity
                                                    key={route.key}
                                                    onPress={onPress}
                                                    onLongPress={onLongPress}
                                                    style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
                                                >
                                                    <Ionicons
                                                        name={options.tabBarIcon?.name || 'ios-home'}
                                                        size={24}
                                                        color={isFocused ? '#673ab7' : '#222'}
                                                    />
                                                    <Text style={{ color: isFocused ? '#673ab7' : '#222' }}>
                                                        {options.title || route.name}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                        {/* Custom Workout Log Button */}
                                        <TouchableOpacity
                                            onPress={() => handleOpenWorkoutLog()}
                                            style={{ justifyContent: 'center', alignItems: 'center', padding: 10 }}
                                        >
                                            <Ionicons name="barbell-outline" size={24} color="#222" />
                                            <Text style={{ color: '#222' }}>Workout Log</Text>
                                        </TouchableOpacity>
                                        {/* Reset Workout Button for testing */}
                                        <TouchableOpacity
                                            onPress={() => resetWorkout()}
                                            style={{ justifyContent: 'center', alignItems: 'center', padding: 10 }}
                                        >
                                            <Ionicons name="refresh-outline" size={24} color="#222" />
                                            <Text style={{ color: '#222' }}>Reset Workout</Text>
                                        </TouchableOpacity>
                                    </View>
                                );
                            };

                            export default CustomTabBar;
                            This setup ensures that the context provider is properly initialized and the resetWorkout function is available wherever you need it.
                                is this function using it properly? This is in my workout log screen

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
                                                ? BW + ${set.weight} ${ex.weightUnit}
                                                : ${calculateTotalWeight(parseFloat(set.weight), ex.weightConfig, ex.weightUnit)} ${ex.weightUnit},
                                        reps: ex.repsConfig === 'time' ? ${set.reps} secs : ${set.reps} reps
                                    })),
                                    supersets: ex.supersets.map(superset => ({
                                        id: camelCase(superset.name),
                                        name: superset.name,
                                        sets: superset.sets.filter(set => set.weight !== '' && set.reps !== '').map(set => ({
                                            ...set,
                                            weight: superset.weightConfig === 'bodyWeight'
                                                ? 'BW'
                                                : superset.weightConfig === 'extraWeightBodyWeight'
                                                    ? BW + ${set.weight} ${superset.weightUnit}
                                                    : ${calculateTotalWeight(parseFloat(set.weight), superset.weightConfig, superset.weightUnit)} ${superset.weightUnit},
                                            reps: superset.repsConfig === 'time' ? ${set.reps} secs : ${set.reps} reps
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
                                            weightUnit: ex.weightUnit,
                                            supersets: ex.supersets.map(superset => ({
                                                id: camelCase(superset.name),
                                                name: superset.name,
                                                setsCount: superset.sets.length,
                                                weightUnit: superset.weightUnit,
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
                                    navigation.navigate("Home");
                                    resetWorkout;
                                } catch (error) {
                                    console.error("Error adding document: ", error);
                                    Alert.alert("Error", "Failed to save workouts.");
                                }
                            };

                            ChatGPT
                            To ensure that the resetWorkout function is being used correctly within your saveWorkouts function, you need to call it properly after navigating to the "Home" screen. It appears that you have a typo in your code where you should be calling the resetWorkout function but instead, you are just referencing it. Here’s how you can correct it:

                                Import the resetWorkout function from your context:

                                Make sure you import and use the resetWorkout function from the WorkoutContext in your WorkoutLogScreen component.

                                Call the resetWorkout function properly:

                                Ensure that you actually call the resetWorkout function after navigating to the "Home" screen.

                                Here's how you can make these changes:

                            Step 1: Import the resetWorkout Function
                            javascript
                            Copy code
                            import { useWorkout } from '../contexts/WorkoutContext';
                            Step 2: Use the resetWorkout Function in Your Component
                            Ensure you have access to the resetWorkout function:

                                javascript
                            Copy code
                            const { resetWorkout } = useWorkout();
                            Step 3: Call the resetWorkout Function Correctly
                            Update your saveWorkouts function to properly call resetWorkout after navigating to the "Home" screen:

                                javascript
                            Copy code
                            import React, { useState, useEffect } from 'react';
                            import { View, Text, Button, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
                            import { db, firebase_auth } from '../../firebaseConfig';
                            import { collection, addDoc, getDocs } from 'firebase/firestore';
                            import { useNavigation } from '@react-navigation/native';
                            import { useWorkout } from '../contexts/WorkoutContext';

                            const WorkoutLogScreen = () => {
                                const navigation = useNavigation();
                                const { resetWorkout } = useWorkout();
                                const [exercises, setExercises] = useState([]);
                                const [templateName, setTemplateName] = useState('');

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
                                                weightUnit: ex.weightUnit,
                                                supersets: ex.supersets.map(superset => ({
                                                    id: camelCase(superset.name),
                                                    name: superset.name,
                                                    setsCount: superset.sets.length,
                                                    weightUnit: superset.weightUnit,
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
                                        navigation.navigate("Home");
                                        resetWorkout();  // Correctly call resetWorkout here
                                    } catch (error) {
                                        console.error("Error adding document: ", error);
                                        Alert.alert("Error", "Failed to save workouts.");
                                    }
                                };

                                return (
                                    <View>
                                        {/* Your component JSX */}
                                    </View>
                                );
                            };

                            export default WorkoutLogScreen;
                            In this code, resetWorkout is called correctly as a function to reset the workout state after successfully saving the workout and navigating to the "Home" screen.
                                in my workout context, does resetWorkout need to be wrapped in a useEffect or no

                            ChatGPT
                            The resetWorkout function in your WorkoutContext does not need to be wrapped in a useEffect since it is an action that should be performed immediately when called, not in response to a component's lifecycle event. It should simply be a function that resets the workout state.

                            Here’s how you should structure your WorkoutContext including the resetWorkout function:

                                WorkoutContext
                            javascript
                            Copy code
                            import React, { createContext, useState, useContext, useEffect } from 'react';
                            import AsyncStorage from '@react-native-async-storage/async-storage';

                            const WorkoutContext = createContext();

                            export const WorkoutProvider = ({ children }) => {
                                const [workout, setWorkout] = useState(null);

                                useEffect(() => {
                                    const loadWorkout = async () => {
                                        try {
                                            const storedWorkout = await AsyncStorage.getItem('currentWorkout');
                                            if (storedWorkout) {
                                                setWorkout(JSON.parse(storedWorkout));
                                            }
                                        } catch (error) {
                                            console.error('Failed to load workout from storage:', error);
                                        }
                                    };

                                    loadWorkout();
                                }, []);

                                useEffect(() => {
                                    const saveWorkout = async () => {
                                        try {
                                            if (workout) {
                                                await AsyncStorage.setItem('currentWorkout', JSON.stringify(workout));
                                            } else {
                                                await AsyncStorage.removeItem('currentWorkout');
                                            }
                                        } catch (error) {
                                            console.error('Failed to save workout to storage:', error);
                                        }
                                    };

                                    saveWorkout();
                                }, [workout]);

                                const resetWorkout = () => {
                                    setWorkout(null);
                                };

                                return (
                                    <WorkoutContext.Provider value={{ workout, setWorkout, resetWorkout }}>
                                        {children}
                                    </WorkoutContext.Provider>
                                );
                            };

                            export const useWorkout = () => useContext(WorkoutContext);
                            WorkoutLogScreen
                            Make sure to call the resetWorkout function correctly after navigating to the "Home" screen:

                                javascript
                            Copy code
                            import React, { useState, useEffect } from 'react';
                            import { View, Text, Button, Alert } from 'react-native';
                            import { useNavigation } from '@react-navigation/native';
                            import { collection, addDoc, getDocs } from 'firebase/firestore';
                            import { db, firebase_auth } from '../../firebaseConfig';
                            import { useWorkout } from '../contexts/WorkoutContext';

                            const WorkoutLogScreen = () => {
                                const navigation = useNavigation();
                                const { resetWorkout } = useWorkout();
                                const [exercises, setExercises] = useState([]);
                                const [templateName, setTemplateName] = useState('');

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
                                                weightUnit: ex.weightUnit,
                                                supersets: ex.supersets.map(superset => ({
                                                    id: camelCase(superset.name),
                                                    name: superset.name,
                                                    setsCount: superset.sets.length,
                                                    weightUnit: superset.weightUnit,
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
                                        navigation.navigate("Home");
                                        resetWorkout();  // Correctly call resetWorkout here
                                    } catch (error) {
                                        console.error("Error adding document: ", error);
                                        Alert.alert("Error", "Failed to save workouts.");
                                    }
                                };

                                return (
                                    <View>
                                        {/* Your component JSX */}
                                    </View>
                                );
                            };

                            export default WorkoutLogScreen;
                            CustomTabBar
                            Remove the onSelectTemplate function from the CustomTabBar since it is no longer needed:

                                javascript
                            Copy code
                            import React from 'react';
                            import { View, TouchableOpacity, Text } from 'react-native';
                            import { Ionicons } from '@expo/vector-icons';
                            import { useNavigation } from '@react-navigation/native';
                            import { useWorkout } from '../contexts/WorkoutContext';

                            const CustomTabBar = ({ state, descriptors, navigation }) => {
                                const nav = useNavigation();
                                const { workout, setWorkout } = useWorkout();

                                const handleOpenWorkoutLog = () => {
                                    if (workout) {
                                        nav.navigate('WorkoutLog');
                                    } else {
                                        nav.navigate('TemplateScreen');
                                    }
                                };

                                return (
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', height: 60 }}>
                                        {state.routes.map((route, index) => {
                                            const { options } = descriptors[route.key];
                                            const isFocused = state.index === index;

                                            const onPress = () => {
                                                const event = navigation.emit({
                                                    type: 'tabPress',
                                                    target: route.key,
                                                    canPreventDefault: true,
                                                });

                                                if (!isFocused && !event.defaultPrevented) {
                                                    navigation.navigate(route.name);
                                                }
                                            };

                                            const onLongPress = () => {
                                                navigation.emit({
                                                    type: 'tabLongPress',
                                                    target: route.key,
                                                });
                                            };

                                            let iconName;
                                            switch (route.name) {
                                                case 'HomeStack':
                                                    iconName = 'home-outline';
                                                    break;
                                                case 'PostStack':
                                                    iconName = 'create-outline';
                                                    break;
                                                case 'SaveHighlightStack':
                                                    iconName = 'bookmark-outline';
                                                    break;
                                                case 'ProgressStack':
                                                    iconName = 'trending-up-outline';
                                                    break;
                                                case 'AccountStack':
                                                    iconName = 'person-outline';
                                                    break;
                                                default:
                                                    iconName = 'ellipse-outline';
                                                    break;
                                            }

                                            return (
                                                <TouchableOpacity
                                                    key={route.key}
                                                    onPress={onPress}
                                                    onLongPress={onLongPress}
                                                    style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
                                                >
                                                    <Ionicons
                                                        name={options.tabBarIcon?.name || 'ios-home'}
                                                        size={24}
                                                        color={isFocused ? '#673ab7' : '#222'}
                                                    />
                                                    <Text style={{ color: isFocused ? '#673ab7' : '#222' }}>
                                                        {options.title || route.name}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                        {/* Custom Workout Log Button */}
                                        <TouchableOpacity
                                            onPress={handleOpenWorkoutLog}
                                            style={{ justifyContent: 'center', alignItems: 'center', padding: 10 }}
                                        >
                                            <Ionicons name="barbell-outline" size={24} color="#222" />
                                            <Text style={{
                                                some of these solutions are not working. Help me diagnose whats wrong

                                                In my context I have this

                                                import React, { createContext, useState, useContext, useEffect } from 'react';
                                                import AsyncStorage from '@react-native-async-storage/async-storage';

                                                const WorkoutContext = createContext();

                                                export const WorkoutProvider = ({ children }) => {
                                                const [workout, setWorkout] = useState(null);

                                                useEffect(() => {
                                                const loadWorkout = async () => {
                                                try {
                                                const storedWorkout = await AsyncStorage.getItem('currentWorkout');
                                                if (storedWorkout) {
                                                setWorkout(JSON.parse(storedWorkout));
                                            }
                                            } catch (error) {
                                                console.error('Failed to load workout from storage:', error);
                                            }
                                            };

                                                loadWorkout();
                                            }, []);

                                                useEffect(() => {
                                                const saveWorkout = async () => {
                                                try {
                                                if (workout) {
                                                await AsyncStorage.setItem('currentWorkout', JSON.stringify(workout));
                                            } else {
                                                await AsyncStorage.removeItem('currentWorkout');
                                            }
                                            } catch (error) {
                                                console.error('Failed to save workout to storage:', error);
                                            }
                                            };

                                                saveWorkout();
                                            }, [workout]);

                                                const resetWorkout = async () => {
                                                try {
                                                await AsyncStorage.removeItem('currentWorkout');
                                                setWorkout(null);
                                            } catch (error) {
                                                console.error('Failed to reset workout:', error);
                                            }
                                            };

                                                return (
                                                <WorkoutContext.Provider value={{ workout, setWorkout }}>
                                                {children}
                                            </WorkoutContext.Provider>
                                            );
                                            };

                                            export const useWorkout = () => useContext(WorkoutContext);

                                            and in my workout log I do these in sequence

                                            import { useWorkout } from '../contexts/WorkoutContext';

                                            const { resetWorkout } = useWorkout();

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
                                            ? BW + ${set.weight} ${ex.weightUnit}
                                            : ${calculateTotalWeight(parseFloat(set.weight), ex.weightConfig, ex.weightUnit)} ${ex.weightUnit},
                                            reps: ex.repsConfig === 'time' ? ${set.reps} secs : ${set.reps} reps
                                            })),
                                            supersets: ex.supersets.map(superset => ({
                                            id: camelCase(superset.name),
                                            name: superset.name,
                                            sets: superset.sets.filter(set => set.weight !== '' && set.reps !== '').map(set => ({
                                            ...set,
                                            weight: superset.weightConfig === 'bodyWeight'
                                            ? 'BW'
                                            : superset.weightConfig === 'extraWeightBodyWeight'
                                            ? BW + ${set.weight} ${superset.weightUnit}
                                            : ${calculateTotalWeight(parseFloat(set.weight), superset.weightConfig, superset.weightUnit)} ${superset.weightUnit},
                                            reps: superset.repsConfig === 'time' ? ${set.reps} secs : ${set.reps} reps
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
                                            weightUnit: ex.weightUnit,
                                            supersets: ex.supersets.map(superset => ({
                                            id: camelCase(superset.name),
                                            name: superset.name,
                                            setsCount: superset.sets.length,
                                            weightUnit: superset.weightUnit,
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


                                            ChatGPT
                                            From your context definition, it looks like resetWorkout is not being passed into the context provider. You need to include resetWorkout in the value passed to WorkoutContext.Provider. Here’s the corrected context definition:

                                            WorkoutContext
                                            javascript
                                            Copy code
                                            import React, { createContext, useState, useContext, useEffect } from 'react';
                                            import AsyncStorage from '@react-native-async-storage/async-storage';

                                            const WorkoutContext = createContext();

                                            export const WorkoutProvider = ({ children }) => {
                                            const [workout, setWorkout] = useState(null);

                                            useEffect(() => {
                                            const loadWorkout = async () => {
                                            try {
                                            const storedWorkout = await AsyncStorage.getItem('currentWorkout');
                                            if (storedWorkout) {
                                            setWorkout(JSON.parse(storedWorkout));
                                            }
                                            } catch (error) {
                                            console.error('Failed to load workout from storage:', error);
                                            }
                                            };

                                            loadWorkout();
                                            }, []);

                                            useEffect(() => {
                                            const saveWorkout = async () => {
                                            try {
                                            if (workout) {
                                            await AsyncStorage.setItem('currentWorkout', JSON.stringify(workout));
                                            } else {
                                            await AsyncStorage.removeItem('currentWorkout');
                                            }
                                            } catch (error) {
                                            console.error('Failed to save workout to storage:', error);
                                            }
                                            };

                                            saveWorkout();
                                            }, [workout]);

                                            const resetWorkout = async () => {
                                            try {
                                            await AsyncStorage.removeItem('currentWorkout');
                                            setWorkout(null);
                                            } catch (error) {
                                            console.error('Failed to reset workout:', error);
                                            }
                                            };

                                            return (
                                            <WorkoutContext.Provider value={{ workout, setWorkout, resetWorkout }}>
                                                {children}
                                            </WorkoutContext.Provider>
                                            );
                                            };

                                            export const useWorkout = () => useContext(WorkoutContext);
                                            WorkoutLogScreen
                                            Ensure you are using resetWorkout correctly:

                                            javascript
                                            Copy code
                                            import React, { useState } from 'react';
                                            import { View, Alert } from 'react-native';
                                            import { useNavigation } from '@react-navigation/native';
                                            import { collection, addDoc, getDocs } from 'firebase/firestore';
                                            import { db, firebase_auth } from '../../firebaseConfig';
                                            import { useWorkout } from '../contexts/WorkoutContext';

                                            const WorkoutLogScreen = () => {
                                            const navigation = useNavigation();
                                            const { resetWorkout } = useWorkout();
                                            const [exercises, setExercises] = useState([]);
                                            const [templateName, setTemplateName] = useState('');

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
                                            weightUnit: ex.weightUnit,
                                            supersets: ex.supersets.map(superset => ({
                                            id: camelCase(superset.name),
                                            name: superset.name,
                                            setsCount: superset.sets.length,
                                            weightUnit: superset.weightUnit,
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
                                            navigation.navigate("Home");
                                            resetWorkout();  // Correctly call resetWorkout here
                                            } catch (error) {
                                            console.error("Error adding document: ", error);
                                            Alert.alert("Error", "Failed to save workouts.");
                                            }
                                            };

                                            return (
                                            <View>
                                                {/* Your component JSX */}
                                            </View>
                                            );
                                            };

                                            export default WorkoutLogScreen;
                                            CustomTabBar
                                            Remove the onSelectTemplate function from the CustomTabBar since it is no longer needed:

                                            javascript
                                            Copy code
                                            import React from 'react';
                                            import { View, TouchableOpacity, Text } from 'react-native';
                                            import { Ionicons } from '@react-navigation/native';
                                            import { useNavigation } from '@react-navigation/native';
                                            import { useWorkout } from '../contexts/WorkoutContext';

                                            const CustomTabBar = ({ state, descriptors, navigation }) => {
                                            const nav = useNavigation();
                                            const { workout } = useWorkout();

                                            const handleOpenWorkoutLog = () => {
                                            if (workout) {
                                            nav.navigate('WorkoutLog');
                                            } else {
                                            nav.navigate('TemplateScreen');
                                            }
                                            };

                                            return (
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', height: 60 }}>
                                                {state.routes.map((route, index) => {
                                                    const { options } = descriptors[route.key];
                                                    const isFocused = state.index === index;

                                                    const onPress = () => {
                                                        const event = navigation.emit({
                                                            type: 'tabPress',
                                                            target: route.key,
                                                            canPreventDefault: true,
                                                        });

                                                        if (!isFocused && !event.defaultPrevented) {
                                                            navigation.navigate(route.name);
                                                        }
                                                    };

                                                    const onLongPress = () => {
                                                        navigation.emit({
                                                            type: 'tabLongPress',
                                                            target: route.key,
                                                        });
                                                    };

                                                    let iconName;
                                                    switch (route.name) {
                                                        case 'HomeStack':
                                                            iconName = 'home-outline';
                                                            break;
                                                        case 'PostStack':
                                                            iconName = 'create-outline';
                                                            break;
                                                        case 'SaveHighlightStack':
                                                            iconName = 'bookmark-outline';
                                                            break;
                                                        case 'ProgressStack':
                                                            iconName = 'trending-up-outline';
                                                            break;
                                                        case 'AccountStack':
                                                            iconName = 'person-outline';
                                                            break;
                                                        default:
                                                            iconName = 'ellipse-outline';
                                                            break;
                                                    }

                                                    return (
                                                        <TouchableOpacity
                                                            key={route.key}
                                                            onPress={onPress}
                                                            onLongPress={onLongPress}
                                                            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
                                                        >
                                                            <Ionicons
                                                                name={options.tabBarIcon?.name || 'ios-home'}
                                                                size={24}
                                                                color={isFocused ? '#673ab7' : '#222'}
                                                            />
                                                            <Text style={{ color: isFocused ? '#673ab7' : '#222' }}>
                                                                {options.title || route.name}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                                {/* Custom Workout Log Button */}
                                                <TouchableOpacity
                                                    onPress={handleOpenWorkoutLog}
                                                    style={{ justifyContent: 'center', alignItems: 'center', padding: 10 }}
                                                >
                                                    <Ionicons name="barbell-outline" size={24} color="#222" />
                                                    <Text style={{ color: '#222' }}>Workout Log</Text>
                                                </TouchableOpacity
                                                I'm going to have to figure out how to load the template, passed through the template screen, into the workout log below. What should I add to be able to automatically load the configurations in?

                                                import React, { useState, useEffect } from 'react';
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
                                                import { useNavigation } from '@react-navigation/native';
                                                import { Picker } from "@react-native-picker/picker";
                                                import Animated, {useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
                                                import { useWorkout } from '../contexts/WorkoutContext';


                                                export default function WorkoutLogScreen() {
                                                const navigation = useNavigation();

                                                const [exercises, setExercises] = useState([
                                                { id: 'bicepCurls', name: 'Bicep Curls', sets: [{ key: 'set1', weight: '', reps: '' }], weightUnit: 'lbs', supersets: [], weightConfig: 'totalWeight', repsConfig: 'reps' }
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
                                                const { resetWorkout } = useWorkout();

                                                const timerHeight = useSharedValue(120);

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
                                                    key: set${exercises[exerciseIndex].sets.length + 1},
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
                                                    id: superset${newExercises[exerciseIndex].supersets.length + 1},
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
                                                    id: exercise${exercises.length + 1},
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
                                                    totalWeight = BW + ${weight} ${unit};
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
                                                {Lifting ${totalWeight} total ${exercise.weightUnit} for set ${lastFilledIndex}}
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
                                                        </GestureHandlerRootView>
                                                    );
                                                })}
                                                {renderTotalWeightMessage(
                                                    supersetIndex === null ? exercises[exerciseIndex] : exercises[exerciseIndex].supersets[supersetIndex],
                                                    sets
                                                )}
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
                                            ? BW + ${set.weight} ${ex.weightUnit}
                                            : ${calculateTotalWeight(parseFloat(set.weight), ex.weightConfig, ex.weightUnit)} ${ex.weightUnit},
                                            reps: ex.repsConfig === 'time' ? ${set.reps} secs : ${set.reps} reps
                                        })),
                                            supersets: ex.supersets.map(superset => ({
                                            id: camelCase(superset.name),
                                            name: superset.name,
                                            sets: superset.sets.filter(set => set.weight !== '' && set.reps !== '').map(set => ({
                                            ...set,
                                            weight: superset.weightConfig === 'bodyWeight'
                                            ? 'BW'
                                            : superset.weightConfig === 'extraWeightBodyWeight'
                                            ? BW + ${set.weight} ${superset.weightUnit}
                                            : ${calculateTotalWeight(parseFloat(set.weight), superset.weightConfig, superset.weightUnit)} ${superset.weightUnit},
                                            reps: superset.repsConfig === 'time' ? ${set.reps} secs : ${set.reps} reps
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
                                            weightUnit: ex.weightUnit,
                                            supersets: ex.supersets.map(superset => ({
                                            id: camelCase(superset.name),
                                            name: superset.name,
                                            setsCount: superset.sets.length,
                                            weightUnit: superset.weightUnit,
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
                                            key: set${newExercises[exerciseIndex].supersets[supersetIndex].sets.length + 1},
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
                                            return Array.from({ length: range }, (_, i) => ({ label: ${i}, value: i }));
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

                                            return (
                                            <GestureHandlerRootView style={styles.fullScreenContainer}>
                                                <View style={styles.modalHeader}>
                                                    <Text style={styles.headerText}>Workout Log</Text>
                                                    <TouchableOpacity onPress={navigation.goBack} style={styles.hideButton}>
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
                                            backgroundColor: '#e9ecef',
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


                                            ChatGPT
                                            To load the template passed through from the TemplateScreen into the WorkoutLogScreen, you need to modify the WorkoutLogScreen component to accept route parameters. These parameters will include the template data. When the component mounts, you can set the exercises state with the template data if it exists.

                                            Here's how you can modify your WorkoutLogScreen to handle this:

                                            Update WorkoutLogScreen to accept route parameters.
                                            Update the useEffect to check for template data and set the exercises state accordingly.
                                            Step-by-Step Changes
                                            1. Accept Route Parameters

                                            In the WorkoutLogScreen, destructure route to get the template data passed from the TemplateScreen.

                                            2. Update useEffect to Set Exercises State

                                            Add logic in the useEffect to check if template data exists and set the exercises state.

                                            Updated WorkoutLogScreen
                                            javascript
                                            Copy code
                                            import React, { useState, useEffect } from 'react';
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
                                            import { useNavigation } from '@react-navigation/native';
                                            import { Picker } from "@react-native-picker/picker";
                                            import Animated, {useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
                                            import { useWorkout } from '../contexts/WorkoutContext';


                                            export default function WorkoutLogScreen({ route }) {
                                            const navigation = useNavigation();
                                            const { resetWorkout } = useWorkout();
                                            const [exercises, setExercises] = useState([
                                        { id: 'bicepCurls', name: 'Bicep Curls', sets: [{ key: 'set1', weight: '', reps: '' }], weightUnit: 'lbs', supersets: [], weightConfig: 'totalWeight', repsConfig: 'reps' }
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

                                            const template = route?.params?.template;  // Get the template from the route params if it exists

                                            const timerHeight = useSharedValue(120);

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
                                            sets: Array.from({ length: ex.setsCount }, (_, index) => ({ key: `set${index + 1}`, weight: '', reps: '' })),
                                            supersets: ex.supersets.map(superset => ({
                                            ...superset,
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
                                                    </GestureHandlerRootView>
                                                );
                                            })}
                                            {renderTotalWeightMessage(
                                                supersetIndex === null ? exercises[exerciseIndex] : exercises[exerciseIndex].supersets[supersetIndex],
                                                sets
                                            )}
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
                                        weightUnit: ex.weightUnit,
                                        supersets: ex.supersets.map(superset => ({
                                        id: camelCase(superset.name),
                                        name: superset.name,
                                        setsCount: superset.sets.length,
                                        weightUnit: superset.weightUnit,
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

                                        return (
                                        <GestureHandlerRootView style={styles.fullScreenContainer}>
                                            <View style={styles.modalHeader}>
                                                <Text style={styles.headerText}>Workout Log</Text>
                                                <TouchableOpacity onPress={navigation.goBack} style={styles.hideButton}>
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
                                        backgroundColor: '#e9ecef',
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
                                        This implementation will automatically load the template into the WorkoutLogScreen when the template is selected in the TemplateScreen and the WorkoutLogScreen is navigated to with the template data.
                                        render error: cannot read property 'map' of undefined

                                        ChatGPT
                                        It seems like the issue is occurring because exercises is being accessed before it is properly defined. To ensure that the exercises state is properly initialized when the component mounts with a template, you can add a check to ensure template exists and use it to set the exercises.

                                        Here's how you can adjust your code to handle the template data properly:

                                        Update the WorkoutLogScreen component to initialize exercises from the template if it exists.
                                        Make sure to handle cases where template might be undefined.
                                        Here's the updated code for the WorkoutLogScreen component:

                                        javascript
                                        Copy code
                                        import React, { useState, useEffect } from 'react';
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
                                        import { useNavigation, useRoute } from '@react-navigation/native';
                                        import { Picker } from "@react-native-picker/picker";
                                        import Animated, {useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
                                        import { useWorkout } from '../contexts/WorkoutContext';

                                        export default function WorkoutLogScreen() {
                                        const navigation = useNavigation();
                                        const route = useRoute();
                                        const template = route.params?.template;

                                        const [exercises, setExercises] = useState(template?.exercises || []);
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
                                        const [timerConfigured, setTimerConfigured] = useState(false);
                                        const { resetWorkout } = useWorkout();

                                        const timerHeight = useSharedValue(120);

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
                                        newExercises[exerciseIndex].supersets =
                                        const handleLoadTemplate = () => {
                                        if (selectedTemplate) {
                                        setWorkout({ exercises: selectedTemplate.exercises });
                                        navigation.navigate('WorkoutLog', { template: selectedTemplate });
                                    }
                                    };

                                        in this function, how do I fix this then so I pass the template directly in?

                                        ChatGPT
                                        To pass the template directly into the WorkoutLog screen, you need to ensure that the WorkoutLog screen properly handles the template prop when navigating. In your TemplateScreen component, you can adjust the handleLoadTemplate function to pass the template directly.

                                        Here's how to fix and integrate it:

                                        TemplateScreen
                                        Update the TemplateScreen to handle the handleLoadTemplate properly:

                                        javascript
                                        Copy code
                                        import React, { useState, useEffect } from 'react';
                                        import { View, Text, Button, FlatList, TouchableOpacity, StyleSheet, Picker } from 'react-native';
                                        import { db, firebase_auth } from '../../firebaseConfig';
                                        import { collection, getDocs } from 'firebase/firestore';
                                        import { useNavigation } from '@react-navigation/native';

                                        const TemplateScreen = () => {
                                        const [templates, setTemplates] = useState([]);
                                        const [selectedTemplate, setSelectedTemplate] = useState(null);
                                        const navigation = useNavigation();

                                        useEffect(() => {
                                        fetchTemplates();
                                    }, []);

                                        const fetchTemplates = async () => {
                                        if (!firebase_auth.currentUser) return;

                                        const userId = firebase_auth.currentUser.uid;
                                        const templateRef = collection(db, "userProfiles", userId, "templates");
                                        const querySnapshot = await getDocs(templateRef);
                                        const templatesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                                        setTemplates(templatesList);
                                    };

                                        const handleLoadTemplate = () => {
                                        if (selectedTemplate) {
                                        navigation.navigate('WorkoutLog', { template: selectedTemplate });
                                    }
                                    };

                                        const handleStartNewWorkout = () => {
                                        navigation.navigate('WorkoutLog');
                                    };

                                        return (
                                        <View style={styles.container}>
                                        <View style={styles.content}>
                                            <Text style={styles.title}>Select a Template</Text>
                                            <Picker
                                                selectedValue={selectedTemplate}
                                                onValueChange={(itemValue) => setSelectedTemplate(itemValue)}
                                                style={styles.picker}
                                            >
                                                {templates.map(template => (
                                                    <Picker.Item key={template.id} label={template.templateName} value={template} />
                                                ))}
                                            </Picker>
                                            {selectedTemplate && (
                                                <View style={styles.templatePreview}>
                                                    <Text style={styles.previewTitle}>Preview</Text>
                                                    {selectedTemplate.exercises.map((exercise, index) => (
                                                        <View key={index}>
                                                            <Text>{exercise.name}</Text>
                                                            {exercise.supersets && exercise.supersets.length > 0 && (
                                                                <View style={styles.supersetContainer}>
                                                                    {exercise.supersets.map((superset, supersetIndex) => (
                                                                        <Text key={supersetIndex}>- {superset.name}</Text>
                                                                    ))}
                                                                </View>
                                                            )}
                                                            <Text>Sets: {exercise.setsCount}</Text>
                                                        </View>
                                                    ))}
                                                </View>
                                            )}
                                            <Button title="Load Template" onPress={handleLoadTemplate} />
                                            <Button title="Start New Workout" onPress={handleStartNewWorkout} />
                                            <Button title="Cancel" onPress={() => navigation.goBack()} />
                                        </View>
                                    </View>
                                );
                            };

                                const styles = StyleSheet.create({
                                    container: {
                                        flex: 1,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                    },
                                    content: {
                                        backgroundColor: 'white',
                                        padding: 20,
                                        borderRadius: 10,
                                        alignItems: 'center',
                                    },
                                    title: {
                                        fontSize: 20,
                                        marginBottom: 10,
                                    },
                                    picker: {
                                        width: 200,
                                        height: 50,
                                    },
                                    templatePreview: {
                                        marginVertical: 20,
                                    },
                                    previewTitle: {
                                        fontSize: 18,
                                        marginBottom: 10,
                                    },
                                    supersetContainer: {
                                        marginLeft: 20,
                                    },
                                    templateItem: {
                                        fontSize: 16,
                                        padding: 10,
                                        borderBottomWidth: 1,
                                        borderBottomColor: '#ccc',
                                    },
                                });

                                export default TemplateScreen;
                                WorkoutLogScreen
                                Update the WorkoutLogScreen to initialize exercises from the passed template:

                                    javascript
                                Copy code
                                import React, { useState, useEffect } from 'react';
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
                                import { useNavigation, useRoute } from '@react-navigation/native';
                                import { Picker } from "@react-native-picker/picker";
                                import Animated, {useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
                                import { useWorkout } from '../contexts/WorkoutContext';

                                export default function WorkoutLogScreen() {
                                    const navigation = useNavigation();
                                    const route = useRoute();
                                    const template = route.params?.template;

                                    const { workout, setWorkout, resetWorkout } = useWorkout();
                                    const [exercises, setExercises] = useState(template?.exercises || workout?.exercises || []);
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
                                    const [timerConfigured, setTimerConfigured] = useState(false);

                                    const timerHeight = useSharedValue(120);

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
                                                    </GestureHandlerRootView>
                                                );
                                            })}
                                            {renderTotalWeightMessage(
                                                supersetIndex === null ? exercises[exerciseIndex] : exercises[exerciseIndex].supersets[supersetIndex],
                                                sets
                                            )}
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
                                                    weightUnit: ex.weightUnit,
                                                    supersets: ex.supersets.map(superset => ({
                                                        id: camelCase(superset.name),
                                                        name: superset.name,
                                                        setsCount: superset.sets.length,
                                                        weightUnit: superset.weightUnit,
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
                                                        style={[styles.unitButtonText, item.weightUnit
                                                            {selectedTemplate && selectedTemplate.exercises && (
                                                                <View style={styles.templatePreview}>
                                                                    <Text style={styles.previewTitle}>Template Preview:</Text>
                                                                    {selectedTemplate.exercises.map((exercise, index) => (
                                                                        <View key={index} style={styles.previewItem}>
                                                                            <Text style={styles.previewItemText}>
                                                                                {exercise.name} - Sets: {exercise.setsCount}
                                                                            </Text>
                                                                            {exercise.supersets.length > 0 && (
                                                                                <View style={styles.supersetContainer}>
                                                                                    <Text style={styles.supersetTitle}>Supersets:</Text>
                                                                                    {exercise.supersets.map((superset, supersetIndex) => (
                                                                                        <Text key={supersetIndex} style={styles.supersetItemText}>
                                                                                            {superset.name} - Sets: {superset.setsCount}
                                                                                        </Text>
                                                                                    ))}
                                                                                </View>
                                                                            )}
                                                                        </View>
                                                                    ))}
                                                                </View>
                                                            )}


                                                            in this snippet, is there a way I can check if selectedTemplate and selectedTemplate.exercises all exist and are loading properly?

                                                            ChatGPT
                                                            Yes, you can add additional logging and conditional checks to ensure that selectedTemplate and selectedTemplate.exercises exist and are loading properly. Here's how you can enhance the snippet to include these checks:

                                                            Add console logs to track the state of selectedTemplate and selectedTemplate.exercises.
                                                            Add additional conditional checks to handle cases where these values might be undefined or null.
                                                            Here's the enhanced snippet:

                                                            javascript
                                                            Copy code
                                                            import React, { useState, useEffect } from 'react';
                                                            import { View, Text, Button, FlatList, TouchableOpacity, StyleSheet, Picker } from 'react-native';
                                                            import { db, firebase_auth } from '../../firebaseConfig';
                                                            import { collection, getDocs } from 'firebase/firestore';
                                                            import { useNavigation } from '@react-navigation/native';

                                                            const TemplateScreen = () => {
                                                            const [templates, setTemplates] = useState([]);
                                                            const [selectedTemplate, setSelectedTemplate] = useState(null);
                                                            const navigation = useNavigation();

                                                            useEffect(() => {
                                                            fetchTemplates();
                                                        }, []);

                                                            const fetchTemplates = async () => {
                                                            if (!firebase_auth.currentUser) return;

                                                            const userId = firebase_auth.currentUser.uid;
                                                            const templateRef = collection(db, "userProfiles", userId, "templates");
                                                            const querySnapshot = await getDocs(templateRef);
                                                            const templatesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                                                            setTemplates(templatesList);
                                                        };

                                                            const handleLoadTemplate = () => {
                                                            if (selectedTemplate) {
                                                            console.log('Loading template:', selectedTemplate);
                                                            navigation.navigate('WorkoutLog', { template: selectedTemplate });
                                                        } else {
                                                            console.log('No template selected');
                                                        }
                                                        };

                                                            const handleStartNewWorkout = () => {
                                                            navigation.navigate('WorkoutLog');
                                                        };

                                                            return (
                                                            <View style={styles.container}>
                                                        <View style={styles.content}>
                                                            <Text style={styles.title}>Select a Template</Text>
                                                            <Picker
                                                                selectedValue={selectedTemplate}
                                                                onValueChange={(itemValue) => setSelectedTemplate(itemValue)}
                                                                style={styles.picker}
                                                            >
                                                                {templates.map(template => (
                                                                    <Picker.Item key={template.id} label={template.templateName} value={template} />
                                                                ))}
                                                            </Picker>
                                                            {selectedTemplate && selectedTemplate.exercises ? (
                                                                <View style={styles.templatePreview}>
                                                                    <Text style={styles.previewTitle}>Template Preview:</Text>
                                                                    {selectedTemplate.exercises.map((exercise, index) => (
                                                                        <View key={index} style={styles.previewItem}>
                                                                            <Text style={styles.previewItemText}>
                                                                                {exercise.name} - Sets: {exercise.setsCount}
                                                                            </Text>
                                                                            {exercise.supersets && exercise.supersets.length > 0 && (
                                                                                <View style={styles.supersetContainer}>
                                                                                    <Text style={styles.supersetTitle}>Supersets:</Text>
                                                                                    {exercise.supersets.map((superset, supersetIndex) => (
                                                                                        <Text key={supersetIndex} style={styles.supersetItemText}>
                                                                                            {superset.name} - Sets: {superset.setsCount}
                                                                                        </Text>
                                                                                    ))}
                                                                                </View>
                                                                            )}
                                                                        </View>
                                                                    ))}
                                                                </View>
                                                            ) : (
                                                                <Text>No template selected or no exercises in template</Text>
                                                            )}
                                                            <Button title="Load Template" onPress={handleLoadTemplate} />
                                                            <Button title="Start New Workout" onPress={handleStartNewWorkout} />
                                                            <Button title="Cancel" onPress={() => navigation.goBack()} />
                                                        </View>
                                            </View>
                                            );
                                            };

                                            const styles = StyleSheet.create({
                                            container: {
                                            flex: 1,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                            },
                                            content: {
                                            backgroundColor: 'white',
                                            padding: 20,
                                            borderRadius: 10,
                                            alignItems: 'center',
                                            },
                                            title: {
                                            fontSize: 20,
                                            marginBottom: 10,
                                            },
                                            picker: {
                                            width: 200,
                                            height: 50,
                                            },
                                            templatePreview: {
                                            marginVertical: 20,
                                            },
                                            previewTitle: {
                                            fontSize: 18,
                                            marginBottom: 10,
                                            },
                                            previewItem: {
                                            marginBottom: 10,
                                            },
                                            previewItemText: {
                                            fontSize: 16,
                                            },
                                            supersetContainer: {
                                            marginLeft: 10,
                                            },
                                            supersetTitle: {
                                            fontSize: 16,
                                            fontWeight: 'bold',
                                            },
                                            supersetItemText: {
                                            fontSize: 14,
                                            },
                                            templateItem: {
                                            fontSize: 16,
                                            padding: 10,
                                            borderBottomWidth: 1,
                                            borderBottomColor: '#ccc',
                                            },
                                            });

                                            export default TemplateScreen;
                                            Key Changes:
                                            Logging:

                                            Added console.log statements to log the selected template and check if it exists.
                                            Conditional Rendering:

                                            Added a conditional check to ensure selectedTemplate and selectedTemplate.exercises exist before attempting to map over selectedTemplate.exercises.
                                            Added a fallback message "No template selected or no exercises in template" to handle cases where no template is selected or the selected template has no exercises.
                                            These changes will help you diagnose any issues with selectedTemplate and ensure that the component only attempts to render exercises if they are properly loaded.

                                            for some reason, my exercises map isn't loading, and the message that I don't have any exercises in template is showing. Can you help me diagnose why?

                                            this is my collection

                                            ChatGPT
                                            Based on the screenshot you provided, it seems that the structure in your Firestore is correct, but the data is not being loaded properly into your application. Here are a few steps you can take to diagnose and fix this issue:

                                            Check Firestore Data Fetching:
                                            Ensure that the data fetching from Firestore is done correctly and the data is being set in the state properly.

                                            Debug the Data Fetching:
                                            Add some console logs to see if the data is being fetched correctly from Firestore and if it is correctly structured when being set into the state.

                                            Ensure Data Structure Consistency:
                                            Make sure the data structure in your Firestore matches exactly what your code expects.

                                            Let's go through these steps:

                                            Step 1: Check Firestore Data Fetching
                                            Make sure your fetchTemplates function correctly fetches the data from Firestore and sets it in the state. Here is a possible implementation with added logging:

                                            javascript
                                            Copy code
                                            const fetchTemplates = async () => {
                                            if (!firebase_auth.currentUser) return;

                                            try {
                                            const userId = firebase_auth.currentUser.uid;
                                            const templateRef = collection(db, "userProfiles", userId, "templates");
                                            const querySnapshot = await getDocs(templateRef);
                                            const templatesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                                            console.log('Fetched Templates:', templatesList);

                                            setTemplates(templatesList);
                                            } catch (error) {
                                            console.error('Error fetching templates:', error);
                                            }
                                            };
                                            Step 2: Debug the Data Fetching
                                            Make sure the data structure matches what your code expects. Add console logs to verify the structure.

                                            Step 3: Ensure Data Structure Consistency
                                            Ensure that the selectedTemplate and its exercises are properly defined and structured.

                                            javascript
                                            Copy code
                                            {selectedTemplate && selectedTemplate.exercises && Array.isArray(selectedTemplate.exercises) && selectedTemplate.exercises.length > 0 ? (
                                            <View style={styles.templatePreview}>
                                                <Text style={styles.previewTitle}>Template Preview:</Text>
                                                {selectedTemplate.exercises.map((exercise, index) => (
                                                    <View key={index} style={styles.previewItem}>
                                                        <Text style={styles.previewItemText}>
                                                            {exercise.name} - Sets: {exercise.setsCount}
                                                        </Text>
                                                        {exercise.supersets && Array.isArray(exercise.supersets) && exercise.supersets.length > 0 && (
                                                            <View style={styles.supersetContainer}>
                                                                <Text style={styles.supersetTitle}>Supersets:</Text>
                                                                {exercise.supersets.map((superset, supersetIndex) => (
                                                                    <Text key={supersetIndex} style={styles.supersetItemText}>
                                                                        {superset.name} - Sets: {superset.setsCount}
                                                                    </Text>
                                                                ))}
                                                            </View>
                                                        )}
                                                    </View>
                                                ))}
                                            </View>
                                            ) : (
                                            <Text>No template selected or no exercises in template</Text>
                                            )}
                                            Adding Console Logs
                                            Add console logs to check if the data is being set correctly:

                                            javascript
                                            Copy code
                                            const handleLoadTemplate = () => {
                                            if (selectedTemplate) {
                                            console.log('Selected Template:', selectedTemplate);
                                            console.log('Exercises:', selectedTemplate.exercises);
                                            setWorkout({ exercises: selectedTemplate.exercises });
                                            navigation.navigate('WorkoutLog', { template: selectedTemplate });
                                            } else {
                                            console.log('No template selected');
                                            }
                                            };
                                            These steps should help you diagnose why the exercises are not being loaded properly. Ensure that the data structure in your Firestore matches the expected structure in your code and that the data fetching and setting process is correct.
                                            when I try to load a template, it shows this  Loading template: [object Object]
                                            does this mean that its an error with how I'm pulling from firebase?

                                            ChatGPT
                                            When you see [object Object] in your logs, it indicates that the object is being logged directly without being properly stringified. To get more useful debug information, you should stringify the object before logging it.

                                            Step 1: Properly Log the Template Object
                                            Let's update the logging to use JSON.stringify so that you can see the full structure of the object.

                                            javascript
                                            Copy code
                                            const handleLoadTemplate = () => {
                                            if (selectedTemplate) {
                                            console.log('Selected Template:', JSON.stringify(selectedTemplate, null, 2));
                                            console.log('Exercises:', JSON.stringify(selectedTemplate.exercises, null, 2));
                                            setWorkout({ exercises: selectedTemplate.exercises });
                                            navigation.navigate('WorkoutLog', { template: selectedTemplate });
                                            } else {
                                            console.log('No template selected');
                                            }
                                            };
                                            Step 2: Check Data Fetching from Firebase
                                            Ensure that the data is being fetched correctly from Firebase. Here is a full example with proper logging:

                                            javascript
                                            Copy code
                                            const fetchTemplates = async () => {
                                            if (!firebase_auth.currentUser) return;

                                            try {
                                            const userId = firebase_auth.currentUser.uid;
                                            const templateRef = collection(db, "userProfiles", userId, "templates");
                                            const querySnapshot = await getDocs(templateRef);
                                            const templatesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                                            console.log('Fetched Templates:', JSON.stringify(templatesList, null, 2));

                                            setTemplates(templatesList);
                                            } catch (error) {
                                            console.error('Error fetching templates:', error);
                                            }
                                            };
                                            Step 3: Verify Data Structure
                                            Ensure the selectedTemplate structure is correct and matches what your code expects.

                                            Example Structure Validation
                                            Make sure the structure is what you expect:

                                            javascript
                                            Copy code
                                            if (selectedTemplate && selectedTemplate.exercises && Array.isArray(selectedTemplate.exercises)) {
                                            console.log('Template has valid exercises array');
                                            selectedTemplate.exercises.forEach(exercise => {
                                            console.log('Exercise:', JSON.stringify(exercise, null, 2));
                                            });
                                            } else {
                                            console.log('Template exercises are not valid');
                                            }
                                            Step 4: Ensure Proper Data Structure in Firestore
                                            Check your Firestore structure to ensure that it matches the expected structure. The structure should look like this:

                                            json
                                            Copy code
                                            {
                                            "templateName": "My Template",
                                            "exercises": [
                                            {
                                            "id": "pullUp",
                                            "name": "Pull Up",
                                            "repsConfig": "reps",
                                            "setsCount": 1,
                                            "supersets": [
                                            {
                                            "id": "pushUp",
                                            "name": "Push Up",
                                            "repsConfig": "reps",
                                            "setsCount": 1,
                                            "weightConfig": "bodyWeight"
                                            }
                                            ]
                                            }
                                            ],
                                            "createdAt": "2024-05-31T21:54:53.000Z"
                                            }
                                            Full Example of Logging and Data Fetching
                                            Here is the complete code with all the logging for better debugging:

                                            javascript
                                            Copy code
                                            const TemplateScreen = ({ route }) => {
                                            const { onSelectTemplate } = route.params;
                                            const [templates, setTemplates] = useState([]);
                                            const [selectedTemplate, setSelectedTemplate] = useState(null);
                                            const navigation = useNavigation();

                                            useEffect(() => {
                                            fetchTemplates();
                                            }, []);

                                            const fetchTemplates = async () => {
                                            if (!firebase_auth.currentUser) return;

                                            try {
                                            const userId = firebase_auth.currentUser.uid;
                                            const templateRef = collection(db, "userProfiles", userId, "templates");
                                            const querySnapshot = await getDocs(templateRef);
                                            const templatesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                                            console.log('Fetched Templates:', JSON.stringify(templatesList, null, 2));

                                            setTemplates(templatesList);
                                            } catch (error) {
                                            console.error('Error fetching templates:', error);
                                            }
                                            };

                                            const handleLoadTemplate = () => {
                                            if (selectedTemplate) {
                                            console.log('Loading template:', JSON.stringify(selectedTemplate, null, 2));
                                            setWorkout({ exercises: selectedTemplate.exercises });
                                            navigation.navigate('WorkoutLog', { template: selectedTemplate });
                                            }
                                            };

                                            return (
                                            <View style={styles.container}>
                                                <View style={styles.content}>
                                                    <Text style={styles.title}>Select a Template</Text>
                                                    <FlatList
                                                        data={templates}
                                                        keyExtractor={item => item.id}
                                                        renderItem={({ item }) => (
                                                            <TouchableOpacity onPress={() => setSelectedTemplate(item)}>
                                                                <Text style={styles.templateItem}>{item.templateName}</Text>
                                                            </TouchableOpacity>
                                                        )}
                                                    />
                                                    {selectedTemplate && selectedTemplate.exercises && (
                                                        <View style={styles.templatePreview}>
                                                            <Text style={styles.previewTitle}>Template Preview:</Text>
                                                            {selectedTemplate.exercises.map((exercise, index) => (
                                                                <View key={index} style={styles.previewItem}>
                                                                    <Text style={styles.previewItemText}>
                                                                        {exercise.name} - Sets: {exercise.setsCount}
                                                                    </Text>
                                                                    {exercise.supersets && exercise.supersets.length > 0 && (
                                                                        <View style={styles.supersetContainer}>
                                                                            <Text style={styles.supersetTitle}>Supersets:</Text>
                                                                            {exercise.supersets.map((superset, supersetIndex) => (
                                                                                <Text key={supersetIndex} style={styles.supersetItemText}>
                                                                                    {superset.name} - Sets: {superset.setsCount}
                                                                                </Text>
                                                                            ))}
                                                                        </View>
                                                                    )}
                                                                </View>
                                                            ))}
                                                        </View>
                                                    )}
                                                    <Button title="Load Template" onPress={handleLoadTemplate} />
                                                    <Button title="Start New Workout" onPress={() => navigation.navigate('WorkoutLog')} />
                                                    <Button title="Cancel" onPress={() => navigation.goBack()} />
                                                </View>
                                            </View>
                                            );
                                            };

                                            const styles = StyleSheet.create({
                                            container: {
                                            flex: 1,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                            },
                                            content: {
                                            backgroundColor: 'white',
                                            padding: 20,
                                            borderRadius: 10,
                                            alignItems: 'center',
                                            },
                                            title: {
                                            fontSize: 20,
                                            marginBottom: 10,
                                            },
                                            templateItem: {
                                            fontSize: 16,
                                            padding: 10,
                                            borderBottomWidth: 1,
                                            borderBottomColor: '#ccc',
                                            },
                                            templatePreview: {
                                            marginTop: 20,
                                            },
                                            previewTitle: {
                                            fontSize: 18,
                                            fontWeight: 'bold',
                                            },
                                            previewItem: {
                                            marginTop: 10,
                                            },
                                            previewItemText: {
                                            fontSize: 16,
                                            },
                                            supersetContainer: {
                                            marginTop: 10,
                                            paddingLeft: 10,
                                            borderLeftWidth: 2,
                                            borderLeftColor: '#ccc',
                                            },
                                            supersetTitle: {
                                            fontSize: 14,
                                            fontWeight: 'bold',
                                            },
                                            supersetItemText: {
                                            fontSize: 14,
                                            },
                                            });

                                            export default TemplateScreen;
                                            This should help you better diagnose why the exercises are not being loaded properly. Ensure that the data structure in Firestore matches the expected structure and that you are properly logging and setting the state in your application.
                                            I get this

                                            Selected Template: "[object Object]"
                                            LOG  Exercises: undefined

                                            ChatGPT
                                            The issue you're seeing means that the selectedTemplate object is being correctly logged, but its exercises property is not being found or is undefined.

                                            To diagnose and fix this, let's add detailed logging to ensure that the data structure is as expected at each step. Here are some steps to help you debug and ensure the data is being handled correctly:

                                            Step 1: Detailed Logging
                                            Update the logging to see the structure of selectedTemplate more clearly.

                                            javascript
                                            Copy code
                                            const handleLoadTemplate = () => {
                                            if (selectedTemplate) {
                                            console.log('Selected Template:', JSON.stringify(selectedTemplate, null, 2));

                                            if (selectedTemplate.exercises) {
                                            console.log('Exercises:', JSON.stringify(selectedTemplate.exercises, null, 2));
                                            } else {
                                            console.log('No exercises found in the selected template');
                                            }

                                            setWorkout({ exercises: selectedTemplate.exercises });
                                            navigation.navigate('WorkoutLog', { template: selectedTemplate });
                                            } else {
                                            console.log('No template selected');
                                            }
                                            };
                                            Step 2: Verify Data Fetching from Firebase
                                            Ensure that the data is being fetched correctly from Firebase and the exercises property exists.

                                            javascript
                                            Copy code
                                            const fetchTemplates = async () => {
                                            if (!firebase_auth.currentUser) return;

                                            try {
                                            const userId = firebase_auth.currentUser.uid;
                                            const templateRef = collection(db, "userProfiles", userId, "templates");
                                            const querySnapshot = await getDocs(templateRef);
                                            const templatesList = querySnapshot.docs.map(doc => {
                                            const data = doc.data();
                                            console.log('Fetched Template Data:', JSON.stringify(data, null, 2));
                                            return { id: doc.id, ...data };
                                            });

                                            setTemplates(templatesList);
                                            } catch (error) {
                                            console.error('Error fetching templates:', error);
                                            }
                                            };
                                            Step 3: Verify Firestore Structure
                                            Ensure that the Firestore structure matches what your app expects. Based on your screenshot, the structure should look like this:

                                            json
                                            Copy code
                                            {
                                            "templateName": "My Template",
                                            "exercises": [
                                            {
                                            "id": "pullUp",
                                            "name": "Pull Up",
                                            "repsConfig": "reps",
                                            "setsCount": 1,
                                            "supersets": [
                                            {
                                            "id": "pushUp",
                                            "name": "Push Up",
                                            "repsConfig": "reps",
                                            "setsCount": 1,
                                            "weightConfig": "bodyWeight"
                                            }
                                            ]
                                            }
                                            ],
                                            "createdAt": "2024-05-31T21:54:53.000Z"
                                            }
                                            Full Code with Enhanced Logging
                                            Here is the complete code with all the necessary logging to help you debug the issue:

                                            javascript
                                            Copy code
                                            const TemplateScreen = ({ route }) => {
                                            const { onSelectTemplate } = route.params;
                                            const [templates, setTemplates] = useState([]);
                                            const [selectedTemplate, setSelectedTemplate] = useState(null);
                                            const navigation = useNavigation();

                                            useEffect(() => {
                                            fetchTemplates();
                                            }, []);

                                            const fetchTemplates = async () => {
                                            if (!firebase_auth.currentUser) return;

                                            try {
                                            const userId = firebase_auth.currentUser.uid;
                                            const templateRef = collection(db, "userProfiles", userId, "templates");
                                            const querySnapshot = await getDocs(templateRef);
                                            const templatesList = querySnapshot.docs.map(doc => {
                                            const data = doc.data();
                                            console.log('Fetched Template Data:', JSON.stringify(data, null, 2));
                                            return { id: doc.id, ...data };
                                            });

                                            setTemplates(templatesList);
                                            } catch (error) {
                                            console.error('Error fetching templates:', error);
                                            }
                                            };

                                            const handleLoadTemplate = () => {
                                            if (selectedTemplate) {
                                            console.log('Selected Template:', JSON.stringify(selectedTemplate, null, 2));

                                            if (selectedTemplate.exercises) {
                                            console.log('Exercises:', JSON.stringify(selectedTemplate.exercises, null, 2));
                                            } else {
                                            console.log('No exercises found in the selected template');
                                            }

                                            setWorkout({ exercises: selectedTemplate.exercises });
                                            navigation.navigate('WorkoutLog', { template: selectedTemplate });
                                            } else {
                                            console.log('No template selected');
                                            }
                                            };

                                            return (
                                            <View style={styles.container}>
                                                <View style={styles.content}>
                                                    <Text style={styles.title}>Select a Template</Text>
                                                    <FlatList
                                                        data={templates}
                                                        keyExtractor={item => item.id}
                                                        renderItem={({ item }) => (
                                                            <TouchableOpacity onPress={() => setSelectedTemplate(item)}>
                                                                <Text style={styles.templateItem}>{item.templateName}</Text>
                                                            </TouchableOpacity>
                                                        )}
                                                    />
                                                    {selectedTemplate && selectedTemplate.exercises && (
                                                        <View style={styles.templatePreview}>
                                                            <Text style={styles.previewTitle}>Template Preview:</Text>
                                                            {selectedTemplate.exercises.map((exercise, index) => (
                                                                <View key={index} style={styles.previewItem}>
                                                                    <Text style={styles.previewItemText}>
                                                                        {exercise.name} - Sets: {exercise.setsCount}
                                                                    </Text>
                                                                    {exercise.supersets && exercise.supersets.length > 0 && (
                                                                        <View style={styles.supersetContainer}>
                                                                            <Text style={styles.supersetTitle}>Supersets:</Text>
                                                                            {exercise.supersets.map((superset, supersetIndex) => (
                                                                                <Text key={supersetIndex} style={styles.supersetItemText}>
                                                                                    {superset.name} - Sets: {superset.setsCount}
                                                                                </Text>
                                                                            ))}
                                                                        </View>
                                                                    )}
                                                                </View>
                                                            ))}
                                                        </View>
                                                    )}
                                                    <Button title="Load Template" onPress={handleLoadTemplate} />
                                                    <Button title="Start New Workout" onPress={() => navigation.navigate('WorkoutLog')} />
                                                    <Button title="Cancel" onPress={() => navigation.goBack()} />
                                                </View>
                                            </View>
                                            );
                                            };

                                            const styles = StyleSheet.create({
                                            container: {
                                            flex: 1,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                            },
                                            content: {
                                            backgroundColor: 'white',
                                            padding: 20,
                                            borderRadius: 10,
                                            alignItems: 'center',
                                            },
                                            title: {
                                            fontSize: 20,
                                            marginBottom: 10,
                                            },
                                            templateItem: {
                                            fontSize: 16,
                                            padding: 10,
                                            borderBottomWidth: 1,
                                            borderBottomColor: '#ccc',
                                            },
                                            templatePreview: {
                                            marginTop: 20,
                                            },
                                            previewTitle: {
                                            fontSize: 18,
                                            fontWeight: 'bold',
                                            },
                                            previewItem: {
                                            marginTop: 10,
                                            },
                                            previewItemText: {
                                            fontSize: 16,
                                            },
                                            supersetContainer: {
                                            marginTop: 10,
                                            paddingLeft: 10,
                                            borderLeftWidth: 2,
                                            borderLeftColor: '#ccc',
                                            },
                                            supersetTitle: {
                                            fontSize: 14,
                                            fontWeight: 'bold',
                                            },
                                            supersetItemText: {
                                            fontSize: 14,
                                            },
                                            });

                                            export default TemplateScreen;
                                            With these changes, you should be able to see more detailed information about what selectedTemplate and its exercises property contain. This will help you diagnose why the exercises might not be loading correctly.
                                            I get this json fetched. But my preview still doesn't display. Is there a problem with this?

                                            LOG  Fetched Template Data: {
                                            "createdAt": {
                                            "seconds": 1717192493,
                                            "nanoseconds": 425000000
                                            },
                                            "exercises": [
                                            {
                                            "supersets": {
                                            "weightConfig": "bodyWeight",
                                            "repsConfig": "reps",
                                            "setsCount": 1,
                                            "id": "pushUp",
                                            "name": "Push Up"
                                            },
                                            "id": "pullUp",
                                            "repsConfig": "reps",
                                            "name": "Pull Up",
                                            "setsCount": 1,
                                            "weightConfig": "bodyWeight"
                                            },
                                            {
                                            "setsCount": 2,
                                            "name": "Bench Press",
                                            "id": "benchPress",
                                            "repsConfig": "reps",
                                            "weightConfig": "weightPerSideBarbell"
                                            }
                                            ],
                                            "templateName": "Pull Day"
                                            }


                                            ChatGPT
                                            Based on the JSON data you provided, it looks like there's a slight inconsistency in how the supersets are structured. Specifically, the supersets are stored as an object instead of an array. This can cause issues when trying to map through the supersets in your component.

                                            Here's how you can adjust your code to handle this structure correctly:

                                            Update TemplateScreen Component
                                            Update your TemplateScreen component to correctly handle and display the fetched template data:

                                            javascript
                                            Copy code
                                            import React, { useState, useEffect } from 'react';
                                            import { View, Text, Button, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
                                            import { db, firebase_auth } from '../../firebaseConfig';
                                            import { collection, getDocs } from 'firebase/firestore';
                                            import { useNavigation } from '@react-navigation/native';
                                            import { useWorkout } from '../contexts/WorkoutContext';

                                            const TemplateScreen = ({ route }) => {
                                            const { setWorkout } = useWorkout();
                                            const [templates, setTemplates] = useState([]);
                                            const [selectedTemplate, setSelectedTemplate] = useState(null);
                                            const navigation = useNavigation();

                                            useEffect(() => {
                                            fetchTemplates();
                                            }, []);

                                            const fetchTemplates = async () => {
                                            if (!firebase_auth.currentUser) return;

                                            try {
                                            const userId = firebase_auth.currentUser.uid;
                                            const templateRef = collection(db, "userProfiles", userId, "templates");
                                            const querySnapshot = await getDocs(templateRef);
                                            const templatesList = querySnapshot.docs.map(doc => {
                                            const data = doc.data();
                                            console.log('Fetched Template Data:', JSON.stringify(data, null, 2));
                                            return { id: doc.id, ...data };
                                            });

                                            setTemplates(templatesList);
                                            } catch (error) {
                                            console.error('Error fetching templates:', error);
                                            }
                                            };

                                            const handleLoadTemplate = () => {
                                            if (selectedTemplate) {
                                            console.log('Selected Template:', JSON.stringify(selectedTemplate, null, 2));

                                            if (selectedTemplate.exercises) {
                                            console.log('Exercises:', JSON.stringify(selectedTemplate.exercises, null, 2));
                                            } else {
                                            console.log('No exercises found in the selected template');
                                            }

                                            setWorkout({ exercises: selectedTemplate.exercises });
                                            navigation.navigate('WorkoutLog', { template: selectedTemplate });
                                            } else {
                                            console.log('No template selected');
                                            }
                                            };

                                            const renderSupersets = (supersets) => {
                                            if (Array.isArray(supersets)) {
                                            return supersets.map((superset, supersetIndex) => (
                                            <Text key={supersetIndex} style={styles.supersetItemText}>
                                                {superset.name} - Sets: {superset.setsCount}
                                            </Text>
                                            ));
                                            } else if (typeof supersets === 'object') {
                                            return (
                                            <Text style={styles.supersetItemText}>
                                                {supersets.name} - Sets: {supersets.setsCount}
                                            </Text>
                                            );
                                            } else {
                                            return null;
                                            }
                                            };

                                            return (
                                            <View style={styles.container}>
                                                <View style={styles.content}>
                                                    <Text style={styles.title}>Select a Template</Text>
                                                    <FlatList
                                                        data={templates}
                                                        keyExtractor={item => item.id}
                                                        renderItem={({ item }) => (
                                                            <TouchableOpacity onPress={() => setSelectedTemplate(item)}>
                                                                <Text style={styles.templateItem}>{item.templateName}</Text>
                                                            </TouchableOpacity>
                                                        )}
                                                    />
                                                    {selectedTemplate && selectedTemplate.exercises && (
                                                        <View style={styles.templatePreview}>
                                                            <Text style={styles.previewTitle}>Template Preview:</Text>
                                                            {selectedTemplate.exercises.map((exercise, index) => (
                                                                <View key={index} style={styles.previewItem}>
                                                                    <Text style={styles.previewItemText}>
                                                                        {exercise.name} - Sets: {exercise.setsCount}
                                                                    </Text>
                                                                    {exercise.supersets && (
                                                                        <View style={styles.supersetContainer}>
                                                                            <Text style={styles.supersetTitle}>Supersets:</Text>
                                                                            {renderSupersets(exercise.supersets)}
                                                                        </View>
                                                                    )}
                                                                </View>
                                                            ))}
                                                        </View>
                                                    )}
                                                    <Button title="Load Template" onPress={handleLoadTemplate} />
                                                    <Button title="Start New Workout" onPress={() => navigation.navigate('WorkoutLog')} />
                                                    <Button title="Cancel" onPress={() => navigation.goBack()} />
                                                </View>
                                            </View>
                                            );
                                            };

                                            const styles = StyleSheet.create({
                                            container: {
                                            flex: 1,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                            },
                                            content: {
                                            backgroundColor: 'white',
                                            padding: 20,
                                            borderRadius: 10,
                                            alignItems: 'center',
                                            },
                                            title: {
                                            fontSize: 20,
                                            marginBottom: 10,
                                            },
                                            templateItem: {
                                            fontSize: 16,
                                            padding: 10,
                                            borderBottomWidth: 1,
                                            borderBottomColor: '#ccc',
                                            },
                                            templatePreview: {
                                            marginTop: 20,
                                            },
                                            previewTitle: {
                                            fontSize: 18,
                                            fontWeight: 'bold',
                                            },
                                            previewItem: {
                                            marginTop: 10,
                                            },
                                            previewItemText: {
                                            fontSize: 16,
                                            },
                                            supersetContainer: {
                                            marginTop: 10,
                                            paddingLeft: 10,
                                            borderLeftWidth: 2,
                                            borderLeftColor: '#ccc',
                                            },
                                            supersetTitle: {
                                            fontSize: 14,
                                            fontWeight: 'bold',
                                            },
                                            supersetItemText: {
                                            fontSize: 14,
                                            },
                                            });

                                            export default TemplateScreen;
                                            Explanation
                                            Logging Enhancements: Added detailed logging for selectedTemplate and selectedTemplate.exercises to verify their structure.
                                            Render Supersets: Adjusted the renderSupersets function to handle both arrays and objects since the supersets can be either.
                                            Component Update: Updated the TemplateScreen component to render the supersets correctly based on their structure.
                                            With these adjustments, your template preview should display the exercises and supersets correctly if they are present in the selectedTemplate. If the structure is still incorrect, the detailed logging will help identify the exact issue.
                                            I think I'll stick with the array configuration, and change my firebase structure to fit with the array to map config

                                            ChatGPT
                                            Great! Adjusting the Firebase structure to fit the array configuration will help maintain consistency in your code. Below is the updated code for your TemplateScreen component that works with arrays for both exercises and supersets:

                                            TemplateScreen Component
                                            javascript
                                            Copy code
                                            import React, { useState, useEffect } from 'react';
                                            import { View, Text, Button, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
                                            import { db, firebase_auth } from '../../firebaseConfig';
                                            import { collection, getDocs } from 'firebase/firestore';
                                            import { useNavigation } from '@react-navigation/native';
                                            import { useWorkout } from '../contexts/WorkoutContext';

                                            const TemplateScreen = ({ route }) => {
                                            const { setWorkout } = useWorkout();
                                            const [templates, setTemplates] = useState([]);
                                            const [selectedTemplate, setSelectedTemplate] = useState(null);
                                            const navigation = useNavigation();

                                            useEffect(() => {
                                            fetchTemplates();
                                            }, []);

                                            const fetchTemplates = async () => {
                                            if (!firebase_auth.currentUser) return;

                                            try {
                                            const userId = firebase_auth.currentUser.uid;
                                            const templateRef = collection(db, "userProfiles", userId, "templates");
                                            const querySnapshot = await getDocs(templateRef);
                                            const templatesList = querySnapshot.docs.map(doc => {
                                            const data = doc.data();
                                            console.log('Fetched Template Data:', JSON.stringify(data, null, 2));
                                            return { id: doc.id, ...data };
                                            });

                                            setTemplates(templatesList);
                                            } catch (error) {
                                            console.error('Error fetching templates:', error);
                                            }
                                            };

                                            const handleLoadTemplate = () => {
                                            if (selectedTemplate) {
                                            console.log('Selected Template:', JSON.stringify(selectedTemplate, null, 2));

                                            if (selectedTemplate.exercises) {
                                            console.log('Exercises:', JSON.stringify(selectedTemplate.exercises, null, 2));
                                            } else {
                                            console.log('No exercises found in the selected template');
                                            }

                                            setWorkout({ exercises: selectedTemplate.exercises });
                                            navigation.navigate('WorkoutLog', { template: selectedTemplate });
                                            } else {
                                            console.log('No template selected');
                                            }
                                            };

                                            return (
                                            <View style={styles.container}>
                                                <View style={styles.content}>
                                                    <Text style={styles.title}>Select a Template</Text>
                                                    <FlatList
                                                        data={templates}
                                                        keyExtractor={item => item.id}
                                                        renderItem={({ item }) => (
                                                            <TouchableOpacity onPress={() => setSelectedTemplate(item)}>
                                                                <Text style={styles.templateItem}>{item.templateName}</Text>
                                                            </TouchableOpacity>
                                                        )}
                                                    />
                                                    {selectedTemplate && selectedTemplate.exercises && (
                                                        <View style={styles.templatePreview}>
                                                            <Text style={styles.previewTitle}>Template Preview:</Text>
                                                            {selectedTemplate.exercises.map((exercise, index) => (
                                                                <View key={index} style={styles.previewItem}>
                                                                    <Text style={styles.previewItemText}>
                                                                        {exercise.name} - Sets: {exercise.setsCount}
                                                                    </Text>
                                                                    {exercise.supersets && exercise.supersets.length > 0 && (
                                                                        <View style={styles.supersetContainer}>
                                                                            <Text style={styles.supersetTitle}>Supersets:</Text>
                                                                            {exercise.supersets.map((superset, supersetIndex) => (
                                                                                <Text key={supersetIndex} style={styles.supersetItemText}>
                                                                                    {superset.name} - Sets: {superset.setsCount}
                                                                                </Text>
                                                                            ))}
                                                                        </View>
                                                                    )}
                                                                </View>
                                                            ))}
                                                        </View>
                                                    )}
                                                    <Button title="Load Template" onPress={handleLoadTemplate} />
                                                    <Button title="Start New Workout" onPress={() => navigation.navigate('WorkoutLog')} />
                                                    <Button title="Cancel" onPress={() => navigation.goBack()} />
                                                </View>
                                            </View>
                                            );
                                            };

                                            const styles = StyleSheet.create({
                                            container: {
                                            flex: 1,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                            },
                                            content: {
                                            backgroundColor: 'white',
                                            padding: 20,
                                            borderRadius: 10,
                                            alignItems: 'center',
                                            },
                                            title: {
                                            fontSize: 20,
                                            marginBottom: 10,
                                            },
                                            templateItem: {
                                            fontSize: 16,
                                            padding: 10,
                                            borderBottomWidth: 1,
                                            borderBottomColor: '#ccc',
                                            },
                                            templatePreview: {
                                            marginTop: 20,
                                            },
                                            previewTitle: {
                                            fontSize: 18,
                                            fontWeight: 'bold',
                                            },
                                            previewItem: {
                                            marginTop: 10,
                                            },
                                            previewItemText: {
                                            fontSize: 16,
                                            },
                                            supersetContainer: {
                                            marginTop: 10,
                                            paddingLeft: 10,
                                            borderLeftWidth: 2,
                                            borderLeftColor: '#ccc',
                                            },
                                            supersetTitle: {
                                            fontSize: 14,
                                            fontWeight: 'bold',
                                            },
                                            supersetItemText: {
                                            fontSize: 14,
                                            },
                                            });

                                            export default TemplateScreen;
                                            Explanation
                                            Array Configuration: Ensure your Firebase structure uses arrays for both exercises and supersets.
                                            Component Update: The renderSupersets function has been removed, and now the supersets are directly rendered using .map() method, assuming the supersets are stored as an array.
                                            Update Firebase Structure
                                            Ensure your Firebase documents look like this:

                                            json
                                            Copy code
                                            {
                                            "templateName": "Pull Day",
                                            "exercises": [
                                            {
                                            "id": "pullUp",
                                            "name": "Pull Up",
                                            "repsConfig": "reps",
                                            "setsCount": 1,
                                            "weightConfig": "bodyWeight",
                                            "supersets": [
                                            {
                                            "id": "pushUp",
                                            "name": "Push Up",
                                            "repsConfig": "reps",
                                            "setsCount": 1,
                                            "weightConfig": "bodyWeight"
                                            }
                                            ]
                                            },
                                            {
                                            "id": "benchPress",
                                            "name": "Bench Press",
                                            "repsConfig": "reps",
                                            "setsCount": 2,
                                            "weightConfig": "weightPerSideBarbell",
                                            "supersets": []
                                            }
                                            ],
                                            "createdAt": {
                                            "seconds": 1717192493,
                                            "nanoseconds": 425000000
                                            }
                                            }
                                            With these adjustments, your template preview should display the exercises and supersets correctly if they are present in the selectedTemplate. This structure assumes that supersets are always arrays, even if they are empty.
                                            Fetched Template Data: {
                                            "templateName": "Pull Day",
                                            "exercises": [
                                            {
                                            "supersets": [
                                            {
                                            "name": "Push Up",
                                            "weightConfig": "bodyWeight",
                                            "repsConfig": "reps",
                                            "id": "pushUp",
                                            "setsCount": 1
                                            }
                                            ],
                                            "weightConfig": "bodyWeight",
                                            "setsCount": 1,
                                            "id": "pullUp",
                                            "repsConfig": "reps",
                                            "name": "Pull Up"
                                            },
                                            {
                                            "id": "benchPress",
                                            "setsCount": 2,
                                            "name": "Bench Press",
                                            "weightConfig": "weightPerSideBarbell",
                                            "repsConfig": "reps"
                                            }
                                            ],
                                            "createdAt": {
                                            "seconds": 1717192493,
                                            "nanoseconds": 425000000
                                            }
                                            }

                                            is this the proper configuration? My preview still doesn't show

                                            ChatGPT
                                            The fetched template data you provided looks correctly structured. Given this structure, your TemplateScreen component should be able to render the preview. Let's add some additional logging to verify that the selectedTemplate is being set correctly and make sure the useEffect and state updates are functioning properly. Here's the updated TemplateScreen component with additional logging and checks:

                                            TemplateScreen Component
                                            javascript
                                            Copy code
                                            import React, { useState, useEffect } from 'react';
                                            import { View, Text, Button, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
                                            import { db, firebase_auth } from '../../firebaseConfig';
                                            import { collection, getDocs } from 'firebase/firestore';
                                            import { useNavigation } from '@react-navigation/native';
                                            import { useWorkout } from '../contexts/WorkoutContext';

                                            const TemplateScreen = ({ route }) => {
                                            const { setWorkout } = useWorkout();
                                            const [templates, setTemplates] = useState([]);
                                            const [selectedTemplate, setSelectedTemplate] = useState(null);
                                            const navigation = useNavigation();

                                            useEffect(() => {
                                            fetchTemplates();
                                            }, []);

                                            const fetchTemplates = async () => {
                                            if (!firebase_auth.currentUser) return;

                                            try {
                                            const userId = firebase_auth.currentUser.uid;
                                            const templateRef = collection(db, "userProfiles", userId, "templates");
                                            const querySnapshot = await getDocs(templateRef);
                                            const templatesList = querySnapshot.docs.map(doc => {
                                            const data = doc.data();
                                            console.log('Fetched Template Data:', JSON.stringify(data, null, 2));
                                            return { id: doc.id, ...data };
                                            });

                                            setTemplates(templatesList);
                                            } catch (error) {
                                            console.error('Error fetching templates:', error);
                                            }
                                            };

                                            const handleLoadTemplate = () => {
                                            if (selectedTemplate) {
                                            console.log('Selected Template:', JSON.stringify(selectedTemplate, null, 2));

                                            if (selectedTemplate.exercises) {
                                            console.log('Exercises:', JSON.stringify(selectedTemplate.exercises, null, 2));
                                            } else {
                                            console.log('No exercises found in the selected template');
                                            }

                                            setWorkout({ exercises: selectedTemplate.exercises });
                                            navigation.navigate('WorkoutLog', { template: selectedTemplate });
                                            } else {
                                            console.log('No template selected');
                                            }
                                            };

                                            return (
                                            <View style={styles.container}>
                                                <View style={styles.content}>
                                                    <Text style={styles.title}>Select a Template</Text>
                                                    <FlatList
                                                        data={templates}
                                                        keyExtractor={item => item.id}
                                                        renderItem={({ item }) => (
                                                            <TouchableOpacity onPress={() => setSelectedTemplate(item)}>
                                                                <Text style={styles.templateItem}>{item.templateName}</Text>
                                                            </TouchableOpacity>
                                                        )}
                                                    />
                                                    {selectedTemplate && selectedTemplate.exercises && (
                                                        <View style={styles.templatePreview}>
                                                            <Text style={styles.previewTitle}>Template Preview:</Text>
                                                            {selectedTemplate.exercises.map((exercise, index) => (
                                                                <View key={index} style={styles.previewItem}>
                                                                    <Text style={styles.previewItemText}>
                                                                        {exercise.name} - Sets: {exercise.setsCount}
                                                                    </Text>
                                                                    {exercise.supersets && exercise.supersets.length > 0 && (
                                                                        <View style={styles.supersetContainer}>
                                                                            <Text style={styles.supersetTitle}>Supersets:</Text>
                                                                            {exercise.supersets.map((superset, supersetIndex) => (
                                                                                <Text key={supersetIndex} style={styles.supersetItemText}>
                                                                                    {superset.name} - Sets: {superset.setsCount}
                                                                                </Text>
                                                                            ))}
                                                                        </View>
                                                                    )}
                                                                </View>
                                                            ))}
                                                        </View>
                                                    )}


                <Button title="Load Template" onPress={handleLoadTemplate} disabled={!selectedTemplate} />
                <Button title="Start New Workout" onPress={() => navigation.navigate('WorkoutLog')} />
                <Button title="Cancel" onPress={() => navigation.goBack()} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    content: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        width: '80%',
    },
    title: {
        fontSize: 20,
        marginBottom: 10,
    },
    picker: {
        width: '100%',
        marginBottom: 20,
    },
    templatePreview: {
        marginBottom: 20,
        width: '100%',
    },
    previewTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    previewItem: {
        marginBottom: 10,
    },
    previewItemText: {
        fontSize: 16,
    },
    supersetContainer: {
        marginLeft: 10,
        marginTop: 5,
    },
    supersetTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    supersetItemText: {
        fontSize: 14,
        marginTop: 2,
    },
});

export default TemplateScreen;
