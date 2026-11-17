// Anti-RMT PvE trading template: minimal command-line client.
// Currency ("points") is stored in wallet-<name>.json on YOUR machine.
// Open that file and change the number. That is intentional.

const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

const name = process.argv[2];
if (!name) {
  console.log("Usage: node src/client.js <playerName>");
  process.exit(1);
}
const URL = process.env.SERVER || "ws://localhost:8080";
const walletFile = path.join(__dirname, "..", `wallet-${name}.json`);

function loadWallet() {
  if (!fs.existsSync(walletFile)) fs.writeFileSync(walletFile, JSON.stringify({ points: 1000 }));
  return JSON.parse(fs.readFileSync(walletFile, "utf8"));
}
function saveWallet(w) { fs.writeFileSync(walletFile, JSON.stringify(w)); }

const ws = new WebSocket(URL);
let pending = null; // buy waiting for a price quote

function send(obj) { ws.send(JSON.stringify(obj)); }
function fmt(item) {
  const a = item.affixes.map((x) => `${x.id}+${x.value}`).join(", ");
  return `${item.baseId}${a ? " [" + a + "]" : ""} (uid ${item.uid.slice(0, 8)})`;
}

ws.on("open", () => {
  send({ type: "login", playerId: name });
  console.log(`Connected as ${name}. Points: ${loadWallet().points}`);
  console.log("Commands: catalog | points | quote <item> [atk:5,hp:20] | buy <item> [atk:5,hp:20] | inv | trade <player> <uid-prefix>");
});

ws.on("message", (raw) => {
  const m = JSON.parse(raw);
  const wallet = loadWallet(); // re-read every time so edits apply immediately
  switch (m.type) {
    case "catalog":
      console.log("Items:");
      for (const [id, i] of Object.entries(m.catalog.items)) console.log(`  ${id}: ${i.name}, base ${i.basePrice}`);
      console.log("Affixes:");
      for (const [id, a] of Object.entries(m.catalog.affixes)) {
        console.log(`  ${id}: ${a.name}, ${a.pricePerPoint}/pt, range ${a.min}-${a.max}`);
      }
      break;
    case "quote":
      if (pending) {
        const p = pending; pending = null;
        if (wallet.points < m.price) {
          console.log(`Not enough points (${wallet.points} < ${m.price}).`);
        } else {
          send({ type: "buy", baseId: p.baseId, affixes: p.affixes });
        }
      } else {
        console.log(`Price: ${m.price}`);
      }
      break;
    case "bought":
      wallet.points -= m.price;
      saveWallet(wallet);
      console.log(`Bought ${fmt(m.item)} for ${m.price}. Points left: ${wallet.points}`);
      break;
    case "inventory":
      console.log(m.items.length ? m.items.map(fmt).join("\n") : "(empty)");
      break;
    case "traded":
      console.log(`Sent ${fmt(m.item)} to ${m.to}`);
      break;
    case "received":
      console.log(`Received ${fmt(m.item)} from ${m.from}`);
      break;
    case "error":
      pending = null;
      console.log("Error:", m.error);
      break;
  }
});

function parseAffixes(s) {
  if (!s) return [];
  return s.split(",").map((p) => {
    const [id, v] = p.split(":");
    return { id, value: Number(v) };
  });
}

const rl = readline.createInterface({ input: process.stdin });
rl.on("line", (line) => {
  const [cmd, a, b] = line.trim().split(/\s+/);
  if (cmd === "catalog") send({ type: "catalog" });
  else if (cmd === "points") console.log(`Points: ${loadWallet().points}`);
  else if (cmd === "inv") send({ type: "inventory" });
  else if (cmd === "quote") send({ type: "quote", baseId: a, affixes: parseAffixes(b) });
  else if (cmd === "buy") {
    pending = { baseId: a, affixes: parseAffixes(b) };
    send({ type: "quote", baseId: a, affixes: pending.affixes });
  } else if (cmd === "trade") {
    // trade <player> <uid-prefix>; the server needs the full uid, so look it up first
    pendingTrade(a, b);
  }
});

// Resolve a uid prefix against the inventory, then trade.
function pendingTrade(to, prefix) {
  const handler = (raw) => {
    const m = JSON.parse(raw);
    if (m.type !== "inventory") return;
    ws.off("message", handler);
    const item = m.items.find((i) => i.uid.startsWith(prefix || ""));
    if (!item) return console.log("No item with that uid prefix.");
    send({ type: "trade", to, uid: item.uid });
  };
  ws.on("message", handler);
  send({ type: "inventory" });
}
