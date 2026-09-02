import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
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

export default function AccountScreen() {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [registrado, setRegistrado] = useState(false);
  const router = useRouter();

  // navegación controlada después del login en handleLogin

  const handleLogin = async () => {
    if (usuario && contrasena) {
      try {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          usuario,
          contrasena
        );
        setRegistrado(true);
        // El admin se detecta por el campo `rol: "admin"` en usuarios/{uid}
        const uid = userCredential.user.uid;
        let esAdmin = false;
        try {
          const snap = await getDoc(doc(db, "usuarios", uid));
          esAdmin = snap.exists() && snap.data()?.rol === "admin";
        } catch (e) {
          console.error("Error verificando rol:", e);
        }
        router.replace(esAdmin ? "/admind" : "/home");
      } catch (error: any) {
        if (
          error.code === "auth/user-not-found" ||
          error.code === "auth/wrong-password"
        ) {
          Alert.alert("Error", "Usuario o contraseña incorrectos.");
        } else if (error.code === "auth/invalid-email") {
          Alert.alert("Error", "El correo electrónico no es válido.");
        } else if (error.code === "auth/too-many-requests") {
          Alert.alert("Error", "Demasiados intentos. Intenta más tarde.");
        } else {
          Alert.alert(
            "Error",
            "Usted no está registrado. Por favor, regístrese primero."
          );
        }
      }
    }
  };

  return (
    <View style={styles.container}>
      {!registrado ? (
        <View style={styles.form}>
          <Text style={styles.title}>Iniciar sesión</Text>
          <TextInput
            style={styles.input}
            placeholder="Correo electrónico"
            placeholderTextColor="#131212ff"
            value={usuario}
            onChangeText={setUsuario}
            autoCapitalize="none"
            keyboardType="email-address"
            selectionColor="#000000ff"
          />
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor="#0c0b0bff"
            value={contrasena}
            onChangeText={setContrasena}
            secureTextEntry
            autoCapitalize="none"
            selectionColor="#fff"
          />
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Entrar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.text}>Redirigiendo...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111",
    padding: 20,
  },
  form: {
    width: "100%",
    maxWidth: 350,
    alignItems: "center",
    // `gap` is not supported in RN StyleSheet; use margins on children instead
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#333",
    backgroundColor: "#222",
    color: "#fff",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  button: {
    backgroundColor: "#FF6F91",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  text: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
});
