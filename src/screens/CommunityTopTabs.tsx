import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import Progress from "./Progress";
import TemplateRecords from "./TemplateRecords";
import CommunityFeed from "./Community/CommunityFeed";
import ExploreScreen from "./ExploreScreen";

const TopTab = createMaterialTopTabNavigator();

function CommunityTopTabs() {
    return (
        <TopTab.Navigator
            initialRouteName="CommunityFeed"
            screenOptions={{
                tabBarIndicatorStyle: { backgroundColor: '#0A78DC'}, // Customize as needed
                tabBarLabelStyle: { fontSize: 14, color: '#0A78DC',}, // Customize as needed
                tabBarStyle: { backgroundColor: '#fff' }, // Customize as needed
            }}
        >
            <TopTab.Screen
                name="CommunityFeed"
                component={CommunityFeed}
                options={{ title: 'Community' }}
            />
            <TopTab.Screen
                name="ExploreScreen"
                component={ExploreScreen}
                options={{ title: 'Explore' }}
            />
        </TopTab.Navigator>
    );
}

export default CommunityTopTabs;

