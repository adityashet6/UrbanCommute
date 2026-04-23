// -------- MOCK RIDE ENGINE (Uber / Ola / Rapido Simulation) --------

// Ride catalog
const RIDES = [
  { id: "r1", type: "Moto", baseFare: 25, perKm: 7, speed: 45 },
  { id: "r2", type: "Auto", baseFare: 35, perKm: 12, speed: 35 },
  { id: "r3", type: "Cab", baseFare: 60, perKm: 18, speed: 50 }
];

// Surge pricing generator
function surgeMultiplier() {
  return 1 + Math.random() * 0.5; // 1.0 to 1.5
}

// Calculate price for a ride
function calculatePrice(distanceKm, ride) {
  return Math.round((ride.baseFare + ride.perKm * distanceKm) * surgeMultiplier());
}

// Generate a random ETA (3–10 minutes)
function generateETA() {
  return Math.floor(3 + Math.random() * 8);
}

// Main ride generator
export function getRideOptions(distanceKm, filterType = "all", sortBy = "price") {
  let list = RIDES.map((ride) => ({
    type: ride.type,
    id: ride.id,
    price: calculatePrice(distanceKm, ride),
    etaMinutes: generateETA(),
    speed: ride.speed
  }));

  // Filter by ride type (Moto / Auto / Cab)
  if (filterType !== "all") {
    list = list.filter((r) => r.type.toLowerCase() === filterType.toLowerCase());
  }

  // Sorting options
  if (sortBy === "price") {
    list.sort((a, b) => a.price - b.price);
  } else if (sortBy === "eta") {
    list.sort((a, b) => a.etaMinutes - b.etaMinutes);
  } else if (sortBy === "speed") {
    list.sort((a, b) => b.speed - a.speed); // fastest first
  }

  return list;
}

// Auto select best ride (cheapest by default)
export function getBestRide(distanceKm) {
  const options = getRideOptions(distanceKm, "all", "price");
  return options[0];
}
