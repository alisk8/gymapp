import React, { useState } from 'react';
import { View, FlatList, Modal, Button, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Post from './CommunityPage';

// Example data for demonstration
const posts = [
  {
    id: '1',
    content: require('../../assets/ff7.png'),
    caption: 'THIS IS THE COMMUNITY PAGE',
    username: 'Drizzy Drake',
    profilePicture: 'https://example.com/profile1.jpg',
    timestamp: '2024-05-01',
  },
  {
    id: '2',
    content: require('../../assets/chinese.png'),
    caption: 'hello american friends, nice to meet you',
    username: 'Neil',
    profilePicture: 'https://example.com/profile2.jpg',
    timestamp: '2024-05-02',
  },
  {
    id: '3',
    content: 'I love lifting weights!',
    username: 'Alejandro',
    profilePicture: 'https://example.com/profile2.jpg',
    timestamp: '2024-05-02',
  },
  // Add more posts as needed
];

const Feed: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);

  const communities = [
    'Powerlifting',
    'Fitness Enthusiasts',
    'Diet Club',
    'Barbell Club',
    // Add more communities as needed
  ];

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <Button title="Communities" onPress={() => setModalVisible(true)} />
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <ScrollView style={styles.modalView}>
          {communities.map((community, index) => (
            <TouchableOpacity key={index} style={styles.button} onPress={() => setModalVisible(false)}>
              <Text style={styles.textStyle}>{community}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Modal>
      <FlatList
        data={posts}
        renderItem={({ item }) => <Post post={item} />}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  modalView: {
    marginTop: 22,
  },
  button: {
    backgroundColor: "#F194FF",
    padding: 10,
    margin: 10,
    borderRadius: 20,
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center"
  }
});

export default Feed;
