import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import Button from "../../components/button";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text>
        hola
      </Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#A1CEDC",
    padding: 20,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1D3D47",
  },
  welcomeContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  welcome: {
    fontSize: 16,
    color: "#1D3D47",
    textAlign: "center",
  },
  stepContainer: {
    gap: 8,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1D3D47",
  },
  bold: {
    fontWeight: "bold",
    color: "#1D3D47",
  },
  reactLogo: {
    height: 178,
    width: 290,
    alignSelf: "center",
    marginBottom: 24,
  },
  button: {
    marginVertical: 8,
    backgroundColor: "#FF6F91",
  },
});