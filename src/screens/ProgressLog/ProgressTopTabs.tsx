import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import Progress from "./Progress";
import TemplateRecords from "./TemplateRecords";

const TopTab = createMaterialTopTabNavigator();

function ProgressTopTabs() {
    return (
        <TopTab.Navigator
            initialRouteName="Progress"
            screenOptions={{
                tabBarIndicatorStyle: { backgroundColor: '#016e03'}, // Customize as needed
                tabBarLabelStyle: { fontSize: 14, color: '#016e03',}, // Customize as needed
                tabBarStyle: { backgroundColor: '#fff', paddingTop: 30 }, // Customize as needed
            }}
        >
            <TopTab.Screen
                name="Progress"
                component={Progress}
                options={{ title: 'Progress' }}
            />
            <TopTab.Screen
                name="TemplateRecords"
                component={TemplateRecords}
                options={{ title: 'Workouts' }}
            />
        </TopTab.Navigator>
    );
}

export default ProgressTopTabs;


