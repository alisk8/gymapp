import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Image,
    ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const AskForAdvice = () => {
    const [media, setMedia] = useState(null);
    const [question, setQuestion] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    const handlePickMedia = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            setMedia(result.assets[0]);
        }
    };

    const handleSubmit = () => {
        if (!question.trim() || (!email.trim() && !phone.trim())) {
            Alert.alert('Error', 'Please provide a question and at least one contact method.');
            return;
        }

        // Logic to handle form submission (e.g., sending to backend)
        Alert.alert('Success', 'Your request has been submitted!');
        setMedia(null);
        setQuestion('');
        setEmail('');
        setPhone('');
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.header}>Get Advice from Our Team</Text>
            <Text style={styles.subHeader}>Attach your video, type your question, and we'll help you improve.</Text>

            {/* Media Attachment */}
            <TouchableOpacity style={styles.mediaButton} onPress={handlePickMedia}>
                <Text style={styles.mediaButtonText}>{media ? 'Change Media' : 'Attach Media'}</Text>
            </TouchableOpacity>
            {media && <Image source={{ uri: media.uri }} style={styles.mediaPreview} />}

            {/* Question Input */}
            <Text style={styles.label}>Your Question</Text>
            <TextInput
                style={styles.textInput}
                placeholder="Type your question here..."
                value={question}
                onChangeText={setQuestion}
                multiline
            />

            {/* Contact Information */}
            <Text style={styles.label}>How Can We Get Back to You?</Text>
            <TextInput
                style={styles.textInput}
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
            />
            <TextInput
                style={styles.textInput}
                placeholder="Enter your phone number (optional)"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
            />

            {/* Submit Button */}
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitButtonText}>Send Request</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#f9f9f9',
        flexGrow: 1,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    subHeader: {
        fontSize: 16,
        color: '#555',
        marginBottom: 20,
        textAlign: 'center',
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        marginBottom: 15,
        backgroundColor: '#fff',
    },
    mediaButton: {
        backgroundColor: '#007BFF',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 15,
    },
    mediaButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    mediaPreview: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 15,
    },
    submitButton: {
        backgroundColor: '#28A745',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default AskForAdvice;
