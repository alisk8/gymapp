import { Button, StyleSheet, Text, View } from "react-native";
import React from "react";

const Home = ({ navigation }) => {
  return (
    <View>
      <Text>Home</Text>

      <Button title="Account" onPress={() => navigation.navigate("Feed")} />
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({});
