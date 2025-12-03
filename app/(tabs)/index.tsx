import React from "react";
// Desde app/(tabs)/index.tsx, sube un nivel y trae app/home.tsx
import Home from "../home";

export default function HomeTab() {
  return <Home />;
}