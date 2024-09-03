import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import moment from "moment";
import { firebase_auth, db } from "../../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { LineChart } from "react-native-gifted-charts";
import StaticSafeAreaInsets from "react-native-static-safe-area-insets";

const screenWidth = Dimensions.get("window").width;

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const TrackedExercise = ({ route }) => {
  const { exercise } = route.params;
  const [exerciseInstances, setExerciseInstances] = useState([]);
  const [showInstances, setShowInstances] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [cumulativeVolume, setCumulativeVolume] = useState(0);
  const [customTimeline, setCustomTimeline] = useState({
    start: null,
    end: null,
  });
  const [customTimelineSelected, setCustomTimelineSelected] = useState(false);
  const [isStartMonthPickerVisible, setStartMonthPickerVisibility] =
    useState(false);
  const [isEndMonthPickerVisible, setEndMonthPickerVisibility] =
    useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchExerciseInstances();
  }, []);

  useEffect(() => {
    updateCumulativeVolume();
  }, [exerciseInstances, selectedMonth, selectedYear, customTimelineSelected]);

  const fetchExerciseInstances = async () => {
    const user = firebase_auth.currentUser;
    if (user) {
      const uid = user.uid;
      const workoutsRef = collection(
        db,
        "userProfiles",
        "X1Nx52EQsHbEOz5mQyVmFum704X2",
        "workouts"
      );
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
              id: workoutDoc.id + ex.id, // Ensure unique keys
            });
          }
        });
      });

      setExerciseInstances(instances);
    } else {
      Alert.alert("Error", "User not authenticated.");
    }
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

  const filterDataByMonthYear = (data, month, year) => {
    return data.filter(
      (item) =>
        new Date(item.date).getMonth() === month &&
        new Date(item.date).getFullYear() === year
    );
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

  const filteredOneRepMaxAverages = customTimelineSelected
    ? oneRepMaxAverages.filter(
        (item) =>
          new Date(item.date) >= new Date(customTimeline.start) &&
          new Date(item.date) <= new Date(customTimeline.end)
      )
    : selectedMonth !== null
    ? filterDataByMonthYear(oneRepMaxAverages, selectedMonth, selectedYear)
    : oneRepMaxAverages;
  const filteredSetsTimesRepsAverages = customTimelineSelected
    ? setsTimesRepsAverages.filter(
        (item) =>
          new Date(item.date) >= new Date(customTimeline.start) &&
          new Date(item.date) <= new Date(customTimeline.end)
      )
    : selectedMonth !== null
    ? filterDataByMonthYear(setsTimesRepsAverages, selectedMonth, selectedYear)
    : setsTimesRepsAverages;
  const filteredTotalVolume = customTimelineSelected
    ? totalVolume.filter(
        (item) =>
          new Date(item.date) >= new Date(customTimeline.start) &&
          new Date(item.date) <= new Date(customTimeline.end)
      )
    : selectedMonth !== null
    ? filterDataByMonthYear(totalVolume, selectedMonth, selectedYear)
    : totalVolume;
  const filteredInstanceCounts = customTimelineSelected
    ? instanceCounts.filter(
        (item) =>
          new Date(item.date) >= new Date(customTimeline.start) &&
          new Date(item.date) <= new Date(customTimeline.end)
      )
    : selectedMonth !== null
    ? filterDataByMonthYear(instanceCounts, selectedMonth, selectedYear)
    : instanceCounts;

  const hasData = filteredOneRepMaxAverages.length > 0;

  const updateCumulativeVolume = () => {
    const relevantData = customTimelineSelected
      ? exerciseInstances.filter(
          (instance) =>
            new Date(instance.workoutDate) >= new Date(customTimeline.start) &&
            new Date(instance.workoutDate) <= new Date(customTimeline.end)
        )
      : selectedMonth !== null
      ? filterDataByMonthYear(exerciseInstances, selectedMonth, selectedYear)
      : exerciseInstances;

    const volume = calculateCumulativeVolume(relevantData);
    setCumulativeVolume(volume);
  };

  const handleCustomTimeline = () => {
    setShowModal(true);
  };

  const handleRemoveCustomTimeline = () => {
    setCustomTimelineSelected(false);
    setCustomTimeline({ start: null, end: null });
  };

  const handleConfirmCustomTimeline = () => {
    setCustomTimelineSelected(true);
    setShowModal(false);
  };

  const showStartMonthPicker = () => {
    setStartMonthPickerVisibility(true);
  };

  const showEndMonthPicker = () => {
    setEndMonthPickerVisibility(true);
  };

  const hideStartMonthPicker = () => {
    setStartMonthPickerVisibility(false);
  };

  const hideEndMonthPicker = () => {
    setEndMonthPickerVisibility(false);
  };

  const handleConfirmStartMonth = (index) => {
    setSelectedMonth(index);
    setCustomTimeline({
      ...customTimeline,
      start: new Date(selectedYear, index, 1).toISOString(),
    });
    hideStartMonthPicker();
  };

  const handleConfirmEndMonth = (index) => {
    setCustomTimeline({
      ...customTimeline,
      end: new Date(selectedYear, index + 1, 0).toISOString(),
    });
    hideEndMonthPicker();
  };

  const renderMonthPicker = ({ item, index }) => (
    <TouchableOpacity
      style={styles.monthPickerItem}
      onPress={() => handleConfirmStartMonth(index)}
    >
      <Text style={styles.monthPickerItemText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Text style={styles.heading}>{exercise.name} Progress</Text>
        {selectedMonth !== null && (
          <Text style={styles.selectedMonthText}>
            Showing data for {months[selectedMonth]} {selectedYear}
          </Text>
        )}
        <Text style={styles.cumulativeText}>
          Cumulative Volume Lifted:{" "}
          <Text style={styles.cumulativeValue}>{cumulativeVolume}</Text> lbs
        </Text>
        <TouchableOpacity
          style={styles.showButton}
          onPress={() => setShowInstances(!showInstances)}
        >
          <Text style={styles.showButtonText}>
            {showInstances
              ? "Hide Instances"
              : "Show All Instances of Exercise"}
          </Text>
        </TouchableOpacity>
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
        <TouchableOpacity
          style={styles.customTimelineButton}
          onPress={handleCustomTimeline}
        >
          <Text style={styles.customTimelineButtonText}>
            Select Custom Timeline
          </Text>
        </TouchableOpacity>
        {customTimelineSelected && (
          <TouchableOpacity
            style={styles.removeCustomTimelineButton}
            onPress={handleRemoveCustomTimeline}
          >
            <Text style={styles.removeCustomTimelineButtonText}>
              Remove Custom Timeline
            </Text>
          </TouchableOpacity>
        )}
        {customTimelineSelected && (
          <Text style={styles.customTimelineText}>
            Custom Timeline: {moment(customTimeline.start).format("MMM YYYY")} -{" "}
            {moment(customTimeline.end).format("MMM YYYY")}
          </Text>
        )}
        <TouchableOpacity
          style={styles.showButton}
          onPress={showStartMonthPicker}
        >
          <Text style={styles.showButtonText}>Select Month</Text>
        </TouchableOpacity>
        <Modal
          visible={isStartMonthPickerVisible}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <FlatList
                data={months}
                renderItem={renderMonthPicker}
                keyExtractor={(item, index) => index.toString()}
              />
              <TouchableOpacity
                style={styles.modalButton}
                onPress={hideStartMonthPicker}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <Modal
          visible={isEndMonthPickerVisible}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <FlatList
                data={months}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    style={styles.monthPickerItem}
                    onPress={() => handleConfirmEndMonth(index)}
                  >
                    <Text style={styles.monthPickerItemText}>{item}</Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item, index) => index.toString()}
              />
              <TouchableOpacity
                style={styles.modalButton}
                onPress={hideEndMonthPicker}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        {hasData ? (
          <>
            <Text style={styles.chartTitle}>
              One Rep Max Averages Over Time
            </Text>
            <View style={styles.chartContainer}>
              <LineChart
                data={filteredOneRepMaxAverages.map(({ value, date }) => ({
                  value,
                  label: customTimelineSelected
                    ? moment(date).format("MMM YYYY")
                    : moment(date).format("MMM D"),
                }))}
                areaChart
                height={250}
                width={screenWidth - 60}
                xAxisLabelTextStyle={styles.axisLabel}
                yAxisTextStyle={styles.axisLabel}
                color="#4484B2"
                thickness={4}
                dataPointsColor={"#4484B2"}
                isAnimated
                animationDuration={800}
                textFontSize={13}
                showStripOnFocus
                showTextOnFocus
                focusedDataPointColor="blue"
                pointerConfig={{
                  pointerStripUptoDataPoint: true,
                  pointerStripColor: "#4484B2",
                  pointerStripWidth: 2,
                  pointerColor: "#4484B2",
                  radius: 6,
                  pointerLabelWidth: 100,
                  pointerLabelHeight: 90,
                  autoAdjustPointerLabelPosition: true,
                  pointerLabelComponent: (items) => (
                    <View
                      style={{
                        height: 90,
                        width: 100,
                        justifyContent: "center",
                        marginTop: -30,
                        marginLeft: -40,
                      }}
                    >
                      <Text
                        style={{
                          color: "black",
                          fontSize: 14,
                          marginBottom: 6,
                          textAlign: "center",
                        }}
                      >
                        {items[0].value}
                      </Text>
                    </View>
                  ),
                }}
                startFillColor="rgba(20,105,81,0.3)"
                endFillColor="rgba(20,85,81,0.01)"
                startOpacity={0.9}
                endOpacity={0.2}
              />
            </View>
            <Text style={styles.chartTitle}>
              Sets x Reps Averages Over Time
            </Text>
            <View style={styles.chartContainer}>
              <LineChart
                data={filteredSetsTimesRepsAverages.map(({ value, date }) => ({
                  value,
                  label: customTimelineSelected
                    ? moment(date).format("MMM YYYY")
                    : moment(date).format("MMM D"),
                }))}
                areaChart
                height={250}
                width={screenWidth - 60}
                xAxisLabelTextStyle={styles.axisLabel}
                yAxisTextStyle={styles.axisLabel}
                color="#4484B2"
                thickness={4}
                dataPointsColor={"#4484B2"}
                isAnimated
                animationDuration={800}
                textFontSize={13}
                showStripOnFocus
                showTextOnFocus
                focusedDataPointColor="blue"
                pointerConfig={{
                  pointerStripUptoDataPoint: true,
                  pointerStripColor: "#4484B2",
                  pointerStripWidth: 2,
                  pointerColor: "#4484B2",
                  radius: 6,
                  pointerLabelWidth: 100,
                  pointerLabelHeight: 90,
                  autoAdjustPointerLabelPosition: true,
                  pointerLabelComponent: (items) => (
                    <View
                      style={{
                        height: 90,
                        width: 100,
                        justifyContent: "center",
                        marginTop: -30,
                        marginLeft: -40,
                      }}
                    >
                      <Text
                        style={{
                          color: "black",
                          fontSize: 14,
                          marginBottom: 6,
                          textAlign: "center",
                        }}
                      >
                        {items[0].value}
                      </Text>
                    </View>
                  ),
                }}
                startFillColor="rgba(20,105,81,0.3)"
                endFillColor="rgba(20,85,81,0.01)"
                startOpacity={0.9}
                endOpacity={0.2}
              />
            </View>
            <Text style={styles.chartTitle}>Total Volume Lifted Over Time</Text>
            <View style={styles.chartContainer}>
              <LineChart
                data={filteredTotalVolume.map(({ value, date }) => ({
                  value,
                  label: customTimelineSelected
                    ? moment(date).format("MMM YYYY")
                    : moment(date).format("MMM D"),
                }))}
                areaChart
                height={250}
                width={screenWidth - 60}
                xAxisLabelTextStyle={styles.axisLabel}
                yAxisTextStyle={styles.axisLabel}
                color="#4484B2"
                thickness={4}
                dataPointsColor={"#4484B2"}
                isAnimated
                animationDuration={800}
                textFontSize={13}
                showStripOnFocus
                showTextOnFocus
                focusedDataPointColor="blue"
                pointerConfig={{
                  pointerStripUptoDataPoint: true,
                  pointerStripColor: "#4484B2",
                  pointerStripWidth: 2,
                  pointerColor: "#4484B2",
                  radius: 6,
                  pointerLabelWidth: 100,
                  pointerLabelHeight: 90,
                  autoAdjustPointerLabelPosition: true,
                  pointerLabelComponent: (items) => (
                    <View
                      style={{
                        height: 90,
                        width: 100,
                        justifyContent: "center",
                        marginTop: -30,
                        marginLeft: -40,
                      }}
                    >
                      <Text
                        style={{
                          color: "black",
                          fontSize: 14,
                          marginBottom: 6,
                          textAlign: "center",
                        }}
                      >
                        {items[0].value}
                      </Text>
                    </View>
                  ),
                }}
                startFillColor="rgba(20,105,81,0.3)"
                endFillColor="rgba(20,85,81,0.01)"
                startOpacity={0.9}
                endOpacity={0.2}
              />
            </View>
            <Text style={styles.chartTitle}>Frequency of Exercise</Text>
            <View style={styles.chartContainer}>
              <LineChart
                data={filteredInstanceCounts.map(({ value, date }) => ({
                  value,
                  label: customTimelineSelected
                    ? moment(date).format("MMM YYYY")
                    : moment(date).format("MMM D"),
                }))}
                areaChart
                height={250}
                width={screenWidth - 60}
                xAxisLabelTextStyle={styles.axisLabel}
                yAxisTextStyle={styles.axisLabel}
                color="#4484B2"
                thickness={4}
                dataPointsColor={"#4484B2"}
                isAnimated
                animationDuration={800}
                textFontSize={13}
                showStripOnFocus
                showTextOnFocus
                pointerConfig={{
                  pointerStripUptoDataPoint: true,
                  pointerStripColor: "#4484B2",
                  pointerStripWidth: 2,
                  pointerColor: "#4484B2",
                  radius: 6,
                  pointerLabelWidth: 100,
                  pointerLabelHeight: 90,
                  autoAdjustPointerLabelPosition: true,
                  pointerLabelComponent: (items) => (
                    <View
                      style={{
                        height: 90,
                        width: 100,
                        justifyContent: "center",
                        marginTop: 20,
                        marginLeft: -40,
                      }}
                    >
                      <Text
                        style={{
                          color: "black",
                          fontSize: 14,
                          marginBottom: 6,
                          textAlign: "center",
                        }}
                      >
                        {items[0].value}
                      </Text>
                    </View>
                  ),
                }}
                startFillColor="rgba(20,105,81,0.3)"
                endFillColor="rgba(20,85,81,0.01)"
                startOpacity={0.9}
                endOpacity={0.2}
              />
            </View>
          </>
        ) : (
          <Text style={styles.noDataText}>
            No data available for this exercise.
          </Text>
        )}
        <Modal visible={showModal} transparent={true} animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Custom Timeline</Text>
              <TouchableOpacity onPress={showStartMonthPicker}>
                <Text style={styles.datePickerText}>
                  {customTimeline.start
                    ? moment(customTimeline.start).format("MMM YYYY")
                    : "Select Start Month"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={showEndMonthPicker}>
                <Text style={styles.datePickerText}>
                  {customTimeline.end
                    ? moment(customTimeline.end).format("MMM YYYY")
                    : "Select End Month"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleConfirmCustomTimeline}
              >
                <Text style={styles.modalButtonText}>Confirm</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
    fontSize: 22,
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
  axisLabel: {
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "center",
  },
  cumulativeText: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 20,
  },
  cumulativeValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#6A0DAD",
  },
  customTimelineButton: {
    backgroundColor: "#6A0DAD",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: "center",
    marginVertical: 10,
  },
  customTimelineButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  removeCustomTimelineButton: {
    backgroundColor: "#FF6347",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: "center",
    marginVertical: 10,
  },
  removeCustomTimelineButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  customTimelineText: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  datePickerText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6A0DAD",
    marginBottom: 10,
    textAlign: "center",
  },
  modalButton: {
    backgroundColor: "#6A0DAD",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: "center",
    marginVertical: 10,
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  monthPickerItem: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    alignItems: "center",
  },
  monthPickerItemText: {
    fontSize: 18,
  },
});
