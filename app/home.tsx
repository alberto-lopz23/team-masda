import { Entypo } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Button from "../components/button";
import { auth, db } from "../firebaseConfig";

export default function MembershipCard() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loadingUserData, setLoadingUserData] = useState(true);
  const [markModalVisible, setMarkModalVisible] = useState(false);
  const [markLocalId, setMarkLocalId] = useState("");
  const [markingDisabled, setMarkingDisabled] = useState(false);
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const cargarFoto = async () => {
      try {
        const foto = await AsyncStorage.getItem("fotoPerfil");
        if (foto) setFotoPerfil(foto);
      } catch (e) {
        setFotoPerfil(null);
      }
    };
    cargarFoto();
  }, []);

  const elegirFoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled && result.assets?.length > 0) {
      const uri = result.assets[0].uri;
      setFotoPerfil(uri);
      await AsyncStorage.setItem("fotoPerfil", uri);
    }
  };

  useEffect(() => {
    let unsubUserSnapshot: any = null;
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (unsubUserSnapshot) {
        unsubUserSnapshot();
        unsubUserSnapshot = null;
      }
      if (firebaseUser) {
        setLoadingUserData(true);
        const userDocRef = doc(db, "usuarios", firebaseUser.uid);
        unsubUserSnapshot = onSnapshot(
          userDocRef,
          (snap) => {
            if (snap.exists()) setUserData(snap.data());
            else setUserData(null);
            setLoadingUserData(false);
          },
          (err) => {
            console.error("Error listening usuario doc:", err);
            setUserData(null);
            setLoadingUserData(false);
          }
        );
      } else {
        setUserData(null);
        setLoadingUserData(false);
      }
    });
    return () => {
      unsubAuth();
      if (unsubUserSnapshot) unsubUserSnapshot();
    };
  }, []);

  const getPlanStyles = (plan: string) => {
    const p = String(plan ?? "").toUpperCase();
    switch (p) {
      case "BASICO":
        return {
          card: [styles.card, styles.basicoCard],
          image: [styles.imageWrapper, styles.basicoCircle],
          planText: [styles.plan, styles.basicoPlan],
        };
      case "PREMIUM":
        return {
          card: [styles.card, styles.premiumCard],
          image: [styles.imageWrapper, styles.premiumCircle],
          planText: [styles.plan, styles.premiumPlan],
        };
      case "ELITE":
        return {
          card: [styles.card, styles.eliteCard],
          image: [styles.imageWrapper, styles.eliteCircle],
          planText: [styles.plan, styles.elitePlan],
        };
      default:
        return {
          card: styles.card,
          image: styles.imageWrapper,
          planText: styles.plan,
        };
    }
  };

  const planStyles = getPlanStyles(userData?.plan ?? "");

  return (
    <View style={styles.container}>
      <Pressable style={styles.menuIcon} onPress={() => setMenuVisible(true)}>
        <Entypo name="dots-three-vertical" size={22} color="white" />
      </Pressable>
      <View style={planStyles.card}>
        <TouchableOpacity onPress={elegirFoto}>
          <View style={planStyles.image}>
            <Image
              source={{
                uri:
                  fotoPerfil ||
                  userData?.fotoPerfil ||
                  "https://ui-avatars.com/api/?name=" +
                    (userData?.nombre ?? "Usuario"),
              }}
              style={{ width: 76, height: 76, borderRadius: 38 }}
              resizeMode="cover"
            />
          </View>
        </TouchableOpacity>
        <Text style={{ color: "#bbb", fontSize: 12 }}>
          Toca para cambiar foto
        </Text>
        {loadingUserData ? (
          <ActivityIndicator
            size="small"
            color="#FFD700"
            style={{ marginVertical: 8 }}
          />
        ) : (
          <Text style={styles.name}>{userData?.nombre ?? "Sin nombre"}</Text>
        )}
        <Text style={styles.id}>
          ID: {userData?.numeroID ?? userData?.id ?? user?.uid ?? "Sin ID"}
        </Text>
        <Text style={styles.label}>
          Estado:{" "}
          <Text style={styles.active}>
            {userData?.estado ? "ACTIVO" : "INACTIVO"}
          </Text>
        </Text>
        <Text style={planStyles.planText}>{userData?.plan ?? "Sin plan"}</Text>
        <Text style={styles.expiry}>
          Expira:{" "}
          {userData?.fecha_expiracion
            ? typeof userData.fecha_expiracion === "string"
              ? userData.fecha_expiracion
              : userData?.fecha_expiracion?.seconds
              ? new Date(
                  userData.fecha_expiracion.seconds * 1000
                ).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "Sin fecha"
            : "Sin fecha"}
        </Text>
      </View>
      <Button
        title="Mapa de beneficios"
        onPress={() => router.push("/mapsBeneficio")}
        style={styles.button}
        textStyle={styles.buttonText}
      />
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setMenuVisible(false)}>
          <View style={styles.menu}>
            <Button
              title="Pagos"
              onPress={() => router.push("/pagos")}
              style={styles.menuItem}
              textStyle={styles.menuText}
            />
            <Button
              title="Plan"
              onPress={() => router.push("/plans")}
              style={styles.menuItem}
              textStyle={styles.menuText}
            />
            <Button
              title="QR"
              onPress={() => {
                /* acción de QR */
              }}
              style={styles.menuItem}
              textStyle={styles.menuText}
            />
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={markModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMarkModalVisible(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setMarkModalVisible(false)}
        >
          <View style={[styles.menu, { padding: 16 }]}>
            <Text style={{ color: "#fff", marginBottom: 8 }}>
              ID del local:
            </Text>
            <TextInput
              value={markLocalId}
              onChangeText={setMarkLocalId}
              placeholder="Ingresa ID del local"
              placeholderTextColor="#888"
              style={{
                backgroundColor: "#333",
                color: "#fff",
                padding: 10,
                borderRadius: 8,
                marginBottom: 12,
              }}
            />
            <Button
              title={markingDisabled ? "Marcando..." : "Marcar visita"}
              onPress={async () => {
                if (!auth.currentUser)
                  return Alert.alert("Debes iniciar sesión");
                if (!markLocalId)
                  return Alert.alert("Introduce el ID del local");
                try {
                  setMarkingDisabled(true);
                  const uid = auth.currentUser.uid;
                  const userRef = doc(db, "usuarios", uid);
                  // write per-local timestamp
                  await updateDoc(userRef, {
                    [`visitedPerLocal.${String(markLocalId)}`]:
                      serverTimestamp(),
                    visitado: true,
                  });
                  // add visita if not already today
                  const visitasCol = collection(
                    db,
                    "locales",
                    String(markLocalId),
                    "visitas"
                  );
                  const today = new Date();
                  const startOfToday = new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    today.getDate()
                  );
                  const q = query(visitasCol, where("userDocId", "==", uid));
                  const snap = await getDocs(q);
                  let alreadyToday = false;
                  snap.docs.forEach((d) => {
                    const ts = (d.data() as any).timestamp;
                    const dt =
                      ts && typeof ts.toDate === "function"
                        ? ts.toDate()
                        : ts
                        ? new Date(ts)
                        : null;
                    if (dt && dt >= startOfToday) alreadyToday = true;
                  });
                  if (!alreadyToday) {
                    await addDoc(visitasCol, {
                      userDocId: uid,
                      nombre: userData?.nombre ?? "",
                      timestamp: serverTimestamp(),
                    });
                  }
                  // success feedback
                  Alert.alert("Listo", "Visita marcada correctamente.");
                  // schedule local re-enable at next midnight
                  const now = new Date();
                  const next = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate() + 1,
                    0,
                    0,
                    5
                  );
                  const ms = next.getTime() - now.getTime();
                  setTimeout(() => setMarkingDisabled(false), ms);
                  setMarkModalVisible(false);
                } catch (e) {
                  console.error("Error marcando visita desde home:", e);
                  Alert.alert("Error", "No se pudo marcar la visita");
                  setMarkingDisabled(false);
                }
              }}
              style={{ backgroundColor: markingDisabled ? "#666" : "#0d6efd" }}
            />
          </View>
        </Pressable>
      </Modal>
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
  menuIcon: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
  },
  card: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    width: "80%",
    marginBottom: 20,
  },
  basicoCard: {
    borderColor: "#007BFF",
    backgroundColor: "#234d94ff",
  },
  premiumCard: {
    borderColor: "#251e08ff",
    backgroundColor: "#ddb739ff",
  },
  eliteCard: {
    borderColor: "#390b11ff",
    backgroundColor: "#390b11ff",
  },
  imageWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 15,
    borderWidth: 2,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  basicoCircle: {
    borderColor: "#007BFF",
  },
  premiumCircle: {
    borderColor: "#D4AF37",
  },
  eliteCircle: {
    borderColor: "#390b11ff",
  },
  name: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  id: {
    color: "#f1f1f3ff",
    marginBottom: 5,
    fontSize: 20,
  },
  label: {
    color: "#fff",
    fontWeight: "600",
    marginBottom: 10,
  },
  active: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  plan: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  basicoPlan: {
    color: "#79a7edff",
  },
  premiumPlan: {
    color: "#b8860b",
  },
  elitePlan: {
    color: "#9a0c2a",
  },
  expiry: {
    color: "#f5f5f5ff",
  },
  button: {
    backgroundColor: "#85102bff",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  menu: {
    backgroundColor: "#222",
    padding: 20,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  menuItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
    marginBottom: 10,
  },
  menuText: {
    color: "#fff",
    fontSize: 16,
  },
});
