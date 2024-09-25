// ExercisePickerModal.js
import React, { useState, useEffect } from 'react';
import {View, Text, Modal, FlatList, TextInput, TouchableOpacity, StyleSheet, Alert} from 'react-native';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import DropdownPicker from 'react-native-dropdown-picker';
import {addDoc} from "@firebase/firestore";

const ExercisePickerModal = ({ visible, onClose, onSelectExercise, onCustomExercise}) => {
    const [exerciseList, setExerciseList] = useState([]);
    const [filteredExercises, setFilteredExercises] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [createExerciseModalVisible, setCreateExerciseModalVisible] = useState(false);
    const [newExerciseName, setNewExerciseName] = useState('');
    const [repsType, setRepsType] = useState('Reps');
    const [weightConfig, setWeightConfig] = useState('Weight');
    const [openRepsType, setOpenRepsType] = useState(false); // For repsType dropdown
    const [openWeightConfig, setOpenWeightConfig] = useState(false); // For weightConfig dropdown
    const [createLoading, setCreateLoading] = useState(false);

    const handleCreateExercise = async () => {
        if (!newExerciseName.trim()) {
            alert("Exercise name can't be empty");
            return;
        }

        try {
            const customExercise = {
                name: newExerciseName,
                repsConfig: repsType,
                weightConfig: weightConfig,
                musclesWorked: [],
            }

            setCreateLoading(true);
            await addDoc(collection(db, 'exercisePresets'), customExercise);

            setExerciseList([...exerciseList, newExerciseName]); // Add to local list
            setCreateExerciseModalVisible(false);
            setNewExerciseName('');
            setRepsType('Reps');
            setWeightConfig('Weight');
            onCustomExercise(customExercise);
            Alert.alert('Exercise Added!');
        } catch (error) {
            console.error("Error adding custom exercise: ", error);
        }
        setCreateLoading(false);
    };

    useEffect(() => {
        const fetchExercises = async () => {
            const querySnapshot = await getDocs(collection(db, 'exercisePresets'));
            const exercises = querySnapshot.docs.map(doc => doc.data().name);
            setExerciseList(exercises);
            setFilteredExercises(exercises);
        };

        if (visible) {
            fetchExercises();
        }
    }, [visible]);

    useEffect(() => {
        const filtered = exerciseList.filter(exercise =>
            exercise.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredExercises(filtered);
    }, [searchQuery, exerciseList]);

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            {!createExerciseModalVisible && <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <View style={{alignItems: 'flex-end', paddingBottom: 15,}}>
                    <TouchableOpacity onPress={() => setCreateExerciseModalVisible(true)}>
                        <Text style={styles.createButtonText}>Custom...</Text>
                    </TouchableOpacity>
                    </View>
                    <TextInput
                        style={styles.searchBar}
                        placeholder="Search exercises..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    <FlatList
                        data={filteredExercises}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity onPress={() => onSelectExercise(item)}>
                                <Text style={styles.exerciseItem}>{item}</Text>
                            </TouchableOpacity>
                        )}
                    />
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>}

            <Modal
                animationType="slide"
                transparent={true}
                visible={createExerciseModalVisible}
                onRequestClose={() => setCreateExerciseModalVisible(false)}
            >
                <View style={styles.createModalContainer}>
                    <View style={styles.createModalContent}>
                        <Text style={styles.modalTitle}>Create Custom Exercise</Text>

                        {/* Exercise Name Input */}
                        <TextInput
                            style={styles.textInput}
                            placeholder="Exercise Name"
                            value={newExerciseName}
                            onChangeText={setNewExerciseName}
                        />

                        {/* Reps Type Dropdown */}
                        <Text style={styles.pickerLabel}>Reps Type:</Text>
                        <DropdownPicker
                            open={openRepsType}
                            value={repsType}
                            items={[
                                { label: 'Reps', value: 'Reps' },
                                { label: 'Hold', value: 'Hold' },
                                { label: 'Cardio', value: 'Cardio' },
                            ]}
                            setOpen={setOpenRepsType}
                            setValue={setRepsType}
                            style={styles.dropdown}
                            containerStyle={{ zIndex: 3000, elevation: 3 }} // Ensure it has a high zIndex
                            dropDownContainerStyle={{ zIndex: 3000 }}
                        />

                        {/* Weight Config Dropdown */}
                        <Text style={styles.pickerLabel}>Weight Config:</Text>
                        <DropdownPicker
                            open={openWeightConfig}
                            value={weightConfig}
                            items={[
                                { label: 'Weight Exercise', value: 'Weight' },
                                { label: 'Bodyweight Exercise', value: 'Bodyweight' },
                                { label: 'Weighted Bodyweight Exercise', value: 'Weighted' },
                            ]}
                            setOpen={setOpenWeightConfig}
                            setValue={setWeightConfig}
                            style={styles.dropdown}
                            containerStyle={{ zIndex: 2000, elevation: 2 }} // Ensure it has a high zIndex
                            dropDownContainerStyle={{ zIndex: 2000 }}
                        />

                        {/* Buttons */}
                        <TouchableOpacity style={styles.saveButton} onPress={handleCreateExercise} disabled={createLoading}>
                            <Text style={styles.saveButtonText}>Create</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelButton} onPress={() => setCreateExerciseModalVisible(false)}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
        width: '80%',
        maxHeight: '80%',
    },
    searchBar: {
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        padding: 10,
        marginBottom: 10,
    },
    exerciseItem: {
        padding: 15,
        borderBottomColor: '#ccc',
        borderBottomWidth: 1,
    },
    closeButton: {
        marginTop: 10,
        padding: 10,
        backgroundColor: '#016e03',
        borderRadius: 5,
    },
    closeButtonText: {
        color: 'white',
        textAlign: 'center',
    },
    createButton: {
        marginTop: 10,
        padding: 10,
        backgroundColor: '#0066CC',
        borderRadius: 5,
    },
    createButtonText: {
        color: '#016e03',
        textAlign: 'center',
        fontSize: 15,
    },
    createModalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    createModalContent: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        width: '80%',
    },
    modalTitle: {
        fontSize: 20,
        marginBottom: 20,
        textAlign: 'center',
    },
    textInput: {
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        padding: 10,
        marginBottom: 10,
    },
    pickerLabel: {
        marginBottom: 5,
        fontWeight: 'bold',
    },
    dropdown: {
        marginBottom: 20,
        borderColor: '#ccc',
        zIndex: 2000,
    },
    saveButton: {
        marginTop: 10,
        padding: 10,
        backgroundColor: '#016e03',
        borderRadius: 5,
    },
    saveButtonText: {
        color: 'white',
        textAlign: 'center',
    },
    cancelButton: {
        marginTop: 10,
        padding: 10,
        backgroundColor: '#FF0000',
        borderRadius: 5,
    },
    cancelButtonText: {
        color: 'white',
        textAlign: 'center',
    },
});

export default ExercisePickerModal;