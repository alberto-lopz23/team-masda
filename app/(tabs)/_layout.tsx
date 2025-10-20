import { Slot, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";

export default function TabsLayout() {
  const router = useRouter();
  const [autenticado, setAutenticado] = useState<boolean | null>(null);

  useEffect(() => {
    // Simulación de verificación de sesión (puedes cambiar por tu lógica real)
    const verificarSesion = async () => {
      // Por ejemplo, podrías leer de AsyncStorage aquí
      // const usuario = await AsyncStorage.getItem("usuario");
      // setAutenticado(!!usuario);

      // Simulación: no autenticado por defecto
      setAutenticado(false);
    };
    verificarSesion();
  }, []);

  useEffect(() => {
    if (autenticado === false) {
      router.replace("/welcome"); // Redirige si no está autenticado
    }
  }, [autenticado]);

  if (autenticado === null) {
    // Mientras verifica la sesión, muestra un loader
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#FF6F91" />
      </View>
    );
  }

  return <Slot />;
}