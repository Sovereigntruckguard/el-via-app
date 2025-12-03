// components/RoseEmbossedSeal.tsx
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

/**
 * Sello “tallado” en oro rosado, incrustado en el fondo.
 * - Usar al final de las pantallas (Welcome, Home, Manual, etc.)
 * - Evita warnings en web (no usa pointerEvents como prop).
 *
 * Props:
 *  - text   : texto principal (default: "ELVIA")
 *  - author : autor o marca ("Elizabeth Tamayo")
 *  - compact: reduce padding/altura
 */
type Props = {
  text?: string;
  author?: string;
  compact?: boolean;
};

export default function RoseEmbossedSeal({ text = "ELVIA", author = "Elizabeth Tamayo", compact = false }: Props) {
  return (
    <View style={[S.wrap, compact && S.wrapCompact, { pointerEvents: "none" as any }]}>
      <View style={S.plate}>
        {/* Bisel superior */}
        <LinearGradient
          colors={["rgba(255,255,255,0.10)", "rgba(255,255,255,0.00)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={S.highlight}
        />
        {/* Texto metalizado */}
        <Text style={S.brand}>
          <Text style={S.brandMain}>{text}</Text>
          <Text style={S.by}>  By: </Text>
          <Text style={S.author}>{author}</Text>
        </Text>
        {/* Sheen diagonal muy suave */}
        <LinearGradient
          colors={["transparent", "rgba(255,255,255,0.07)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={S.sheen}
        />
      </View>
    </View>
  );
}

const ROSE = "#E6B7C8";
const ROSE_DEEP = "#D79AB3";

const S = StyleSheet.create({
  wrap: {
    paddingTop: 10,
    paddingBottom: Platform.select({ web: 18, default: 12 })
  },
  wrapCompact: {
    paddingTop: 6,
    paddingBottom: 10
  },
  plate: {
    backgroundColor: "#141414",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    overflow: "hidden",
    // sombra sutil (móvil)
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    // sombra en web
    ...(Platform.OS === "web" ? { boxShadow: "0 10px 18px rgba(0,0,0,0.35)" as any } : null)
  },
  highlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 10
  },
  sheen: {
    position: "absolute",
    inset: 0 as any
  },
  brand: {
    color: ROSE,
    fontWeight: "900",
    letterSpacing: 0.8,
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 7
  },
  brandMain: {
    color: ROSE
  },
  by: {
    color: ROSE_DEEP,
    fontWeight: "800"
  },
  author: {
    color: ROSE
  }
});
