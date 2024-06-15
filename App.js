import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';


import Home from './src/screens/Home';
import Account from './src/screens/Account';
import Post from './src/screens/Post';
import Progress from './src/screens/Progress';
import Notifications from './src/screens/Notifications';
import PersonalDetails from './src/screens/PersonalDetails';
import WorkoutLogScreen from './src/screens/workout-log';
import SaveGymHighlightScreen from "./src/screens/save-gym-highlight";
import CustomTabBar from "./src/components/CustomTabBar";
import Feed from './src/screens/Feed';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const screenOptions = ({ navigation }) => ({
    headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={24} color="black" style={{ marginRight: 15 }} />
        </TouchableOpacity>
    ),
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
                    title: "Feed"
                })}
            />
            <Stack.Screen name='Notifications' component={Notifications} />
            <Stack.Screen
                name='WorkoutLog'
                component={WorkoutLogScreen}
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
            <Stack.Screen options={{ title: "Personal Details" }} name='PersonalDetails' component={PersonalDetails} />
            <Stack.Screen
                name='WorkoutLog'
                component={WorkoutLogScreen}
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
            <Stack.Screen name='Notifications' component={Notifications} />
            <Stack.Screen
                name='WorkoutLog'
                component={WorkoutLogScreen}
                options={{
                    headerShown: false,
                    presentation: 'fullScreenModal',
                }}
            />
        </Stack.Navigator>
    );
}

function PostStack() {
    return (
        <Stack.Navigator initialRouteName='Post'>
            <Stack.Screen name='Save Highlight' component={SaveGymHighlightScreen} options={screenOptions} />
            <Stack.Screen name='Notifications' component={Notifications} />
            <Stack.Screen
                name='WorkoutLog'
                component={WorkoutLogScreen}
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
            <Stack.Screen name='Feed' component={Account} options={screenOptions} />
            <Stack.Screen name='Feed' component={Feed} />
            <Stack.Screen
                name='WorkoutLog'
                component={WorkoutLogScreen}
                options={{
                    headerShown: false,
                    presentation: 'fullScreenModal',
                }}
            />
        </Stack.Navigator>
    );
}
function App() {
    return (
        <NavigationContainer>
            <Tab.Navigator tabBar={props => <CustomTabBar {...props} />}>
                <Tab.Screen
                    name='HomeStack'
                    component={HomeStack}
                    options={{ headerShown: false, title: 'Feed', tabBarIcon: { name: 'home-outline' } }}
                />
                <Tab.Screen
                    name='PostStack'
                    component={PostStack}
                    options={{ headerShown: false, title: 'Post', tabBarIcon: { name: 'create-outline' } }}
                />
                <Tab.Screen
                    name='ProgressStack'
                    component={ProgressStack}
                    options={{ headerShown: false, title: 'Progress', tabBarIcon: { name: 'trending-up-outline' } }}
                />
                <Tab.Screen
                    name='AccountStack'
                    component={AccountStack}
                    options={{ headerShown: false, title: 'Account', tabBarIcon: { name: 'person-outline' } }}
                />
                <Tab.Screen
                    name='FeedStack'
                    component={FeedStack}
                    options={{ headerShown: false, title: 'Feed', tabBarIcon: { name: 'person-outline' } }}
                />
            </Tab.Navigator>
        </NavigationContainer>
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
});
