import { StatusBar } from 'expo-status-bar';
import React, {useState, useEffect, useRef} from 'react';
import {StyleSheet, View, TouchableOpacity, ActivityIndicator, Alert} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { onAuthStateChanged, setPersistence, browserLocalPersistence} from 'firebase/auth';
import {db, firebase_auth} from './firebaseConfig'; // Update this path as necessary
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { WorkoutProvider } from './src/contexts/WorkoutContext';
import AIFrontPage from './src/screens/AI/AIFrontPage';
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import 'react-native-get-random-values';

// Import screens
import Account from './src/screens/Account';
import Progress from './src/screens/ProgressLog/Progress';
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
import AskForAdvice from "./src/screens/ProgressLog/RequestFeedback";

import { LogBox } from 'react-native';
import CustomTabBar from "./src/components/CustomTabBar";
import CommunityTopTabs from "./src/screens/Community/CommunityTopTabs";
import messaging from "@react-native-firebase/messaging";
import {doc, updateDoc} from "@firebase/firestore";
import * as navigation from "expo-router/build/global-state/routing";
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
            onPress = () => navigation.navigate('NewCommunity', {isEdit: false});
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
        <Stack.Navigator initialRouteName='Progress'>
            <Stack.Screen name='Progress' component={Progress} options={screenOptions} />
            <Stack.Screen name='AskForAdvice' component={AskForAdvice}
                          options={{
                              title: 'Ask for Advice',
                          }}/>
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


/**
 <Stack.Screen
 name="AIFrontPage"
 component={AIFrontPage}
 options={({ navigation }) => ({
 ...screenOptions({ navigation }),
 title: "Create a Workout",  // This title can still be used if needed later
 headerShown: false,         // This hides the top header
 })}
 />

 **/

function AIStack() {
    return (
        <Stack.Navigator initialRouteName="TemplateRecords">
            <Stack.Screen name='TemplateRecords'
                          component={TemplateRecords}
                          options={({ navigation }) => ({
                              ...screenOptions({ navigation }),
                              title: "My Routines",  // This title can still be used if needed later
                          })}
            />
            <Stack.Screen name='EditTemplateScreenUpdated' component={EditTemplateScreenUpdated}/>
            <Stack.Screen
                name="AIFrontPage"
                component={AIFrontPage}
                options={({ navigation }) => ({
                    ...screenOptions({ navigation }),
                    title: "Create a Workout",  // This title can still be used if needed later
                    headerShown: "false",
                    presentation: "fullScreenModal",
                })}
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

/**
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
            <Stack.Screen name='Communities' component={Communities} />
            <Stack.Screen name="EventDetailScreen" component={EventDetailScreen} />
            <Stack.Screen name="UserDetails" component={UserDetails} options={{ title: "User Details" }} />
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
    **/

function CommunitiesStack() {
    return (
        <Stack.Navigator initialRouteName='CommunityLandingPage'>
            <Stack.Screen name='Communities' component={Communities} />
            <Stack.Screen name="EventDetailScreen" component={EventDetailScreen} />
            <Stack.Screen name="UserDetails" component={UserDetails} options={{ title: "User Details" }} />
            <Stack.Screen
                name='NewCommunity'
                component={NewCommunity}
                options={{ title: "New Group" }}
            />
            <Stack.Screen
                name='CommunityLandingPage'
                component={communityLandingPage}
                options={{ title: "" }}
                initialParams={{ communityId: '8UH3Vdfp1hnkhKvAa0MO' }}
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

function handleRegistrationError(errorMessage) {
    alert(errorMessage);
    throw new Error(errorMessage);
}

const registerForPushNotificationsAsync = async (userId) => {
    if (!Device.isDevice) {
        console.log("Must use a physical device for push notifications.");
        return;
    }

    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== "granted") {
        console.log("Failed to get push token for push notifications!");
        return;
    }

    const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    if (!projectId) {
        handleRegistrationError('Project ID not found');
    }
    try {
        const pushTokenString = (
            await Notifications.getExpoPushTokenAsync({
                projectId,
            })
        ).data;
        console.log(pushTokenString);

        // Save the push token to Firestore
        if (userId) {
            const userRef = doc(db, `userProfiles/${userId}`);
            await updateDoc(userRef, { notificationToken: pushTokenString });
            console.log("Token updated successfully in Firestore.");
        }

        return pushTokenString;
    } catch (e) {
        handleRegistrationError(`${e}`);
    }

};


Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
    }),
});


function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expoPushToken, setExpoPushToken] = useState("");
    const notificationListener = useRef();
    const responseListener = useRef();
    const [notification, setNotification] = useState(
        undefined
    );
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(firebase_auth, async (authUser) => {
            setUser(authUser);
            setLoading(false);

            if (authUser) {
                // Register for push notifications and save the token
                await registerForPushNotificationsAsync(authUser.uid).then(token => setExpoPushToken(token));

                notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
                    setNotification(notification);
                });

                responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
                    console.log(response);
                });
            }
        });

        return () => {
            unsubscribe();
            notificationListener.current &&
            Notifications.removeNotificationSubscription(notificationListener.current);
            responseListener.current &&
            Notifications.removeNotificationSubscription(responseListener.current);
        };

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
                                name='AccountStack'
                                component={AccountStack}
                                options={{
                                    headerShown: false,
                                    title: 'Account',
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
