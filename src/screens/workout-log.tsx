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
    FlatList
} from 'react-native';
import { db, firebase_auth } from '../../firebaseConfig';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { FontAwesome5 } from '@expo/vector-icons';
import { commonExercises } from '../../exercisesList';
import { Checkbox } from 'react-native-paper';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';

export default function WorkoutLogScreen({ onClose }) {
    const [exercises, setExercises] = useState([
        { id: 'bicepCurls', name: 'Bicep Curls', sets: [{ key: 'set1', weight: '', reps: '' }], weightUnit: 'lbs', supersets: [] }
    ]);
    const [suggestions, setSuggestions] = useState([]);
    const [userExercises, setUserExercises] = useState([]);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(null);
    const [currentSupersetIndex, setCurrentSupersetIndex] = useState(null);
    const [isTemplate, setIsTemplate] = useState(false);
    const [templateName, setTemplateName] = useState('');

    useEffect(() => {
        fetchUserExercises();
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
            setSuggestions([]);
        });

        return () => {
            keyboardDidHideListener.remove();
        };
    }, []);

    const fetchUserExercises = async () => {
        if (!firebase_auth.currentUser) return;

        const userId = firebase_auth.currentUser.uid;
        const userExercisesRef = collection(db, "userProfiles", userId, "exercises");
        const querySnapshot = await getDocs(userExercisesRef);
        const exercises = querySnapshot.docs.map(doc => doc.data().name);
        setUserExercises(exercises);
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
            weightUnit: 'lbs'
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
            supersets: []
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

    const renderSets = (sets, exerciseIndex, supersetIndex = null) => (
        sets.map((set, setIndex) => (
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
                            placeholder="Weight"
                            keyboardType="numeric"
                            style={styles.weightInput}
                            onChangeText={(text) => updateSetData(text, exerciseIndex, setIndex, 'weight', supersetIndex)}
                            value={set.weight}
                        />
                        <TextInput
                            placeholder="Reps"
                            keyboardType="numeric"
                            style={styles.repsInput}
                            onChangeText={(text) => updateSetData(text, exerciseIndex, setIndex, 'reps', supersetIndex)}
                            value={set.reps}
                        />
                    </View>
                </Swipeable>
            </GestureHandlerRootView>
        ))
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
                        Keyboard.dismiss(); // Dismiss the keyboard
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
        console.log(`Selected suggestion: ${suggestion} for exercise index: ${exerciseIndex}`);
        const newExercises = [...exercises];
        newExercises[exerciseIndex].name = suggestion;
        setExercises(newExercises);
        setSuggestions([]);
        setCurrentExerciseIndex(null);
    };

    const handleSupersetSuggestionSelect = (suggestion, exerciseIndex, supersetIndex) => {
        console.log(`Selected suggestion: ${suggestion} for superset index: ${supersetIndex}`);
        const newExercises = [...exercises];
        newExercises[exerciseIndex].supersets[supersetIndex].name = suggestion;
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
            sets: ex.sets.filter(set => set.weight !== '' && set.reps !== '').map(set => ({
                ...set,
                weight: `${set.weight} ${ex.weightUnit}`
            })),
            supersets: ex.supersets.map(superset => ({
                id: camelCase(superset.name),
                name: superset.name,
                sets: superset.sets.filter(set => set.weight !== '' && set.reps !== '').map(set => ({
                    ...set,
                    weight: `${set.weight} ${superset.weightUnit}`
                }))
            })).filter(superset => superset.sets.length > 0)
        })).filter(ex => ex.sets.length > 0 || ex.supersets.length > 0);

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
                        weightUnit: superset.weightUnit
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
                style={{ position: 'absolute', top: 2, right: 10 }}
            />
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

    return (
        <View style={styles.fullScreenContainer}>
            <View style={styles.modalHeader}>
                <Text style={styles.headerText}>Workout Log</Text>
                <TouchableOpacity onPress={onClose} style={styles.hideButton}>
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
            <FlatList
                data={exercises}
                renderItem={renderExerciseItem}
                keyExtractor={(item) => item.id}
                ListFooterComponent={() => (
                    <View>
                        <Button title="Add Exercise" onPress={addExercise} />
                        <Button title="Save Workouts" onPress={() => saveWorkouts(isTemplate)} />
                    </View>
                )}
                keyboardShouldPersistTaps="handled"
                style={{ zIndex: 1 }}
                nestedScrollEnabled={true}
            />
        </View>
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
    },
    exerciseContainer: {
        marginBottom: 20,
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 5,
        position: 'relative',
        borderWidth: 1,
        borderColor: '#ccc',
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
        borderLeftWidth: 2,
        borderLeftColor: '#ccc',
        paddingLeft: 10,
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
});










































