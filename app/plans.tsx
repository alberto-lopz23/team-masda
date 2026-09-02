import React, { useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import Button from "../components/button";

const beneficios = [
  {
    nombre: "Básico",
    beneficios: [
      "Carnet digital de miembro del Team.",
      "Acceso a grupo privado de WhatsApp.",
      "Sticker oficial del club.",
    ],
  },
  {
    nombre: "Premium",
    beneficios: [
      "Acceso prioritario a actividades y cupos limitados.",
      "Descuentos exclusivos con patrocinadores (talleres, piezas, car wash, detailing, etc.).",
      "Camiseta oficial del Team (edición anual).",
      "Acceso a sorteos especiales solo para Premium.",
      "Derecho a exhibir su vehículo en car shows organizados por el Team.",
      "Participación en reuniones privadas de planificación y votación de ideas.",
    ],
  },
  {
    nombre: "Elite",
    beneficios: [
      "Paquete de bienvenida (merchandising completo: gorra, camiseta, taza).",
      "Logo o nombre destacado en las promociones del Team y eventos.",
      "Invitación VIP en eventos con acceso a áreas exclusivas.",
      "Participación gratuita en al menos 1 gran evento anual del Team.",
      "Reconocimiento público en redes y en el evento principal del año.",
      "Oportunidad de ser anfitrión/embajador en actividades oficiales del Team.",
      "Prioridad para ocupar puestos administrativos dentro de la comunidad.",
    ],
  },
];
export default function Plans() {
  const [planSeleccionado, setPlanSeleccionado] = useState<number | null>(null);

  const handleSelect = (idx: number) => {
    setPlanSeleccionado(planSeleccionado === idx ? null : idx);
  };

  return (
    <View style={styles.container}>
      <Button
        title="Básico"
        onPress={() => handleSelect(0)}
        style={styles.button}
        textStyle={styles.text}
      />
      {planSeleccionado === 0 && (
        <View style={styles.beneficiosContainer}>
          <Text style={styles.planTitle}>
            Beneficios Básico
          </Text>
          {beneficios[0].beneficios.map((item, idx) => (
            <Text key={idx} style={styles.beneficioItem}>• {item}</Text>
          ))}
        </View>
      )}

      <Button
        title="Premium"
        onPress={() => handleSelect(1)}
        style={styles.button}
        textStyle={styles.text}
      />
      {planSeleccionado === 1 && (
        <View style={styles.beneficiosContainer}>
          <Text style={styles.planTitle}>
            Beneficios Premium
          </Text>
          {beneficios[1].beneficios.map((item, idx) => (
            <Text key={idx} style={styles.beneficioItem}>• {item}</Text>
          ))}
        </View>
      )}

      <Button
        title="Elite"
        onPress={() => handleSelect(2)}
        style={styles.button}
        textStyle={styles.text}
      />
      {planSeleccionado === 2 && (
        <View style={styles.beneficiosContainer}>
          <Text style={styles.planTitle}>
            Beneficios Elite
          </Text>
          {beneficios[2].beneficios.map((item, idx) => (
            <Text key={idx} style={styles.beneficioItem}>• {item}</Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
    justifyContent: "center", 
    alignItems: "center",
    padding: 20,
  },
  button: {
    marginVertical: 15,
    width: 200,
    backgroundColor: "#85102bff",
  },
  text: {
    fontSize: 18,
  },
  beneficiosContainer: {
    backgroundColor: "#222",
    borderRadius: 10,
    padding: 16,
    width: "100%",
    marginBottom: 10,
  },
  planTitle: {
    color: "#a50d31ff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  beneficioItem: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 6,
  },
});