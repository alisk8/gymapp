import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';

const CustomPickerModal = ({ visible, options, selectedValue, onValueChange, onClose }) => {
    const [tempSelectedValue, setTempSelectedValue] = useState(selectedValue);

    const handleSelect = () => {
        onValueChange(tempSelectedValue);
        onClose();
    };

    return (
        <Modal
            transparent={true}
            animationType="slide"
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={tempSelectedValue}
                        onValueChange={(itemValue) => setTempSelectedValue(itemValue)}
                    >
                        {options.map((option, index) => (
                            <Picker.Item key={index} label={option} value={option} />
                        ))}
                    </Picker>
                    <TouchableOpacity style={styles.selectButton} onPress={handleSelect}>
                        <Text style={styles.selectButtonText}>Select</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    pickerContainer: {
        backgroundColor: 'white',
        paddingBottom: 20,
    },
    selectButton: {
        alignItems: 'center',
        marginTop: 10,
    },
    selectButtonText: {
        color: 'green',
        fontSize: 18,
    },
    closeButton: {
        alignItems: 'center',
        marginTop: 10,
    },
    closeButtonText: {
        color: 'blue',
        fontSize: 18,
    },
});

export default CustomPickerModal;

