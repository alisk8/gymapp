import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WorkoutContext = createContext();

export const WorkoutProvider = ({ children }) => {
    const [workoutState, setWorkoutState] = useState(null);
    const [isWorkoutLogActive, setIsWorkoutLogActive] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const loadWorkout = async () => {
            try {
                const storedWorkout = await AsyncStorage.getItem('currentWorkout');
                if (storedWorkout) {
                    const parsedWorkout = JSON.parse(storedWorkout);
                    if (parsedWorkout && parsedWorkout.exercises) {
                        setWorkoutState(parsedWorkout);
                    } else {
                        setWorkoutState({ exercises: [] });
                    }
                }
            } catch (error) {
                console.error('Failed to load workout from storage:', error);
            } finally {
                setIsLoaded(true);
            }
        };

        loadWorkout();
    }, []);

    useEffect(() => {
        if (isLoaded) {
            const saveWorkout = async () => {
                try {
                    if (workoutState.exercises.length > 0) {
                        await AsyncStorage.setItem('currentWorkout', JSON.stringify(workoutState));
                        console.log('outside the screen', JSON.stringify(workoutState));
                    } else {
                        await AsyncStorage.removeItem('currentWorkout');
                    }
                } catch (error) {
                    console.error('Failed to save workout to storage:', error);
                }
            };

            saveWorkout();
        }
    }, [workoutState, isLoaded]);

    const resetWorkout = async () => {
        try {
            await AsyncStorage.removeItem('currentWorkout');
            setWorkoutState(null);
            console.log('called here');
        } catch (error) {
            console.error('Failed to reset workout:', error);
        }
    };

    const startWorkoutLog = () => setIsWorkoutLogActive(true);
    const stopWorkoutLog = () => setIsWorkoutLogActive(false);

    return (
        <WorkoutContext.Provider value={{ workoutState, setWorkoutState, resetWorkout, isWorkoutLogActive, startWorkoutLog, stopWorkoutLog }}>
            {children}
        </WorkoutContext.Provider>
    );
};

export const useWorkout = () => useContext(WorkoutContext);
