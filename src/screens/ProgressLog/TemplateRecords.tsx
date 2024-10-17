import React, { useState, useEffect } from "react";
import {
    StyleSheet,
    Text,
    View,
    Alert,
    RefreshControl,
    ScrollView,
    Modal,
    TextInput,
    TouchableOpacity,
    FlatList,
} from "react-native";
import { firebase_auth, db } from "../../../firebaseConfig";
import {
    doc,
    collection,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
    Timestamp,
} from "firebase/firestore";
import {useFocusEffect, useNavigation} from "@react-navigation/native";


const TemplateRecords = ({ navigation }) => {
    const [templates, setTemplates] = useState([]);
    const nav = useNavigation();

    useFocusEffect(
        React.useCallback(() => {
            const currentDate = new Date();
            fetchTemplates();
        }, [])
    );


    useEffect(() => {
        nav.setOptions({
            headerRight: () => (
                <TouchableOpacity onPress={() => navigation.navigate('EditTemplateScreenUpdated', { template: [] })}>
                    <Text style={{fontSize: 30}}>+</Text>
                </TouchableOpacity>
            )
        });
    }, [nav]);

    const fetchTemplates = async () => {
        const user = firebase_auth.currentUser;
        if (user) {
            try {
                const uid = user.uid;
                const userRef = doc(db, "userProfiles", uid);
                const templatesRef = collection(userRef, "templates");
                const snapshot = await getDocs(templatesRef);
                const templates = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setTemplates(templates);
            }
            catch (error){
                Alert.alert("Error", "Failed to fetch templates");
                console.error("Error fetching templates: ", error);
            }
        } else {
            Alert.alert("Error", "No user is logged in");
        }
    };


    return (
        <View style={styles.container}>
            <FlatList
                data={templates}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.templateItem}
                        onPress={() => {
                            navigation.navigate('EditTemplateScreenUpdated', { template: item });
                        }}
                    >
                        <Text style={styles.templateName}>{item.templateName}</Text>
                    </TouchableOpacity>
                )}
            />
            <TouchableOpacity
                style={styles.createButton}
                onPress={() => {
                    navigation.navigate('AIFrontPage');
                }}
            >
                <Text style={styles.createButtonText}>+ Generate Routine with AI</Text>
            </TouchableOpacity>
        </View>
    );
};

export default TemplateRecords;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8f9fa", // Light background for the entire screen
        padding: 10,
    },
    templateItem: {
        backgroundColor: "#ffffff", // White background for each item
        padding: 15,
        marginVertical: 8,
        marginHorizontal: 10,
        borderRadius: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2, // Adds a subtle shadow on Android
    },
    templateName: {
        fontSize: 18,
        fontWeight: "600",
        color: "#333",
        marginBottom: 5,
    },
    templateDescription: {
        fontSize: 14,
        color: "#666",
    },
    createButton: {
        backgroundColor: "#016e03", // Green background for the button
        padding: 15,
        marginVertical: 8,
        marginHorizontal: 10,
        borderRadius: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2, // Adds a subtle shadow on Android
        alignItems: "center", // Centers the text inside the button
    },
    createButtonText: {
        fontSize: 18,
        fontWeight: "600",
        color: "#ffffff", // White text color
    },
});

