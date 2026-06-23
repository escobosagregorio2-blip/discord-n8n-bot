// Discord Bot - Bridge to n8n
// Escucha mensajes en canales de ticket y los envía a n8n
// Requiere: discord.js, axios, dotenv

const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// ================================================================
// CONFIGURACIÓN
// ================================================================

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
const N8N_WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET;
const HEALTHCHECK_URL = process.env.HEALTHCHECK_URL; // URL para healthcheck (ej: Healthchecks.io)

// Validar que tengamos los secretos críticos
if (!DISCORD_TOKEN) {
  console.error("❌ Error: DISCORD_TOKEN no encontrado en variables de entorno");
  process.exit(1);
}

if (!N8N_WEBHOOK_URL) {
  console.error("❌ Error: N8N_WEBHOOK_URL no encontrado en variables de entorno");
  process.exit(1);
}

if (!N8N_WEBHOOK_SECRET) {
  console.warn("⚠️  Advertencia: N8N_WEBHOOK_SECRET no configurado. El webhook es público.");
}

console.log("✅ Configuración cargada correctamente");
console.log(`📡 Webhook de n8n: ${N8N_WEBHOOK_URL}`);
if (HEALTHCHECK_URL) {
  console.log(`❤️  Healthcheck: ${HEALTHCHECK_URL}`);
}

// ================================================================
// SISTEMA DE MEMORIA DE CONVERSACIÓN (últimos 15 mensajes por canal)
// ================================================================
//
// - Guarda los últimos MAX_HISTORY mensajes de CADA canal/ticket.
// - Cada entrada: { role, username, userId, content, timestamp }.
// - Persiste en un archivo JSON local (sin base de datos externa).
// - Thread-safe: las escrituras a disco se serializan en una cola
//   (una a la vez) y son atómicas (write a .tmp + rename).
// - Si el bot se reinicia, intenta recuperar la memoria del archivo;
//   si el archivo no existe o está corrupto, arranca vacío (OK).
//
// Funciona en EasyPanel sin cambios de config: el archivo se crea
// junto al proceso. Si el contenedor es efímero, simplemente se
// pierde la memoria al reiniciar (aceptable según los requisitos).
// ================================================================

const MAX_HISTORY = 15; // número de mensajes a recordar por canal
const MEMORY_FILE = path.join(__dirname, "conversation_memory.json");

// Estructura en memoria: Map<channelId, Array<entry>>
const memoryStore = new Map();

// --- Cola de escritura serializada (thread-safe, una escritura a la vez) ---
let writeChain = Promise.resolve();
let writePending = false;

function persistMemory() {
  // Coalesce: si ya hay una escritura encolada esperando, no encolamos otra.
  if (writePending) return writeChain;
  writePending = true;

  writeChain = writeChain.then(async () => {
    writePending = false;
    try {
      // Serializar el Map a un objeto plano { channelId: [entries] }
      const snapshot = {};
      for (const [channelId, entries] of memoryStore.entries()) {
        snapshot[channelId] = entries;
      }
      const json = JSON.stringify(snapshot);
      const tmpFile = `${MEMORY_FILE}.tmp`;
      // Escritura atómica: escribir a temp y renombrar
      await fs.promises.writeFile(tmpFile, json, "utf8");
      await fs.promises.rename(tmpFile, MEMORY_FILE);
    } catch (error) {
      console.error(`⚠️  No se pudo guardar la memoria: ${error.message}`);
    }
  });

  return writeChain;
}

function loadMemory() {
  try {
    if (!fs.existsSync(MEMORY_FILE)) {
      console.log("🧠 Memoria: archivo no existe, arrancando vacío.");
      return;
    }
    const raw = fs.readFileSync(MEMORY_FILE, "utf8");
    const snapshot = JSON.parse(raw);
    let channels = 0;
    for (const [channelId, entries] of Object.entries(snapshot)) {
      if (Array.isArray(entries)) {
        // Defensa: recortar a MAX_HISTORY por si el archivo trae de más
        memoryStore.set(channelId, entries.slice(-MAX_HISTORY));
        channels++;
      }
    }
    console.log(`🧠 Memoria cargada: ${channels} canal(es) recuperado(s).`);
  } catch (error) {
    console.error(
      `⚠️  No se pudo cargar la memoria (arranca vacío): ${error.message}`
    );
    memoryStore.clear();
  }
}

/**
 * Agrega un mensaje al historial de un canal y persiste.
 * role: "user" (mensaje del usuario) | "assistant" (respuesta del bot)
 */
function addToMemory(channelId, entry) {
  let entries = memoryStore.get(channelId);
  if (!entries) {
    entries = [];
    memoryStore.set(channelId, entries);
  }
  entries.push(entry);
  // Mantener solo los últimos MAX_HISTORY
  if (entries.length > MAX_HISTORY) {
    entries.splice(0, entries.length - MAX_HISTORY);
  }
  persistMemory();
}

/**
 * Devuelve el historial actual del canal (copia segura).
 * Estos son los mensajes ANTERIORES (no incluye el que se está procesando
 * porque se llama antes de agregar el mensaje nuevo).
 */
function getHistory(channelId) {
  const entries = memoryStore.get(channelId);
  if (!entries) return [];
  return entries.map((e) => ({ ...e }));
}

// Cargar memoria al arrancar
loadMemory();

// ================================================================
// RETRY LOGIC CON BACKOFF
// ================================================================

const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 segundo

async function sendWithRetry(url, data, headers = {}) {
  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      const response = await axios.post(url, data, {
        timeout: 15000,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      });
      return { success: true, status: response.status };
    } catch (error) {
      if (attempt === RETRY_ATTEMPTS) {
        // Último intento falló
        return {
          success: false,
          error: error.response?.status || error.code,
          message: error.message,
        };
      }
      // Esperar antes de reintentar (backoff exponencial)
      const delay = RETRY_DELAY * Math.pow(2, attempt - 1);
      console.log(
        `   ⏳ Reintentando en ${delay}ms... (intento ${attempt}/${RETRY_ATTEMPTS})`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

// ================================================================
// HEALTHCHECK
// ================================================================

function sendHealthcheck(status = "up") {
  if (!HEALTHCHECK_URL) return;

  const url = status === "up" ? HEALTHCHECK_URL : `${HEALTHCHECK_URL}/fail`;
  axios
    .get(url, { timeout: 5000 })
    .catch((error) => {
      console.error(`⚠️  Error en healthcheck: ${error.message}`);
    });
}

// ================================================================
// CLIENTE DE DISCORD
// ================================================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,                 // Para leer servidores
    GatewayIntentBits.GuildMessages,          // Para leer mensajes en canales
    GatewayIntentBits.MessageContent,         // CRÍTICO: Para leer contenido de mensajes
    GatewayIntentBits.DirectMessages,         // Para mensajes directos (opcional)
  ],
});

// ================================================================
// EVENTO: BOT CONECTADO
// ================================================================

client.on("ready", () => {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`✅ Bot conectado como: ${client.user.tag}`);
  console.log(`✅ ID del Bot: ${client.user.id}`);
  console.log(`✅ Servidores: ${client.guilds.cache.size}`);
  console.log(`📡 Escuchando canales: ticket, soporte, support`);
  console.log(`${"=".repeat(60)}\n`);

  // Enviar healthcheck
  sendHealthcheck("up");

  // Healthcheck periódico cada 5 minutos
  setInterval(() => sendHealthcheck("up"), 5 * 60 * 1000);
});

// Detectar desconexión
client.on("disconnect", () => {
  console.error("❌ Bot desconectado de Discord");
  sendHealthcheck("down");
});

client.on("error", (error) => {
  console.error(`❌ Error en Discord:`, error);
  sendHealthcheck("down");
});

// ================================================================
// EVENTO: MENSAJE RECIBIDO
// ================================================================

client.on("messageCreate", async (message) => {
  try {
    // 1. Mensajes de bots:
    //    - Si es ESTE bot (su propia respuesta vía n8n), lo guardamos en
    //      memoria como "assistant" para que forme parte del contexto.
    //    - Cualquier otro bot se ignora.
    if (message.author.bot) {
      const isSelf = client.user && message.author.id === client.user.id;
      if (isSelf && !message.channel.isDMBased() && message.content?.trim()) {
        const chName = message.channel.name?.toLowerCase() || "";
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

    // 2. Ignorar mensajes en DMs
    if (message.channel.isDMBased()) {
      return;
    }

    // 3. Ignorar mensajes vacíos
    if (!message.content || !message.content.trim()) {
      return;
    }

    // 4. Detectar si es un canal de ticket
    const channelName = message.channel.name.toLowerCase();
    const isTicketChannel =
      channelName.includes("ticket") ||
      channelName.includes("soporte") ||
      channelName.includes("support");

    if (!isTicketChannel) {
      return;
    }

    // 5. Log de mensaje recibido
    console.log(`\n📨 MENSAJE RECIBIDO`);
    console.log(`   ID: ${message.id}`);
    console.log(`   Canal: #${message.channel.name}`);
    console.log(`   Usuario: ${message.author.username} (${message.author.id})`);
    console.log(`   Contenido: ${message.content.substring(0, 100)}${message.content.length > 100 ? "..." : ""}`);

    // 6. Obtener el historial ANTERIOR del canal (antes de añadir este mensaje)
    const history = getHistory(message.channel.id);

    // 7. Guardar el mensaje ACTUAL del usuario en la memoria del canal
    addToMemory(message.channel.id, {
      role: "user",
      username: message.author.username,
      userId: message.author.id,
      content: message.content,
      timestamp: message.createdAt.toISOString(),
    });

    // 8. Preparar payload para n8n (incluye el historial de los últimos 15)
    const payload = {
      message: message.content,
      userId: message.author.id,
      username: message.author.username,
      userAvatar: message.author.displayAvatarURL(),
      channelId: message.channel.id,
      channelName: message.channel.name,
      guildId: message.guild.id,
      guildName: message.guild.name,
      timestamp: message.createdAt.toISOString(),
      messageId: message.id,
      // === MEMORIA: historial de conversación (mensajes previos del canal) ===
      history: history, // array de { role, username, userId, content, timestamp }
    };

    console.log(`   🧠 Historial adjunto: ${history.length} mensaje(s) previo(s)`);
    console.log(`   📤 Enviando a n8n...`);

    // 9. Preparar headers con secreto si existe
    const headers = {};
    if (N8N_WEBHOOK_SECRET) {
      headers["X-Webhook-Secret"] = N8N_WEBHOOK_SECRET;
    }

    // 10. Enviar a n8n vía webhook CON RETRY
    const result = await sendWithRetry(N8N_WEBHOOK_URL, payload, headers);

    if (result.success) {
      console.log(`   ✅ Enviado a n8n (HTTP ${result.status})`);
    } else {
      console.error(`   ❌ Error al enviar a n8n después de ${RETRY_ATTEMPTS} intentos`);
      console.error(`   Error: ${result.error} - ${result.message}`);
      console.error(`   El mensaje se perdió y el usuario no recibirá respuesta.`);

      // Opcional: notificar en Discord que algo salió mal
      // await message.reply("❌ Error procesando tu mensaje. Por favor intenta de nuevo.");
    }

    console.log(`\n`);

  } catch (error) {
    console.error(`❌ Error no esperado en messageCreate:`, error);
  }
});

// ================================================================
// MANEJADORES DE ERROR DEL PROCESO
// ================================================================

process.on("unhandledRejection", (error) => {
  console.error(`❌ Promise rejection no manejado:`, error);
  sendHealthcheck("down");
});

process.on("uncaughtException", (error) => {
  console.error(`❌ Exception no capturado:`, error);
  sendHealthcheck("down");
  // Espera un poco antes de salir para que se registre el error
  setTimeout(() => process.exit(1), 1000);
});

// ================================================================
// CONECTAR BOT
// ================================================================

console.log("🚀 Iniciando bot de Discord...\n");

client.login(DISCORD_TOKEN).catch((error) => {
  console.error(`❌ Error al conectar con Discord:`, error.message);
  console.error(`\nVerifica que:`);
  console.error(`  - DISCORD_TOKEN es válido`);
  console.error(`  - El token no ha sido regenerado (invalidando este token)`);
  console.error(`  - Message Content Intent está activado en Discord Developer Portal`);
  process.exit(1);
});

// Mantener el proceso vivo
process.on("SIGINT", () => {
  console.log("\n📴 Desconectando bot...");
  client.destroy();
  process.exit(0);
});
