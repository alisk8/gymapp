import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import Home from './src/screens/Home';
import Account from './src/screens/Account';
import Progress from './src/screens/Progress';
import Notifications from './src/screens/Notifications';
import PersonalDetails from './src/screens/PersonalDetails';
import WorkoutLogScreen from './src/screens/WorkoutLog/workout-log';
import SaveGymHighlightScreen from "./src/screens/Feed/save-gym-highlight";
import CustomTabBar from "./src/components/CustomTabBar";
import FeedPage from "./src/screens/Feed/FeedPage";
import TemplateScreen from "./src/screens/WorkoutLog/TemplateScreen";
import { WorkoutProvider } from './src/contexts/WorkoutContext';
import Communities from './src/screens/Community/CommunityFeed';
import NewCommunity from './src/screens/new-community';
import WorkoutSummaryScreen from './src/screens/WorkoutLog/WorkoutSummary';
import communityLandingPage from './src/screens/Community/CommunityLandingPage';
import CommunityPostScreen from "./src/screens/Community/CommunityPost";
import CreateEventScreen from "./src/screens/Community/CreateEventScreen";
import EventDetailScreen from './src/screens/Community/EventDetailScreen';
import WorkoutLogQuickMode from "./src/screens/WorkoutLog/WorkoutLogQuickMode";



const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const screenOptions = ({ navigation, iconType }) => ({
    headerRight: () => {
        let icon = null;
        let onPress = null;

        if (iconType === 'notifications') {
            icon = <Ionicons name="notifications-outline" size={24} color="black"/>;
            onPress = () => navigation.navigate('Notifications');
        } else if (iconType === 'newCommunity') {
            icon = <Ionicons name="add-circle-outline" size={24} color="black"/>;
            onPress = () => navigation.navigate('NewCommunity');
        }
        else if (iconType === 'CreateOutline'){
            icon = <Ionicons name="create-outline" size={24} color="black"/>;
            onPress = () => navigation.navigate('SaveGymHighlightScreen');
        }

        return (
            <TouchableOpacity onPress={onPress} style={{marginRight: 15}}>
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
            <Stack.Screen name='Notifications' component={Notifications} />
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

function QuickModeStack() {
    return (
        <Stack.Navigator initialRouteName='Quickmode'>
            <Stack.Screen name='Quickmode' component={WorkoutLogQuickMode}
                options={{
                headerShown: false,
                presentation: 'fullScreenModal',
            }}/>
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
            <Stack.Screen name='Notifications' component={Notifications} />
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
function PostStack() {
    return (
        <Stack.Navigator initialRouteName='Post'>
            <Stack.Screen name='SaveGymHighlightScreen' component={SaveGymHighlightScreen} options={screenOptions} />
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

function FeedStack() {
    return (
        <Stack.Navigator initialRouteName='Feed'>
            <Stack.Screen name='Feed' component={FeedPage}
                          options={({navigation}) => ({
                              ...screenOptions({navigation, iconType: 'CreateOutline'}), // Icon for adding a new community
                              title: "Feed"
                          })}/>
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
        </Stack.Navigator>
    );
}



function CommunitiesStack() {
    return (
        <Stack.Navigator initialRouteName='Communities'>
            <Stack.Screen
                name='Communities'
                component={Communities}
                options={({navigation}) => ({
                    ...screenOptions({navigation, iconType: 'newCommunity'}), // Icon for adding a new community
                    title: "Communities"
                })}
            />
            <Stack.Screen name="EventDetailScreen" component={EventDetailScreen} />
            <Stack.Screen
                name='NewCommunity'
                component={NewCommunity}
                options={{title: "NewCommunity"}}
            />
            <Stack.Screen
                name='CommunityLandingPage'
                component={communityLandingPage}
                options={{title: ""}}
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

/**
<Tab.Screen
    name='PostStack'
    component={PostStack}
    options={{ headerShown: false, title: 'Post', tabBarIcon: { name: 'create-outline' } }}
/>

    **/
function App() {
    return (
        <WorkoutProvider>
            <NavigationContainer>
                <Tab.Navigator tabBar={props => <CustomTabBar {...props} />}>
                    <Tab.Screen
                        name='HomeStack'
                        component={HomeStack}
                        options={{ headerShown: false, title: 'Home', tabBarIcon: { name: 'home-outline' } }}
                    />
                    <Tab.Screen
                        name='ProgressStack'
                        component={ProgressStack}
                        options={{ headerShown: false, title: 'Progress', tabBarIcon: { name: 'trending-up-outline' } }}
                    />
                    <Tab.Screen
                        name='QuickModeStack'
                        component={QuickModeStack}
                        options={{ headerShown: false, title: 'Quick Mode'}}
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
                    <Tab.Screen
                        name='CommunitiesStack'
                        component={CommunitiesStack}
                        options={{ headerShown: false, title: 'Communities' }} />

                </Tab.Navigator>
            </NavigationContainer>
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
});
