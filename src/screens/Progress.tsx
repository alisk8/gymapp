import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Alert,
  RefreshControl,
  ScrollView,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { useFocusEffect } from "@react-navigation/native";
import useMarkedDates from "../../hooks/setMarkedDates";
import { firebase_auth, db } from "../../firebaseConfig";
import {
  doc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";

const Progress = () => {
  const [selectedDate, setSelectedDate] = useState("");
  const [highlights, setHighlights] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const { markedDates, loadMonthData, clearMarkedDates } = useMarkedDates(); // use the custom hook

  useFocusEffect(
    React.useCallback(() => {
      const currentDate = new Date();
      loadMonthData(currentDate);
    }, [])
  );

  useEffect(() => {
    if (selectedDate) {
      fetchData(selectedDate);
    }
  }, [selectedDate]);

  const onRefresh = () => {
    const currentDate = new Date();
    loadMonthData(currentDate);
  };

  const fetchData = async (date) => {
    const user = firebase_auth.currentUser;
    if (user) {
      const uid = user.uid;
      const userRef = doc(db, "userProfiles", uid);

      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      // Fetch highlights
      const highlightsRef = collection(userRef, "highlights");
      const highlightsQuery = query(
        highlightsRef,
        where("createdAt", ">=", Timestamp.fromDate(startDate)),
        where("createdAt", "<=", Timestamp.fromDate(endDate))
      );
      const highlightsSnapshot = await getDocs(highlightsQuery);
      const highlightsData = highlightsSnapshot.docs.map((doc) => doc.data());

      // Fetch templates
      const templatesRef = collection(userRef, "templates");
      const templatesQuery = query(
        templatesRef,
        where("createdAt", ">=", Timestamp.fromDate(startDate)),
        where("createdAt", "<=", Timestamp.fromDate(endDate))
      );
      const templatesSnapshot = await getDocs(templatesQuery);
      const templatesData = templatesSnapshot.docs.map((doc) => doc.data());

      setHighlights(highlightsData);
      setTemplates(templatesData);
    } else {
      Alert.alert("Error", "No user is logged in");
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Calendar
        onMonthChange={(month) => {
          const newDate = new Date(month.year, month.month - 1);
          loadMonthData(newDate);
        }}
        markedDates={markedDates}
        onDayPress={(day) => setSelectedDate(day.dateString)}
      />
      <View style={styles.detailsContainer}>
        <Text style={styles.heading}>Selected Date: {selectedDate}</Text>
        {highlights.length > 0 && (
          <>
            <Text style={styles.subHeading}>Highlights:</Text>
            {highlights.map((highlight, index) => (
              <Text key={index} style={styles.detailText}>
                {highlight.detail}
              </Text>
            ))}
          </>
        )}
        {templates.length > 0 && (
          <>
            <Text style={styles.subHeading}>Templates:</Text>
            {templates.map((template, index) => (
              <Text key={index} style={styles.detailText}>
                {template.detail}
              </Text>
            ))}
          </>
        )}
        {highlights.length === 0 && templates.length === 0 && (
          <Text style={styles.detailText}>
            No highlights or templates found for this date.
          </Text>
        )}
      </View>
    </ScrollView>
  );
};

export default Progress;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  detailsContainer: {
    padding: 20,
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subHeading: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
  },
  detailText: {
    fontSize: 16,
    marginBottom: 5,
  },
});
