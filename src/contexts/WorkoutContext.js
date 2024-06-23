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
