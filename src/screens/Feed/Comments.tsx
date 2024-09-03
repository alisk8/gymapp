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
  userName?: string;
  replies?: Comment[];
}

const Comments = ({ route, navigation }) => {
  const { postId, userId, isWorkout } = route.params;
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
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
        const replies = await fetchReplies(userId, collectionName, postId, doc.id);
        return {
          id: doc.id,
          ...commentData,
          userName: commenterProfile || 'Anonymous',
          replies,
        };
      }));

      setComments(commentsList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching comments: ', error);
      setLoading(false);
    }
  };

  const fetchReplies = async (userId: string, collectionName: string, postId: string, commentId: string) => {
    try {
      const repliesRef = collection(db, 'userProfiles', userId, collectionName, postId, 'comments', commentId, 'replies');
      const repliesSnapshot = await getDocs(repliesRef);
      
      const repliesList: Comment[] = await Promise.all(repliesSnapshot.docs.map(async (doc) => {
        const replyData = doc.data() as Comment;
        const replierProfile = await fetchUserName(replyData.userId);
        const nestedReplies = await fetchReplies(userId, collectionName, postId, doc.id); // Fetch nested replies
        return {
          id: doc.id,
          ...replyData,
          userName: replierProfile || 'Anonymous',
          replies: nestedReplies, // Set nested replies
        };
      }));

      return repliesList;
    } catch (error) {
      console.error('Error fetching replies: ', error);
      return [];
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
      return userProfiles[userId];
    }
    try {
      const userRef = doc(db, 'userProfiles', userId);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const profileData = userDoc.data();
        const firstName = profileData?.firstName || '';
        const lastName = profileData?.lastName || '';
        const userName = `${firstName} ${lastName}`.trim() || 'Anonymous';
        console.log(`Fetched userName: ${userName} for userId: ${userId}`);
        setUserProfiles(prevState => ({
          ...prevState,
          [userId]: userName,
        }));
        return userName;
      } else {
        console.log(`No document exists for userId: ${userId}`);
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
      if (replyingTo) {
        const repliesRef = collection(db, 'userProfiles', userId, collectionName, postId, 'comments', replyingTo.id, 'replies');
        
        const newReply: Omit<Comment, 'id'> = {
          text: commentText,
          userId: firebase_auth.currentUser.uid,
          timestamp: new Date(),
          likes: [],
        };

        await addDoc(repliesRef, newReply);
        const replierName = await fetchUserName(firebase_auth.currentUser.uid);
        setComments(comments.map(comment => 
          updateCommentWithReply(comment, replyingTo.id, newReply, replierName)
        ));
      } else {
        const commentsRef = collection(db, 'userProfiles', userId, collectionName, postId, 'comments');
        
        const newComment: Omit<Comment, 'id'> = {
          text: commentText,
          userId: firebase_auth.currentUser.uid,
          timestamp: new Date(),
          likes: [],
        };

        await addDoc(commentsRef, newComment);
        const commenterName = await fetchUserName(firebase_auth.currentUser.uid);
        setComments([...comments, { ...newComment, id: comments.length.toString(), userName: commenterName, replies: [] }]);
      }
      setCommentText('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error adding comment: ', error);
    }
  };

  const updateCommentWithReply = (comment: Comment, parentId: string, reply: Omit<Comment, 'id'>, replierName: string): Comment => {
    if (comment.id === parentId) {
      return {
        ...comment,
        replies: [...(comment.replies || []), { ...reply, id: comment.replies?.length.toString() || '0', userName: replierName, replies: [] }],
      };
    }

    if (comment.replies && comment.replies.length > 0) {
      return {
        ...comment,
        replies: comment.replies.map(subReply =>
          updateCommentWithReply(subReply, parentId, reply, replierName)
        ),
      };
    }

    return comment;
  };

  const handleLikeComment = async (commentId: string, isReply = false, parentCommentId = '') => {
    const collectionName = isWorkout ? 'workouts' : 'highlights';
    const commentRef = isReply 
      ? doc(db, 'userProfiles', userId, collectionName, postId, 'comments', parentCommentId, 'replies', commentId)
      : doc(db, 'userProfiles', userId, collectionName, postId, 'comments', commentId);
    const currentUserUid = firebase_auth.currentUser.uid;

    try {
      await updateDoc(commentRef, {
        likes: arrayUnion(currentUserUid),
      });

      setComments(comments.map(comment => 
        updateCommentWithLike(comment, commentId, isReply, parentCommentId)
      ));
    } catch (error) {
      console.error('Error liking comment: ', error);
    }
  };

  const updateCommentWithLike = (comment: Comment, commentId: string, isReply: boolean, parentCommentId: string): Comment => {
    if (!isReply && comment.id === commentId) {
      return {
        ...comment,
        likes: [...comment.likes, firebase_auth.currentUser.uid],
      };
    }

    if (isReply && comment.id === parentCommentId) {
      return {
        ...comment,
        replies: comment.replies?.map(reply =>
          reply.id === commentId ? { ...reply, likes: [...reply.likes, firebase_auth.currentUser.uid] } : reply
        ),
      };
    }

    if (comment.replies && comment.replies.length > 0) {
      return {
        ...comment,
        replies: comment.replies.map(subReply =>
          updateCommentWithLike(subReply, commentId, isReply, parentCommentId)
        ),
      };
    }

    return comment;
  };

  const handleUnlikeComment = async (commentId: string, isReply = false, parentCommentId = '') => {
    const collectionName = isWorkout ? 'workouts' : 'highlights';
    const commentRef = isReply 
      ? doc(db, 'userProfiles', userId, collectionName, postId, 'comments', parentCommentId, 'replies', commentId)
      : doc(db, 'userProfiles', userId, collectionName, postId, 'comments', commentId);
    const currentUserUid = firebase_auth.currentUser.uid;

    try {
      await updateDoc(commentRef, {
        likes: arrayRemove(currentUserUid),
      });

      setComments(comments.map(comment => 
        updateCommentWithUnlike(comment, commentId, isReply, parentCommentId)
      ));
    } catch (error) {
      console.error('Error unliking comment: ', error);
    }
  };

  const updateCommentWithUnlike = (comment: Comment, commentId: string, isReply: boolean, parentCommentId: string): Comment => {
    if (!isReply && comment.id === commentId) {
      return {
        ...comment,
        likes: comment.likes.filter(uid => uid !== firebase_auth.currentUser.uid),
      };
    }

    if (isReply && comment.id === parentCommentId) {
      return {
        ...comment,
        replies: comment.replies?.map(reply =>
          reply.id === commentId ? { ...reply, likes: reply.likes.filter(uid => uid !== firebase_auth.currentUser.uid) } : reply
        ),
      };
    }

    if (comment.replies && comment.replies.length > 0) {
      return {
        ...comment,
        replies: comment.replies.map(subReply =>
          updateCommentWithUnlike(subReply, commentId, isReply, parentCommentId)
        ),
      };
    }

    return comment;
  };

  const renderComment = (comment: Comment) => {
  const liked = comment.likes.includes(firebase_auth.currentUser.uid);
  const commenterProfilePicture = userProfiles[comment.userId]?.profilePicture || defaultProfilePicture;

  return (
    <View key={comment.id} style={styles.commentContainer}>
      <View style={styles.commentRow}>
        <Image source={{ uri: commenterProfilePicture }} style={styles.profilePicture} />
        <View style={styles.commentContent}>
          <Text style={styles.commenterName}>{comment.userName}</Text>
          <Text style={styles.commentText}>{comment.text}</Text>
        </View>
      </View>
      <View style={styles.commentActions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => liked ? handleUnlikeComment(comment.id) : handleLikeComment(comment.id)}>
          <Icon name={liked ? 'heart' : 'heart-outline'} size={20} color="#000" />
          <Text style={styles.likeCount}>{comment.likes.length}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => setReplyingTo(comment)}>
          <Icon name="chatbubble-outline" size={20} color="#000" />
        </TouchableOpacity>
      </View>
      {comment.replies && comment.replies.map(reply => renderComment(reply))}
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
        renderItem={({ item }) => renderComment(item)}
        ListEmptyComponent={<Text style={styles.noCommentsText}>No comments yet. Be the first to comment!</Text>}
      />
      <View style={styles.commentInputContainer}>
        {replyingTo && (
          <Text style={styles.replyingToText}>
            Replying to {replyingTo.userName} - <Text onPress={() => setReplyingTo(null)} style={styles.cancelReplyText}>Cancel</Text>
          </Text>
        )}
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
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,  // Adds space between the like and reply buttons
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
  replyingToText: {
    marginBottom: 5,
    fontSize: 14,
    color: '#666',
  },
  cancelReplyText: {
    color: '#007bff',
  },
});

export default Comments;
