// ExercisePickerModal.js
import React, { useState, useEffect } from 'react';
import { View, Text, Modal, FlatList, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';

const ExercisePickerModal = ({ visible, onClose, onSelectExercise }) => {
    const [exerciseList, setExerciseList] = useState([]);
    const [filteredExercises, setFilteredExercises] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

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
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
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
});

export default ExercisePickerModal;