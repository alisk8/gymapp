// src/components/CustomTabBar.js

import React, {useState} from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useWorkout } from '../contexts/WorkoutContext';



const CustomTabBar = ({ state, descriptors, navigation }) => {
    const nav = useNavigation();
    const { workoutState, isWorkoutLogActive, isPaused} = useWorkout();

    const handleOpenWorkoutLog = () => {
        if(isPaused){
            nav.navigate('WorkoutSummaryScreen',{ previousScreen: nav.getCurrentRoute().name} )
        }
        else if (workoutState) {
            nav.navigate('WorkoutLog', { previousScreen: nav.getCurrentRoute().name });
        } else {
            nav.navigate('TemplateScreen', { previousScreen: nav.getCurrentRoute().name });
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
                <Ionicons name="barbell-outline" size={24} color={workoutState ? 'blue' : 'black'} />
                <Text style={workoutState ? {color: 'blue'} : {color: 'black'}}>Workout Log</Text>
            </TouchableOpacity>
        </View>
    );
};

export default CustomTabBar;

