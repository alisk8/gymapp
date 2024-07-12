import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { firebase_auth, db } from "../../firebaseConfig";
import { doc, collection, getDocs } from "firebase/firestore";
import { LineChart, BarChart } from "react-native-chart-kit";
import { Picker } from "@react-native-picker/picker";

const screenWidth = Dimensions.get("window").width;

const TrackedExercise = ({ route }) => {
  const { exercise } = route.params;
  const [exerciseInstances, setExerciseInstances] = useState([]);
  const [showInstances, setShowInstances] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [months, setMonths] = useState([]);
  const [mostDataMonth, setMostDataMonth] = useState("");

  useEffect(() => {
    fetchExerciseInstances();
  }, []);

  useEffect(() => {
    if (exerciseInstances.length > 0) {
      const uniqueMonths = [
        ...new Set(
          exerciseInstances.map((inst) => inst.workoutDate.slice(0, 7))
        ),
      ];
      setMonths(uniqueMonths);

      const monthDataCounts = uniqueMonths.map(
        (month) =>
          exerciseInstances.filter((inst) => inst.workoutDate.startsWith(month))
            .length
      );

      const maxDataMonth =
        uniqueMonths[monthDataCounts.indexOf(Math.max(...monthDataCounts))];
      setMostDataMonth(maxDataMonth);
      setSelectedMonth(maxDataMonth);
    }
  }, [exerciseInstances]);

  const fetchExerciseInstances = async () => {
    const user = firebase_auth.currentUser;
    if (user) {
      // const uid = user.uid;
      const uid = "X1Nx52EQsHbEOz5mQyVmFum704X2";
      const workoutsRef = collection(db, "userProfiles", uid, "workouts");
      const workoutsSnapshot = await getDocs(workoutsRef);

      const instances = [];
      workoutsSnapshot.docs.forEach((workoutDoc) => {
        const workoutData = workoutDoc.data();
        workoutData.exercises.forEach((ex) => {
          if (ex.name === exercise.name) {
            instances.push({
              ...ex,
              workoutDate: workoutData.createdAt
                .toDate()
                .toISOString()
                .split("T")[0],
            });
          }
        });
      });

      setExerciseInstances(instances);
    } else {
      alert("Error");
    }
  };

  // Helper function to calculate one rep max using Epley formula
  const calculateOneRepMax = (weight, reps) => weight * (1 + reps / 30);

  // Helper function to process data for charts
  const processDataForCharts = () => {
    const dataByDate = {};

    exerciseInstances.forEach((instance) => {
      const { workoutDate, sets } = instance;
      if (workoutDate.startsWith(selectedMonth)) {
        if (!dataByDate[workoutDate]) {
          dataByDate[workoutDate] = {
            totalWeight: 0,
            totalReps: 0,
            totalSets: 0,
            oneRepMaxes: [],
            instanceCount: 0,
          };
        }
        sets.forEach((set) => {
          const reps = parseInt(set.reps.replace(" reps", ""), 10);
          let weight =
            set.weight === "BW"
              ? 150
              : parseInt(set.weight.replace(" lbs", ""), 10);
          const oneRepMax = calculateOneRepMax(weight, reps);
          dataByDate[workoutDate].totalWeight += weight * reps;
          dataByDate[workoutDate].totalReps += reps;
          dataByDate[workoutDate].totalSets += 1;
          dataByDate[workoutDate].oneRepMaxes.push(oneRepMax);
        });
        dataByDate[workoutDate].instanceCount += 1;
      }
    });

    const dates = Object.keys(dataByDate).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );
    const oneRepMaxAverages = dates.map(
      (date) =>
        dataByDate[date].oneRepMaxes.reduce((a, b) => a + b, 0) /
        dataByDate[date].oneRepMaxes.length
    );
    const setsTimesRepsAverages = dates.map(
      (date) => dataByDate[date].totalReps / dataByDate[date].totalSets
    );
    const totalVolume = dates.map((date) => dataByDate[date].totalWeight);
    const instanceCounts = dates.map((date) => dataByDate[date].instanceCount);

    return {
      dates,
      oneRepMaxAverages,
      setsTimesRepsAverages,
      totalVolume,
      instanceCounts,
    };
  };

  const {
    dates,
    oneRepMaxAverages,
    setsTimesRepsAverages,
    totalVolume,
    instanceCounts,
  } = processDataForCharts();

  const hasData = dates.length > 0;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>{exercise.name} Progress</Text>
      <Picker
        selectedValue={selectedMonth}
        style={styles.picker}
        onValueChange={(itemValue) => setSelectedMonth(itemValue)}
      >
        {months.map((month) => (
          <Picker.Item key={month} label={month} value={month} />
        ))}
      </Picker>
      <TouchableOpacity
        style={styles.showButton}
        onPress={() => setShowInstances(!showInstances)}
      >
        <Text style={styles.showButtonText}>
          {showInstances ? "Hide Instances" : "Show All Instances of Exercise"}
        </Text>
      </TouchableOpacity>
      {showInstances && (
        <View style={styles.instancesContainer}>
          {exerciseInstances.map((item, index) => (
            <View key={index} style={styles.card}>
              <Text style={styles.dateText}>Date: {item.workoutDate}</Text>
              {item.sets.map((set, setIndex) => (
                <View key={setIndex} style={styles.setContainer}>
                  <Text style={styles.detailText}>
                    Set {setIndex + 1}:{" "}
                    {parseInt(set.reps.replace(" reps", ""), 10)} reps,{" "}
                    {set.weight === "BW"
                      ? 150
                      : parseInt(set.weight.replace(" lbs", ""), 10)}{" "}
                    weight
                  </Text>
                  {set.dropSets &&
                    set.dropSets.map((dropset, dropsetIndex) => (
                      <Text key={dropsetIndex} style={styles.dropsetText}>
                        Dropset {dropsetIndex + 1}:{" "}
                        {parseInt(dropset.reps.replace(" reps", ""), 10)} reps,{" "}
                        {dropset.weight === "BW"
                          ? 150
                          : parseInt(
                              dropset.weight.replace(" lbs", ""),
                              10
                            )}{" "}
                        weight
                      </Text>
                    ))}
                </View>
              ))}
            </View>
          ))}
        </View>
      )}
      {hasData ? (
        <>
          <Text style={styles.chartTitle}>One Rep Max Averages Over Time</Text>
          <LineChart
            data={{
              labels: dates.map((date) => date.slice(8, 10)), // Display only day
              datasets: [
                {
                  data: oneRepMaxAverages,
                },
              ],
            }}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
            bezier
          />
          <Text style={styles.axisLabel}>Date</Text>
          <Text style={styles.chartTitle}>Sets x Reps Averages Over Time</Text>
          <LineChart
            data={{
              labels: dates.map((date) => date.slice(8, 10)), // Display only day
              datasets: [
                {
                  data: setsTimesRepsAverages,
                },
              ],
            }}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
            bezier
          />
          <Text style={styles.axisLabel}>Date</Text>
          <Text style={styles.chartTitle}>Total Volume Lifted Over Time</Text>
          <LineChart
            data={{
              labels: dates.map((date) => date.slice(8, 10)), // Display only day
              datasets: [
                {
                  data: totalVolume,
                },
              ],
            }}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
            bezier
          />
          <Text style={styles.axisLabel}>Date</Text>
          <Text style={styles.chartTitle}>Frequency of Exercise</Text>
          <BarChart
            data={{
              labels: dates.map((date) => date.slice(8, 10)), // Display only day
              datasets: [
                {
                  data: instanceCounts,
                },
              ],
            }}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
            yAxisLabel=""
            yAxisSuffix=" instances"
          />
          <Text style={styles.axisLabel}>Date</Text>
        </>
      ) : (
        <Text style={styles.noDataText}>
          No data available for this exercise.
        </Text>
      )}
    </ScrollView>
  );
};

export default TrackedExercise;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  heading: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  picker: {
    height: 50,
    width: 150,
    alignSelf: "center",
    marginVertical: 10,
    marginBottom: 150,
  },
  showButton: {
    backgroundColor: "#6A0DAD",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: "center",
    marginVertical: 10,
  },
  showButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  instancesContainer: {
    marginVertical: 20,
  },
  card: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    marginVertical: 5,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  setContainer: {
    marginTop: 10,
  },
  detailText: {
    fontSize: 16,
    color: "#555",
    marginBottom: 5,
  },
  dropsetText: {
    fontSize: 14,
    color: "#888",
    marginLeft: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    textAlign: "center",
  },
  noDataText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    textAlign: "center",
    color: "#888",
  },
  axisLabel: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
});

const chartConfig = {
  backgroundColor: "#022173",
  backgroundGradientFrom: "#1E2923",
  backgroundGradientTo: "#08130D",
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: "6",
    strokeWidth: "2",
    stroke: "#ffa726",
  },
};
