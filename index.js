// ======================== IMPORTS ================================
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import Groq from "groq-sdk";
import { findBuses } from "./routeEngine.js";

dotenv.config();

// ======================== LOAD BUS DATA ==========================
const buses = JSON.parse(fs.readFileSync("./data/buses.json", "utf-8"));

// Load Demand Counts
let demandCounts = {};
try {
  demandCounts = JSON.parse(fs.readFileSync("./data/demandCounts.json", "utf-8"));
} catch {
  demandCounts = {};
}

// Helper to persist JSON
function persistJSON(name, data) {
  fs.writeFileSync(`./data/${name}`, JSON.stringify(data, null, 2));
}

// ======================== INIT SERVER ============================
const app = express();
app.use(express.json());
app.use(cors());

// ======================== TEST ROUTE =============================
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// ======================== ETA SIMULATION =========================
function simulateETA(min) {
  return new Date(Date.now() + min * 60000).toISOString();
}

// =================================================================
//                     1️⃣ BUS ROUTE / OPTIONS
// =================================================================
app.post("/route", (req, res) => {
  const { start, end } = req.body || {};

  // Demand indexing
  const key = `${start || "ANY"}--${end || "ANY"}`;
  demandCounts[key] = (demandCounts[key] || 0) + 1;
  persistJSON("demandCounts.json", demandCounts);

  const routes = buses.map((bus) => ({
    id: bus.id,
    busNumber: bus.busNumber,
    pickupStop: bus.stops[0].name,
    pickupETA: simulateETA(5),
    dropStop: bus.stops.at(-1).name,
    dropETA: simulateETA(30 + Math.random() * 20),
    fare: bus.baseFare,
    speedKmph: bus.speedKmph,
    crowdScore: Math.random(),
    probabilityOnTime: (0.7 + Math.random() * 0.3).toFixed(2),
    polyline: bus.polyline
  }));

  res.json({
    routes,
    meta: {
      bestTimeToLeaveMinutes: 10 + Math.floor(Math.random() * 10),
      predictedDemand: demandCounts[key],
      safetyIndex: (0.75 + Math.random() * 0.2).toFixed(2)
    }
  });
});

// =================================================================
//                     2️⃣ LIVE BUS TRACKING
// =================================================================
const busStart = {};

function getBusPosition(bus) {
  const poly = bus.polyline;
  const speed = bus.speedKmph;

  if (!busStart[bus.id]) busStart[bus.id] = Date.now();

  const elapsedHours = (Date.now() - busStart[bus.id]) / 3600000;
  const dist = speed * elapsedHours;

  let segmentDist = [];
  let total = 0;

  for (let i = 0; i < poly.length - 1; i++) {
    const dx = poly[i + 1][0] - poly[i][0];
    const dy = poly[i + 1][1] - poly[i][1];
    const seg = Math.sqrt(dx * dx + dy * dy) * 111;
    segmentDist.push(seg);
    total += seg;
  }

  let prog = dist / total;
  if (prog >= 1) {
    busStart[bus.id] = Date.now();
    prog = 0;
  }

  let run = 0;
  let segIndex = 0;
  for (let i = 0; i < segmentDist.length; i++) {
    if (run + segmentDist[i] > prog * total) {
      segIndex = i;
      break;
    }
    run += segmentDist[i];
  }

  const segProg = (prog * total - run) / segmentDist[segIndex];

  const start = poly[segIndex];
  const end = poly[segIndex + 1];

  return {
    lat: start[0] + (end[0] - start[0]) * segProg,
    lng: start[1] + (end[1] - start[1]) * segProg,
    speedKmph: speed,
    timestamp: new Date().toISOString()
  };
}

function autoFeedback(bus, pos) {
  const fb = [];

  if (pos.speedKmph < bus.speedKmph * 0.6) fb.push("Bus moving slower than usual.");
  if (Math.random() > 0.7) fb.push("Traffic is heavy.");
  if (Math.random() > 0.8) fb.push("Bus is crowded.");
  if (fb.length === 0) fb.push("Bus running smoothly.");

  return fb;
}

app.get("/busLocation", (req, res) => {
  const bus = buses.find((b) => b.id === req.query.busId);
  if (!bus) return res.status(400).json({ error: "Invalid busId" });

  const pos = getBusPosition(bus);
  const fb = autoFeedback(bus, pos);

  res.json({ position: pos, feedback: fb });
});

// =================================================================
//                     3️⃣ AI RECOMMENDATION ENGINE
// =================================================================

// If no GROQ_KEY provided → disable AI safely
let groqClient = null;
try {
  if (process.env.GROQ_KEY) {
    groqClient = new Groq({ apiKey: process.env.GROQ_KEY });
    console.log("✅ Groq AI initialized");
  }
} catch {
  groqClient = null;
}

// Always returns a response
async function askAI(prompt) {
  if (!groqClient) {
    return `
AI offline. Quick suggestions:
• Leave in ~12 min
• Route safety: Moderate
• Consider autos/cabs if bus delay > 20 mins
• Last-mile: walk 300–500m or take auto
`;
  }

  const models = [
    "llama-3.3-70b-versatile"   // Only stable working model
  ];

  for (const model of models) {
    try {
      const completion = await groqClient.chat.completions.create({
        model,
        messages: [
          { role: "system", content: "You are a transport assistant AI." },
          { role: "user", content: prompt }
        ]
      });
      return completion.choices[0].message.content;
    } catch (err) {
      console.log(`Model failed (${model}):`, err.message);
    }
  }

  return `
AI temporarily unavailable.
Fallback:
• Leave early
• Check autos/motos
• Use safe main roads
`;
}

app.post("/ai", async (req, res) => {
  const { start, destination, delayMinutes } = req.body;

  const prompt = `
Trip details:
Start: ${start}
Destination: ${destination}
Delay: ${delayMinutes} minutes

Provide:
• Best time to leave
• Safety score
• Route reliability
• Fallback options (cab/auto/moto)
• Last-mile assistance
  `;

  const reply = await askAI(prompt);
  res.json({ reply });
});

// =================================================================
//                     4️⃣ FIND BUSES
// =================================================================
app.post("/findBuses", (req, res) => {
  const { start, destination } = req.body;
  const result = findBuses(start, destination, buses);

  if (result.length === 0)
    return res.json({ buses: [], message: "No buses found." });

  res.json({ buses: result });
});

// =================================================================
//                     5️⃣ FALLBACK (CAB/AUTO/MOTO)
// =================================================================
app.post("/fallback", (req, res) => {
  const { start, destination, busDelayMinutes, filter } = req.body;

  const rides = [
    {
      type: "Moto",
      provider: "Rapido",
      price: 40 + Math.floor(Math.random() * 20),
      pickupETA: 3 + Math.floor(Math.random() * 4),
      travelTime: 12 + Math.floor(Math.random() * 10)
    },
    {
      type: "Auto",
      provider: "Ola Auto",
      price: 70 + Math.floor(Math.random() * 30),
      pickupETA: 4 + Math.floor(Math.random() * 5),
      travelTime: 15 + Math.floor(Math.random() * 12)
    },
    {
      type: "Cab",
      provider: "Uber Go",
      price: 120 + Math.floor(Math.random() * 50),
      pickupETA: 5 + Math.floor(Math.random() * 5),
      travelTime: 18 + Math.floor(Math.random() * 10)
    }
  ];

  let filtered = rides;
  if (filter) {
    filtered = rides.filter(
      (r) => r.type.toLowerCase() === filter.toLowerCase()
    );
  }

  filtered.sort((a, b) => a.price - b.price);

  res.json({
    reason:
      busDelayMinutes > 30 ? "Bus delayed — fallback recommended." : "Optional fallback.",
    start,
    destination,
    filterUsed: filter || "none",
    alternatives: filtered
  });
});

// =================================================================
//                     6️⃣ LAST-MILE SUPPORT
// =================================================================
app.post("/lastmile", (req, res) => {
  res.json({
    walking: `${300 + Math.floor(Math.random() * 200)} meters`,
    auto: `${1 + (Math.random() * 1.5).toFixed(1)} km`,
    bikeShare: Math.random() > 0.5 ? "Available" : "Not available"
  });
});

// =================================================================
//                     7️⃣ SOS / EMERGENCY
// =================================================================
app.get("/sos", (req, res) => {
  res.json({
    emergencyNumbers: ["100", "112", "1091"],
    nearbyPolice: "1.3 km away",
    safeSpots: ["Metro Station Gate A", "Mall Security Desk"]
  });
});

// =================================================================
//                     START SERVER
// =================================================================
app.listen(5000, () => console.log("Server running on port 5000"));
