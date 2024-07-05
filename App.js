import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import Communities from './src/screens/CommunityFeed';
import NewCommunity from './src/screens/NewCommunity';
import Home from './src/screens/Home';
import Account from './src/screens/Account';
import Post from './src/screens/Post';
import Progress from './src/screens/Progress';
import Notifications from './src/screens/Notifications';
import PersonalDetails from './src/screens/PersonalDetails';
import WorkoutLogScreen from './src/screens/workout-log';
import SaveGymHighlightScreen from "./src/screens/save-gym-highlight";
import CustomTabBar from "./src/components/CustomTabBar";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

<<<<<<< HEAD
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
=======
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
>>>>>>> 9215a71 (edits)
});


function HomeStack() {
<<<<<<< HEAD
  return (
    <Stack.Navigator initialRouteName='Home'>
      <Stack.Screen 
        name="Home" 
        component={Home} 
        options={({ navigation }) => ({
          ...screenOptions({ navigation, iconType: 'notifications' }), 
          title: "Feed" 
        })}
      />
      <Stack.Screen name='Notifications' component={Notifications} />
    </Stack.Navigator>
  );
=======
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
                    presentation: 'modal',
                }}
            />
        </Stack.Navigator>
    );
>>>>>>> 9215a71 (edits)
}


function WorkoutLogStack() {
    return (
        <Stack.Navigator initialRouteName='Workout'>
            <Stack.Screen
                name="Workout"
                component={WorkoutLogScreen}
                options={{
                    headerShown: false,
                    presentation: 'modal',  // This line enables the upward animation
                }}
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
            <Stack.Screen
                name='WorkoutLog'
                component={WorkoutLogScreen}
                options={{
                    headerShown: false,
                    presentation: 'modal',
                }}
            />
        </Stack.Navigator>
    );
}

function AccountStack() {
<<<<<<< HEAD
  return (
    <Stack.Navigator initialRouteName='Account'>
      <Stack.Screen 
        name='Account' 
        component={Account} 
        options={({ navigation }) => ({
          ...screenOptions({ navigation, iconType: 'notifications' }), // Assuming you want notifications icon here
          title: "Account"
        })}
      />
      <Stack.Screen 
        name='Notifications' 
        component={Notifications}
        options={{ title: "Notifications" }}
      />
      <Stack.Screen 
        name='PersonalDetails' 
        component={PersonalDetails}
        options={{ title: "Personal Details" }}
      />
    </Stack.Navigator>
  );
=======
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
                    presentation: 'modal',
                }}
            />
        </Stack.Navigator>
    );
>>>>>>> 9215a71 (edits)
}


function ProgressStack() {
<<<<<<< HEAD
  return (
    <Stack.Navigator initialRouteName='Progress'>
      <Stack.Screen 
        name='Progress' 
        component={Progress} 
        options={({ navigation }) => ({
          ...screenOptions({ navigation, iconType: 'notifications' }), // Adding notifications icon
          title: "Progress"
        })}
      />
      <Stack.Screen 
        name='Notifications' 
        component={Notifications}
        options={{ title: "Notifications" }}
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
      <Stack.Screen 
        name='NewCommunity' 
        component={NewCommunity}
        options={{ title: "NewCommunity" }}
      />
    </Stack.Navigator>
  );
=======
    return (
        <Stack.Navigator initialRouteName='Progress'>
            <Stack.Screen name='Progress' component={Progress} options={screenOptions} />
            <Stack.Screen name='Notifications' component={Notifications} />
            <Stack.Screen
                name='WorkoutLog'
                component={WorkoutLogScreen}
                options={{
                    headerShown: false,
                    presentation: 'modal',
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
                    presentation: 'modal',
                }}
            />
        </Stack.Navigator>
    );
>>>>>>> 9215a71 (edits)
}


function PostStack() {
  return (
    <Stack.Navigator initialRouteName='Post'>
      <Stack.Screen 
        name='Post' 
        component={Post} 
        options={({ navigation }) => ({
          ...screenOptions({ navigation, iconType: 'notifications' }), // Adding notifications icon
          title: "Post"
        })}
      />
      <Stack.Screen 
        name='Notifications' 
        component={Notifications}
        options={{ title: "Notifications" }}
      />
    </Stack.Navigator>
  );
}


function App() {
<<<<<<< HEAD
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name='HomeStack' component={HomeStack} options={{ headerShown: false, title: 'Feed' }} />
        <Tab.Screen name='PostStack' component={PostStack} options={{ headerShown: false, title: 'Post' }} />
          <Tab.Screen name='SaveHighlightStack' component={SaveHighlightStack} options={{ headerShown: false, title: 'Save Highlight' }} />
          <Tab.Screen name='CommunitiesStack' component={CommunitiesStack} options={{ headerShown: false, title: 'Communities' }} />
          <Tab.Screen name='WorkoutLogStack' component={WorkoutLogStack} options={{ headerShown: false, title: 'Workout Log' }} />
          <Tab.Screen name='ProgressStack' component={ProgressStack} options={{ headerShown: false, title: 'Progress' }} />
        <Tab.Screen name='AccountStack' component={AccountStack} options={{ headerShown: false, title: 'Account' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
=======
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
            </Tab.Navigator>
        </NavigationContainer>
    );
>>>>>>> 9215a71 (edits)
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
