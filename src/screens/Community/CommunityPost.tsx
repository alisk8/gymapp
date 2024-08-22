import React, { useEffect, useState } from 'react';
import {
    View,
    TextInput,
    Button,
    Image,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Text,
    Alert,
    Modal
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { db, storage } from '../../../firebaseConfig'; // Adjust the import path based on your project structure
import { doc, collection, addDoc } from "firebase/firestore";
import { getDownloadURL, ref as storageRef, uploadBytes } from "@firebase/storage";
import { Ionicons } from '@expo/vector-icons'; // Make sure you have installed expo vector icons

const CommunityPostScreen = ({ route, navigation }) => {
    const { communityId, communityName } = route.params;
    const [postContent, setPostContent] = useState('');
    const [postTitle, setPostTitle] = useState('');
    const [image, setImage] = useState(null);
    const [showTitleInput, setShowTitleInput] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);


    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: false, // Single image selection
            aspect: [4, 3],
            quality: 1,
        });

        console.log("Image Picker Result:", result); // Log the entire result object

        if (!result.cancelled && result.assets && result.assets.length > 0) {
            const newImage = result.assets[0].uri;
            console.log("New Image URI:", newImage); // Log the URI of the selected image
            setImage(newImage);
        }
    };

    useEffect(() => {
        console.log(image); // Log the images state
    }, [image]);

    useEffect(() => {
        navigation.setOptions({
            headerTitle: communityName,
            headerLeft: () => (
                <Button style={styles.backButton} title="Back" onPress={() => navigation.goBack()} />
            ),
        });
    }, [navigation, communityName]);

    const uploadImage = async (uri) => {
        const response = await fetch(uri);
        const blob = await response.blob();
        const fileRef = storageRef(storage, `community_posts/${communityId}/${Date.now()}`);
        await uploadBytes(fileRef, blob);
        return await getDownloadURL(fileRef);
    };

    const handleSubmit = async () => {
        if (!postContent && !image) {
            Alert.alert("Error", "Please provide at least one of the following: description, or image.");
            return;
        }

        try {
            const imageUrl = image ? await uploadImage(image) : null;
            await addDoc(collection(db, "communities", communityId, "posts"), {
                title: postTitle || '', // Save null if the title is not provided
                content: postContent || '', // Save null if the content is not provided
                image: imageUrl || null,
                timestamp: new Date(),
                likes: [],
                comments: [],
                type: 'community',
            });
            Alert.alert("Success", "Post saved successfully!");
            navigation.goBack();
        } catch (error) {
            console.error("Error adding document: ", error);
        }
    };

    const handleDeleteMedia = () => {
        setImage(null);
        setModalVisible(false);
    };

    return (
        <View style={styles.container}>
            <ScrollView>
            {showTitleInput && (
                <TextInput
                    style={styles.titleInput}
                    placeholder="Enter Title"
                    value={postTitle}
                    onChangeText={setPostTitle}
                />
            )}
            <TextInput
                style={styles.textInput}
                placeholder="Write your post..."
                multiline
                value={postContent}
                onChangeText={setPostContent}
            />
            <TouchableOpacity
                style={styles.mediaBox}
                onLongPress={() => setModalVisible(true)}
            >
                {image && (
                        <Image source={{ uri: image }} style={styles.selectedImage} />
                )}
            </TouchableOpacity>
            <View style={styles.buttonRow}>
                <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
                    <Ionicons name="image-outline" size={32} color="gray" />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setShowTitleInput(!showTitleInput)}
                    style={styles.addTitleButton}
                >
                    <Text style={styles.addTitleButtonText}>{showTitleInput ? "Hide Title" : "Add Title"}</Text>
                </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.postButton} onPress={handleSubmit}>
                <Text style={styles.postButtonText}>Post</Text>
            </TouchableOpacity>
            </ScrollView>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                    setModalVisible(!modalVisible);
                }}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalText}>Do you want to delete this media?</Text>
                        <View style={styles.modalButtonContainer}>
                            <TouchableOpacity
                                style={[styles.button, styles.buttonClose]}
                                onPress={handleDeleteMedia}
                            >
                                <Text style={styles.textStyle}>Delete</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, styles.buttonCancel]}
                                onPress={() => setModalVisible(!modalVisible)}
                            >
                                <Text style={styles.textStyle}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    titleInput: {
        fontSize: 18,
        marginVertical: 10,
        padding: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 10,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 10,
    },
    imagePicker: {
        alignItems: 'center',
        justifyContent: 'center',
        margin: 15,
    },
    addTitleButton: {
        backgroundColor: '#007bff',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginHorizontal: 15
    },
    addTitleButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    textInput: {
        flex: 1,
        fontSize: 18,
        marginVertical: 20,
        marginBottom: 100,
        padding: 10,
    },
    imageContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginVertical: 10,
        zIndex: 9,
    },
    image: {
        width: 100,
        height: 100,
        margin: 5,
        borderRadius: 10,
        zIndex: 10,
    },
    backButton: {
        fontWeight: 'bold',
        size: 16,
    },
    postButton: {
        backgroundColor: '#28a745',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    postButtonText: {
        color: '#fff',
        fontSize: 18,
    },
    selectedImage: {
        width: '100%',
        height: 300,
        marginVertical: 10,
        borderRadius: 10,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalText: {
        marginBottom: 15,
        textAlign: 'center',
    },
    modalButtonContainer: {
        flexDirection: 'row',
    },
    button: {
        borderRadius: 10,
        padding: 10,
        elevation: 2,
        marginHorizontal: 10,
    },
    buttonClose: {
        backgroundColor: '#d9534f',
    },
    buttonCancel: {
        backgroundColor: '#007bff',
    },
    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
});

export default CommunityPostScreen;

