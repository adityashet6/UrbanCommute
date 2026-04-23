// ===================== ROUTE ENGINE ==========================
// Searches buses that contain start → destination in correct order

export function findBuses(start, destination, busDatabase) {
  const result = [];

  for (const bus of busDatabase) {
    const startIndex = bus.route.indexOf(start);
    const endIndex = bus.route.indexOf(destination);

    if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
      result.push({
        id: bus.id,
        busNumber: bus.busNumber,
        startTime: bus.startTime,
        endTime: bus.endTime,
        fare: bus.baseFare,
        speedKmph: bus.speedKmph,
        route: bus.route,
        probabilityOnTime: (0.7 + Math.random() * 0.25).toFixed(2) // 70% – 95%
      });
    }
  }

  return result;
}

// ================= DELAY PROBABILITY ENGINE ==================

export function calculateDelayProbability(bus, trafficLevel) {
  let score = parseFloat(bus.probabilityOnTime);

  if (trafficLevel === "high") score -= 0.25;
  if (trafficLevel === "medium") score -= 0.10;

  if (score < 0) score = 0;
  if (score > 1) score = 1;

  return score.toFixed(2);
}
