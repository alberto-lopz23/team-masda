import { Slot, useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { auth } from "../../firebaseConfig";

export default function TabsLayout() {
  const router = useRouter();
  const [autenticado, setAutenticado] = useState<boolean | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setAutenticado(!!user);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (autenticado !== null) {
      router.replace(autenticado ? "/home" : "/welcome");
    }
  }, [autenticado, router]);

  if (autenticado === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#FF6F91" />
      </View>
    );
  }

  return <Slot />;
}