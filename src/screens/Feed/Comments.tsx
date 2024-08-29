import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { db, firebase_auth } from '../../../firebaseConfig';
import { collection, addDoc, getDocs, updateDoc, doc, getDoc, arrayUnion, arrayRemove } from '@firebase/firestore';
import Icon from 'react-native-vector-icons/Ionicons';

interface Comment {
  id: string;
  text: string;
  userId: string;
  timestamp: Date;
  likes: string[];
  userName?: string; // Added userName to Comment interface
}

const Comments = ({ route, navigation }) => {
  const { postId, userId, isWorkout } = route.params;
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [userProfiles, setUserProfiles] = useState<{ [key: string]: string }>({});
  const defaultProfilePicture = 'https://firebasestorage.googleapis.com/v0/b/gym-app-a79f9.appspot.com/o/media%2Fpfp.jpeg?alt=media&token=dd124ee9-6c61-48ad-b41c-97f3acc3350c';

  useEffect(() => {
    fetchComments();
    fetchUserProfile();
  }, []);

  const fetchComments = async () => {
    try {
      const collectionName = isWorkout ? 'workouts' : 'highlights';
      const commentsRef = collection(db, 'userProfiles', userId, collectionName, postId, 'comments');
      const commentsSnapshot = await getDocs(commentsRef);
      
      const commentsList: Comment[] = await Promise.all(commentsSnapshot.docs.map(async (doc) => {
        const commentData = doc.data() as Comment;
        const commenterProfile = await fetchUserName(commentData.userId);
        return {
          id: doc.id,
          ...commentData,
          userName: commenterProfile || 'Anonymous', // add a fallback in case the user profile is not found
        };
      }));

      setComments(commentsList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching comments: ', error);
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    const currentUser = firebase_auth.currentUser;
    if (currentUser) {
      const userRef = doc(db, 'userProfiles', currentUser.uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        setCurrentUserProfile(userDoc.data());
      }
    }
  };

  const fetchUserName = async (userId: string) => {
    if (userProfiles[userId]) {
        return userProfiles[userId]; // return cached name if already fetched
    }
    try {
        const userRef = doc(db, 'userProfiles', userId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
            const profileData = userDoc.data();
            const firstName = profileData?.firstName || '';
            const lastName = profileData?.lastName || '';
            const userName = `${firstName} ${lastName}`.trim() || 'Anonymous';
            console.log(`Fetched userName: ${userName} for userId: ${userId}`); // Debugging line
            setUserProfiles(prevState => ({
                ...prevState,
                [userId]: userName,
            }));
            return userName;
        } else {
            console.log(`No document exists for userId: ${userId}`); // Debugging line
        }
    } catch (error) {
        console.error('Error fetching user name: ', error);
        return 'Anonymous';
    }
};


  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    try {
      const collectionName = isWorkout ? 'workouts' : 'highlights';
      const commentsRef = collection(db, 'userProfiles', userId, collectionName, postId, 'comments');
      
      const newComment: Omit<Comment, 'id'> = {
        text: commentText,
        userId: firebase_auth.currentUser.uid,
        timestamp: new Date(),
        likes: [],
      };

      await addDoc(commentsRef, newComment);
      const commenterName = await fetchUserName(firebase_auth.currentUser.uid);
      setComments([...comments, { ...newComment, id: comments.length.toString(), userName: commenterName }]);
      setCommentText('');
    } catch (error) {
      console.error('Error adding comment: ', error);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    const collectionName = isWorkout ? 'workouts' : 'highlights';
    const commentRef = doc(db, 'userProfiles', userId, collectionName, postId, 'comments', commentId);
    const currentUserUid = firebase_auth.currentUser.uid;

    try {
      await updateDoc(commentRef, {
        likes: arrayUnion(currentUserUid),
      });

      setComments(comments.map(comment => 
        comment.id === commentId ? { ...comment, likes: [...comment.likes, currentUserUid] } : comment
      ));
    } catch (error) {
      console.error('Error liking comment: ', error);
    }
  };

  const handleUnlikeComment = async (commentId: string) => {
    const collectionName = isWorkout ? 'workouts' : 'highlights';
    const commentRef = doc(db, 'userProfiles', userId, collectionName, postId, 'comments', commentId);
    const currentUserUid = firebase_auth.currentUser.uid;

    try {
      await updateDoc(commentRef, {
        likes: arrayRemove(currentUserUid),
      });

      setComments(comments.map(comment => 
        comment.id === commentId ? { ...comment, likes: comment.likes.filter(uid => uid !== currentUserUid) } : comment
      ));
    } catch (error) {
      console.error('Error unliking comment: ', error);
    }
  };

  const renderItem = ({ item }: { item: Comment & { userName: string } }) => {
    const liked = item.likes.includes(firebase_auth.currentUser.uid);
    return (
      <View style={styles.commentContainer}>
        <Image source={{ uri: currentUserProfile?.profilePicture || defaultProfilePicture }} style={styles.profilePicture} />
        <View style={styles.commentContent}>
          <Text style={styles.commenterName}>{item.userName}</Text>
          <Text style={styles.commentText}>{item.text}</Text>
        </View>
        <TouchableOpacity onPress={() => liked ? handleUnlikeComment(item.id) : handleLikeComment(item.id)}>
          <Icon name={liked ? 'heart' : 'heart-outline'} size={20} color="#000" />
          <Text style={styles.likeCount}>{item.likes.length}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Icon name="arrow-back" size={24} color="#000" />
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.noCommentsText}>No comments yet. Be the first to comment!</Text>}
      />
      <View style={styles.commentInputContainer}>
        <TextInput
          style={styles.commentInput}
          placeholder="Add a comment..."
          value={commentText}
          onChangeText={setCommentText}
        />
        <TouchableOpacity onPress={handleAddComment} style={styles.sendButton}>
          <Icon name="send" size={24} color="#007bff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  backButtonText: {
    marginLeft: 5,
    fontSize: 16,
    color: '#007bff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  profilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  commentContent: {
    flex: 1,
  },
  commenterName: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
  },
  commentText: {
    fontSize: 16,
    color: '#333',
  },
  likeCount: {
    fontSize: 12,
    marginLeft: 5,
  },
  commentInputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  commentInput: {
    flex: 1,
    fontSize: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  sendButton: {
    marginLeft: 10,
    justifyContent: 'center',
  },
  noCommentsText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
  },
});

export default Comments;
