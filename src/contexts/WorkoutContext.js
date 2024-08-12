import React, {createContext, useState, useContext, useEffect, useCallback} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useFocusEffect} from "@react-navigation/native";

const WorkoutContext = createContext();

export const WorkoutProvider = ({ children }) => {
    const [workoutState, setWorkoutState] = useState(null);
    const [isWorkoutLogActive, setIsWorkoutLogActive] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [startTime, setStartTime] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [workoutFinished, setWorkoutFinished] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [pausedTime, setPausedTime] = useState(0);  // Total time the workout has been paused
    const [pauseStart, setPauseStart] = useState(null);  // The time when the pause started
    const [loadedFromTemplate, setLoadedFromTemplate] = ('');


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
                const storedStartTime = await AsyncStorage.getItem('startTime');
                if (storedStartTime) {
                    setStartTime(new Date(parseInt(storedStartTime, 10)));
                }
                const storedElapsedTime = await AsyncStorage.getItem('elapsedTime');
                if (storedElapsedTime) {
                    setElapsedTime(parseInt(storedElapsedTime, 10));
                    console.log('IM HEREER');
                }
                const storedWorkoutFinished = await AsyncStorage.getItem('workoutFinished');
                if (storedWorkoutFinished) {
                    setWorkoutFinished(storedWorkoutFinished === 'true');
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
        let timer;
        if (startTime && !isPaused) {
            timer = setInterval(() => {
                const currentTime = new Date();
                const updatedElapsedTime = Math.floor((currentTime - startTime - pausedTime) / 1000); // Subtract paused time
                setElapsedTime(updatedElapsedTime);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [startTime, isPaused, pausedTime]);


    useEffect(() => {
        if (isLoaded) {
            const saveWorkout = async () => {
                try {
                    if (workoutState.exercises.length > 0) {
                        await AsyncStorage.setItem('currentWorkout', JSON.stringify(workoutState));
                    } else {
                        await AsyncStorage.removeItem('currentWorkout');
                    }
                    if (startTime) {
                        await AsyncStorage.setItem('startTime', startTime.getTime().toString());
                    } else {
                        await AsyncStorage.removeItem('startTime');
                    }
                } catch (error) {
                    console.error('Failed to save workout to storage:', error);
                }
            };

            saveWorkout();
        }
    }, [workoutState, isLoaded, startTime, elapsedTime]);

    const resetWorkout = async () => {
        try {
            await AsyncStorage.removeItem('currentWorkout');
            await AsyncStorage.removeItem('startTime');
            await AsyncStorage.removeItem('elapsedTime');
            setWorkoutState(null);
            setStartTime(null);
            setElapsedTime(0);
            setWorkoutFinished(false);
            console.log('called here');
        } catch (error) {
            console.error('Failed to reset workout:', error);
        }
    };

    const startWorkoutLog = () => {
        setIsWorkoutLogActive(true);
        if (!startTime) {
            setStartTime(new Date());
        }
        setWorkoutFinished(false);
    };

    const pauseWorkout = () => {
        if (!isPaused) {
            setIsPaused(true);
            setPauseStart(new Date());  // Record the time when the pause started
        }
    };

    const resumeWorkout = () => {
        if (isPaused) {
            const now = new Date();
            const pausedDuration = now - pauseStart;  // Calculate how long the workout was paused
            setPausedTime(pausedTime + pausedDuration);  // Add this duration to the total paused time
            setIsPaused(false);
        }
    };

    const stopWorkoutLog = () => setIsWorkoutLogActive(false);

    const finishWorkout = () => {setWorkoutFinished(true);
                                        console.log('workout finished state', workoutFinished)};


    return (
        <WorkoutContext.Provider value={{ workoutState, isPaused, setWorkoutState, resetWorkout, isWorkoutLogActive, startWorkoutLog, stopWorkoutLog,  startTime, setStartTime, elapsedTime, setElapsedTime, workoutFinished, finishWorkout, pauseWorkout, resumeWorkout, loadedFromTemplate}}>
            {children}
        </WorkoutContext.Provider>
    );
};

export const useWorkout = () => useContext(WorkoutContext);
