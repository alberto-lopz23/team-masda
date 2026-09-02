import { useLocalSearchParams } from "expo-router";
import { collection, doc, getDoc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { db } from "../firebaseConfig";

// Ocultar header (title y flecha atrás) en esta pantalla
export const options = {
  headerShown: false,
};

export default function PerfilLocalScreen() {
  const { id } = useLocalSearchParams();
  const [locales, setLocales] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [visitantes, setVisitantes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [todayCount, setTodayCount] = useState(0);
  const [monthCount, setMonthCount] = useState(0);

  useEffect(() => {
    if (!id) return;

    // fetch locales doc once
    (async () => {
      try {
        const docRef = doc(db, "locales", String(id));
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setLocales(docSnap.data());
        else setLocales(null);
      } catch {
        setLocales(null);
      }
    })();

    // realtime listener for visitas subcollection
    const visitasCol = collection(db, "locales", String(id), "visitas");
    const unsub = onSnapshot(visitasCol, async (snap) => {
      const visitas = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      })) as any[];

      const hoy = new Date();
      const startOfToday = new Date(
        hoy.getFullYear(),
        hoy.getMonth(),
        hoy.getDate()
      );
      const startOfMonth = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

      const visitantesMap: Record<string, any> = {};
      let diarios = 0;
      let mensuales = 0;

      visitas.forEach((v) => {
        const ts =
          v.timestamp && typeof v.timestamp.toDate === "function"
            ? v.timestamp.toDate()
            : v.timestamp
            ? new Date(v.timestamp)
            : null;
        if (ts) {
          if (ts >= startOfToday) diarios++;
          if (ts >= startOfMonth) mensuales++;
        }
        if (v.userDocId) {
          const existing = visitantesMap[v.userDocId];
          if (!existing) visitantesMap[v.userDocId] = v;
          else {
            const existingTs =
              existing.timestamp &&
              typeof existing.timestamp.toDate === "function"
                ? existing.timestamp.toDate()
                : existing.timestamp
                ? new Date(existing.timestamp)
                : null;
            if (ts && existingTs && ts > existingTs)
              visitantesMap[v.userDocId] = v;
          }
        }
      });

      let visitantesLista = Object.values(visitantesMap).map((v) => ({
        userDocId: v.userDocId,
        nombre: v.nombre,
        lastVisit:
          v.timestamp && typeof v.timestamp.toDate === "function"
            ? v.timestamp.toDate()
            : v.timestamp
            ? new Date(v.timestamp)
            : null,
      }));

      // fetch visitado flag for each user so changes from user profile are reflected here
      try {
        const docs = await Promise.all(
          visitantesLista.map((it) =>
            getDoc(doc(db, "usuarios", String(it.userDocId)))
          )
        );
        visitantesLista = visitantesLista.map((it, i) => {
          const data = docs[i]?.exists() ? (docs[i].data() as any) : {};
          return {
            ...(it as any),
            visitado: data?.visitado ?? false,
            // prefer numeroID stored on user document, fallback to userDocId
            numeroID: data?.numeroID ?? data?.id ?? String(it.userDocId),
          };
        });
      } catch (e) {
        console.error("Error fetching usuarios visitado flags:", e);
      }

      setVisitantes(visitantesLista);
      setTodayCount(diarios);
      setMonthCount(mensuales);
      setLoading(false);
    });

    return () => unsub();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#e53935" />
      </View>
    );
  }

  if (!locales) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>No se encontró el local.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Perfil de {locales.nombre ?? "Sin nombre"}
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{todayCount}</Text>
          <Text style={styles.statLabel}>Hoy</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{monthCount}</Text>
          <Text style={styles.statLabel}>Mes</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Visitantes</Text>

      <ScrollView style={styles.list}>
        <View style={{ marginBottom: 8, width: "100%" }}>
          <TextInput
            placeholder="Buscar visitante por nombre o ID..."
            placeholderTextColor="#888"
            value={searchTerm}
            onChangeText={setSearchTerm}
            style={{
              backgroundColor: "#fff",
              borderRadius: 8,
              padding: 8,
              marginBottom: 8,
            }}
          />
        </View>

        {visitantes.length > 0 ? (
          visitantes
            .filter((v) =>
              ((v.nombre ?? "") + " " + ((v as any).numeroID ?? ""))
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
            )
            .map((v, idx) => (
              <View key={v.userDocId ?? idx} style={styles.cardVisitor}>
                <Image
                  source={{
                    uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      v.nombre ?? "Anon"
                    )}&background=222222&color=FFD700`,
                  }}
                  style={styles.avatar}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.visitorName}>
                    {v.nombre ?? "Sin nombre"}
                  </Text>
                  <Text style={[styles.visitorDate, { color: "#bbb" }]}>
                    ID: {(v as any).numeroID ?? v.userDocId}
                  </Text>
                  <Text style={styles.visitorDate}>
                    {v.lastVisit ? v.lastVisit.toLocaleString() : "—"}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: v.visitado ? "#e53935" : "#444" },
                    ]}
                  >
                    <Text style={styles.badgeText}>
                      {v.visitado ? "Visitado" : "No visitado"}
                    </Text>
                  </View>
                </View>
              </View>
            ))
        ) : (
          <Text style={[styles.label, { marginTop: 8 }]}>
            No hay visitantes marcados para este local hoy.
          </Text>
        )}
      </ScrollView>
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
  label: {
    color: "#fff",
    fontSize: 18,
    marginBottom: 10,
    fontWeight: "bold",
  },
  value: {
    color: "#FFD700",
    fontWeight: "normal",
  },
  statsRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statBox: {
    backgroundColor: "#222",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    width: "48%",
  },
  statNumber: {
    color: "#FFD700",
    fontSize: 22,
    fontWeight: "bold",
  },
  statLabel: {
    color: "#fff",
    fontSize: 12,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    alignSelf: "flex-start",
    marginLeft: 6,
  },
  list: {
    width: "100%",
    maxHeight: 260,
    marginTop: 8,
  },
  cardVisitor: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    marginBottom: 10,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  visitorName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  visitorDate: {
    color: "#bbb",
    fontSize: 12,
  },
  badges: {
    marginLeft: 8,
    alignItems: "flex-end",
  },
  badge: {
    backgroundColor: "#e53935",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  error: {
    color: "#e53935",
    fontSize: 20,
    textAlign: "center",
  },
});
