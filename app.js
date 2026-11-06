const DB_NAME = "eva-local-v1";
const DB_VERSION = 1;
let db;
let activeConversation = [];
let notes = "";

const $ = (id) => document.getElementById(id);

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const d = request.result;
      if (!d.objectStoreNames.contains("kv")) d.createObjectStore("kv");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
function getValue(key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("kv", "readonly");
    const req = tx.objectStore("kv").get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
function setValue(key, value) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("kv", "readwrite");
    tx.objectStore("kv").put(value, key);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}
function renderMessages() {
  const host = $("messages");
  host.replaceChildren();
  if (!activeConversation.length) {
    const hint = document.createElement("div");
    hint.className = "empty-hint";
    hint.textContent = "Your conversation will appear here. Try: “EVA, introduce yourself.”";
    host.append(hint);
    return;
  }
  for (const item of activeConversation) {
    const bubble = document.createElement("div");
    bubble.className = `message ${item.role}`;
    const who = document.createElement("span");
    who.className = "who";
    who.textContent = item.role === "user" ? "YOU" : "EVA";
    const body = document.createElement("span");
    body.textContent = item.text;
    bubble.append(who, body);
    host.append(bubble);
  }
  host.scrollTop = host.scrollHeight;
}
async function saveConversation() {
  await setValue("conversation", activeConversation);
}
async function sendMessage() {
  const input = $("messageInput");
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  activeConversation.push({ role: "user", text, at: new Date().toISOString() });
  await saveConversation();
  renderMessages();

  // Deliberately no fabricated assistant answer. A real local inference runtime
  // will replace this notice in a later build.
  const notice = "I've saved your message on this device. My local language-model engine is not connected in this starter version yet, so I won't pretend I've generated an AI response. The next development step is adding a tested on-device runtime.";
  activeConversation.push({ role: "assistant", text: notice, at: new Date().toISOString() });
  await saveConversation();
  renderMessages();
}
function switchPanel(panelId) {
  document.querySelectorAll(".panel").forEach(p => p.classList.toggle("active", p.id === panelId));
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.panel === panelId));
}
async function checkGPU() {
  const supported = !!(navigator.gpu);
  $("gpuStatus").textContent = supported
    ? "WebGPU API detected. Actual model compatibility and memory limits still need testing."
    : "WebGPU not detected. Local browser inference may not be available in this browser.";
  $("gpuPill").textContent = supported ? "Detected" : "Not detected";
  $("gpuPill").classList.toggle("green", supported);
}
async function init() {
  try {
    db = await openDB();
    activeConversation = (await getValue("conversation")) || [];
    notes = (await getValue("notes")) || "";
    $("memoryInput").value = notes;
    $("engineStatus").textContent = "Local browser storage ready · AI engine not connected";
    renderMessages();
  } catch (err) {
    $("engineStatus").textContent = "Local storage unavailable: " + err.message;
  }
  checkGPU();
}
$("sendButton").addEventListener("click", sendMessage);
$("messageInput").addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});
$("newChat").addEventListener("click", async () => {
  activeConversation = [];
  await saveConversation();
  renderMessages();
  switchPanel("chatPanel");
});
document.querySelectorAll(".tab").forEach(t => t.addEventListener("click", () => switchPanel(t.dataset.panel)));
$("saveMemory").addEventListener("click", async () => {
  notes = $("memoryInput").value;
  await setValue("notes", notes);
  $("memoryStatus").textContent = "Saved locally on this device.";
});
$("exportData").addEventListener("click", async () => {
  const payload = { app: "EVA", exportedAt: new Date().toISOString(), conversation: activeConversation, notes };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "eva-private-export.json"; a.click();
  URL.revokeObjectURL(url);
});
$("deleteData").addEventListener("click", async () => {
  if (!confirm("Delete EVA conversations and notes from this browser? This cannot be undone.")) return;
  activeConversation = []; notes = "";
  await setValue("conversation", []);
  await setValue("notes", "");
  $("memoryInput").value = "";
  $("memoryStatus").textContent = "Local notes deleted.";
  renderMessages();
});
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}
init();
