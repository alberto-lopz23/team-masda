import { useRouter } from "expo-router";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../firebaseConfig";

export default function LoginLocalScreen() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!correo || !contrasena) {
      return Alert.alert("Error", "Ingresa tu correo y contraseña.");
    }
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        correo,
        contrasena
      );
      const uid = userCredential.user.uid;
      // Solo los usuarios con documento en la colección `locales` pueden entrar como local
      const localRef = doc(db, "locales", uid);
      const snap = await getDoc(localRef);
      if (!snap.exists()) {
        await signOut(auth);
        return Alert.alert(
          "Error",
          "Este usuario no está registrado como local."
        );
      }
      const data = snap.data();
      router.replace({
        pathname: "/business",
        params: { id: uid, nombre: data?.nombre ?? "" },
      });
    } catch (error: any) {
      let msg = "Correo o contraseña incorrectos.";
      if (error?.code === "auth/invalid-email") {
        msg = "El correo electrónico no es válido.";
      } else if (error?.code === "auth/user-not-found" || error?.code === "auth/wrong-password") {
        msg = "Correo o contraseña incorrectos.";
      } else if (error?.code === "auth/too-many-requests") {
        msg = "Demasiados intentos. Intenta más tarde.";
      }
      Alert.alert("Error", msg);
      console.error(error);
    } finally {
      setLoading(false);
    }
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
