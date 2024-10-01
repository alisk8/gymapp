import React from "react";
import { View, Text, Modal, FlatList, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Avatar } from "react-native-elements";

const CommunityUserModal = ({ visible, onClose, members }) => {
    const renderMemberItem = ({ item }) => (
        <View style={styles.memberItem}>
            <Avatar source={{ uri: item.profilePicture }} rounded size="medium" />
            <Text style={styles.memberName}>
                {item.firstName} {item.lastName}
            </Text>
        </View>
    );
    return (
        <Modal visible={visible} transparent={true} animationType="slide">
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Members</Text>
                    <FlatList
                        data={members}
                        keyExtractor={(item) => item.id}
                        renderItem={renderMemberItem}
                    />
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
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
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalContent: {
        width: "80%",
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 20,
        alignItems: "center",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 10,
    },
    memberItem: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 10,
    },
    memberName: {
        marginLeft: 10,
        fontSize: 16,
    },
    closeButton: {
        marginTop: 20,
        padding: 10,
        backgroundColor: "#007AFF",
        borderRadius: 5,
    },
    closeButtonText: {
        color: "#fff",
        fontWeight: "bold",
    },
});

export default CommunityUserModal;