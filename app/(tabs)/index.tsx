import React from "react";
import { View, StyleSheet } from "react-native";

// Pantalla transitoria: el layout de (tabs) redirige a /home o /welcome según la sesión.
export default function HomeScreen() {
  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#A1CEDC",
  },
});