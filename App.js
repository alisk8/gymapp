import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';
import { firebase_auth } from './firebaseConfig'; // Update this path as necessary
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { WorkoutProvider } from './src/contexts/WorkoutContext';

// Import screens
import Account from './src/screens/Account';
import Progress from './src/screens/ProgressLog/Progress';
import Notifications from './src/screens/Notifications';
import PersonalDetails from './src/screens/PersonalDetails';
import WorkoutLogScreen from './src/screens/WorkoutLog/workout-log';
import SaveGymHighlightScreen from "./src/screens/Feed/save-gym-highlight";
import CustomTabBar from "./src/components/CustomTabBar";
import FeedPage from "./src/screens/Feed/FeedPage";
import TemplateScreen from "./src/screens/WorkoutLog/TemplateScreen";
import Communities from './src/screens/Community/CommunityFeed';
import NewCommunity from './src/screens/new-community';
import WorkoutSummaryScreen from './src/screens/WorkoutLog/WorkoutSummary';
import communityLandingPage from './src/screens/Community/CommunityLandingPage';
import CommunityPostScreen from "./src/screens/Community/CommunityPost";
import CreateEventScreen from "./src/screens/Community/CreateEventScreen";
import EventDetailScreen from './src/screens/Community/EventDetailScreen';
import UserDetails from './src/screens/UserDetails';
import Settings from './src/screens/Settings';
import UserList from './src/screens/UserList';
import PostDetails from './src/screens/PostDetails';
import TrackedExercise from './src/screens/TrackedExercise';
import Saved from './src/screens/Saved';
import Messages from './src/screens/Messages';
import UserDMs from './src/screens/UserDMs';
import TemplateRecords from "./src/screens/ProgressLog/TemplateRecords";
import ProgressTopTabs from "./src/screens/ProgressLog/ProgressTopTabs";
import EditTemplateScreen from "./src/screens/ProgressLog/EditTemplateScreen";
import Comments from './src/screens/Feed/Comments';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const screenOptions = ({ navigation, iconType }) => ({
    headerRight: () => {
        let icon = null;
        let onPress = null;

        if (iconType === 'notifications') {
            icon = <Ionicons name="notifications-outline" size={24} color="black" />;
            onPress = () => navigation.navigate('Notifications');
        } else if (iconType === 'newCommunity') {
            icon = <Ionicons name="add-circle-outline" size={24} color="black" />;
            onPress = () => navigation.navigate('NewCommunity');
        } else if (iconType === 'CreateOutline') {
            icon = <Ionicons name="create-outline" size={24} color="black" />;
            onPress = () => navigation.navigate('SaveGymHighlightScreen');
        }else if (iconType === 'addEntry') {
            icon = <Ionicons name="add-outline" size={24} color="black" />;
            onPress = () => navigation.navigate('AddExerciseEntry'); // Example navigation action
        }

        return (
            <TouchableOpacity onPress={onPress} style={{ marginRight: 15 }}>
                {icon}
            </TouchableOpacity>
        );
    },
    headerStyle: {
        paddingTop: 20,
        height: 80,
    },
});

function AccountStack() {
    return (
        <Stack.Navigator initialRouteName='Account'>
            <Stack.Screen name='Account' component={Account} options={screenOptions} />
            <Stack.Screen name='Notifications' component={Notifications} />
            <Stack.Screen name='Settings' component={Settings} />
            <Stack.Screen name='UserList' component={UserList} />
            <Stack.Screen name='UserDetails' component={UserDetails} />
            <Stack.Screen options={{ title: "Personal Details" }} name='PersonalDetails' component={PersonalDetails} />
            <Stack.Screen name="PostDetails" component={PostDetails} />
            <Stack.Screen name="Saved" component={Saved} />
            <Stack.Screen
                name='WorkoutLog'
                component={WorkoutLogScreen}
                options={{
                    headerShown: false,
                    presentation: 'fullScreenModal',
                }}
            />
            <Stack.Screen
                name='TemplateScreen'
                component={TemplateScreen}
                options={{
                    headerShown: false,
                    presentation: 'fullScreenModal',
                }}
            />
            <Stack.Screen
                name='WorkoutSummaryScreen'
                component={WorkoutSummaryScreen}
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
        <Stack.Navigator initialRouteName='ProgressTopTabs'>
            <Stack.Screen
                name="ProgressTopTabs"
                component={ProgressTopTabs}
                options={{headerShown: false}} // Hide the header if not needed
            />
            <Stack.Screen name='Progress' component={Progress} options={screenOptions} />
            <Stack.Screen name='TemplateRecords' component={TemplateRecords}/>
            <Stack.Screen name='EditTemplateScreen' component={EditTemplateScreen}/>
            <Stack.Screen name="TrackedExercise" component={TrackedExercise} />
            <Stack.Screen
                name='WorkoutLog'
                component={WorkoutLogScreen}
                options={{
                    headerShown: false,
                    presentation: 'fullScreenModal',
                }}
            />
            <Stack.Screen
                name='TemplateScreen'
                component={TemplateScreen}
                options={{
                    headerShown: false,
                    presentation: 'fullScreenModal',
                }}
            />
            <Stack.Screen
                name='WorkoutSummaryScreen'
                component={WorkoutSummaryScreen}
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
            <Stack.Screen name='Feed' component={FeedPage}
                options={({ navigation }) => ({
                    ...screenOptions({ navigation, iconType: 'CreateOutline' }), // Icon for adding a new community
                    title: "Feed"
                })} />
            <Stack.Screen
                name='SaveGymHighlightScreen'
                component={SaveGymHighlightScreen}
            />
            <Stack.Screen
                name='WorkoutLog'
                component={WorkoutLogScreen}
                options={{
                    headerShown: false,
                    presentation: 'fullScreenModal',
                }}
            />
            <Stack.Screen
                name='TemplateScreen'
                component={TemplateScreen}
                options={{
                    headerShown: false,
                    presentation: 'fullScreenModal',
                }}
            />
            <Stack.Screen
                name='WorkoutSummaryScreen'
                component={WorkoutSummaryScreen}
                options={{
                    headerShown: true,
                    presentation: 'fullScreenModal',
                }}
            />
            <Stack.Screen
                name='Comments'
                component={Comments}
                options={{
                    headerShown: true,
                    presentation: 'fullScreenModal',
                }}
            />
        </Stack.Navigator>
    );
}

function CommunitiesStack() {
    return (
        <Stack.Navigator initialRouteName='Communities'>
            <Stack.Screen
                name='Communities'
                component={Communities}
                options={({ navigation }) => ({
                    ...screenOptions({ navigation, iconType: 'newCommunity' }), // Icon for adding a new community
                    title: "Communities"
                })}
            />
            <Stack.Screen name="EventDetailScreen" component={EventDetailScreen} />
            <Stack.Screen
                name='NewCommunity'
                component={NewCommunity}
                options={{ title: "NewCommunity" }}
            />
            <Stack.Screen
                name='CommunityLandingPage'
                component={communityLandingPage}
                options={{ title: "" }}
            />
            <Stack.Screen
                name='CreateEventScreen'
                component={CreateEventScreen}
                options={{
                    headerShown: true,
                    presentation: 'fullScreenModal',
                }}
            />
            <Stack.Screen
                name='CommunityPostScreen'
                component={CommunityPostScreen}
                options={{
                    headerShown: true,
                    presentation: 'fullScreenModal',
                }}
            />
            <Stack.Screen
                name='WorkoutLog'
                component={WorkoutLogScreen}
                options={{
                    headerShown: false,
                    presentation: 'fullScreenModal',
                }}
            />
            <Stack.Screen
                name='TemplateScreen'
                component={TemplateScreen}
                options={{
                    headerShown: false,
                    presentation: 'fullScreenModal',
                }}
            />
            <Stack.Screen
                name='WorkoutSummaryScreen'
                component={WorkoutSummaryScreen}
                options={{
                    headerShown: false,
                    presentation: 'fullScreenModal',
                }}
            />
        </Stack.Navigator>
    );
}

function MessagesStack() {
    return (
        <Stack.Navigator initialRouteName='Messages'>
            <Stack.Screen name='Messages' component={Messages} options={screenOptions} />
            <Stack.Screen name="UserDMs" component={UserDMs} />
            <Stack.Screen name='UserDetails' component={UserDetails} />
        </Stack.Navigator>
    );
}

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(firebase_auth, (user) => {
            setUser(user);
            setLoading(false);
        });
        return unsubscribe; // Cleanup subscription on unmount
    }, []);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    return (
        <WorkoutProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <NavigationContainer>
                    {user ? (
                        <Tab.Navigator tabBar={props => <CustomTabBar {...props} />}>
                            <Tab.Screen
                                name='FeedStack'
                                component={FeedStack}
                                options={{
                                    headerShown: false,
                                    title: 'Feed',
                                    tabBarIcon: ({ color, size }) => (
                                        <Ionicons name="list-outline" color={color} size={size} />
                                    )
                                }}
                            />
                            <Tab.Screen
                                name='MessagesStack'
                                component={MessagesStack}
                                options={{
                                    headerShown: false,
                                    title: 'Messages',
                                    tabBarIcon: ({ color, size }) => (
                                        <Ionicons name="chatbubbles-outline" color={color} size={size} />
                                    )
                                }}
                            />
                            <Tab.Screen
                                name='ProgressStack'
                                component={ProgressStack}
                                options={{
                                    headerShown: false,
                                    title: 'Progress',
                                    tabBarIcon: ({ color, size }) => (
                                        <Ionicons name="bar-chart-outline" color={color} size={size} />
                                    )
                                }}
                            />
                            <Tab.Screen
                                name='AccountStack'
                                component={AccountStack}
                                options={{
                                    headerShown: false,
                                    title: 'Account',
                                    tabBarIcon: ({ color, size }) => (
                                        <Ionicons name="person-outline" color={color} size={size} />
                                    )
                                }}
                            />
                            <Tab.Screen
                                name='CommunitiesStack'
                                component={CommunitiesStack}
                                options={{
                                    headerShown: false,
                                    title: 'Communities',
                                    tabBarIcon: ({ color, size }) => (
                                        <Ionicons name="people-outline" color={color} size={size} />
                                    )
                                }}
                            />
                        </Tab.Navigator>
                    ) : (
                        <Stack.Navigator initialRouteName='Account'>
                            <Stack.Screen name='Account' component={Account} options={{ headerShown: false }} />
                        </Stack.Navigator>
                    )}
                </NavigationContainer>
            </GestureHandlerRootView>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
});
