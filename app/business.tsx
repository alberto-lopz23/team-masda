import { useLocalSearchParams, useRouter } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../firebaseConfig";

// 🔹 Definición del tipo
interface Usuario {
  // `id` can be a numeric business id stored in the document
  id?: string | number;
  // `numeroID` is the renamed id field in Firestore (new field name)
  numeroID?: string | number;
  // `docId` is the Firestore document id (string) used for reads/writes
  docId?: string;
  nombre?: string;
  plan?: string;
  estado?: boolean;
  fecha_expiracion?: {
    seconds: number;
    nanoseconds?: number;
  };
  visitado?: boolean;
}

export default function BusinessScreen() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [usuarioSeleccionado, setUsuarioSeleccionado] =
    useState<Usuario | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  // track which user ids are disabled for marking (per local) until next midnight
  const [disabledMark, setDisabledMark] = useState<Record<string, boolean>>({});

  const router = useRouter();
  const params = useLocalSearchParams();
  const localId = params.id ? String(params.id) : "";
  const localNombre = params.nombre ? String(params.nombre) : "";
  const localProfilePic = "https://ui-avatars.com/api/?name=Local";

  // 🔹 Cargar todos los usuarios
  const fetchUsuarios = async () => {
    try {
      const usuariosCol = collection(db, "usuarios");
      const usuariosSnap = await getDocs(usuariosCol);
      const lista = usuariosSnap.docs.map((docSnap) => {
        const data = docSnap.data() as Record<string, any>;
        // Preserve any `id` field from the document (could be numeric),
        // and store the Firestore doc id separately as `docId` (string)
        return {
          ...data,
          docId: String(docSnap.id),
        } as Usuario;
      });
      setUsuarios(lista);
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  // 🔹 Filtra usuarios (busca por nombre, numeroID o el antiguo campo id)
  const usuariosFiltrados = usuarios.filter((u) => {
    const nombreMatch = (u.nombre ?? "")
      .toLowerCase()
      .includes(busqueda.toLowerCase());
    const numeroMatch = (u.numeroID ?? u.id ?? "")
      .toString()
      .includes(busqueda);
    return nombreMatch || numeroMatch;
  });

  // 🔹 Verifica si está inactivo
  const isInactivo = (usuario: Usuario | null) => {
    if (!usuario) return false;
    const fechaExp = usuario.fecha_expiracion;
    const expirado =
      fechaExp && fechaExp.seconds
        ? new Date(fechaExp.seconds * 1000) < new Date()
        : false;
    return usuario.estado === false || expirado;
  };

  // 🔹 Estilos dinámicos según el plan
  const getPlanStyles = (plan?: string) => {
    const p = String(plan ?? "").toUpperCase();
    switch (p) {
      case "BASICO":
        return {
          card: [styles.card, styles.basicoCard],
          planText: [styles.plan, styles.basicoPlan],
          textColor: styles.textOnDark,
        };
      case "PREMIUM":
        return {
          card: [styles.card, styles.premiumCard],
          planText: [styles.plan, styles.premiumPlan],
          textColor: styles.textOnLight,
        };
      case "ELITE":
        return {
          card: [styles.card, styles.eliteCard],
          planText: [styles.plan, styles.elitePlan],
          textColor: styles.textOnDark,
        };
      default:
        return {
          card: styles.card,
          planText: styles.plan,
          textColor: styles.textOnDark,
        };
    }
  };

  // helper: return inline style overrides for small user cards based on plan
  const getCardColorStyles = (plan?: string) => {
    const p = String(plan ?? "").toUpperCase();
    switch (p) {
      case "BASICO":
        return { borderColor: "#007BFF", backgroundColor: "#e7f0ff" };
      case "PREMIUM":
        return { borderColor: "#D4AF37", backgroundColor: "#fff8e1" };
      case "ELITE":
        return { borderColor: "#390b11ff", backgroundColor: "#390b11ff" };
      default:
        return null;
    }
  };

  // visitado functionality moved to perfil-local

  return (
    <View style={styles.container}>
      {/* Header con foto */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          {localNombre ? (
            <Text style={styles.localNombre}>{localNombre}</Text>
          ) : null}
        </View>
        <TouchableOpacity
          onPress={() =>
            router.push({ pathname: "/perfil-local", params: { id: localId } })
          }
        >
          <Image source={{ uri: localProfilePic }} style={styles.profilePic} />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Buscar Usuario</Text>
      <TextInput
        style={styles.input}
        placeholder="Escribe un nombre o ID..."
        placeholderTextColor="#888"
        value={busqueda}
        onChangeText={setBusqueda}
      />

      {/* Lista de usuarios */}
      <ScrollView style={{ width: "100%" }}>
        {usuariosFiltrados.map((u, index) => {
          const key =
            u.docId ??
            (u.numeroID !== undefined
              ? String(u.numeroID)
              : u.id !== undefined
              ? String(u.id)
              : `user-${index}`);
          return (
            <TouchableOpacity
              key={key}
              style={[styles.userBox, getCardColorStyles(u.plan) || {}]}
              onPress={async () => {
                try {
                  setUsuarioSeleccionado(u);
                  // check if this user already has a visita for this local today
                  if (u.docId) {
                    const visitasCol = collection(
                      db,
                      "locales",
                      String(localId),
                      "visitas"
                    );
                    const today = new Date();
                    const startOfToday = new Date(
                      today.getFullYear(),
                      today.getMonth(),
                      today.getDate()
                    );
                    // query by userDocId and then client-filter by timestamp to avoid needing a composite index
                    const q = query(
                      visitasCol,
                      where("userDocId", "==", String(u.docId))
                    );
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
                    setDisabledMark((s) => ({
                      ...s,
                      [u.docId!]: alreadyToday,
                    }));
                  }
                } catch (err) {
                  console.error("Error checking today's visita:", err);
                }
                setModalVisible(true);
              }}
            >
              <Text style={styles.userText}>
                {u.nombre} ({u.numeroID ?? u.id ?? u.docId ?? "-"})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.fullScreenModal}>
          <View style={getPlanStyles(usuarioSeleccionado?.plan).card}>
            {isInactivo(usuarioSeleccionado) && (
              <View style={styles.inactivoBanner}>
                <Text style={styles.inactivoText}>INACTIVO</Text>
              </View>
            )}

            <Text
              style={[
                styles.name,
                getPlanStyles(usuarioSeleccionado?.plan).textColor,
              ]}
            >
              {usuarioSeleccionado?.nombre ?? "Sin nombre"}
            </Text>
            <Text
              style={[
                styles.numeroID,
                getPlanStyles(usuarioSeleccionado?.plan).textColor,
              ]}
            >
              ID: {usuarioSeleccionado?.numeroID ?? "Sin ID"}
            </Text>
            <Text
              style={[
                styles.label,
                getPlanStyles(usuarioSeleccionado?.plan).textColor,
              ]}
            >
              Estado:{" "}
              <Text style={getPlanStyles(usuarioSeleccionado?.plan).textColor}>
                {isInactivo(usuarioSeleccionado) ? "INACTIVO" : "ACTIVO"}
              </Text>
            </Text>
            <Text style={getPlanStyles(usuarioSeleccionado?.plan).planText}>
              {usuarioSeleccionado?.plan ?? "Sin plan"}
            </Text>
            <Text
              style={[
                styles.expiry,
                getPlanStyles(usuarioSeleccionado?.plan).textColor,
              ]}
            >
              Expira:{" "}
              {usuarioSeleccionado?.fecha_expiracion?.seconds
                ? new Date(
                    usuarioSeleccionado.fecha_expiracion.seconds * 1000
                  ).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "Sin fecha"}
            </Text>

            {/* Close button (visit marking moved to Perfil Local) */}
            <View style={{ marginTop: 16, alignItems: "center" }}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Cerrar</Text>
              </TouchableOpacity>
              {/* Marcar visitado (redirecciona a perfil-local or mark directly) */}
              {usuarioSeleccionado?.docId && (
                <TouchableOpacity
                  disabled={!!disabledMark[usuarioSeleccionado.docId!]}
                  style={[
                    styles.closeButton,
                    {
                      marginTop: 8,
                      backgroundColor: disabledMark[usuarioSeleccionado.docId!]
                        ? "#666"
                        : "#0d6efd",
                    },
                  ]}
                  onPress={async () => {
                    try {
                      const userRef = doc(
                        db,
                        "usuarios",
                        usuarioSeleccionado.docId!
                      );
                      // set visitado true and write per-local timestamp
                      await updateDoc(userRef, {
                        visitado: true,
                        [`visitedPerLocal.${String(localId)}`]:
                          serverTimestamp(),
                      });

                      // add visita to locales/{localId}/visitas if not already today
                      const visitasCol = collection(
                        db,
                        "locales",
                        String(localId),
                        "visitas"
                      );
                      const q = query(
                        visitasCol,
                        where(
                          "userDocId",
                          "==",
                          String(usuarioSeleccionado.docId)
                        )
                      );
                      const snap = await getDocs(q);
                      const today = new Date();
                      const startOfToday = new Date(
                        today.getFullYear(),
                        today.getMonth(),
                        today.getDate()
                      );
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
                          userDocId: String(usuarioSeleccionado.docId),
                          nombre: usuarioSeleccionado.nombre ?? "",
                          timestamp: serverTimestamp(),
                        });
                      }

                      // locally disable the mark button for this user until next midnight
                      setDisabledMark((s) => ({
                        ...s,
                        [usuarioSeleccionado.docId!]: true,
                      }));
                      // schedule re-enable at next midnight (best-effort, server-side record is authoritative)
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
                      setTimeout(() => {
                        setDisabledMark((s) => ({
                          ...s,
                          [usuarioSeleccionado.docId!]: false,
                        }));
                      }, ms);

                      // refresh list so UI updates immediately
                      await fetchUsuarios();
                      setModalVisible(false);
                    } catch (e) {
                      console.error(
                        "Error marcando visitado desde business modal:",
                        e
                      );
                    }
                  }}
                >
                  <Text style={styles.closeButtonText}>
                    {disabledMark[usuarioSeleccionado.docId!]
                      ? "Marcado"
                      : "Marcar visitado"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
    alignItems: "center",
    paddingTop: 30,
    paddingHorizontal: 10,
  },
  header: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: 10,
    marginTop: 10,
  },
  localNombre: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  profilePic: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#e53935",
    marginRight: 8,
  },
  title: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 22,
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    marginBottom: 18,
    width: "100%",
  },
  userBox: {
    borderWidth: 2,
    borderColor: "#e53935",
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    backgroundColor: "#222",
    width: "100%",
  },
  userText: {
    color: "#e53935",
    fontWeight: "bold",
    fontSize: 20,
  },
  fullScreenModal: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    width: "80%",
    backgroundColor: "#222",
    position: "relative",
  },
  basicoCard: {
    borderColor: "#007BFF",
    backgroundColor: "#e7f0ff",
  },
  premiumCard: {
    borderColor: "#D4AF37",
    backgroundColor: "#fff8e1",
  },
  eliteCard: {
    borderColor: "#390b11ff",
    backgroundColor: "#390b11ff",
  },
  inactivoBanner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 38,
    backgroundColor: "#e53935",
    justifyContent: "center",
    alignItems: "center",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    zIndex: 2,
  },
  inactivoText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
    letterSpacing: 2,
  },
  name: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  numeroID: {
    color: "#bbb",
    marginBottom: 5,
  },
  label: {
    color: "#fff",
    fontWeight: "600",
    marginBottom: 10,
  },
  plan: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  basicoPlan: {
    color: "#0056d6",
  },
  premiumPlan: {
    color: "#b8860b",
  },
  elitePlan: {
    color: "#9a0c2a",
  },
  expiry: {
    color: "#bbb",
    marginBottom: 10,
  },
  closeButton: {
    backgroundColor: "#e53935",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 10,
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  textOnLight: {
    color: "#111",
  },
  textOnDark: {
    color: "#fff",
  },
});
