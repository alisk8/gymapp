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
    </Stack.Navigator>
  );
}

function WorkoutLogStack() {
    return (
        <Stack.Navigator initialRouteName='Home'>
            <Stack.Screen
                name="Workout"
                component={WorkoutLogScreen}
                options={({ navigation }) => ({
                    ...screenOptions({ navigation }),
                    title: "Workout"
                })}
            />
        </Stack.Navigator>
    );
}

function SaveHighlightStack() {
    return (
        <Stack.Navigator initialRouteName='Home'>
            <Stack.Screen
                name="Save Highlight"
                component={SaveGymHighlightScreen}
                options={({ navigation }) => ({
                    ...screenOptions({ navigation }),
                    title: "Save Highlight"
                })}
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
    </Stack.Navigator>
  );
}

function ProgressStack() {
  return (
    <Stack.Navigator initialRouteName='Progress'>
      <Stack.Screen name='Progress' component={Progress} options={screenOptions} />
      <Stack.Screen name='Notifications' component={Notifications} />
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

function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name='HomeStack' component={HomeStack} options={{ headerShown: false, title: 'Feed' }} />
        <Tab.Screen name='PostStack' component={PostStack} options={{ headerShown: false, title: 'Post' }} />
          <Tab.Screen name='SaveHighlightStack' component={SaveHighlightStack} options={{ headerShown: false, title: 'Save Highlight' }} />
          <Tab.Screen name='WorkoutLogStack' component={WorkoutLogStack} options={{ headerShown: false, title: 'Workout Log' }} />
          <Tab.Screen name='ProgressStack' component={ProgressStack} options={{ headerShown: false, title: 'Progress' }} />
        <Tab.Screen name='AccountStack' component={AccountStack} options={{ headerShown: false, title: 'Account' }} />
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
