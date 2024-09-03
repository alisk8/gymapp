// src/components/CustomTabBar.js

import React, {useState} from 'react';
import {View, TouchableOpacity, Text, StyleSheet} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useWorkout } from '../contexts/WorkoutContext';



const CustomTabBar = ({ state, descriptors, navigation }) => {
    const nav = useNavigation();
    const { workoutState, isPaused } = useWorkout();

    const handleOpenWorkoutLog = () => {
        if (isPaused) {
            nav.navigate('WorkoutSummaryScreen', { previousScreen: nav.getCurrentRoute().name });
        } else if (workoutState) {
            nav.navigate('WorkoutLog', { previousScreen: nav.getCurrentRoute().name });
        } else {
            nav.navigate('TemplateScreen', { previousScreen: nav.getCurrentRoute().name });
        }
    };

    // Calculate the middle index to insert the workout log button
    const middleIndex = Math.floor(state.routes.length / 2);

    return (
        <View style={styles.tabBarStyle}>
            {state.routes.map((route, index) => {
                // Before inserting the workout log button
                if (index === middleIndex) {
                    return (
                        <React.Fragment key="workout-log">
                            {/* Render the first half of the tabs */}
                                {state.routes.slice(0, middleIndex).map((route, idx) => {
                                    const { options } = descriptors[route.key];
                                    const isFocused = state.index === idx;

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
                                        case 'FeedStack':
                                            iconName = 'list-outline';
                                            break;
                                        case 'ExploreScreen':
                                            iconName = 'compass-outline';
                                            break;
                                        case 'ProgressStack':
                                            iconName = 'bar-chart-outline';
                                            break;
                                        case 'AccountStack':
                                            iconName = 'person-outline';
                                            break;
                                        case 'CommunitiesStack':
                                            iconName = 'people-outline';
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
                                            style={styles.tabBarLabelStyle}
                                        >
                                            <Ionicons
                                                name={iconName}
                                                size={24}
                                                color={isFocused ? styles.tabBarActiveTintColor : styles.tabBarInactiveTintColor}
                                            />
                                            <Text style={{ color: isFocused ? styles.tabBarActiveTintColor : styles.tabBarInactiveTintColor, fontSize: 14 }}>
                                                {options.title || route.name}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}

                            {/* Workout Log Button in the Middle */}
                            <TouchableOpacity
                                onPress={handleOpenWorkoutLog}
                                style={styles.workoutLogButtonContainer}
                            >
                                <Ionicons name="barbell-outline" size={24} color={workoutState ? styles.tabBarActiveTintColor : styles.tabBarInactiveTintColor} />
                                <Text style={{ color: workoutState ? styles.tabBarActiveTintColor : styles.tabBarInactiveTintColor }}>Workout</Text>
                            </TouchableOpacity>

                            {/* Render the second half of the tabs */}
                                {state.routes.slice(middleIndex).map((route, idx) => {
                                    const { options } = descriptors[route.key];
                                    const isFocused = state.index === middleIndex + idx;

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
                                        case 'FeedStack':
                                            iconName = 'list-outline';
                                            break;
                                        case 'ExploreScreen':
                                            iconName = 'compass-outline';
                                            break;
                                        case 'ProgressStack':
                                            iconName = 'bar-chart-outline';
                                            break;
                                        case 'AccountStack':
                                            iconName = 'person-outline';
                                            break;
                                        case 'CommunitiesStack':
                                            iconName = 'people-outline';
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
                                            style={styles.tabBarLabelStyle}
                                        >
                                            <Ionicons
                                                name={iconName}
                                                size={24}
                                                color={isFocused ? styles.tabBarActiveTintColor : styles.tabBarInactiveTintColor}
                                            />
                                            <Text style={{ color: isFocused ? styles.tabBarActiveTintColor : styles.tabBarInactiveTintColor }}>
                                                {options.title || route.name}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                        </React.Fragment>
                    );
                }
                return null;
            })}
        </View>
    );
};


const styles = StyleSheet.create({
    tabBarStyle: {
        backgroundColor: '#ffffff',
        borderTopWidth: 0,
        elevation: 0,
        height: 60,
        width: '100%',
        paddingBottom: 10,
        paddingTop: 5,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabBarLabelStyle: {
        fontSize: 10,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    tabItemsContainerLeft: {
        flex:0.9,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    tabItemsContainerRight: {
        flex:1.1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    workoutLogButtonContainer: {
        fontSize: 10,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 5,
    },
    tabBarActiveTintColor: '#007BFF',
    tabBarInactiveTintColor: '#8e8e93',
});


export default CustomTabBar;

