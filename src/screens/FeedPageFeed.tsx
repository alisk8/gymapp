import React from 'react';
import { View, FlatList } from 'react-native';
import Post from './FeedPage'; // Assuming Post component is in a separate file

// Example data for demonstration
const posts = [
  {
    id: '1',
    content: require('../../assets/images/ff7.png'), // Use require to get the correct URI
    caption: 'Oh my! 😳 My gains are looking so huuuge 😳', // Adding a caption for the first photo
    username: 'Drizzy Drake',
    profilePicture: 'https://example.com/profile1.jpg',
    timestamp: '2024-05-01',
  },
  {
    id: '2',
    content: require('../../assets/images/chinese.png'),
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
  /*{
    id: '4',
    content: require('../../assets/images/minion.mp4'), // Assuming 'minion.mp4' is the video file
    username: 'John Z',
    profilePicture: 'https://example.com/profile3.jpg',
    timestamp: '2024-05-02',
  },*/
  // Add more posts as needed
];

const Feed2: React.FC = () => {
  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <FlatList
        data={posts}
        renderItem={({ item }) => <Post post={item} />}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

export default Feed2;