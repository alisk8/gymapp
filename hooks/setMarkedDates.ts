import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { firebase_auth, db } from "../firebaseConfig";
import {
  doc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";

const useMarkedDates = () => {
  const [markedDates, setMarkedDates] = useState({});

  const loadMonthData = async (date) => {
    const user = firebase_auth.currentUser;
    if (user) {
      const uid = user.uid;
      const userRef = doc(db, "userProfiles", uid);

      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      startOfMonth.setHours(0, 0, 0, 0);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);
      const now = new Date();

      // Fetch highlights
      const highlightsRef = collection(userRef, "highlights");
      const highlightsQuery = query(
        highlightsRef,
        where("createdAt", ">=", Timestamp.fromDate(startOfMonth)),
        where("createdAt", "<=", Timestamp.fromDate(endOfMonth))
      );
      const highlightsSnapshot = await getDocs(highlightsQuery);
      const highlightsData = highlightsSnapshot.docs.map((doc) => ({
        ...doc.data(),
        date: doc.data().createdAt.toDate().toISOString().split("T")[0],
      }));

      // Fetch templates
      const templatesRef = collection(userRef, "templates");
      const templatesQuery = query(
        templatesRef,
        where("createdAt", ">=", Timestamp.fromDate(startOfMonth)),
        where("createdAt", "<=", Timestamp.fromDate(endOfMonth))
      );
      const templatesSnapshot = await getDocs(templatesQuery);
      const templatesData = templatesSnapshot.docs.map((doc) => ({
        ...doc.data(),
        date: doc.data().createdAt.toDate().toISOString().split("T")[0],
      }));

      const newMarkedDates = {};

      for (
        let d = new Date(startOfMonth);
        d <= endOfMonth;
        d.setDate(d.getDate() + 1)
      ) {
        const dateStr = d.toISOString().split("T")[0];
        if (d <= now) {
          newMarkedDates[dateStr] = { selected: true, selectedColor: "red" };
        }
      }

      highlightsData.forEach((highlight) => {
        newMarkedDates[highlight.date] = {
          selected: true,
          selectedColor: "green",
        };
      });

      templatesData.forEach((template) => {
        if (newMarkedDates[template.date]) {
          newMarkedDates[template.date].selectedColor = "green";
        } else {
          newMarkedDates[template.date] = {
            selected: true,
            selectedColor: "green",
          };
        }
      });

      setMarkedDates(newMarkedDates);
    } else {
      Alert.alert("Error", "No user is logged in");
    }
  };

  const clearMarkedDates = useCallback(() => {
    setMarkedDates({});
  }, []);

  return { markedDates, loadMonthData, clearMarkedDates };
};

export default useMarkedDates;
