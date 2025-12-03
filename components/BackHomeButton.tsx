import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function BackHomeButton() {
  const router = useRouter();
  return (
    <View style={S.wrapper}>
      <Pressable style={S.btn} onPress={() => router.push("/home")}>
        <Text style={S.text}>🏠 Volver al inicio</Text>
      </Pressable>
    </View>
  );
}

const S = StyleSheet.create({
  wrapper: { marginTop: 20, alignItems: "center" },
  btn: {
    backgroundColor: "#E6B7C8",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#D79AB3",
  },
  text: { color: "#181818", fontWeight: "900" },
});
