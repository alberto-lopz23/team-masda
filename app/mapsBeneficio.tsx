import { Ionicons } from "@expo/vector-icons"; // Iconos de Expo
import React from "react";
import {
  FlatList,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const beneficios = [
  {
    id: "1",
    titulo: "baterias cometa",
    descripcion: "20% de Descuento\nen la compra de una batería",
    ubi: "https://maps.app.goo.gl/7u2XmHjPPLkZCTXx5",
  },
  {
    id: "2",
    titulo: "baterias cometa",
    descripcion: "20% de Descuento\nen la compra de una batería",
    ubi: "https://maps.app.goo.gl/7u2XmHjPPLkZCTXx5",
  },
  {
    id: "3",
    titulo: "baterias cometa",
    descripcion: "20% de Descuento\nen la compra de una batería",
    ubi: "https://maps.app.goo.gl/7u2XmHjPPLkZCTXx5",
  },
];

export default function MapaBeneficios() {
  return (
    <View style={styles.container}>
      <FlatList
        data={beneficios}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.titulo}>{item.titulo}</Text>
              <Text style={styles.descripcion}>{item.descripcion}</Text>
            </View>
            <TouchableOpacity onPress={() => Linking.openURL(item.ubi)}>
              <Ionicons name="location-sharp" size={30} color="#FF6F91" />
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 20, paddingTop: 30 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111", // negro de fondo
    padding: 15,
  },
  card: {
    borderWidth: 1,
    borderColor: "#FF6F91", // rosado fuerte
    borderRadius: 5,
    padding: 15,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titulo: {
    fontSize: 18,
    color: "#FF6F91", // mismo rosado del borde
    fontWeight: "bold",
    marginBottom: 5,
  },
  descripcion: {
    fontSize: 14,
    color: "#fff",
  },
});
