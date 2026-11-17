// Anti-RMT PvE trading template: minimal server.
// The server owns: the price list, item ownership, trading.
// The server does NOT track or validate currency. Currency lives on the client.

const { WebSocketServer } = require("ws");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const catalog = require("./catalog.json");

const PORT = process.env.PORT || 8080;
const DATA_FILE = path.join(__dirname, "..", "inventories.json");

// ---- storage (JSON file; swap for a real database in production) ----
let inventories = {};
if (fs.existsSync(DATA_FILE)) {
  inventories = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}
let dirty = false;
function saveSoon() { dirty = true; }
setInterval(() => {
  if (!dirty) return;
  fs.writeFileSync(DATA_FILE, JSON.stringify(inventories, null, 2));
  dirty = false;
}, 3000);

// ---- pricing: ALWAYS decided by the developer's catalog, never by supply or luck ----
// price = basePrice + sum(affixValue * pricePerPoint)
function quote(baseId, affixes) {
  const base = catalog.items[baseId];
  if (!base) return { error: "unknown item" };
  if (!Array.isArray(affixes)) affixes = [];
  if (affixes.length > 6) return { error: "too many affixes" };

  let price = base.basePrice;
  const seen = new Set();
  const clean = [];
  for (const a of affixes) {
    const def = catalog.affixes[a && a.id];
    if (!def) return { error: "unknown affix" };
    if (seen.has(a.id)) return { error: "duplicate affix" };
    seen.add(a.id);
    const v = Number(a.value);
    if (!Number.isInteger(v) || v < def.min || v > def.max) {
      return { error: `affix ${a.id} must be an integer ${def.min}-${def.max}` };
    }
    price += v * def.pricePerPoint;
    clean.push({ id: a.id, value: v });
  }
  return { price, affixes: clean };
}

// ---- networking ----
const online = new Map(); // playerId -> ws
const wss = new WebSocketServer({ port: PORT });

function send(ws, obj) {
  if (ws.readyState === 1) ws.send(JSON.stringify(obj));
}

wss.on("connection", (ws) => {
  let playerId = null;
  let msgCount = 0;
  const limiter = setInterval(() => { msgCount = 0; }, 1000);

  ws.on("message", (raw) => {
    if (++msgCount > 10) return send(ws, { type: "error", error: "rate limited" });

    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.type === "login") {
      // DEMO ONLY: no authentication. Use real auth (Steam, OAuth, etc.) in production.
      if (!/^[A-Za-z0-9_-]{1,32}$/.test(msg.playerId || "")) {
        return send(ws, { type: "error", error: "bad playerId" });
      }
      playerId = msg.playerId;
      online.set(playerId, ws);
      if (!inventories[playerId]) { inventories[playerId] = []; saveSoon(); }
      return send(ws, { type: "loggedIn", playerId });
    }

    if (!playerId) return send(ws, { type: "error", error: "login first" });

    switch (msg.type) {
      case "catalog":
        return send(ws, { type: "catalog", catalog });

      case "quote": {
        const q = quote(msg.baseId, msg.affixes);
        if (q.error) return send(ws, { type: "error", error: q.error });
        return send(ws, { type: "quote", baseId: msg.baseId, ...q });
      }

      case "buy": {
        // No balance check on purpose: currency is client-side and editable.
        const q = quote(msg.baseId, msg.affixes);
        if (q.error) return send(ws, { type: "error", error: q.error });
        const item = { uid: crypto.randomUUID(), baseId: msg.baseId, affixes: q.affixes };
        inventories[playerId].push(item);
        saveSoon();
        return send(ws, { type: "bought", item, price: q.price });
      }

      case "inventory":
        return send(ws, { type: "inventory", items: inventories[playerId] });

      case "trade": {
        // Simple direct transfer. Safe to allow because every item is buyable by anyone.
        const to = msg.to;
        if (to === playerId || !inventories[to]) {
          return send(ws, { type: "error", error: "unknown recipient" });
        }
        const idx = inventories[playerId].findIndex((i) => i.uid === msg.uid);
        if (idx === -1) return send(ws, { type: "error", error: "you don't own that item" });
        const [item] = inventories[playerId].splice(idx, 1);
        inventories[to].push(item);
        saveSoon();
        send(ws, { type: "traded", item, to });
        const target = online.get(to);
        if (target) send(target, { type: "received", item, from: playerId });
        return;
      }

      default:
        return send(ws, { type: "error", error: "unknown message type" });
    }
  });

  ws.on("close", () => {
    clearInterval(limiter);
    if (playerId && online.get(playerId) === ws) online.delete(playerId);
  });
});

console.log(`Server listening on ws://localhost:${PORT}`);
