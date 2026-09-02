import { collection, getDocs, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { auth, db } from "../firebaseConfig";

interface Pago {
  id: string;
  monto?: number;
  concepto?: string;
  estado?: string;
  fecha?: any;
}

const formatEstado = (estado?: string) => {
  const e = String(estado ?? "").toLowerCase();
  if (e === "pagado" || e === "completado" || e === "aprobado") return "Pagado";
  if (e === "pendiente") return "Pendiente";
  if (e === "fallido" || e === "rechazado") return "Rechazado";
  return e || "—";
};

const estadoColor = (estado?: string) => {
  const e = String(estado ?? "").toLowerCase();
  if (e === "pagado" || e === "completado" || e === "aprobado") return "#16a34a";
  if (e === "pendiente") return "#d97706";
  return "#dc2626";
};

const parseFecha = (fecha?: any): Date | null => {
  if (!fecha) return null;
  if (typeof fecha.toDate === "function") return fecha.toDate();
  if (typeof fecha === "number") return new Date(fecha);
  const d = new Date(fecha);
  return isNaN(d.getTime()) ? null : d;
};

export default function PagosScreen() {
  const [pagos, setPagos] = useState<Pago[] | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        if (active) setPagos([]);
        return;
      }
      try {
        const q = query(
          collection(db, "pagos"),
          where("uid", "==", uid)
        );
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Pago, "id">),
        }));
        // Ordenar por fecha descendente
        list.sort((a, b) => {
          const t1 = parseFecha(a.fecha)?.getTime() ?? 0;
          const t2 = parseFecha(b.fecha)?.getTime() ?? 0;
          return t2 - t1;
        });
        if (active) setPagos(list);
      } catch (e) {
        console.error("Error cargando pagos:", e);
        if (active) setPagos([]);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (pagos === null) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#FF6F91" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mis pagos</Text>
      {pagos.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.empty}>Aún no tienes pagos registrados.</Text>
        </View>
      ) : (
        <ScrollView style={{ width: "100%" }} contentContainerStyle={{ paddingBottom: 24 }}>
          {pagos.map((p) => {
            const fecha = parseFecha(p.fecha);
            return (
              <View key={p.id} style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.concepto}>{p.concepto ?? "Pago"}</Text>
                  <Text style={styles.fecha}>
                    {fecha
                      ? fecha.toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "Sin fecha"}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.monto}>
                    {typeof p.monto === "number"
                      ? `$${p.monto.toLocaleString("es-ES")}`
                      : "—"}
                  </Text>
                  <Text style={[styles.estado, { color: estadoColor(p.estado) }]}>
                    {formatEstado(p.estado)}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
    padding: 20,
    paddingTop: 30,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  empty: {
    color: "#888",
    fontSize: 16,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#222",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  concepto: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  fecha: {
    color: "#bbb",
    fontSize: 13,
    marginTop: 4,
  },
  monto: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "bold",
  },
  estado: {
    fontSize: 13,
    fontWeight: "bold",
    marginTop: 4,
  },
});