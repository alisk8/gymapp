import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { firebase_auth, db } from "../../firebaseConfig";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";

const Messages = ({ navigation }) => {
  const [userHistories, setUserHistories] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = firebase_auth.currentUser;

  useEffect(() => {
    const fetchUserHistories = () => {
      const userIds = new Set();

      const q1 = query(
        collection(db, "messages"),
        where("senderID", "==", currentUser.uid)
      );
      const q2 = query(
        collection(db, "messages"),
        where("receiverID", "==", currentUser.uid)
      );

      const unsubscribe1 = onSnapshot(q1, (querySnapshot) => {
        querySnapshot.forEach((doc) => {
          userIds.add(doc.data().receiverID);
        });
        fetchUsers(userIds);
      });

      const unsubscribe2 = onSnapshot(q2, (querySnapshot) => {
        querySnapshot.forEach((doc) => {
          userIds.add(doc.data().senderID);
        });
        fetchUsers(userIds);
      });

      return () => {
        unsubscribe1();
        unsubscribe2();
      };
    };

    const fetchUsers = async (userIds) => {
      try {
        const userHistoriesData = await Promise.all(
          [...userIds].map(async (userId) => {
            const userRef = doc(db, "userProfiles", userId);
            const userSnap = await getDoc(userRef);
            const lastMessageDoc = await getLastMessage(
              currentUser.uid,
              userId
            );
            const lastMessage = lastMessageDoc ? lastMessageDoc.body : "";
            const createdAt = lastMessageDoc ? lastMessageDoc.createdAt : 0;
            const hasUnread = lastMessageDoc
              ? !lastMessageDoc.read &&
                lastMessageDoc.receiverID === currentUser.uid
              : false;
            return {
              id: userId,
              ...userSnap.data(),
              lastMessage,
              createdAt,
              hasUnread,
            };
          })
        );

        userHistoriesData.sort((a, b) => b.createdAt - a.createdAt);
        setUserHistories(userHistoriesData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching users: ", error);
        setLoading(false);
      }
    };

    const getLastMessage = async (currentUserId, userId) => {
      const q = query(
        collection(db, "messages"),
        where("senderID", "in", [currentUserId, userId]),
        where("receiverID", "in", [currentUserId, userId]),
        orderBy("createdAt", "desc"),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.empty ? null : querySnapshot.docs[0].data();
    };

    fetchUserHistories();
  }, [currentUser.uid]);

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          data={userHistories}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.userItem, item.hasUnread && styles.unread]}
              onPress={() =>
                navigation.navigate("UserDMs", {
                  userId: item.id,
                  firstName: item.firstName,
                  lastName: item.lastName,
                  profilePicture: item.profilePicture,
                })
              }
            >
              <Image
                source={{ uri: item.profilePicture }}
                style={styles.profilePicture}
              />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {item.firstName} {item.lastName}
                </Text>
                <Text style={styles.lastMessage}>
                  {item.lastMessage && item.lastMessage.length > 30
                    ? `${item.lastMessage.substring(0, 30)}...`
                    : item.lastMessage}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text>No message history found</Text>}
        />
      )}
    </View>
  );
};

export default Messages;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomColor: "#ccc",
    borderBottomWidth: 1,
  },
  profilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  lastMessage: {
    fontSize: 14,
    color: "#666",
  },
  unread: {
    backgroundColor: "#e6f7ff",
  },
});
