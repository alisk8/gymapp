import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  ScrollView,
} from "react-native";
import { firebase_auth, db } from "../../firebaseConfig";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  updateDoc,
} from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

const UserDMs = ({ route, navigation }) => {
  const { userId, firstName, lastName, profilePicture } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [imageUri, setImageUri] = useState(null);
  const currentUser = firebase_auth.currentUser;
  const flatListRef = useRef(null);

  useEffect(() => {
    const q = query(
      collection(db, "messages"),
      where("senderID", "in", [currentUser.uid, userId]),
      where("receiverID", "in", [currentUser.uid, userId]),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(messagesData);

      // Update hasUnread to false for the messages received by the current user
      snapshot.docs.forEach(async (doc) => {
        if (doc.data().receiverID === currentUser.uid && doc.data().hasUnread) {
          await updateDoc(doc.ref, { hasUnread: false });
        }
      });
    });

    return () => unsubscribe();
  }, [userId]);

  const handleSend = async () => {
    if (newMessage.trim() || imageUri) {
      try {
        const messageData = {
          createdAt: new Date(),
          senderID: currentUser.uid,
          receiverID: userId,
          body: newMessage,
          imageUrl: imageUri || null,
          hasUnread: true,
        };

        // Add the message to Firestore and update state after success
        await addDoc(collection(db, "messages"), messageData);

        // Clear input fields after successful send
        setNewMessage("");
        setImageUri(null);

        // Scroll to bottom of FlatList
        flatListRef.current.scrollToEnd({ animated: true });
      } catch (error) {
        console.error("Error sending message: ", error);
      }
    }
  };

  const confirmAndSendImage = () => {
    Alert.alert(
      "Confirm Image",
      "Do you want to send this image?",
      [
        {
          text: "Cancel",
          onPress: () => {
            setImageUri(null); // Reset the image URI if canceled
          },
          style: "cancel",
        },
        {
          text: "Send",
          onPress: () => {
            handleSend();
          },
        },
      ],
      { cancelable: false }
    );
  };

  const pickImage = async () => {
    try {
      const response = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!response.canceled) {
        setImageUri(response.assets[0].uri); // Set the image URI
        confirmAndSendImage(); // Confirm and send the image
      }
    } catch (error) {
      console.error("Error picking image: ", error);
    }
  };

  const renderMessage = ({ item }) => (
    <View
      style={[
        styles.messageContainer,
        item.senderID === currentUser.uid
          ? styles.myMessage
          : styles.theirMessage,
      ]}
    >
      {item.body ? <Text style={styles.messageText}>{item.body}</Text> : null}
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.messageImage} />
      ) : null}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.scrollViewContainer}>
          <View style={styles.innerContainer}>
            <TouchableOpacity
              style={styles.header}
              onPress={() =>
                navigation.navigate("UserDetails", {
                  user: { userId, firstName, lastName, profilePicture },
                })
              }
            >
              <Image
                source={{ uri: profilePicture }}
                style={styles.profilePicture}
              />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {firstName} {lastName}
                </Text>
              </View>
            </TouchableOpacity>
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messagesList}
              onContentSizeChange={() =>
                flatListRef.current.scrollToEnd({ animated: true })
              }
              showsVerticalScrollIndicator={false}
            />
            <View style={styles.inputContainer}>
              <TouchableOpacity onPress={pickImage}>
                <Ionicons name="image-outline" size={28} color="#007AFF" />
              </TouchableOpacity>
              <TextInput
                style={styles.input}
                placeholder="Write a message..."
                value={newMessage}
                onChangeText={setNewMessage}
              />
              <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                <Text style={styles.sendButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default UserDMs;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollViewContainer: {
    flexGrow: 1,
  },
  innerContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  profilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userInfo: {
    marginLeft: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexGrow: 1,
  },
  messageContainer: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    maxWidth: "70%",
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#d1f7c4",
  },
  theirMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#e6e6e6",
  },
  messageText: {
    fontSize: 16,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    marginHorizontal: 12,
  },
  sendButton: {
    backgroundColor: "#007AFF",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 16,
  },
});
