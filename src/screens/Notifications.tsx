import React from "react";
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Dummy notifications data
const notifications = [
  {
    id: 1,
    message: "John Liked your post",
    timestamp: new Date("2024-04-24T10:00:00Z"),
  },
  {
    id: 6,
    message: "Neil has requested to join Henry Crown Community",
    timestamp: new Date("2024-04-24T18:00:00Z"),
  },
  {
    id: 2,
    message: "Alejandro wants to be your friend",
    timestamp: new Date("2024-04-15T09:30:00Z"),
  },
  {
    id: 3,
    message: "New Post from XXXXX",
    timestamp: new Date("2024-03-25T08:45:00Z"),
  },
  {
    id: 4,
    message: "Notification 4",
    timestamp: new Date("2023-04-25T10:00:00Z"),
  },
  {
    id: 5,
    message: "Notification 5",
    timestamp: new Date("2020-04-25T10:00:00Z"),
  },
  {
    id: 1,
    message: "John Liked your post",
    timestamp: new Date("2024-04-24T10:00:00Z"),
  },
  {
    id: 6,
    message: "Neil has requested to join Henry Crown Community",
    timestamp: new Date("2024-04-24T18:00:00Z"),
  },
  {
    id: 2,
    message: "Alejandro wants to be your friend",
    timestamp: new Date("2024-04-15T09:30:00Z"),
  },
  {
    id: 3,
    message: "New Post from XXXXX",
    timestamp: new Date("2024-03-25T08:45:00Z"),
  },
  {
    id: 4,
    message: "Notification 4",
    timestamp: new Date("2023-04-25T10:00:00Z"),
  },
  {
    id: 5,
    message: "Notification 5",
    timestamp: new Date("2020-04-25T10:00:00Z"),
  },
  {
    id: 1,
    message: "John Liked your post",
    timestamp: new Date("2024-04-24T10:00:00Z"),
  },
  {
    id: 6,
    message: "Neil has requested to join Henry Crown Community",
    timestamp: new Date("2024-04-24T18:00:00Z"),
  },
  {
    id: 2,
    message: "Alejandro wants to be your friend",
    timestamp: new Date("2024-04-15T09:30:00Z"),
  },
  {
    id: 3,
    message: "New Post from XXXXX",
    timestamp: new Date("2024-03-25T08:45:00Z"),
  },
  {
    id: 4,
    message: "Notification 4",
    timestamp: new Date("2023-04-25T10:00:00Z"),
  },
  {
    id: 5,
    message: "Notification 5",
    timestamp: new Date("2020-04-25T10:00:00Z"),
  },
];

const Notifications = () => {
  const renderItem = ({ item }) => {
    const timeDiff = Math.floor((Date.now() - item.timestamp.getTime()) / 1000); // Time difference in seconds
    const minutes = Math.floor(timeDiff / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    let timeAgo = "";
    if (minutes < 60) {
      timeAgo = `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
    } else if (hours < 24) {
      timeAgo = `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    } else if (days < 7) {
      timeAgo = `${days} day${days !== 1 ? "s" : ""} ago`;
    } else if (weeks < 4) {
      timeAgo = `${weeks} week${weeks !== 1 ? "s" : ""} ago`;
    } else if (months < 12) {
      timeAgo = `${months} month${months !== 1 ? "s" : ""} ago`;
    } else {
      timeAgo = `${years} year${years !== 1 ? "s" : ""} ago`;
    }

    const truncatedMessage =
      item.message.length > 40
        ? item.message.substring(0, 40) + "..."
        : item.message;

    return (
      <TouchableOpacity
        onPress={() => console.log("Notification pressed:", item.message)}
      >
        <View style={styles.notification}>
          <Ionicons
            name="notifications"
            size={24}
            color="black"
            style={styles.icon}
          />
          <View>
            <Text style={styles.text}>{truncatedMessage}</Text>
            <Text style={styles.timestamp}>{timeAgo}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={notifications}
      renderItem={renderItem}
      keyExtractor={(item) => item.id.toString()}
    />
  );
};

const styles = StyleSheet.create({
  notification: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    backgroundColor: "white",
  },
  icon: {
    marginRight: 10,
  },
  text: {
    color: "black",
  },
  timestamp: {
    color: "#999",
    fontSize: 12,
    marginTop: 2,
  },
});

export default Notifications;
