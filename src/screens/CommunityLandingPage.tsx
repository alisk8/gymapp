import React, {useState, useEffect, useCallback} from 'react';
import {View, Image, StyleSheet, FlatList, Text, ScrollView, TouchableOpacity} from 'react-native';
import { Avatar, Card, Input, Button  } from 'react-native-elements';
import { db, firebaseApp } from '../../firebaseConfig'; // Adjust the import path based on your project structure
import { doc, getDoc, collection, getDocs, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { useFocusEffect } from "@react-navigation/native";
import {getAuth, onAuthStateChanged} from "firebase/auth";
import Icon from 'react-native-vector-icons/FontAwesome';

const auth = getAuth(firebaseApp);

const useAuth = () => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUser(user);
            } else {
                setUser(null);
            }
        });

        return () => unsubscribe();
    }, []);

    return user;
};


const CommunityLandingPage = ({ route, navigation }) => {
    const { communityId } = route.params;
    const [communityData, setCommunityData] = useState(null);
    const [posts, setPosts] = useState([]);
    const [commentText, setCommentText] = useState({});

    const user = useAuth();
    const userId = user?.uid; // Fetch the userId of the logged-in user

    useFocusEffect(
        useCallback(() => {
            fetchCommunityData(communityId);
            fetchCommunityPosts(communityId);
        }, [])
    );


    const fetchCommunityData = async (id) => {
        try {
            const communityDoc = await getDoc(doc(db, "communities", id));
            if (communityDoc.exists()) {
                setCommunityData(communityDoc.data());
                console.log(communityDoc.data()); // Log the data fetched
            } else {
                console.log("No such document!");
            }
        } catch (error) {
            console.error("Error fetching community data: ", error);
        }
    };

    const fetchCommunityPosts = async (id) => {
        try {
            const postsSnapshot = await getDocs(collection(db, "communities", id, "posts"));
            const postsList = postsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setPosts(postsList);
        } catch (error) {
            console.error("Error fetching community posts: ", error);
        }
    };

    const handleLike = async (postId) => {
        try {
            const postRef = doc(db, "communities", communityId, "posts", postId);
            const postDoc = await getDoc(postRef);

            if (postDoc.exists()) {
                const postData = postDoc.data();
                if (postData.likes && postData.likes.includes(userId)) {
                    await updateDoc(postRef, {
                        likes: arrayRemove(userId)
                    });
                } else {
                    await updateDoc(postRef, {
                        likes: arrayUnion(userId)
                    });
                }
                fetchCommunityPosts(communityId); // Refresh the posts after liking/unliking
            }
        } catch (error) {
            console.error("Error updating likes: ", error);
        }
    };

    const handleComment = async (postId) => {
        try {
            const postRef = doc(db, "communities", communityId, "posts", postId);
            await updateDoc(postRef, {
                comments: arrayUnion({
                    userId: "exampleUserId", // Replace with the actual user ID
                    text: commentText[postId],
                    timestamp: new Date()
                })
            });
            setCommentText({ ...commentText, [postId]: "" }); // Clear the comment input
            fetchCommunityPosts(communityId); // Refresh the posts after commenting
        } catch (error) {
            console.error("Error commenting on post: ", error);
        }
    };

    if (!communityData) {
        return <Text>Loading...</Text>;
    }

    const visibility = communityData.private ? 'Private' : 'Public';
    const membersCount = communityData.members ? communityData.members.length : 0;

    return (
        <View style={styles.container}>
            <ScrollView>
            {communityData.bannerImage ? (
                <Image source={{ uri: communityData.bannerImage }} style={styles.bannerImage} />
            ) : (
                <View style={styles.bannerPlaceholder} />
            )}
            <Avatar
                source={{ uri: communityData.imageUrl }}
                rounded
                size="large"
                containerStyle={styles.profileImage}
            />
            <Text style={styles.communityName}>{communityData.name}</Text>
            <Text style={styles.communityDetails}>{visibility} · {membersCount} Members</Text>

                <TouchableOpacity
                    style={styles.createPostButton}
                    onPress={() => navigation.navigate('CommunityPostScreen', { communityId, communityName: communityData.name})}
                >
                    <Text style={styles.createPostText}>Post something...</Text>
                </TouchableOpacity>

                <FlatList
                    data={posts}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <Card>
                            <Card.Title>{item.title}</Card.Title>
                            <Card.Divider />
                            <Text>{item.content}</Text>
                            {item.image && <Image source={{ uri: item.image }} style={styles.postImage} />}
                            <View style={styles.postActions}>
                                <TouchableOpacity onPress={() => handleLike(item.id)}>
                                    <Icon
                                        name={item.likes && item.likes.includes(userId) ? "thumbs-up" : "thumbs-o-up"}
                                        size={24}
                                        color={item.likes && item.likes.includes(userId) ? "blue" : "gray"}
                                    />
                                </TouchableOpacity>
                                <Button
                                    title="Comment"
                                    type="clear"
                                    onPress={() => handleComment(item.id)}
                                />
                            </View>
                            <Input
                                placeholder="Add a comment..."
                                value={commentText[item.id] || ""}
                                onChangeText={(text) => setCommentText({ ...commentText, [item.id]: text })}
                            />
                            {item.comments && item.comments.map((comment, index) => (
                                <View key={index} style={styles.comment}>
                                    <Text style={styles.commentText}>{comment.text}</Text>
                                    <Text style={styles.commentTimestamp}>{new Date(comment.timestamp?.seconds * 1000).toLocaleString()}</Text>
                                </View>
                            ))}
                        </Card>
                    )}
                    contentContainerStyle={styles.feed}
                />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    bannerImage: {
        width: '100%',
        height: 200,
    },
    bannerPlaceholder: {
        width: '100%',
        height: 200,
        backgroundColor: '#cccccc', // Placeholder color
    },
    profileImage: {
        position: 'absolute',
        top: 150,
        left: 20,
        borderWidth: 3,
        borderColor: '#fff',
    },
    feed: {
        paddingTop: 70, // To avoid overlap with the profile picture
        paddingHorizontal: 10,
    },
    communityImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 50,
    },
    communityName: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginVertical: 10,
    },
    communityDetails: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginVertical: 5,
    },
    createPostButton: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 10,
        padding: 15,
        margin: 10,
        backgroundColor: '#fff',
    },
    postActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    createPostText: {
        color: '#999',
    },
    postImage: {
        width: '100%',
        height: 200,
        marginVertical: 10,
    },
});

export default CommunityLandingPage;
