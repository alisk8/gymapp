import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';
import { firebase_auth } from './firebaseConfig'; // Update this path as necessary
import 'react-native-gesture-handler';
import 'react-native-reanimated';


import Home from './src/screens/Home';
import Account from './src/screens/Account';
import Post from './src/screens/Post';
import Progress from './src/screens/Progress';
import Notifications from './src/screens/Notifications';
import PersonalDetails from './src/screens/PersonalDetails';
import UserDetails from './src/screens/UserDetails';
import Settings from './src/screens/Settings';
import UserList from './src/screens/UserList';
import PostDetails from './src/screens/PostDetails';
import TrackedExercise from './src/screens/TrackedExercise';
import FeedPage from './src/screens/FeedPage';
import Saved from './src/screens/Saved';
import Messages from './src/screens/Messages';
import UserDMs from './src/screens/UserDMs';

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
      <Stack.Screen name='FeedPage' component={FeedPage} options={{ title: 'Feed Page' }} />
      <Stack.Screen name='Notifications' component={Notifications} />
      <Stack.Screen name="UserDetails" component={UserDetails} options={{ title: "User Details" }} />
      <Stack.Screen name="PostDetails" component={PostDetails} />
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
      <Stack.Screen options={{ title: "Personal Details" }} name='PersonalDetails' component={PersonalDetails} />
      <Stack.Screen name="PostDetails" component={PostDetails} />
      <Stack.Screen name="Saved" component={Saved} />
    </Stack.Navigator>
  );
}

function ProgressStack() {
  return (
    <Stack.Navigator initialRouteName='Progress'>
      <Stack.Screen name='Progress' component={Progress} options={screenOptions} />
      <Stack.Screen name='Notifications' component={Notifications} />
      <Stack.Screen name="TrackedExercise" component={TrackedExercise} />
    </Stack.Navigator>
  );
}

function PostStack() {
  return (
    <Stack.Navigator initialRouteName='Post'>
      <Stack.Screen name='Post' component={Post} options={screenOptions} />
      <Stack.Screen name='Notifications' component={Notifications} />
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        {user ? (
          <Tab.Navigator>
            <Tab.Screen 
              name='HomeStack' 
              component={HomeStack} 
              options={{ 
                headerShown: false, 
                title: 'Home', 
                tabBarIcon: ({ color, size }) => (
                  <Ionicons name="home-outline" color={color} size={size} />
                ) 
              }} 
            />
            <Tab.Screen 
              name='FeedPage' 
              component={FeedPage} 
              options={{ 
                headerShown: false, 
                title: 'Feed', 
                tabBarIcon: ({ color, size }) => (
                  <Ionicons name="list-outline" color={color} size={size} />
                ) 
              }} 
            />
            <Tab.Screen 
              name='PostStack' 
              component={PostStack} 
              options={{ 
                headerShown: false, 
                title: 'Post', 
                tabBarIcon: ({ color, size }) => (
                  <Ionicons name="create-outline" color={color} size={size} />
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
          </Tab.Navigator>
        ) : (
          <Stack.Navigator initialRouteName='Account'>
            <Stack.Screen name='Account' component={Account} options={{ headerShown: false }} />
          </Stack.Navigator>
        )}
      </NavigationContainer>
    </GestureHandlerRootView>

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
