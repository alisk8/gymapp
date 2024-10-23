import React, { useState } from "react";
import {
  View,
  Button,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import Geocoder from "react-native-geocoding";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";

// Initialize Geocoder
Geocoder.init("AIzaSyCMogbDFxjNsReLGGKAo4AwE-6DdNUPRJI");

const GPSModal = ({ isVisible, onClose, onSelectLocation }) => {
  const [location, setLocation] = useState({
    latitude: 41.7965,
    longitude: -87.5965,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

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
      name: locationName,
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
    <Modal visible={isVisible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.container}>
          <View style={styles.autocompleteContainer} pointerEvents='auto'>
            <GooglePlacesAutocomplete
              placeholder="Search for a location"
              minLength={2}
              autoFocus={true}
              fetchDetails={true}
              onPress={(data, details = null) => {
                handleLocationSelect(data, details);
              }}
              query={{
                key: "AIzaSyCMogbDFxjNsReLGGKAo4AwE-6DdNUPRJI",
                language: "en",
                types: "establishment",
              }}
              styles={{
                textInput: styles.input,
                container: {
                  marginTop: 20,
                  flex: 0,
                  width: "100%",
                  zIndex: 1101,
                },
                listView: {
                  position: "absolute",
                  top: 50,
                  backgroundColor: "#fff",
                  borderWidth: 1,
                  borderColor: "#ccc",
                  width: "100%",
                  zIndex: 999,
                },
              }}
              debounce={200}
              keyboardShouldPersistTaps='handled'
            />
          </View>
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
          <View style={styles.buttonContainer}>
            <Button
              title="Select Location"
              onPress={() => onSelectLocation(location)}
            />
            <Button title="Cancel" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
  },
  autocompleteContainer: {
    position: "absolute",
    top: 30, // Adjusted top value to bring the box slightly down
    left: 10,
    right: 10,
    zIndex: 1000,
    width: "95%",
    alignSelf: "center",
    backgroundColor: "#fff",
    borderRadius: 5,
    padding: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    paddingHorizontal: 10,
  },
  map: {
    width: "100%",
    height: "70%",
    marginTop: 80, // Space for the autocomplete and a small gap
    zIndex: 0,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10,
  },
});

export default GPSModal;
