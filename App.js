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
import FeedPage from "./src/screens/Feed/FeedPage";
import TemplateScreen from "./src/screens/WorkoutLog/TemplateScreen";
import Communities from './src/screens/Community/CommunityFeed';
import NewCommunity from './src/screens/Community/new-community';
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
import ExploreScreen from './src/screens/ExploreScreen';
import TemplateRecords from "./src/screens/ProgressLog/TemplateRecords";
import ProgressTopTabs from "./src/screens/ProgressLog/ProgressTopTabs";
import EditTemplateScreen from "./src/screens/ProgressLog/EditTemplateScreen";
import EditTemplateScreenUpdated from "./src/screens/ProgressLog/EditTemplateScreenUpdated";
import Comments from './src/screens/Feed/Comments';

import { LogBox } from 'react-native';
import CustomTabBar from "./src/components/CustomTabBar";
import CommunityTopTabs from "./src/screens/Community/CommunityTopTabs";
import AIFrontPage from './src/screens/AI/AIFrontPage';
LogBox.ignoreLogs(['Warning: ...']); // Ignore log notification by message
LogBox.ignoreAllLogs();//Ignore all log notifications

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
            <Stack.Screen name='FeedPage' component={FeedPage} options={{ title: 'Feed Page' }} />
            <Stack.Screen name='Quickmode' component={WorkoutLogQuickMode} options={{ headerShown: false, presentation: 'fullScreenModal' }} />
            <Stack.Screen name='Notifications' component={Notifications} />
            <Stack.Screen name="UserDetails" component={UserDetails} options={{ title: "User Details" }} />
            <Stack.Screen name="PostDetails" component={PostDetails} />
            <Stack.Screen name='WorkoutLog' component={WorkoutLogScreen} options={{ headerShown: false, presentation: 'fullScreenModal' }} />
            <Stack.Screen name='TemplateScreen' component={TemplateScreen} options={{ headerShown: false, presentation: 'fullScreenModal' }} />
            <Stack.Screen name='WorkoutSummaryScreen' component={WorkoutSummaryScreen} options={{ headerShown: false, presentation: 'fullScreenModal' }} />
        </Stack.Navigator>
    );
}

function AIStack() {
    return (
        <Stack.Navigator initialRouteName="AIFrontPage">
        <Stack.Screen
            name="AIFrontPage"
            component={AIFrontPage}
            options={({ navigation }) => ({
            ...screenOptions({ navigation }),
            title: "Create a Workout",  // This title can still be used if needed later
            headerShown: false,         // This hides the top header
            })}
        />
        </Stack.Navigator>
    );
}

function WorkoutLogStack(){
    return(
        <Stack.Navigator initialRouteName='TemplateScreen'>
            <Stack.Screen
                name='TemplateScreen'
                component={TemplateScreen}
                options={{
                    headerShown: false,
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

function AccountStack() {
    return (
        <Stack.Navigator initialRouteName='Account'>
            <Stack.Screen name='Account' component={Account} options={screenOptions} />
            <Stack.Screen name='Notifications' component={Notifications} />
            <Stack.Screen name='Settings' component={Settings} />
            <Stack.Screen name='UserList' component={UserList} />
            <Stack.Screen name='UserDetails' component={UserDetails} />
            <Stack.Screen name='PersonalDetails' component={PersonalDetails} options={{ title: "Personal Details" }} />
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
            <Stack.Screen name='EditTemplateScreenUpdated' component={EditTemplateScreenUpdated}/>
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
                options={({ navigation }) => ({
                        title: "Highlight"
                    })}
            />
            <Stack.Screen name='Messages' component={Messages} options={screenOptions} />
            <Stack.Screen name="UserDMs" component={UserDMs} />
            <Stack.Screen name='UserDetails' component={UserDetails} />
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
        <Stack.Navigator initialRouteName='CommunityTopTabs'>
            <Stack.Screen
                name="CommunityTopTabs"
                component={CommunityTopTabs}
                options={({ navigation }) => ({
                    ...screenOptions({ navigation, iconType: 'newCommunity' }),
                    title: "Community"
                })}
            />
            <Stack.Screen name='ExploreScreen' component={ExploreScreen} options={screenOptions} />
            <Stack.Screen name='UserDetails' component={UserDetails} />
            <Stack.Screen name='Communities' component={Communities} />
            <Stack.Screen name="EventDetailScreen" component={EventDetailScreen} />
            <Stack.Screen
                name='NewCommunity'
                component={NewCommunity}
                options={{ title: "New Group" }}
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

function ExploreScreenStack() {
    return (
        <Stack.Navigator initialRouteName='ExploreScreen'>
            <Stack.Screen name='ExploreScreen' component={ExploreScreen} options={screenOptions} />
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
        return unsubscribe; 
    }, []);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    /**

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
     name='ExploreScreen'
     component={ExploreScreen}
     options={{
     headerShown: false,
     title: 'Explore',
     }}
     />

     **/

    return (
        <WorkoutProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <NavigationContainer>
                    {user ? (
                        <Tab.Navigator
                            tabBar={props => <CustomTabBar {...props} />}
                            screenOptions={{headerTintColor:'#016e03'}}
                        >
                            <Tab.Screen
                                name='FeedStack'
                                component={FeedStack}
                                options={{
                                    headerShown: false,
                                    title: 'Feed',
                                }}
                            />
                            <Tab.Screen
                                name='ProgressStack'
                                component={ProgressStack}
                                options={{
                                    headerShown: false,
                                    title: 'Progress',
                                }}
                            />
                            <Tab.Screen
                                name='AIStack'
                                component={AIStack}
                                options={{
                                    headerShown: false,
                                    title: 'Plan',
                                }}
                            />

                            <Tab.Screen
                                name='CommunitiesStack'
                                component={CommunitiesStack}
                                options={{
                                    headerShown: false,
                                    title: 'Community',
                                }}
                            />
                            <Tab.Screen
                                name='AccountStack'
                                component={AccountStack}
                                options={{
                                    headerShown: false,
                                    title: 'Account',
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
});
