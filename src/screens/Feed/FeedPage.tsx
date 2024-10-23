import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    Image,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    TextInput,
    Modal,
    Keyboard,
} from "react-native";
import { db, firebase_auth } from "../../../firebaseConfig";
import {
    collection,
    getDocs,
    query,
    orderBy,
    limit,
    startAfter,
    doc,
    getDoc,
    updateDoc,
    arrayUnion,
    arrayRemove,
} from "@firebase/firestore";
import { InteractionManager } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import Swiper from "react-native-swiper";
import { useFocusEffect } from "@react-navigation/native";
import { Timestamp } from "firebase/firestore";


const defaultProfilePicture =
    "https://firebasestorage.googleapis.com/v0/b/gym-app-a79f9.appspot.com/o/media%2Fpfp.jpeg?alt=media&token=dd124ee9-6c61-48ad-b41c-97f3acc3350c";

const FeedPage = ({ navigation }) => {
    const [highlights, setHighlights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState(null);
    const [lastVisible, setLastVisible] = useState({});
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState(null);
    const [allUsers, setAllUsers] = useState([]);
    const [initialFetchDone, setInitialFetchDone] = useState(false);
    const [latestPostTimestamp, setLatestPostTimestamp] = useState(null);

    useEffect(() => {
        InteractionManager.runAfterInteractions(() => {
            fetchUserProfile();
            fetchUsers();
        });
    }, []);

    useEffect(() => {
        const filtered = allUsers.filter((user) => {
            const fullName = `${user.firstName?.toLowerCase()} ${user.lastName?.toLowerCase()}`;
            return fullName.includes(searchQuery.toLowerCase());
        });
        setFilteredUsers(filtered);
    }, [searchQuery, allUsers]);

    useFocusEffect(
        useCallback(() => {
            if (userProfile && !initialFetchDone) {
                fetchHighlights();
                setInitialFetchDone(true);
            }
        }, [userProfile, initialFetchDone])
    );

    const formatTotalWorkoutTime = (totalTime) => {
        const minutes = Math.floor(totalTime / 60); // Convert milliseconds to minutes
        const seconds = Math.floor((totalTime % 60)); // Get remaining seconds
        return `${minutes} mins ${seconds} secs`;
    };

    const fetchUserProfile = async () => {
        try {
            const currentUser = firebase_auth.currentUser;
            if (currentUser) {
                const userRef = doc(db, "userProfiles", currentUser.uid);
                const userDoc = await getDoc(userRef);
                setUserProfile(userDoc.exists() ? userDoc.data() : null);
            }
        } catch (error) {
            console.error("Error fetching user profile: ", error);
        }
    };

    const fetchUsers = async () => {
        try {
            const userSnapshot = await getDocs(collection(db, "userProfiles"));
            const userList = userSnapshot.docs
                .map((doc) => ({ id: doc.id, ...doc.data() }))
                .filter((user) => user.id !== firebase_auth.currentUser.uid);
            setAllUsers(userList);
            setFilteredUsers(userList);
        } catch (error) {
            console.error("Error fetching users: ", error);
        }
    };

    const handleUnlike = async (postId, userId, isWorkout) => {
        const collectionName = isWorkout ? "workouts" : "highlights";
        const postRef = doc(db, "userProfiles", userId, collectionName, postId);
        const currentUser = firebase_auth.currentUser;

        if (!currentUser) {
            console.error("User not authenticated");
            return;
        }

        const userUid = currentUser.uid;

        try {
            const postDoc = await getDoc(postRef);
            if (postDoc.exists()) {
                await updateDoc(postRef, {
                    likes: arrayRemove(userUid),
                });

                setHighlights((prevHighlights) =>
                    prevHighlights.map((post) =>
                        post.id === postId
                            ? { ...post, liked: false, likes: post.likes - 1 }
                            : post
                    )
                );
            } else {
                console.error("Post does not exist");
            }
        } catch (error) {
            console.error("Error unliking post: ", error);
        }
    };

    const fetchHighlights = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        setLoading(true);

        try {
            const following = userProfile?.following || [];
            if (following.length === 0) {
                setLoading(false);
                setRefreshing(false);
                return;
            }

            const allHighlightsAndWorkouts = [];
            let newLastVisible = { ...lastVisible };

            if (latestPostTimestamp === null){
                setLatestPostTimestamp(Timestamp.now());
            }

            for (const userId of following) {
                const userProfileData = (
                    await getDoc(doc(db, "userProfiles", userId))
                ).data();

                console.log('user data fetched', userProfileData)

                // Fetch highlights
                const highlightsQuery = query(
                    collection(db, "userProfiles", userId, "highlights"),
                    orderBy("timestamp", "desc"),
                    ...(latestPostTimestamp ? [startAfter(latestPostTimestamp)] : []), // Fetch posts only after the latest one
                    limit(10)
                );

                const highlightsSnapshot = await getDocs(highlightsQuery);

                if (highlightsSnapshot.docs.length > 0) {
                    console.log('current timestamp',latestPostTimestamp);
                    newLastVisible[userId] = {
                        ...newLastVisible[userId],
                        highlight:
                            highlightsSnapshot.docs[highlightsSnapshot.docs.length - 1],
                    };

                    highlightsSnapshot.docs.forEach((doc) => {
                        const highlightData = doc.data();
                        console.log('highlight data', highlightData);
                        allHighlightsAndWorkouts.push({
                            id: doc.id,
                            ...highlightData,
                            userId,
                            userProfileData,
                            timestamp: highlightData.timestamp?.toDate(),
                            likes: highlightData.likes?.length || 0,
                            savedBy: highlightData.savedBy?.length || 0,
                            liked: highlightData.likes?.includes(
                                firebase_auth.currentUser.uid
                            ),
                            saved: highlightData.savedBy?.includes(
                                firebase_auth.currentUser.uid
                            ),
                            type: "highlight",
                        });
                    });
                }

                // Fetch workouts similarly...
                const workoutsQuery = query(
                    collection(db, "userProfiles", userId, "workouts"),
                    orderBy("createdAt", "desc"),
                    ...(latestPostTimestamp ? [startAfter(latestPostTimestamp)] : []),
                    limit(10)
                );

                const workoutsSnapshot = await getDocs(workoutsQuery);

                if (workoutsSnapshot.docs.length > 0) {
                    console.log('current timestamp',latestPostTimestamp);
                    newLastVisible[userId] = {
                        ...newLastVisible[userId],
                        workout: workoutsSnapshot.docs[workoutsSnapshot.docs.length - 1],
                    };

                    workoutsSnapshot.docs.forEach((doc) => {
                        const workoutData = doc.data();
                        console.log('workout data', workoutData);
                        allHighlightsAndWorkouts.push({
                            id: doc.id,
                            ...workoutData,
                            userProfileData,
                            userId,
                            profilePicture:
                                userProfileData.profilePicture || defaultProfilePicture, // Add user's profile picture
                            timestamp: workoutData.createdAt?.toDate(),
                            likes: workoutData.likes?.length || 0,
                            savedBy: workoutData.savedBy?.length || 0,
                            liked: workoutData.likes?.includes(firebase_auth.currentUser.uid),
                            saved: workoutData.savedBy?.includes(
                                firebase_auth.currentUser.uid
                            ),
                            type: "workout",
                        });
                    });
                }
            }

            // Sort both highlights and workouts by timestamp in descending order
            const sortedData = allHighlightsAndWorkouts.sort(
                (a, b) => b.timestamp - a.timestamp
            );

            if (isRefresh) {
                setHighlights(sortedData); // Replace old data with new sorted data
            } else {
                setHighlights([...highlights, ...sortedData]); // Append to the existing highlights
            }


            setLastVisible(newLastVisible);
            setLoading(false);
            setRefreshing(false);
        } catch (error) {
            console.error("Error fetching highlights and workouts: ", error);
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleLike = async (postId, userId, isLiked, itemType) => {
        let postRef = null;
        if (itemType !== 'workout'){
            postRef = doc(db, "userProfiles", userId, "highlights", postId);
        }
        else{
            postRef = doc(db, "userProfiles", userId, "workouts", postId);
        }
        const currentUser = firebase_auth.currentUser;

        if (!currentUser) return;

        const updateLikes = isLiked ? arrayRemove : arrayUnion;
        try {
            await updateDoc(postRef, { likes: updateLikes(currentUser.uid) });
            setHighlights((prevHighlights) =>
                prevHighlights.map((post) =>
                    post.id === postId
                        ? {
                            ...post,
                            liked: !isLiked,
                            likes: post.likes + (isLiked ? -1 : 1),
                        }
                        : post
                )
            );
        } catch (error) {
            console.error("Error updating like: ", error);
        }
    };

    const handleSave = async (postId, userId, isSaved) => {
        const postRef = doc(db, "userProfiles", userId, "highlights", postId);
        const currentUser = firebase_auth.currentUser;
        const userRef = doc(db, "userProfiles", currentUser.uid);

        if (!currentUser) return;

        const updateSaved = isSaved ? arrayRemove : arrayUnion;
        try {
            await updateDoc(postRef, { savedBy: updateSaved(currentUser.uid) });
            await updateDoc(userRef, {
                savedPosts: updateSaved({ collection: "highlights", postId, userId }),
            });
            setHighlights((prevHighlights) =>
                prevHighlights.map((post) =>
                    post.id === postId
                        ? {
                            ...post,
                            saved: !isSaved,
                            savedBy: post.savedBy + (isSaved ? -1 : 1),
                        }
                        : post
                )
            );
        } catch (error) {
            console.error("Error updating save: ", error);
        }
    };

    const handleUnsave = async (postId, userId, isWorkout) => {
        const collectionName = isWorkout ? "workouts" : "highlights";
        const postRef = doc(db, "userProfiles", userId, collectionName, postId);
        const currentUser = firebase_auth.currentUser;
        const userRef = doc(db, "userProfiles", currentUser.uid);

        if (!currentUser) {
            console.error("User not authenticated");
            return;
        }

        const userUid = currentUser.uid;

        try {
            const postDoc = await getDoc(postRef);
            if (postDoc.exists()) {
                await updateDoc(postRef, {
                    savedBy: arrayRemove(userUid),
                });

                await updateDoc(userRef, {
                    savedPosts: arrayRemove({
                        collection: collectionName,
                        postId,
                        userId,
                    }),
                });

                setHighlights((prevHighlights) =>
                    prevHighlights.map((post) =>
                        post.id === postId
                            ? { ...post, saved: false, savedBy: post.savedBy - 1 }
                            : post
                    )
                );
            } else {
                console.error("Post does not exist");
            }
        } catch (error) {
            console.error("Error unsaving post: ", error);
        }
    };

    const handleComment = (postId, userId, isWorkout) => {
        navigation.navigate("Comments", { postId, userId, isWorkout });
    };

    const openModal = (mediaUrl) => {
        setSelectedMedia(mediaUrl);
        setIsModalVisible(true);
    };

    const closeModal = () => setIsModalVisible(false);

    const renderUserList = useCallback(
        ({ item }) => (
            <TouchableOpacity
                style={styles.userItem}
                onPress={() => navigation.navigate("UserDetails", { user: item })}
            >
                <Text style={styles.userName}>
                    {item.firstName} {item.lastName}
                </Text>
            </TouchableOpacity>
        ),
        [navigation]
    );

    const renderItem = useCallback(({ item }) => {
        if (item.type === "workout") {
            if (
                typeof item.totalWorkoutTime === "undefined" ||
                item.totalWorkoutTime === null
            ) {
                console.log("totalWorkoutTime is undefined or null for item:", item.id);
                return null;
            }

            const totalSets = item.exercises.reduce(
                (acc, exercise) => acc + (exercise.sets ? exercise.sets.length : 0),
                0
            );
            const elapsedTime = formatTotalWorkoutTime(item.totalWorkoutTime);

            const getBestSet = (sets) => {
                if (!sets || sets.length === 0) return null;

                return sets.reduce((bestSet, currentSet) => {
                    if (currentSet.weight > bestSet.weight) {
                        return currentSet;
                    } else if (
                        currentSet.weight === bestSet.weight &&
                        currentSet.reps > bestSet.reps
                    ) {
                        return currentSet;
                    }
                    return bestSet;
                });
            };

            console.log('item', item);

            return (
                <View style={styles.highlightContainer}>
                    <View style={styles.userInfoContainer}>

                        <TouchableOpacity
                            onPress={() => navigation.navigate("UserDetails", { user: item.userProfileData })}
                        >
                            <Image
                                source={{ uri: item.userProfileData.profilePicture }}
                                style={styles.profilePicture}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => navigation.navigate("UserDetails", { user: item.userProfileData })}
                        >
                            <Text style={styles.userNameText}>
                                {item.userProfileData.firstName} {item.userProfileData.lastName}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {item.workoutDescription && (
                        <Text style={styles.descriptionText}>
                            {item.workoutDescription}
                        </Text>
                    )}
                    <View style={styles.metricsContainer}>
                        <Text style={styles.metricText}>{`Total Sets: ${totalSets}`}</Text>
                        <Text
                            style={styles.metricText}
                        >{`Workout Time: ${elapsedTime}`}</Text>
                    </View>
                    <Text style={styles.exerciseHeader}>{item.title}</Text>
                    {item.exercises && item.exercises.length > 0 ? (
                        <View style={styles.exerciseNamesContainer}>
                            {item.exercises.map((exercise, index) => {
                                const bestSet = getBestSet(exercise.sets);
                                if (!bestSet) {
                                    return (
                                        <Text key={index} style={styles.bestSetText}>
                                            No sets available
                                        </Text>
                                    );
                                }

                                return (
                                    <View key={index} style={styles.exerciseItemContainer}>
                                        <Text style={styles.exerciseNameText}>{exercise.name}</Text>
                                        <Text
                                            style={styles.bestSetText}
                                        >{`Total Sets: ${exercise.sets.length}`}</Text>
                                        <Text style={styles.bestSetText}>
                                            {`Best Set: ${bestSet.weight} ${exercise.weightUnit} x ${
                                                exercise.repsUnit === "time"
                                                    ? `${Math.floor(
                                                        bestSet.reps / 60000
                                                    )} mins ${Math.floor(
                                                        (bestSet.reps % 60000) / 1000
                                                    )} secs`
                                                    : `${bestSet.reps} ${exercise.repsUnit}`
                                            }`}
                                        </Text>

                                        {exercise.isSuperset && exercise.supersetExercise && (
                                            <Text style={styles.supersetText}>
                                                {`Superset with: ${exercise.supersetExercise}`}
                                            </Text>
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    ) : (
                        <Text style={styles.bestSetText}>No exercises available</Text>
                    )}
                    {item.mediaUrls && item.mediaUrls.length > 0 && (
                        <View style={styles.imageContainer}>
                            <Swiper style={styles.swiper} showsPagination={true}>
                                {item.mediaUrls.map((mediaUrl, index) => (
                                    <TouchableOpacity
                                        key={`${item.id}_${index}`}
                                        onPress={() => openModal(mediaUrl)}
                                    >
                                        <Image
                                            source={{ uri: mediaUrl }}
                                            style={styles.postImage}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </Swiper>
                        </View>
                    )}

                    {item.timestamp && (
                        <Text style={styles.timestampText}>
                            {new Date(item.timestamp).toLocaleDateString()}
                        </Text>
                    )}
                    <View style={styles.actionButtonsContainer}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() =>
                                item.liked
                                    ? handleUnlike(item.id, item.userId, true)
                                    : handleLike(item.id, item.userId, false, item.type)
                            }
                        >
                            <Icon
                                name={item.liked ? "heart" : "heart-outline"}
                                size={25}
                                color="#000"
                            />
                            <Text style={styles.actionText}>{item.likes}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleComment(item.id, item.userId, true)}
                        >
                            <Icon name="chatbubble-outline" size={25} color="#000" />
                            <Text style={styles.actionText}>{item.commentCount}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() =>
                                item.saved
                                    ? handleUnsave(item.id, item.userId, true)
                                    : handleSave(item.id, item.userId, true)
                            }
                        >
                            <Icon
                                name={item.saved ? "bookmark" : "bookmark-outline"}
                                size={25}
                                color="#000"
                            />
                            <Text style={styles.actionText}>{item.savedBy}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        } else {
            return (
                <View style={styles.highlightContainer}>
                    <View style={styles.userInfoContainer}>
                        <TouchableOpacity
                            onPress={() =>
                                navigation.navigate("UserDetails", {
                                    user: item.userProfileData,
                                })
                            }
                        >
                            <Image
                                source={{
                                    uri:
                                        item.userProfileData?.profilePicture ||
                                        defaultProfilePicture,
                                }}
                                style={styles.profilePicture}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() =>
                                navigation.navigate("UserDetails", {
                                    user: item.userProfileData,
                                })
                            }
                        >
                            <Text style={styles.userNameText}>
                                {item.userProfileData?.firstName}{" "}
                                {item.userProfileData?.lastName}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    {item.caption && (
                        <Text style={styles.captionText}>{item.caption}</Text>
                    )}
                    {item.mediaUrls?.length > 0 && (
                        <Swiper style={styles.swiper} showsPagination={true}>
                            {item.mediaUrls.map((mediaUrl, index) => (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => openModal(mediaUrl)}
                                >
                                    <Image source={{ uri: mediaUrl }} style={styles.postImage} />
                                </TouchableOpacity>
                            ))}
                        </Swiper>
                    )}
                    <Text style={styles.timestampText}>
                        {item.timestamp?.toLocaleDateString()}
                    </Text>
                    <View style={styles.actionButtonsContainer}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() =>
                                item.liked
                                    ? handleUnlike(item.id, item.userId, false)
                                    : handleLike(item.id, item.userId, false, item.type)
                            }
                        >
                            <Icon
                                name={item.liked ? "heart" : "heart-outline"}
                                size={25}
                                color="#000"
                            />
                            <Text style={styles.actionText}>{item.likes}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleComment(item.id, item.userId, false)}
                        >
                            <Icon name="chatbubble-outline" size={25} color="#000" />
                            <Text style={styles.actionText}>{item.commentCount || 0}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() =>
                                item.saved
                                    ? handleUnsave(item.id, item.userId, false)
                                    : handleSave(item.id, item.userId, false)
                            }
                        >
                            <Icon
                                name={item.saved ? "bookmark" : "bookmark-outline"}
                                size={25}
                                color="#000"
                            />
                            <Text style={styles.actionText}>{item.savedBy}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }
    }, []);

    if (loading) {
        return (
            <ActivityIndicator
                size="large"
                color="#0000ff"
                style={styles.loadingContainer}
            />
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchBar}
                    placeholder="Search for users..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity
                        onPress={() => {
                            setSearchQuery("");
                            Keyboard.dismiss();
                        }}
                    >
                        <Icon
                            name="close-circle"
                            size={24}
                            color="#888"
                            style={styles.clearIcon}
                        />
                    </TouchableOpacity>
                )}
            </View>
            <FlatList
                data={searchQuery ? filteredUsers : highlights}
                keyExtractor={(item) => item.id}
                renderItem={searchQuery ? renderUserList : renderItem}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => fetchHighlights(true)}
                    />
                }
            />
            {isModalVisible && selectedMedia && (
                <Modal visible={isModalVisible} transparent={true}>
                    <View style={styles.modalContainer}>
                        <TouchableOpacity
                            onPress={closeModal}
                            style={styles.modalCloseButton}
                        >
                            <Icon name="close" size={30} color="#fff" />
                        </TouchableOpacity>
                        <Image
                            source={{ uri: selectedMedia }}
                            style={styles.fullscreenImage}
                        />
                    </View>
                </Modal>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    profilePicture: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
    userNameText: { fontSize: 16, fontFamily: "Rubik-Bold", color: "#000"},
    swiper: { height: 300 },
    highlightContainer: {
        padding: 15,
        backgroundColor: "white",
        borderRadius: 10,
        marginBottom: 20,
    },
    actionButtonsContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: "#ccc",
    },
    actionButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 15,
    },
    actionText: {
        marginLeft: 5,
        fontSize: 14,
        fontFamily: "Inter-Regular",
        color: "#000",
    },
    loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
    modalContainer: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        justifyContent: "center",
        alignItems: "center",
    },
    fullscreenImage: { width: "100%", height: "80%" },
    modalCloseButton: { position: "absolute", top: 40, right: 20, zIndex: 1 },
    timestampText: {
        fontSize: 12,
        fontFamily: "Inter-Regular",
        color: "#888",
        marginTop: 10,
        alignSelf: "flex-end",
    },
    postImage: {
        width: "100%",
        height: 300,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#000",
    },
    captionText: {
        fontSize: 16,
        fontFamily: "Rubik-Bold",
        marginVertical: 5,
        color: "#333",
    },
    userInfoContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    userItem: {
        padding: 12,
        borderBottomColor: "#ccc",
        borderBottomWidth: 1,
    },
    userName: {
        fontSize: 16,
        fontFamily: "Inter-Regular",
        color: "#000",
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderColor: "#ccc",
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 8,
        marginBottom: 16,
        marginHorizontal: 15,
        marginTop: 10,
        backgroundColor: "#fff",
    },
    searchBar: {
        flex: 1,
        height: 40,
        color: "#000",
    },
    clearIcon: {
        paddingLeft: 8,
    },
    imageContainer: {
        marginTop: 10,
        borderRadius: 10,
        overflow: "hidden", // Ensures images within the container don't overflow
    },
    bestSetText: {
        fontSize: 14,
        fontFamily: "Inter-Regular",
        color: "#555",
        marginTop: 2,
        fontWeight: "bold",
    },
    supersetText: {
        fontSize: 14,
        fontFamily: "Inter-Regular",
        color: "#888",
        marginTop: 2,
    },
    exerciseNameText: {
        fontSize: 16,
        fontFamily: "Rubik-Bold",
        fontWeight: "bold",
        color: "#016e03",
    },
    exerciseItemContainer: {
        padding: 10,
        borderRadius: 5,
        marginBottom: 5,
        backgroundColor: "#F3F3F3",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
    },
    exerciseNamesContainer: {
        paddingHorizontal: 10,
        marginBottom: 10,
    },
    exerciseHeader: {
        fontSize: 16,
        fontFamily: "Rubik-Bold",
        marginBottom: 5,
        color: "#333",
    },
    metricText: {
        fontSize: 14,
        fontFamily: "Inter-SemiBold",
        color: "#016e03",
        fontWeight: "bold",
        marginBottom: 2,
    },
    metricsContainer: {
        marginBottom: 10,
        flexDirection: "column", // Display metrics in a column
    },
    descriptionText: {
        fontSize: 14,
        fontFamily: "Inter-Regular",
        color: "#666",
        marginBottom: 10,
    },
});

export default FeedPage;