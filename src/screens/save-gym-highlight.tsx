import React, { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, Image, View, FlatList, Text, Modal, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { db, firebase_auth, storage } from '../../firebaseConfig';
import { addDoc, collection, getDocs, query, where, Timestamp, serverTimestamp } from '@firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from "@firebase/storage";
import Video from 'react-native-video';
import DropDownPicker from 'react-native-dropdown-picker';

export default function SaveGymHighlightScreen() {
    const params = useLocalSearchParams();
    const [caption, setCaption] = useState('');
    const [description, setDescription] = useState('');
    const [highlightType, setHighlightType] = useState('gym');
    const [visibility, setVisibility] = useState('public'); // Default visibility set to public
    const [reps, setReps] = useState('');
    const [weightLifted, setWeightLifted] = useState('');
    const [weight, setWeight] = useState('');
    const [weightUnit, setWeightUnit] = useState('lbs');
    const [bodyWeightUnit, setBodyWeightUnit] = useState('lbs');
    const [openVisibilityDropdown, setOpenVisibilityDropdown] = useState(false);
    const [openHighlightTypeDropdown, setOpenHighlightTypeDropdown] = useState(false);
    const [macros, setMacros] = useState({
        calories: '',
        protein: '',
        carbs: '',
        fat: ''
    });
    const [items, setItems] = useState([
        { label: 'Gym Highlight', value: 'gym' },
        { label: 'Daily Weight Update', value: 'body' },
        { label: 'Meal Highlight', value: 'meal' },
        { label: 'Post', value: 'post' } // Added Post highlight type
    ]);
    const visibilityItems = [
        { label: 'Private', value: 'private' },
        { label: 'Public', value: 'public' }
    ];

    const [media, setMedia] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState(null);

    const handlePickMedia = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsMultipleSelection: true,  // Enable multiple selection
        });

        console.log('Media Picker Result:', result);

        if (!result.canceled && result.assets) {
            setMedia([...media, ...result.assets]);  // Add selected media to the state
        } else {
            console.log('No media selected or operation canceled');
        }
    };

    const handleDeleteMedia = () => {
        setMedia(media.filter(item => item.uri !== selectedMedia.uri));
        setModalVisible(false);
    };

    const handleLongPressMedia = (item) => {
        setSelectedMedia(item);
        setModalVisible(true);
    };

    const handleSaveHighlight = async () => {
        if (!firebase_auth.currentUser) {
            alert('You must be logged in to save a highlight.');
            return;
        }

        const userId = firebase_auth.currentUser.uid; // Get the user's ID

        try {
            // Check for existing bodyweight highlights for the current date
            if (highlightType === 'body') {
                const today = new Date();
                const startOfDay = new Date(today.setHours(0, 0, 0, 0));
                const endOfDay = new Date(today.setHours(23, 59, 59, 999));

                const highlightsRef = collection(db, 'userProfiles', userId, 'highlights');
                const q = query(
                    highlightsRef,
                    where('type', '==', 'body'),
                    where('timestamp', '>=', Timestamp.fromDate(startOfDay)),
                    where('timestamp', '<=', Timestamp.fromDate(endOfDay))
                );
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    Alert.alert('Error', 'A bodyweight progress highlight for today already exists.');
                    return;
                }
            }

            const mediaUploadPromises = media.map(async (mediaItem, index) => {
                if (!mediaItem.uri) {
                    throw new Error(`Media item at index ${index} is missing a URI.`);
                }

                const fileName = `${userId}_${Date.now()}_${index}`; // A unique file name for the upload
                const fileRef = storageRef(storage, `media/${fileName}`);

                const response = await fetch(mediaItem.uri);
                if (!response.ok) {
                    throw new Error(`Failed to fetch media item at URI ${mediaItem.uri}`);
                }
                const blob = await response.blob();

                // Ensure the blob is valid
                if (!blob) {
                    throw new Error(`Failed to create a valid blob for media item at index ${index}`);
                }

                // Log the blob information
                console.log('Uploading blob:', blob);

                // Upload the media file to Firebase Storage
                const snapshot = await uploadBytes(fileRef, blob);
                const downloadURL = await getDownloadURL(snapshot.ref); // Get the URL of the uploaded file
                console.log('Download URL:', downloadURL);
                return downloadURL;
            });

            const uploadedMediaUrls = await Promise.all(mediaUploadPromises);

            const highlightData = {
                type: highlightType,
                caption: caption,
                description: description,
                mediaUrls: uploadedMediaUrls,
                userId: userId, // Associate highlight with the user
                visibility: visibility,
                timestamp: serverTimestamp(), // Adds a timestamp
            };

            if (highlightType === 'gym') {
                highlightData.reps = reps;
                highlightData.weightLifted = `${weightLifted} ${weightUnit}`;
            } else if (highlightType === 'body') {
                highlightData.weight = `${weight} ${bodyWeightUnit}`;
            } else if (highlightType === 'meal') {
                highlightData.macros = macros;
            }

            const userHighlightsCollection = collection(db, 'userProfiles', userId, 'highlights');
            await addDoc(userHighlightsCollection, highlightData);
            alert('Highlight saved successfully!');
            console.log("Save successful");
        } catch (error) {
            console.error('Error saving highlight:', error);
            alert('Error saving highlight: ' + error.message);
        }
    };



    return (
        <ScrollView style={styles.contentScrollView}>
            <View style={styles.mediaContainer}>
                <FlatList
                    data={[...media, { addNew: true }]}
                    horizontal
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => {
                        if (item.addNew) {
                            return (
                                <TouchableOpacity style={styles.addMediaBox} onPress={handlePickMedia}>
                                    <Text style={styles.addMediaText}>Add Media</Text>
                                </TouchableOpacity>
                            );
                        } else {
                            return (
                                <TouchableOpacity
                                    style={styles.mediaBox}
                                    onLongPress={() => handleLongPressMedia(item)}
                                >
                                    {item.type === 'image' ? (
                                        <Image source={{ uri: item.uri }} style={styles.mediaThumbnail} />
                                    ) : (
                                        <Video source={{ uri: item.uri }} style={styles.mediaThumbnail} resizeMode="contain" paused={true} />
                                    )}
                                </TouchableOpacity>
                            );
                        }
                    }}
                />
            </View>

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

            <View style={styles.container}>
                <DropDownPicker
                    open={openHighlightTypeDropdown}
                    value={highlightType}
                    items={items}
                    setOpen={setOpenHighlightTypeDropdown}
                    setValue={setHighlightType}
                    setItems={setItems}
                    zIndex={3000}
                    zIndexInverse={1000}
                    containerStyle={styles.dropdownContainer}
                    style={styles.picker}
                    dropDownContainerStyle={styles.dropdownStyle}
                />
                {highlightType === 'gym' && (
                    <>
                        <Text style={styles.header}>Title</Text>
                        <TextInput style={styles.textInput} placeholder="Exercise name" value={caption} onChangeText={setCaption} />
                        <Text style={styles.header}>Weight</Text>
                        <View style={styles.row}>
                            <TextInput style={[styles.textInput, styles.flex1]} keyboardType="numeric" placeholder="Weight lifted" value={weightLifted} onChangeText={setWeightLifted} />
                            <View style={styles.unitButtonsContainer}>
                                <TouchableOpacity
                                    style={[styles.unitButton, weightUnit === 'lbs' && styles.unitButtonSelected]}
                                    onPress={() => setWeightUnit('lbs')}
                                >
                                    <Text style={[styles.unitButtonText, weightUnit === 'lbs' ? styles.unitButtonSelectedText : styles.unitButtonUnselectedText]}>lbs</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.unitButton, weightUnit === 'kgs' && styles.unitButtonSelected]}
                                    onPress={() => setWeightUnit('kgs')}
                                >
                                    <Text style={[styles.unitButtonText, weightUnit === 'kgs' ? styles.unitButtonSelectedText : styles.unitButtonUnselectedText]}>kgs</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <Text style={styles.header}>Reps</Text>
                        <TextInput style={styles.textInput} keyboardType="numeric" placeholder="Number of reps" value={reps} onChangeText={setReps} />
                    </>
                )}
                {highlightType === 'body' && (
                    <>
                        <Text style={styles.header}>Title</Text>
                        <TextInput style={styles.textInput} placeholder="Progress name" value={caption} onChangeText={setCaption} />
                        <Text style={styles.header}>Current Weight</Text>
                        <View style={styles.row}>
                            <TextInput style={[styles.textInput, styles.flex1]} keyboardType="numeric" placeholder="Weight" value={weight} onChangeText={setWeight} />
                            <View style={styles.unitButtonsContainer}>
                                <TouchableOpacity
                                    style={[styles.unitButton, bodyWeightUnit === 'lbs' && styles.unitButtonSelected]}
                                    onPress={() => setBodyWeightUnit('lbs')}
                                >
                                    <Text style={[styles.unitButtonText, bodyWeightUnit === 'lbs' ? styles.unitButtonSelectedText : styles.unitButtonUnselectedText]}>lbs</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.unitButton, bodyWeightUnit === 'kgs' && styles.unitButtonSelected]}
                                    onPress={() => setBodyWeightUnit('kgs')}
                                >
                                    <Text style={[styles.unitButtonText, bodyWeightUnit === 'kgs' ? styles.unitButtonSelectedText : styles.unitButtonUnselectedText]}>kgs</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </>
                )}
                {highlightType === 'meal' && (
                    <>
                        <Text style={styles.header}>Title</Text>
                        <TextInput style={styles.textInput} placeholder="Meal name" value={caption} onChangeText={setCaption} />
                        <Text style={styles.header}>Macros</Text>
                        <TextInput style={styles.textInput} keyboardType="numeric" placeholder="Calories" value={macros.calories} onChangeText={(val) => setMacros({ ...macros, calories: val })} />
                        <TextInput style={styles.textInput} keyboardType="numeric" placeholder="Protein" value={macros.protein} onChangeText={(val) => setMacros({ ...macros, protein: val })} />
                        <TextInput style={styles.textInput} keyboardType="numeric" placeholder="Carbs" value={macros.carbs} onChangeText={(val) => setMacros({ ...macros, carbs: val })} />
                        <TextInput style={styles.textInput} keyboardType="numeric" placeholder="Fat" value={macros.fat} onChangeText={(val) => setMacros({ ...macros, fat: val })} />
                    </>
                )}
                {highlightType === 'post' && (
                    <>
                        <Text style={styles.header}>Title</Text>
                        <TextInput style={styles.textInput} placeholder="Post title" value={caption} onChangeText={setCaption} />
                    </>
                )}

                <Text style={styles.header}>Description</Text>
                <TextInput style={[styles.textInput, styles.descriptionInput]} placeholder="add description" value={description} onChangeText={setDescription} />

                <DropDownPicker
                    open={openVisibilityDropdown}
                    value={visibility}
                    items={visibilityItems}
                    setOpen={setOpenVisibilityDropdown}
                    setValue={setVisibility}
                    zIndex={2000}
                    zIndexInverse={2000}
                    containerStyle={styles.dropdownContainer}
                    style={styles.picker}
                    dropDownContainerStyle={styles.dropdownStyle}
                />

                <View style={[styles.buttonContainer]}>
                    <TouchableOpacity style={styles.saveButton} onPress={handleSaveHighlight}>
                        <Text style={styles.saveButtonText}>Save Highlight</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    contentScrollView: {
        flex: 1,
    },
    container: {
        padding: 16,
        backgroundColor: '#f8f9fa',
    },
    textInput: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        paddingLeft: 8,
        borderRadius: 8,
        marginBottom: 16,
    },
    descriptionInput: {
        height: 80,
    },
    picker: {
        borderColor: 'gray',
        borderRadius: 8,
        marginBottom: 16,
    },
    dropdownContainer: {
        marginBottom: 16,
    },
    dropdownStyle: {
        borderColor: 'gray',
    },
    header: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    mediaContainer: {
        flexDirection: 'row',
        padding: 8,
    },
    addMediaBox: {
        width: 100,
        height: 100,
        borderWidth: 2,
        borderColor: '#ddd',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        backgroundColor: '#f8f9fa',
    },
    addMediaText: {
        textAlign: 'center',
        color: '#6c757d',
    },
    mediaBox: {
        width: 100,
        height: 100,
        marginRight: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mediaThumbnail: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    buttonContainer: {
        marginTop: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveButton: {
        backgroundColor: '#007bff',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 8,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    flex1: {
        flex: 1,
    },
    unitButtonsContainer: {
        flexDirection: 'row',
        marginLeft: 8,
        alignItems: 'center', // Aligns unit buttons with the text input
        paddingBottom: 18
    },
    unitButton: {
        height: 40, // Match the height of the TextInput
        justifyContent: 'center', // Center text vertically
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: 'gray',
        borderRadius: 8,
        marginHorizontal: 4,
    },
    unitButtonSelected: {
        backgroundColor: '#007bff',
    },
    unitButtonText: {
        color: '#fff',
    },
    unitButtonSelectedText: {
        color: '#fff',
    },
    unitButtonUnselectedText: {
        color: '#000',
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


