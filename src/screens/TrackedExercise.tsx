import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import moment from "moment";
import { LineChart } from "react-native-gifted-charts";
import StaticSafeAreaInsets from "react-native-static-safe-area-insets";

const screenWidth = Dimensions.get("window").width;

const months = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

const TrackedExercise = ({ route }) => {
  const { exercise, allData } = route.params;
  const [exerciseInstances, setExerciseInstances] = useState([]);
  const [showInstances, setShowInstances] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear] = useState(new Date().getFullYear());
  const [cumulativeVolume, setCumulativeVolume] = useState(0);

  useEffect(() => {
    filterExerciseInstances();
  }, [exercise, allData]);

  useEffect(() => {
    updateCumulativeVolume();
  }, [exerciseInstances, selectedMonth]);

  const filterExerciseInstances = () => {
    const instances = [];

    allData.workouts.forEach((workout) => {
      workout.exercises.forEach((ex) => {
        if (ex.name === exercise.name) {
          instances.push({
            ...ex,
            workoutDate: workout.date,
          });
        }
      });
    });

    setExerciseInstances(instances);
  };

  const calculateCumulativeVolume = (instances) => {
    let totalVolume = 0;
    instances.forEach((instance) => {
      instance.sets.forEach((set) => {
        const reps = set.reps;
        const weight = set.weight;
        totalVolume += weight * reps;
      });
    });
    return totalVolume;
  };

  const calculateOneRepMax = (weight, reps) => weight * (1 + reps / 30);

  const filterDataByMonthYear = (data, month) => {
    return data.filter((item) => {
      const itemDate = new Date(item.date);
      return (
          itemDate.getMonth() === month && itemDate.getFullYear() === selectedYear
      );
    });
  };

  const processDataForCharts = () => {
    const dataByDate = {};

    exerciseInstances.forEach((instance) => {
      const { workoutDate, sets } = instance;
      if (!dataByDate[workoutDate]) {
        dataByDate[workoutDate] = {
          totalWeight: 0,
          totalReps: 0,
          totalSets: 0,
          maxOneRepMax: 0,
          instanceCount: 0,
        };
      }
      sets.forEach((set) => {
        const reps = set.reps;
        const weight = set.weight;
        const oneRepMax = calculateOneRepMax(weight, reps);
        dataByDate[workoutDate].totalWeight += weight * reps;
        dataByDate[workoutDate].totalReps += reps;
        dataByDate[workoutDate].totalSets += 1;
        dataByDate[workoutDate].maxOneRepMax = Math.max(
            dataByDate[workoutDate].maxOneRepMax,
            oneRepMax
        );
      });
      dataByDate[workoutDate].instanceCount += 1;
    });

    const dates = Object.keys(dataByDate).sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );
    const oneRepMaxAverages = dates.map((date) =>
        Math.round(dataByDate[date].maxOneRepMax)
    );
    const setsTimesRepsAverages = dates.map((date) =>
        Math.round(dataByDate[date].totalReps / dataByDate[date].totalSets)
    );
    const totalVolume = dates.map((date) => dataByDate[date].totalWeight);
    const instanceCounts = dates.map((date) => dataByDate[date].instanceCount);

    return {
      dates,
      oneRepMaxAverages: oneRepMaxAverages.map((value, index) => ({
        date: dates[index],
        value,
      })),
      setsTimesRepsAverages: setsTimesRepsAverages.map((value, index) => ({
        date: dates[index],
        value,
      })),
      totalVolume: totalVolume.map((value, index) => ({
        date: dates[index],
        value,
      })),
      instanceCounts: instanceCounts.map((value, index) => ({
        date: dates[index],
        value,
      })),
    };
  };

  const {
    oneRepMaxAverages,
    setsTimesRepsAverages,
    totalVolume,
    instanceCounts,
  } = processDataForCharts();

  const filteredOneRepMaxAverages =
      selectedMonth !== null
          ? filterDataByMonthYear(oneRepMaxAverages, selectedMonth)
          : oneRepMaxAverages;

  const filteredSetsTimesRepsAverages =
      selectedMonth !== null
          ? filterDataByMonthYear(setsTimesRepsAverages, selectedMonth)
          : setsTimesRepsAverages;

  const filteredTotalVolume =
      selectedMonth !== null
          ? filterDataByMonthYear(totalVolume, selectedMonth)
          : totalVolume;

  const filteredInstanceCounts =
      selectedMonth !== null
          ? filterDataByMonthYear(instanceCounts, selectedMonth)
          : instanceCounts;

  const hasData = filteredOneRepMaxAverages.length > 0;

  const updateCumulativeVolume = () => {
    const relevantData =
        selectedMonth !== null
            ? filterDataByMonthYear(exerciseInstances, selectedMonth)
            : exerciseInstances;

    const volume = calculateCumulativeVolume(relevantData);
    setCumulativeVolume(volume);
  };

  return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <Text style={styles.heading}>{exercise.name}</Text>
          {selectedMonth !== null && (
              <Text style={styles.selectedMonthText}>
                Showing data for {months[selectedMonth]} {selectedYear}
              </Text>
          )}

          <Text style={styles.cumulativeText}>
            Cumulative Volume Lifted:{"\n"}
            <Text style={styles.cumulativeValue}>{cumulativeVolume}</Text> lbs
          </Text>

          <View style={styles.centerButtonContainer}>
            <TouchableOpacity
                style={styles.showButton}
                onPress={() => setShowInstances(!showInstances)}
            >
              <Text style={styles.showButtonText}>
                {showInstances ? "Hide Instances" : "Show All Instances"}
              </Text>
            </TouchableOpacity>
          </View>

          {showInstances && (
              <View style={styles.instancesContainer}>
                {exerciseInstances.map((item) => (
                    <View key={item.id} style={styles.card}>
                      <Text style={styles.dateText}>
                        Date: {moment(item.workoutDate).format("MMM D, YYYY")}
                      </Text>
                      {item.sets.map((set, setIndex) => (
                          <View key={setIndex} style={styles.setContainer}>
                            <Text style={styles.detailText}>
                              Set {setIndex + 1}: {set.reps} reps, {set.weight}{" "}
                              {item.weightUnit}
                            </Text>
                          </View>
                      ))}
                    </View>
                ))}
              </View>
          )}

          {hasData ? (
              <>
                <Text style={styles.chartTitle}>
                  One Rep Max Averages Over Time
                </Text>
                <View style={styles.chartContainer}>
                  <LineChart
                      data={filteredOneRepMaxAverages.map(({ value, date }) => ({
                        value,
                        label: moment(date).format("MMM D"),
                      }))}
                      areaChart
                      height={250}
                      width={screenWidth - 60}
                      color="#4484B2"
                      thickness={4}
                      dataPointsColor={"#4484B2"}
                      isAnimated
                      animationDuration={800}
                      showStripOnFocus
                      showTextOnFocus
                      focusedDataPointColor="blue"
                  />
                </View>

                <Text style={styles.chartTitle}>
                  Sets x Reps Averages Over Time
                </Text>
                <View style={styles.chartContainer}>
                  <LineChart
                      data={filteredSetsTimesRepsAverages.map(({ value, date }) => ({
                        value,
                        label: moment(date).format("MMM D"),
                      }))}
                      areaChart
                      height={250}
                      width={screenWidth - 60}
                      color="#4484B2"
                      thickness={4}
                      dataPointsColor={"#4484B2"}
                      isAnimated
                      animationDuration={800}
                      showStripOnFocus
                      showTextOnFocus
                      focusedDataPointColor="blue"
                  />
                </View>

                <Text style={styles.chartTitle}>Total Volume Lifted Over Time</Text>
                <View style={styles.chartContainer}>
                  <LineChart
                      data={filteredTotalVolume.map(({ value, date }) => ({
                        value,
                        label: moment(date).format("MMM D"),
                      }))}
                      areaChart
                      height={250}
                      width={screenWidth - 60}
                      color="#4484B2"
                      thickness={4}
                      dataPointsColor={"#4484B2"}
                      isAnimated
                      animationDuration={800}
                      showStripOnFocus
                      showTextOnFocus
                      focusedDataPointColor="blue"
                  />
                </View>

                <Text style={styles.chartTitle}>Frequency of Exercise</Text>
                <View style={styles.chartContainer}>
                  <LineChart
                      data={filteredInstanceCounts.map(({ value, date }) => ({
                        value,
                        label: moment(date).format("MMM D"),
                      }))}
                      areaChart
                      height={250}
                      width={screenWidth - 60}
                      color="#4484B2"
                      thickness={4}
                      dataPointsColor={"#4484B2"}
                      isAnimated
                      animationDuration={800}
                      showStripOnFocus
                      showTextOnFocus
                      focusedDataPointColor="blue"
                  />
                </View>
              </>
          ) : (
              <Text style={styles.noDataText}>
                No data available for this exercise.
              </Text>
          )}
        </ScrollView>
      </View>
  );
};

export default TrackedExercise;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingTop: StaticSafeAreaInsets?.safeAreaInsetsTop + 15 || 15,
    paddingBottom: StaticSafeAreaInsets?.safeAreaInsetsBottom + 15 || 15,
  },
  scrollViewContent: {
    padding: 20,
  },
  heading: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  selectedMonthText: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 10,
  },
  showButton: {
    backgroundColor: "#016e03",
    paddingVertical: 10,
    borderRadius: 25,
    alignItems: "center",
    width: 200,
  },
  showButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  centerButtonContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
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
  chartTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    textAlign: "center",
  },
  chartContainer: {
    height: 250,
    marginBottom: 20,
    alignItems: "center",
  },
  noDataText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    textAlign: "center",
    color: "#888",
  },
  cumulativeText: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  cumulativeValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#016e03",
  },
  monthButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  monthButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  selectedButton: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  monthButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  selectedText: {
    color: "#000",
  },
});