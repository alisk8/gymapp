
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Video from 'react-native-video';

interface PostProps {
  post: {
    content: string | { uri: string };
    caption?: string;
    username: string;
    profilePicture: string;
    timestamp: string;
  };
}

const Post: React.FC<PostProps> = ({ post }) => {
  const { content, caption, username, profilePicture, timestamp } = post;

  const handleLike = () => {
    // Implement like functionality
  };

  const handleComment = () => {
    // Implement comment functionality
  };

  const handleShare = () => {
    // Implement share functionality
  };

  const handleSave = () => {
    // Implement save functionality
  };

  const handleProfilePress = () => {
    // Handle profile press
  };

  const handleContentPress = () => {
    // Handle content press
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleProfilePress}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleProfilePress}>
            <Image source={{ uri: profilePicture }} style={styles.profilePicture} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleProfilePress}>
            <Text style={styles.username}>{username}</Text>
          </TouchableOpacity>
          <Text style={styles.timestamp}>{timestamp}</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleContentPress} style={styles.content}>
        {typeof content === 'string' ? (
          <Text>{content}</Text>
        ) : (
          <>
            {content.uri && content.uri.endsWith('.mp4') ? (
              <Video
                source={content}
                style={styles.videoContent}
                resizeMode="cover"
                controls={true}
              />
            ) : (
              <Image source={{ uri: content.uri }} style={styles.imageContent} />
            )}
            {caption && <Text style={styles.caption}>{caption}</Text>}
          </>
        )}
      </TouchableOpacity>
      <View style={styles.actions}>
        <TouchableOpacity onPress={handleLike}>
          <Text>Like</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleComment}>
          <Text>Comments</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShare}>
          <Text>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSave}>
          <Text>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  profilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  username: {
    fontWeight: 'bold',
    marginRight: 5,
  },
  timestamp: {
    color: '#666',
  },
  content: {
    marginBottom: 10,
  },
  imageContent: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
    borderRadius: 10,
  },
  videoContent: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  caption: {
    marginTop: 5,
    color: 'black', // Set caption color to black
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default Post;