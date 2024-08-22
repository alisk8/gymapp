import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Button,
    StyleSheet,
    Image
} from 'react-native';
import CheckBox from '@react-native-community/checkbox';

const InviteModal = ({
                         isVisible,
                         onClose,
                         onSave,
                         userCommunities,
                         mutualFollowers,
                         selectedCommunities,
                         selectedFollowers,
                     }) => {
    const [tempSelectedCommunities, setTempSelectedCommunities] = useState([...selectedCommunities]);
    const [tempSelectedFollowers, setTempSelectedFollowers] = useState([...selectedFollowers]);

    const handleCommunitySelect = (communityId) => {
        setTempSelectedCommunities(prev =>
            prev.includes(communityId)
                ? prev.filter(id => id !== communityId)
                : [...prev, communityId]
        );
    };

    const handleFollowerSelect = (followerId) => {
        setTempSelectedFollowers(prev =>
            prev.includes(followerId)
                ? prev.filter(id => id !== followerId)
                : [...prev, followerId]
        );
    };

    const handleSave = () => {
        onSave(tempSelectedCommunities, tempSelectedFollowers);
        onClose();
    };

    return (
        <Modal visible={isVisible} animationType="slide">
            <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Invite locations:</Text>

                <Text style={styles.label}>Groups</Text>
                <FlatList
                    data={userCommunities}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => handleCommunitySelect(item.id)} style={styles.item}>
                            {item.imageUrl && <Image source={{ uri: item.imageUrl }} style={styles.communityImage} />}
                            <View style={styles.communityInfo}>
                                <Text style={styles.communityName}>{item.name}</Text>
                            </View>
                            <CheckBox
                                value={tempSelectedCommunities.includes(item.id)}
                                onValueChange={() => handleCommunitySelect(item.id)}
                                style={styles.checkbox}
                            />
                        </TouchableOpacity>
                    )}
                />

                <Text style={styles.label}>Mutual Followers</Text>
                <FlatList
                    data={mutualFollowers}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => handleFollowerSelect(item.id)} style={styles.item}>
                            {item.profilePicture && <Image source={{ uri: item.profilePicture }} style={styles.communityImage} />}
                            <View style={styles.communityInfo}>
                                <Text style={styles.communityName}>{item.firstName} {item.lastName}</Text>
                            </View>
                            <CheckBox
                                value={tempSelectedFollowers.includes(item.id)}
                                onValueChange={() => handleFollowerSelect(item.id)}
                                style={styles.checkbox}
                            />
                        </TouchableOpacity>
                    )}
                />

                <Button title="Save" onPress={handleSave} />
                <Button title="Cancel" onPress={onClose} />
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    item: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 15,
        marginVertical: 5,
        borderRadius: 10,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        elevation: 2,
        alignItems: 'center',
    },
    communityImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
    },
    communityInfo: {
        flex: 1,
    },
    communityName: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
    },
    checkbox: {
        alignSelf: 'center',
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
});

export default InviteModal;