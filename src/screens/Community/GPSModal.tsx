import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    Button,
    StyleSheet,
    Modal,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform, ScrollView,
    FlatList
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Geocoder from 'react-native-geocoding';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

Geocoder.init('AIzaSyCMogbDFxjNsReLGGKAo4AwE-6DdNUPRJI'); // Use the same key for both geocoding and maps

const GPSModal = ({ isVisible, onClose, onSelectLocation }) => {
    const [location, setLocation] = useState({
        latitude: 41.7965,
        longitude: -87.5965,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    });
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    const handleLocationSearch = async (text) => {
        setQuery(text);
        if (text.trim() === '') {
            setSearchResults([]);
            return;
        }
        try {
            const json = await Geocoder.from(text);
            const results = json.results;
            setSearchResults(results);
        } catch (error) {
            console.error(error);
        }
    };

    const handleLocationSelect = (data, details) => {
        const { lat, lng } = details.geometry.location;
        const locationName = data.description;
        setLocation({
            ...location,
            latitude: lat,
            longitude: lng,
        });
        onSelectLocation({
            latitude: lat,
            longitude: lng,
            name: locationName
        });
        onClose();
    };

    const handleMapDragEnd = (e) => {
        setLocation({
            ...location,
            latitude: e.nativeEvent.coordinate.latitude,
            longitude: e.nativeEvent.coordinate.longitude,
        });
    };

    return (
        <Modal
            visible={isVisible}
            animationType="slide"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
                <ScrollView contentContainerStyle={styles.container}>
                    <MapView
                        style={styles.map}
                        region={location}
                        onRegionChangeComplete={setLocation}
                    >
                        <Marker
                            coordinate={location}
                            draggable
                            onDragEnd={handleMapDragEnd}
                        />
                    </MapView>
                    <GooglePlacesAutocomplete
                        placeholder="Search for a location"
                        minLength={2}
                        autoFocus={false}
                        returnKeyType={'search'}
                        listViewDisplayed="auto"
                        fetchDetails={true}
                        onPress={(data, details = null) => {
                            handleLocationSelect(data, details);
                        }}
                        query={{
                            key: 'AIzaSyCMogbDFxjNsReLGGKAo4AwE-6DdNUPRJI',
                            language: 'en',
                            types: 'establishment',
                        }}
                        styles={{
                            textInput: styles.input,
                            container: {
                                flex: 0,
                                width: '100%',
                                zIndex: 1,
                                top: 16,
                            },
                            listView: {
                                position: 'absolute',
                                top: 60,
                                backgroundColor: '#fff',
                                borderWidth: 1,
                                borderColor: '#ccc',
                                width: '100%',
                                zIndex: 2,
                            },
                        }}
                        debounce={200}
                    />
                </ScrollView>
                <Button title="Select Location" onPress={() => onSelectLocation(location)} />
                <Button title="Cancel" onPress={onClose} />
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    container: {
        padding: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 8,
        marginBottom: 16,
        borderRadius: 4,
    },
    map: {
        width: '100%',
        height: 400,
        marginBottom: 16,
    },
    searchResults: {
        maxHeight: 200,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        marginBottom: 16,
    },
    searchResultItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
});

export default GPSModal;
