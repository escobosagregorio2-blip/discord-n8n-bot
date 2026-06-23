// Discord Bot - Bridge to n8n + Escalation System
// v3.0: memoria de conversacion + estado persistente + retry + healthcheck + TTL

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  REST,
  Routes,
  SlashCommandBuilder,
} = require("discord.js");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// ================================================================
// S1: CONFIGURACION
// ================================================================

const DISCORD_TOKEN         = process.env.DISCORD_TOKEN;
const N8N_WEBHOOK_URL       = process.env.N8N_WEBHOOK_URL;
const N8N_WEBHOOK_SECRET    = process.env.N8N_WEBHOOK_SECRET;
const ESCALATION_CHANNEL_ID = process.env.ESCALATION_CHANNEL_ID;
const SUPPORT_ROLE_ID       = process.env.SUPPORT_ROLE_ID;
const GUILD_ID              = process.env.DISCORD_GUILD_ID;
const HEALTHCHECK_URL       = process.env.HEALTHCHECK_URL;

const HUMAN_HANDLING_TTL_MS = parseInt(process.env.HUMAN_HANDLING_TTL_MS || "") || 4 * 60 * 60 * 1000;
const ESCALATION_COOLDOWN_SECONDS = parseInt(process.env.ESCALATION_COOLDOWN_SECONDS || "") || 15 * 60;

const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

if (!DISCORD_TOKEN) {
  console.error("Error: DISCORD_TOKEN no encontrado en .env");
  process.exit(1);
}
if (!N8N_WEBHOOK_URL) {
  console.error("Error: N8N_WEBHOOK_URL no encontrado en .env");
  process.exit(1);
}
if (!N8N_WEBHOOK_SECRET) {
  console.warn("N8N_WEBHOOK_SECRET no configurado. El webhook es publico.");
}

console.log("🎯 ========================================");
console.log("🎯 VERSION 2.0 CON ESCALACION ACTIVADA 🎯");
console.log("🎯 ========================================");
console.log("Configuracion cargada");
console.log("Webhook n8n: " + N8N_WEBHOOK_URL);
if (HEALTHCHECK_URL) console.log("Healthcheck: " + HEALTHCHECK_URL);

// ================================================================
// S2a: MEMORIA DE CONVERSACION (conversation_memory.json)
// ================================================================

const MAX_HISTORY = 15;
const MEMORY_FILE = path.join(__dirname, "conversation_memory.json");

const memoryStore = new Map();

let memWriteChain = Promise.resolve();
let memWritePending = false;

function persistMemory() {
  if (memWritePending) return memWriteChain;
  memWritePending = true;
  memWriteChain = memWriteChain.then(async () => {
    memWritePending = false;
    try {
      const snapshot = {};
      for (const [channelId, entries] of memoryStore.entries()) {
        snapshot[channelId] = entries;
      }
      const tmpFile = MEMORY_FILE + ".tmp";
      await fs.promises.writeFile(tmpFile, JSON.stringify(snapshot), "utf8");
      await fs.promises.rename(tmpFile, MEMORY_FILE);
    } catch (err) {
      console.error("No se pudo guardar conversation_memory.json: " + err.message);
    }
  });
  return memWriteChain;
}

function loadMemory() {
  try {
    if (!fs.existsSync(MEMORY_FILE)) {
      console.log("Memoria: archivo no existe, arrancando vacio.");
      return;
    }
    const raw = fs.readFileSync(MEMORY_FILE, "utf8");
    const snapshot = JSON.parse(raw);
    let channels = 0;
    for (const [channelId, entries] of Object.entries(snapshot)) {
      if (Array.isArray(entries)) {
        memoryStore.set(channelId, entries.slice(-MAX_HISTORY));
        channels++;
      }
    }
    console.log("Memoria cargada: " + channels + " canal(es).");
  } catch (err) {
    console.error("No se pudo cargar conversation_memory.json (arranca vacio): " + err.message);
    memoryStore.clear();
  }
}

function addToMemory(channelId, entry) {
  let entries = memoryStore.get(channelId);
  if (!entries) {
    entries = [];
    memoryStore.set(channelId, entries);
  }
  entries.push(entry);
  if (entries.length > MAX_HISTORY) {
    entries.splice(0, entries.length - MAX_HISTORY);
  }
  persistMemory();
}

function getHistory(channelId) {
  const entries = memoryStore.get(channelId);
  if (!entries) return [];
  return entries.map((e) => ({ ...e }));
}

loadMemory();

// ================================================================
// S2b: ESTADO PERSISTENTE DE ESCALACION (escalation_state.json)
// ================================================================

const STATE_FILE = path.join(__dirname, "escalation_state.json");

const channelStates = new Map();

let stateWriteChain = Promise.resolve();
let stateWritePending = false;

function persistState() {
  if (stateWritePending) return stateWriteChain;
  stateWritePending = true;
  stateWriteChain = stateWriteChain.then(async () => {
    stateWritePending = false;
    try {
      const snapshot = {};
      for (const [channelId, data] of channelStates.entries()) {
        snapshot[channelId] = data;
      }
      const tmpFile = STATE_FILE + ".tmp";
      await fs.promises.writeFile(tmpFile, JSON.stringify(snapshot, null, 2), "utf8");
      await fs.promises.rename(tmpFile, STATE_FILE);
    } catch (err) {
      console.error("No se pudo guardar escalation_state.json: " + err.message);
    }
  });
  return stateWriteChain;
}

function loadState() {
  try {
    if (!fs.existsSync(STATE_FILE)) {
      console.log("escalation_state.json no existe, arrancando vacio.");
      return;
    }
    const raw = fs.readFileSync(STATE_FILE, "utf8");
    const snapshot = JSON.parse(raw);
    let count = 0;
    for (const [channelId, data] of Object.entries(snapshot)) {
      if (data && typeof data.state === "string") {
        channelStates.set(channelId, data);
        count++;
      }
    }
    console.log("Estado cargado: " + count + " canal(es).");
  } catch (err) {
    console.error("No se pudo cargar escalation_state.json (arranca vacio): " + err.message);
    channelStates.clear();
  }
}

function getChannelState(channelId) {
  const data = channelStates.get(channelId);
  if (!data) return { state: "ACTIVE" };

  if (data.state === "HUMAN_HANDLING" && data.disabledUntil) {
    const nowSec = Date.now() / 1000;
    if (nowSec >= data.disabledUntil) {
      console.log("TTL expirado para canal " + channelId + ", reactivando bot.");
      const updated = { ...data, state: "ACTIVE", disabledUntil: null, humanHandlingTs: null };
      channelStates.set(channelId, updated);
      persistState();
      return updated;
    }
  }
  return data;
}

function setChannelState(channelId, updates) {
  const current = channelStates.get(channelId) || { state: "ACTIVE" };
  const updated = { ...current, ...updates };
  channelStates.set(channelId, updated);
  persistState();
  return updated;
}

loadState();

// ================================================================
// RETRY HACIA N8N CON BACKOFF EXPONENCIAL
// ================================================================

async function sendWithRetry(url, data, headers) {
  headers = headers || {};
  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      const response = await axios.post(url, data, {
        timeout: 15000,
        headers: Object.assign({ "Content-Type": "application/json" }, headers),
      });
      return { success: true, status: response.status };
    } catch (error) {
      if (attempt === RETRY_ATTEMPTS) {
        return {
          success: false,
          error: error.response ? error.response.status : error.code,
          message: error.message,
        };
      }
      const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
      console.log("Reintentando en " + delay + "ms... (intento " + attempt + "/" + RETRY_ATTEMPTS + ")");
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

// ================================================================
// HEALTHCHECK
// ================================================================

function sendHealthcheck(status) {
  status = status || "up";
  if (!HEALTHCHECK_URL) return;
  const url = status === "up" ? HEALTHCHECK_URL : HEALTHCHECK_URL + "/fail";
  axios.get(url, { timeout: 5000 }).catch((err) => {
    console.error("Error en healthcheck: " + err.message);
  });
}

// ================================================================
// PALABRAS CLAVE DE ESCALACION
// ================================================================

const ESCALATION_KEYWORDS = [
  "hablar con un humano",
  "hablar con humano",
  "quiero un humano",
  "necesito un humano",
  "quiero una persona",
  "necesito una persona",
  "quiero un asesor",
  "necesito un asesor",
  "quiero un agente",
  "necesito un agente",
  "persona real",
  "habla un humano",
  "atendeme un humano",
  "soporte tecnico",
  "hablar con soporte",
];

function detectEscalationIntent(content) {
  const lower = content.toLowerCase().trim();
  return ESCALATION_KEYWORDS.some((kw) => lower.includes(kw));
}

// ================================================================
// ALERTA DE ESCALACION AL CANAL DE SOPORTE
// ================================================================

async function sendEscalationAlert(channelId, userId, username, lastMessages) {
  try {
    console.log("🔍 [ESCALATION] Iniciando sendEscalationAlert...");
    console.log("   ESCALATION_CHANNEL_ID=" + ESCALATION_CHANNEL_ID);
    console.log("   SUPPORT_ROLE_ID=" + SUPPORT_ROLE_ID);

    if (!ESCALATION_CHANNEL_ID) {
      console.warn("⚠️  ESCALATION_CHANNEL_ID no configurado, alerta no enviada");
      return;
    }

    console.log("🔍 [ESCALATION] Buscando canal...");
    const escalationChannel = await client.channels.fetch(ESCALATION_CHANNEL_ID);

    if (!escalationChannel) {
      console.error("❌ No se encontro el canal de escalacion (ID: " + ESCALATION_CHANNEL_ID + ")");
      return;
    }

    console.log("✅ [ESCALATION] Canal encontrado: " + escalationChannel.name);

    const truncatedMessages = lastMessages.map((m) => m.substring(0, 300)).join("\n");

    const embed = new EmbedBuilder()
      .setColor(0xff9900)
      .setTitle("ESCALACION A HUMANO")
      .addFields(
        { name: "Usuario",         value: "<@" + userId + "> (" + username + ")",       inline: true  },
        { name: "ID Usuario",      value: userId,                                        inline: true  },
        { name: "Canal",           value: "<#" + channelId + ">",                        inline: false },
        { name: "Ultima pregunta", value: truncatedMessages || "Sin mensajes",           inline: false }
      )
      .setTimestamp()
      .setFooter({ text: "Escalacion automatica del bot" });

    const pingText = SUPPORT_ROLE_ID ? "<@&" + SUPPORT_ROLE_ID + ">" : "@Soporte";
    console.log("🔍 [ESCALATION] Enviando embed con ping: " + pingText);

    await escalationChannel.send({ content: pingText, embeds: [embed] });
    console.log("✅ ALERTA DE ESCALACION ENVIADA para " + username + " en " + escalationChannel.name);
  } catch (error) {
    console.error("❌ ERROR al enviar alerta de escalacion: " + error.message);
    console.error("   Stack: " + error.stack);
  }
}

// ================================================================
// CLIENTE DE DISCORD
// ================================================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

// ================================================================
// EVENTO: BOT CONECTADO
// ================================================================

client.on("ready", async () => {
  console.log("=".repeat(60));
  console.log("Bot conectado como: " + client.user.tag);
  console.log("ID del Bot: " + client.user.id);
  console.log("Servidores: " + client.guilds.cache.size);
  console.log("Escuchando canales: ticket, soporte, support");
  console.log("TTL auto-reactivacion: " + (HUMAN_HANDLING_TTL_MS / 3600000) + "h");
  console.log("Memoria activa (MAX_HISTORY=" + MAX_HISTORY + ")");
  console.log("Archivos: escalation_state.json + conversation_memory.json");
  console.log("=".repeat(60));

  sendHealthcheck("up");
  setInterval(() => sendHealthcheck("up"), 5 * 60 * 1000);

  try {
    if (GUILD_ID) {
      const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);
      const commands = [
        new SlashCommandBuilder()
          .setName("disconnected")
          .setDescription("Silencia el bot en este canal (solo Soporte)"),
        new SlashCommandBuilder()
          .setName("connected")
          .setDescription("Reactiva el bot en este canal (solo Soporte)"),
      ];
      await rest.put(Routes.applicationGuildCommands(client.user.id, GUILD_ID), {
        body: commands,
      });
      console.log("Comandos slash registrados");
    } else {
      console.warn("DISCORD_GUILD_ID no configurado, comandos slash no registrados");
    }
  } catch (error) {
    console.error("Error registrando comandos slash: " + error.message);
  }
});

client.on("disconnect", () => {
  console.error("Bot desconectado de Discord");
  sendHealthcheck("down");
});

client.on("error", (error) => {
  console.error("Error en Discord: " + error);
  sendHealthcheck("down");
});

// ================================================================
// EVENTO: MENSAJE RECIBIDO
// ================================================================

client.on("messageCreate", async (message) => {
  try {
    // Mensajes del propio bot (respuestas via n8n): guardar como "assistant"
    if (message.author.bot) {
      const isSelf = client.user && message.author.id === client.user.id;
      if (isSelf && !message.channel.isDMBased() && message.content && message.content.trim()) {
        const chName = message.channel.name ? message.channel.name.toLowerCase() : "";
        const isTicket =
          chName.includes("ticket") ||
          chName.includes("soporte") ||
          chName.includes("support");
        if (isTicket) {
          addToMemory(message.channel.id, {
            role: "assistant",
            username: message.author.username,
            userId: message.author.id,
            content: message.content,
            timestamp: message.createdAt.toISOString(),
          });
        }
      }
      return;
    }

    if (message.channel.isDMBased()) return;
    if (!message.content || !message.content.trim()) return;

    const channelName = message.channel.name.toLowerCase();
    const isTicketChannel =
      channelName.includes("ticket") ||
      channelName.includes("soporte") ||
      channelName.includes("support");

    if (!isTicketChannel) return;

    const channelId = message.channel.id;
    const userId    = message.author.id;

    // Gate: si HUMAN_HANDLING, el bot no responde (verifica TTL internamente)
    const channelData = getChannelState(channelId);
    if (channelData.state === "HUMAN_HANDLING") {
      console.log("Canal " + message.channel.name + " en HUMAN_HANDLING, ignorando a " + message.author.username);
      return;
    }

    console.log("\nMENSAJE RECIBIDO");
    console.log("  Canal: #" + message.channel.name);
    console.log("  Usuario: " + message.author.username + " (" + userId + ")");
    console.log("  Contenido: " + message.content.substring(0, 100));

    // MEMORIA: obtener historial PREVIO (antes de agregar el mensaje actual)
    const history = getHistory(channelId);

    // MEMORIA: guardar mensaje del usuario
    addToMemory(channelId, {
      role: "user",
      username: message.author.username,
      userId: userId,
      content: message.content,
      timestamp: message.createdAt.toISOString(),
    });

    console.log("  Historial adjunto: " + history.length + " mensaje(s) previo(s)");

    // Detectar intencion de escalacion
    if (detectEscalationIntent(message.content)) {
      const nowSec = Date.now() / 1000;
      const lastEscalationTs = channelData.escalationTs || 0;
      const alreadyEscalated = channelData.state === "ESCALATED";

      if (alreadyEscalated && (nowSec - lastEscalationTs) < ESCALATION_COOLDOWN_SECONDS) {
        console.log("Cooldown activo para " + message.channel.name + ", no re-alertar");
        await message.reply({
          content: "Ya avise al equipo de soporte. Un agente te atendera en breve.",
          flags: 64,
        });
        return;
      }

      setChannelState(channelId, { state: "ESCALATED", escalationTs: nowSec });

      await message.reply({
        content: "He avisado al equipo de soporte. A la brevedad se comunicara una persona de soporte tecnico con usted. Mientras tanto puedes dejar mas detalles aqui.",
      });

      const lastMessages = await message.channel.messages
        .fetch({ limit: 10 })
        .then((msgs) =>
          msgs
            .filter((m) => m.author.id === userId)
            .sort((a, b) => b.createdTimestamp - a.createdTimestamp)
            .map((m) => m.content)
            .slice(0, 3)
        )
        .catch(() => [message.content]);

      await sendEscalationAlert(channelId, userId, message.author.username, lastMessages);

      console.log("Escalacion detectada: " + message.author.username + " en " + message.channel.name);
      return;
    }

    // Payload para n8n: incluye historia + estado de escalacion
    const payload = {
      message:         message.content,
      userId:          userId,
      username:        message.author.username,
      userAvatar:      message.author.displayAvatarURL(),
      channelId:       channelId,
      channelName:     message.channel.name,
      guildId:         message.guild.id,
      guildName:       message.guild.name,
      timestamp:       message.createdAt.toISOString(),
      messageId:       message.id,
      history:         history,
      escalationState: channelData.state,
      escalationTs:    channelData.escalationTs || null,
    };

    const headers = {};
    if (N8N_WEBHOOK_SECRET) {
      headers["X-Webhook-Secret"] = N8N_WEBHOOK_SECRET;
    }

    console.log("  Enviando a n8n...");
    const result = await sendWithRetry(N8N_WEBHOOK_URL, payload, headers);

    if (result.success) {
      console.log("  Enviado a n8n (HTTP " + result.status + ")");
    } else {
      console.error("  Error al enviar a n8n tras " + RETRY_ATTEMPTS + " intentos");
      console.error("  Error: " + result.error + " - " + result.message);
    }

  } catch (error) {
    console.error("Error no esperado en messageCreate: " + error);
  }
});

// ================================================================
// COMANDOS SLASH: /disconnected y /connected
// ================================================================

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (!interaction.member) {
    return interaction.reply({ content: "Este comando solo funciona en un servidor.", flags: 64 });
  }

  try {
    if (interaction.commandName === "disconnected") {
      if (SUPPORT_ROLE_ID && !interaction.member.roles.cache.has(SUPPORT_ROLE_ID)) {
        return interaction.reply({
          content: "Solo el equipo de soporte puede usar este comando.",
          flags: 64,
        });
      }

      const channelId     = interaction.channelId;
      const nowSec        = Date.now() / 1000;
      const disabledUntil = nowSec + HUMAN_HANDLING_TTL_MS / 1000;

      setChannelState(channelId, {
        state:           "HUMAN_HANDLING",
        humanHandlingTs: nowSec,
        disabledUntil:   disabledUntil,
      });

      const ttlHours = (HUMAN_HANDLING_TTL_MS / 3600000).toFixed(1);
      await interaction.reply({
        content: "Bot desactivado en este canal. El equipo de soporte esta atendiendo.\nSe reactivara automaticamente en " + ttlHours + "h si no se usa /connected.",
      });

      console.log("Bot desactivado en #" + interaction.channel.name + " por " + interaction.user.username + " (TTL: " + ttlHours + "h)");
    }

    if (interaction.commandName === "connected") {
      if (SUPPORT_ROLE_ID && !interaction.member.roles.cache.has(SUPPORT_ROLE_ID)) {
        return interaction.reply({
          content: "Solo el equipo de soporte puede usar este comando.",
          flags: 64,
        });
      }

      const channelId = interaction.channelId;

      setChannelState(channelId, {
        state:           "ACTIVE",
        humanHandlingTs: null,
        disabledUntil:   null,
        escalationTs:    null,
      });

      await interaction.reply({
        content: "Bot reactivado en este canal. Vuelvo a responder mensajes.",
      });

      console.log("Bot reactivado en #" + interaction.channel.name + " por " + interaction.user.username);
    }

  } catch (error) {
    console.error("Error en comando slash: " + error);
    if (!interaction.replied && !interaction.deferred) {
      interaction.reply({ content: "Error procesando comando.", flags: 64 }).catch(console.error);
    }
  }
});

// ================================================================
// MANEJADORES DE ERROR DEL PROCESO
// ================================================================

process.on("unhandledRejection", (error) => {
  console.error("Promise rejection no manejado: " + error);
  sendHealthcheck("down");
});

process.on("uncaughtException", (error) => {
  console.error("Exception no capturado: " + error);
  sendHealthcheck("down");
  setTimeout(() => process.exit(1), 1000);
});

// ================================================================
// CONECTAR BOT
// ================================================================

console.log("Iniciando bot de Discord...");

client.login(DISCORD_TOKEN).catch((error) => {
  console.error("Error al conectar con Discord: " + error.message);
  console.error("Verifica que DISCORD_TOKEN es valido y Message Content Intent esta activado.");
  process.exit(1);
});

process.on("SIGINT", () => {
  console.log("Desconectando bot...");
  client.destroy();
  process.exit(0);
});
