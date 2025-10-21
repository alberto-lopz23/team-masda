import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../firebaseConfig";

export default function AdmindScreen() {
  const [activeTab, setActiveTab] = useState<"locales" | "usuarios">("locales");
  const [locales, setLocales] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planModalOptions, setPlanModalOptions] = useState<
    { key: string; label: string }[]
  >([]);
  const [planModalTitle, setPlanModalTitle] = useState<string>("Subir plan");
  const [expandedLocal, setExpandedLocal] = useState<string | null>(null);
  const [localVisits, setLocalVisits] = useState<Record<string, any>>({});

  // Persistir activación en Firestore (batch)
  const activateSelected = async () => {
    if (selectedIds.length === 0) return;
    Alert.alert(
      "Activar usuarios",
      `¿Confirmas activar ${selectedIds.length} usuario(s)?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            setLoading(true);
            try {
              const batch = writeBatch(db);
              const ids = selectedIds
                .map((id) => String(id))
                .filter((id) => id && id.length > 0);
              if (ids.length === 0)
                throw new Error(
                  "No valid ids to activate: " + JSON.stringify(selectedIds)
                );
              ids.forEach((id) => {
                const ref = doc(db, "usuarios", id);
                // usar set con merge para crear/actualizar si no existe
                // NOTE: no marcar `visitado` aquí — esa propiedad corresponde a
                // visitas en locales. Al activar una cuenta solo seteamos
                // `estado: true` y registramos `activatedAt`.
                batch.set(
                  ref,
                  {
                    estado: true,
                    activatedAt: serverTimestamp(),
                  },
                  { merge: true }
                );
              });
              // debug: ids y refs que vamos a commitear
              console.debug("activateSelected - committing ids:", ids);
              await batch.commit();
              // actualizar estado local (usar docId)
              // actualizar estado local (usar docId) — marcamos `estado`.
              setUsuarios((prev) =>
                prev.map((u) =>
                  ids.includes(String(u.docId)) ? { ...u, estado: true } : u
                )
              );
              setSelectedIds([]);
              await fetchData();
            } catch (e) {
              console.error("Error activando usuarios:", e);
              Alert.alert(
                "Error",
                "No se pudieron activar los usuarios. Revisa la consola."
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;
    Alert.alert(
      "Eliminar usuarios",
      `¿Eliminar permanentemente ${selectedIds.length} usuario(s)? Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const ids = selectedIds
                .map((id) => String(id))
                .filter((id) => id && id.length > 0);
              if (ids.length === 0)
                throw new Error(
                  "No valid ids to delete: " + JSON.stringify(selectedIds)
                );

              // Verificar existencia
              const existing: string[] = [];
              const missing: string[] = [];
              await Promise.all(
                ids.map(async (id) => {
                  const ref = doc(db, "usuarios", id);
                  const snap = await getDoc(ref);
                  if (snap.exists()) existing.push(id);
                  else missing.push(id);
                })
              );

              if (missing.length > 0) {
                Alert.alert(
                  "Alerta",
                  `No se encontraron ${
                    missing.length
                  } documento(s): ${missing.join(
                    ", "
                  )}. Se eliminarán solo los existentes.`,
                  [{ text: "Continuar" }]
                );
              }

              if (existing.length === 0) {
                throw new Error(
                  "No existing docs to delete: " + JSON.stringify(ids)
                );
              }

              const batch = writeBatch(db);
              // debug: ids que vamos a eliminar
              console.debug("deleteSelected - deleting ids:", existing);
              existing.forEach((id) => {
                const ref = doc(db, "usuarios", id);
                batch.delete(ref);
              });
              await batch.commit();
              setUsuarios((prev) =>
                prev.filter((u) => !existing.includes(String(u.docId)))
              );
              setSelectedIds([]);
              await fetchData();
            } catch (e) {
              console.error("Error eliminando usuarios:", e);
              Alert.alert(
                "Error",
                "No se pudieron eliminar los usuarios. Revisa la consola."
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Abrir modal de opciones para subir plan según el plan actual de los usuarios seleccionados
  const uploadPlanSelected = async () => {
    if (selectedIds.length === 0) return;
    // Mostrar siempre las opciones de plan: Basico, Premium y Elite
    const options = [
      { key: "basico", label: "Subir a Basico" },
      { key: "premium", label: "Subir a Premium" },
      { key: "elite", label: "Subir a Elite" },
    ];
    setPlanModalTitle(
      "Cambiar plan para " + selectedIds.length + " usuario(s)"
    );
    setPlanModalOptions(options);
    setShowPlanModal(true);
  };

  // Ejecuta la actualización del campo 'plan' según la opción elegida
  const performUploadPlan = async (optionKey: string) => {
    setShowPlanModal(false);
    if (selectedIds.length === 0) return;
    setLoading(true);
    try {
      const ids = selectedIds
        .map((id) => String(id))
        .filter((id) => id && id.length > 0);
      if (ids.length === 0)
        throw new Error(
          "No valid ids to change plan: " + JSON.stringify(selectedIds)
        );

      // Verificar existencia de documentos
      const existing: string[] = [];
      const missing: string[] = [];
      await Promise.all(
        ids.map(async (id) => {
          const ref = doc(db, "usuarios", id);
          const snap = await getDoc(ref);
          if (snap.exists()) existing.push(id);
          else missing.push(id);
        })
      );

      if (missing.length > 0) {
        Alert.alert(
          "Alerta",
          `No se encontraron ${missing.length} documento(s): ${missing.join(
            ", "
          )}. Se actualizarán solo los existentes.`,
          [{ text: "Continuar" }]
        );
      }

      if (existing.length === 0)
        throw new Error(
          "No existing docs to update plan: " + JSON.stringify(ids)
        );

      const batch = writeBatch(db);
      const planUpdates: { id: string; plan: string }[] = [];
      existing.forEach((id) => {
        const ref = doc(db, "usuarios", id);
        const newPlanValue =
          optionKey === "BASICO"
            ? "BASICO"
            : optionKey === "PREMIUM"
            ? "PREMIUM"
            : optionKey === "ELITE"
            ? "ELITE"
            : optionKey;

        if (typeof newPlanValue !== "undefined") {
          // usar update para cambiar solo el campo 'plan' y no crear otros campos
          batch.update(ref, { plan: newPlanValue });
          planUpdates.push({ id, plan: newPlanValue });
        }
      });

      // debug: mostrar qué actualizaciones vamos a aplicar
      console.debug("performUploadPlan - plan updates:", planUpdates);
      await batch.commit();

      // actualizar estado local (optimista)
      setUsuarios((prev) =>
        prev.map((u) =>
          existing.includes(String(u.id))
            ? {
                ...u,
                plan: optionKey,
              }
            : u
        )
      );

      setSelectedIds([]);
      await fetchData();
    } catch (e) {
      console.error("Error actualizando plan:", e);
      Alert.alert("Error", "No se pudo actualizar el plan. Revisa la consola.");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = String(name).trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const fetchData = async () => {
    try {
      const localesSnap = await getDocs(collection(db, "locales"));
      setLocales(
        localesSnap.docs.map((d) => ({
          ...(d.data() as any),
          id: String(d.id),
        }))
      );
    } catch (e) {
      console.error("Error fetching locales:", e);
      setLocales([]);
    }

    try {
      const usuariosSnap = await getDocs(collection(db, "usuarios"));
      const mappedUsers = usuariosSnap.docs.map((d) => {
        const data = d.data() as any;
        return {
          ...data,
          // keep `id` for backward compatibility (was previously used as doc id)
          id: String(d.id),
          // document id explicitly
          docId: String(d.id),
          // prefer a stored numeroID field, fallback to previous `id` or doc id
          numeroID: data.numeroID ?? data.id ?? String(d.id),
        };
      });
      const withoutId = mappedUsers.filter((u) => !u.id && u.id !== 0);
      if (withoutId.length > 0)
        console.debug("fetchData - usuarios sin id:", withoutId);
      // log sample to see doc id vs stored uid
      console.debug(
        "fetchData - usuarios sample (docId vs data.uid):",
        mappedUsers
          .slice(0, 10)
          .map((u) => ({ docId: u.docId, uidField: (u as any).uid, data: u }))
      );
      setUsuarios(mappedUsers);
    } catch (e) {
      console.error("Error fetching usuarios:", e);
      setUsuarios([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleLocal = async (l: any) => {
    const expanded = expandedLocal === l.id;
    if (expanded) {
      setExpandedLocal(null);
      return;
    }

    setExpandedLocal(l.id);

    if (!localVisits[l.id]) {
      try {
        const visitasCol = collection(db, "locales", String(l.id), "visitas");
        const visitasSnap = await getDocs(visitasCol);
        const visitas = visitasSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));
        const hoy = new Date();
        const startOfToday = new Date(
          hoy.getFullYear(),
          hoy.getMonth(),
          hoy.getDate()
        );
        const startOfMonth = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        let diarios = 0;
        let mensuales = 0;
        const visitorsMap: Record<string, any> = {};
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
            const prev = visitorsMap[v.userDocId];
            if (
              !prev ||
              (ts && prev.lastVisit && ts > prev.lastVisit) ||
              (ts && !prev.lastVisit)
            ) {
              visitorsMap[v.userDocId] = {
                userDocId: v.userDocId,
                nombre: v.nombre,
                lastVisit: ts,
              };
            }
          }
        });
        const visitors = Object.values(visitorsMap);
        setLocalVisits((prev) => ({
          ...prev,
          [l.id]: { diarios, mensuales, visitors },
        }));
      } catch (e) {
        setLocalVisits((prev) => ({
          ...prev,
          [l.id]: { diarios: 0, mensuales: 0, visitors: [] },
        }));
      }
    }
  };

  // usuarios actualmente seleccionados (por docId)
  const selectedUsers = usuarios.filter((u) => selectedIds.includes(u.docId));
  // activar solo tiene sentido si al menos uno de los seleccionados está inactivo
  // Usamos `estado` como la propiedad que indica cuenta activa/inactiva.
  const canActivate = selectedUsers.some(
    (u) => u.estado === false || !u.estado
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin</Text>
    
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "locales" && styles.tabActive]}
          onPress={() => setActiveTab("locales")}
        >
          <Text style={styles.tabText}>Locales</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "usuarios" && styles.tabActive]}
          onPress={() => setActiveTab("usuarios")}
        >
          <Text style={styles.tabText}>Usuarios</Text>
        </TouchableOpacity>
      </View>

      {activeTab === "locales" ? (
        <ScrollView style={{ width: "100%" }}>
          {locales.map((l) => {
            const expanded = expandedLocal === l.id;
            const visitsData = localVisits[l.id];
            return (
              <View key={l.id} style={styles.card}>
                <TouchableOpacity onPress={() => handleToggleLocal(l)}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>
                      {l.nombre ?? "Sin nombre"}
                    </Text>
                    <View style={styles.countsBadge}>
                      <Text style={styles.countsText}>
                        {visitsData ? visitsData.diarios : "-"}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {expanded ? (
                  visitsData ? (
                    <View style={styles.cardBody}>
                      <View style={styles.countsRow}>
                        <View style={styles.countPill}>
                          <Text style={styles.countLabel}>Hoy</Text>
                          <Text style={styles.countNumber}>
                            {visitsData.diarios}
                          </Text>
                        </View>
                        <View style={styles.countPill}>
                          <Text style={styles.countLabel}>Mes</Text>
                          <Text style={styles.countNumber}>
                            {visitsData.mensuales}
                          </Text>
                        </View>
                      </View>

                      {visitsData.visitors.length > 0 ? (
                        <View style={{ marginTop: 8 }}>
                          {visitsData.visitors
                            .filter(
                              (v: any) =>
                                String(v.nombre ?? "").toLowerCase() !== "roddy"
                            )
                            .map((v: any) => (
                              <View
                                key={v.userDocId}
                                style={styles.visitorItem}
                              >
                                <View style={styles.avatarPlaceholder}>
                                  <Text style={styles.avatarInitials}>
                                    {getInitials(v.nombre ?? v.userDocId)}
                                  </Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.visitorName}>
                                    {v.nombre ?? v.userDocId}
                                  </Text>
                                  <Text style={styles.lastVisit}>
                                    {v.lastVisit
                                      ? v.lastVisit.toLocaleString()
                                      : "—"}
                                  </Text>
                                </View>
                                <View style={styles.smallBadge}>
                                  <Text style={styles.smallBadgeText}>V</Text>
                                </View>
                              </View>
                            ))}
                        </View>
                      ) : (
                        <Text style={[styles.cardText, { marginTop: 8 }]}>
                          No hay visitantes aún
                        </Text>
                      )}
                    </View>
                  ) : (
                    <Text style={[styles.cardText, { marginTop: 8 }]}>
                      Cargando visitas...
                    </Text>
                  )
                ) : null}
              </View>
            );
          })}
        </ScrollView>
      ) : (
        <ScrollView style={{ width: "100%" }}>
          {usuarios
            .filter((u) => {
              const name = String(u.nombre ?? "")
                .toLowerCase()
                .trim();
              // Excluir exactamente al admin 'Roddy Ramires' (case-insensitive)
              if (name === "roddy ramires") return false;
              return true;
            })
            .map((u) => (
              <View key={u.docId ?? u.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarInitials}>
                        {getInitials(u.nombre ?? (u as any).numeroID ?? u.id)}
                      </Text>
                    </View>
                    <Text style={[styles.cardTitle, { marginLeft: 8 }]}>
                      {u.nombre ?? "Sin nombre"}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View style={styles.statusRow}>
                      <Text
                        style={[
                          styles.statusText,
                          u.estado
                            ? styles.statusActive
                            : styles.statusInactive,
                        ]}
                      >
                        {u.estado ? "Activo" : "No activo"}
                      </Text>
                    </View>
                    {/* Selector (disponible para activos e inactivos) */}
                    <TouchableOpacity
                      style={[
                        styles.selectBox,
                        selectedIds.includes(u.docId) && styles.selectBoxActive,
                      ]}
                      onPress={() => {
                        setSelectedIds((prev) =>
                          prev.includes(u.docId)
                            ? prev.filter((i) => i !== u.docId)
                            : [...prev, u.docId]
                        );
                      }}
                    >
                      <Text style={styles.selectBoxText}>
                        {selectedIds.includes(u.docId) ? "✓" : "+"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.cardText}>
                  ID: {(u as any).numeroID ?? u.id ?? "(sin id)"}
                </Text>
              </View>
            ))}
        </ScrollView>
      )}
      {/* Barra de acciones cuando hay seleccionados */}
      {selectedIds.length > 0 && (
        <View style={styles.actionsBar}>
          <TouchableOpacity
            style={[styles.actionBtn, loading && styles.actionDisabled]}
            onPress={uploadPlanSelected}
            disabled={loading}
          >
            <Text style={styles.actionText}>Subir plan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionBtn,
              (!canActivate || loading) && styles.actionDisabled,
            ]}
            disabled={!canActivate || loading}
            onPress={activateSelected}
          >
            <Text style={styles.actionText}>Activar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionBtn,
              styles.actionDelete,
              loading && styles.actionDisabled,
            ]}
            disabled={loading}
            onPress={deleteSelected}
          >
            <Text style={styles.actionText}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      )}
      {/* Modal para elegir opción de plan */}
      <Modal visible={showPlanModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{planModalTitle}</Text>
            <ScrollView style={{ maxHeight: 260 }}>
              {planModalOptions.map((o) => (
                <TouchableOpacity
                  key={o.key}
                  style={styles.modalOption}
                  onPress={() => performUploadPlan(o.key)}
                >
                  <Text style={styles.modalOptionText}>{o.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                marginTop: 8,
              }}
            >
              <TouchableOpacity
                style={[styles.actionBtn, { marginRight: 8 }]}
                onPress={() => setShowPlanModal(false)}
              >
                <Text style={styles.actionText}>Cancelar</Text>
              </TouchableOpacity>
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
    padding: 16,
    alignItems: "center",
  },
  title: {
    color: "#e53935",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
  },
  tabRow: {
    flexDirection: "row",
    width: "100%",
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    padding: 10,
    backgroundColor: "#222",
    borderRadius: 8,
    marginRight: 8,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "#e53935",
  },
  tabText: {
    color: "#fff",
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "#222",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  cardTitle: {
    color: "#FFD700",
    fontWeight: "bold",
    marginBottom: 6,
  },
  cardText: {
    color: "#fff",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  countsBadge: {
    backgroundColor: "#333",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countsText: {
    color: "#fff",
    fontWeight: "bold",
  },
  cardBody: {
    marginTop: 8,
  },
  countsRow: {
    flexDirection: "row",
    gap: 8,
  },
  countPill: {
    backgroundColor: "#1e293b",
    padding: 8,
    borderRadius: 8,
    minWidth: 72,
    alignItems: "center",
  },
  countLabel: {
    color: "#9ca3af",
    fontSize: 12,
  },
  countNumber: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  visitorItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.04)",
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#374151",
    marginRight: 10,
  },
  visitorName: {
    color: "#fff",
    fontWeight: "600",
  },
  lastVisit: {
    color: "#9ca3af",
    fontSize: 12,
  },
  avatarInitials: {
    color: "#fff",
    fontWeight: "700",
    textAlign: "center",
  },
  smallBadge: {
    backgroundColor: "#444",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  smallBadgeText: {
    color: "#fff",
    fontWeight: "700",
  },
  badgeVisited: {
    backgroundColor: "#16a34a",
  },
  badgeNotVisited: {
    backgroundColor: "#6b7280",
  },
  statusRow: {
    marginLeft: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: {
    color: "#fff",
    fontWeight: "700",
  },
  statusActive: {
    color: "#16a34a", // verde
  },
  statusInactive: {
    color: "#dc2626", // rojo
  },
  selectBox: {
    marginLeft: 8,
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#555",
    alignItems: "center",
    justifyContent: "center",
  },
  selectBoxActive: {
    backgroundColor: "#16a34a",
    borderColor: "#16a34a",
  },
  selectBoxText: {
    color: "#fff",
    fontWeight: "700",
  },
  actionsBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#1f2937",
    borderRadius: 8,
  },
  actionDelete: {
    backgroundColor: "#dc2626",
  },
  actionText: {
    color: "#fff",
    fontWeight: "700",
  },
  actionDisabled: {
    opacity: 0.5,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    backgroundColor: "#111",
    width: "100%",
    maxWidth: 520,
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    color: "#fff",
    fontWeight: "700",
    marginBottom: 8,
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.04)",
  },
  modalOptionText: {
    color: "#fff",
    fontWeight: "600",
  },
});
