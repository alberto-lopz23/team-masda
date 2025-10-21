import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../firebaseConfig";

export default function LoginLocalScreen() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        correo,
        contrasena
      );
      // Usuario autenticado correctamente
      router.push({
        pathname: "/business",
        params: { id: userCredential.user.uid },
      });
    } catch (error) {
      Alert.alert("Error", "Correo o contraseña incorrectos.");
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar sesión Local</Text>
      <TextInput
        style={styles.input}
        placeholder="Correo"
        placeholderTextColor="#bbb"
        autoCapitalize="none"
        value={correo}
        onChangeText={setCorreo}
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor="#bbb"
        secureTextEntry
        value={contrasena}
        onChangeText={setContrasena}
      />
      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Cargando..." : "Ingresar"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    color: "#e53935",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#222",
    color: "#fff",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 18,
    width: "100%",
  },
  button: {
    backgroundColor: "#e53935",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginTop: 10,
    width: "80%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
