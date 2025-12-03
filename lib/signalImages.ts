// lib/signalImages.ts
// Mapping estático EXACTO a tus archivos (no hay rutas dinámicas en RN)
export const signalImages: Record<string, any> = {
  "__fallback": require("../assets/elvia-logo.png"),

  "accident-ahead.png": require("../assets/signals/accident-ahead.png"),
  "animal-crossing.png": require("../assets/signals/animal-crossing.png"),
  "lane-closed-ahead.png": require("../assets/signals/lane-closed-ahead.png"),
  "merge-right.png": require("../assets/signals/merge-right.png"),
  "merge-road.jpg": require("../assets/signals/merge-road.jpg"), // ← TU ARCHIVO ES .jpg
  "no-left-turn.png": require("../assets/signals/no-left-turn.png"),
  "no-parking-zone.png": require("../assets/signals/no-parking-zone.png"),
  "no-right-turn.png": require("../assets/signals/no-right-turn.png"),
  "no-u-turn.png": require("../assets/signals/no-u-turn.png"),
  "pedestrian-crossing.png": require("../assets/signals/pedestrian-crossing.png"),
  "railroad-crossing.png": require("../assets/signals/railroad-crossing.png"),
  "road-work-ahead.png": require("../assets/signals/road-work-ahead.png"),
  "sharp-curve-right.png": require("../assets/signals/sharp-curve-right.png"),
  "sharp-curve-left.png": require("../assets/signals/sharp-curve-left.png"),
  "slippery-when-wet.png": require("../assets/signals/slippery-when-wet.png"),
  "speed-limit-50.png": require("../assets/signals/speed-limit-50.png"),
  "stop.png": require("../assets/signals/stop.png"),
  "traffic-light-ahead.png": require("../assets/signals/traffic-light-ahead.png"),
  "truck-downhill.png": require("../assets/signals/truck-downhill.png"),
  "weight-limit-10-tons.png": require("../assets/signals/weight-limit-10-tons.png"),
  "weight-station.png": require("../assets/signals/weight-station.png"),
  "yield.png": require("../assets/signals/yield.png"),
  "school-zone.png": require("../assets/signals/school-zone.png")
};

// Helper: si el JSON pide .png y existe .jpg (o viceversa), resolvemos igual
export function getSignalImage(file: string) {
  if (signalImages[file]) return signalImages[file];
  const alt = file.endsWith(".png") ? file.replace(".png", ".jpg") : file.replace(".jpg", ".png");
  return signalImages[alt] ?? signalImages["__fallback"];
}
