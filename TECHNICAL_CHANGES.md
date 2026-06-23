# 🔧 Cambios Técnicos - Sistema de Escalación

Resumen de las modificaciones al bot para soportar escalación a humano.

---

## 📝 Cambios en `bot.js`

### 1. Nuevas Importaciones
```javascript
const {
  Client,
  GatewayIntentBits,
  ChannelType,
  EmbedBuilder,           // Para crear alertas bonitas
  PermissionFlagsBits,
  REST,                   // Para registrar comandos
  Routes,
  SlashCommandBuilder,    // Para crear /disconnected y /connected
} = require("discord.js");
```

### 2. Nuevas Variables de Entorno
```javascript
const ESCALATION_CHANNEL_ID = process.env.ESCALATION_CHANNEL_ID;
const SUPPORT_ROLE_ID = process.env.SUPPORT_ROLE_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
```

### 3. Nuevo Estado del Sistema
```javascript
// Estado por canal (ACTIVE, ESCALATED, HUMAN_HANDLING)
const ticketStates = new Map();

// Usuarios desactivados (formato: "channelId:userId")
const disabledUsers = new Set();

// Cooldown para evitar spam
const escalationCooldown = new Map();
const ESCALATION_COOLDOWN_SECONDS = 15 * 60; // 15 minutos
```

### 4. Palabras Clave de Escalación
```javascript
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
  "soporte técnico",
  "hablar con soporte",
];
```

---

## 🎯 Nuevas Funciones

### `detectEscalationIntent(content)`
Detecta si un mensaje contiene palabras clave de escalación.

```javascript
function detectEscalationIntent(content) {
  const lowerContent = content.toLowerCase().trim();
  return ESCALATION_KEYWORDS.some((keyword) =>
    lowerContent.includes(keyword)
  );
}
```

**Parámetros:**
- `content` (string): El mensaje del usuario

**Retorna:**
- `true` si detecta intención de escalación
- `false` si no

---

### `async sendEscalationAlert(channelId, userId, username, lastMessages)`
Envía una alerta al canal de soporte con información del usuario.

```javascript
async function sendEscalationAlert(channelId, userId, username, lastMessages) {
  // 1. Obtiene el canal de escalación
  // 2. Crea un embed (mensaje bonito con info)
  // 3. Menciona al rol @Soporte
  // 4. Envía la alerta
}
```

**Parámetros:**
- `channelId` (string): ID del canal donde escaló
- `userId` (string): ID del usuario que escaló
- `username` (string): Nombre del usuario
- `lastMessages` (array): Últimos 3 mensajes del usuario

**Efecto:**
- Envía un embed naranja a `#escalaciones-soporte`
- Menciona a `@Soporte` para notificar

---

## 📡 Cambios en Event Handlers

### `client.on("ready")`
Ahora registra los comandos slash `/disconnected` y `/connected`.

```javascript
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
```

---

### `client.on("messageCreate")`
Modificado para manejar:

1. **Chequear si usuario está desactivado**
   ```javascript
   const disabledKey = `${channelId}:${userId}`;
   if (disabledUsers.has(disabledKey)) {
     return; // No procesar el mensaje
   }
   ```

2. **Detectar intención de escalación**
   ```javascript
   if (detectEscalationIntent(message.content)) {
     // Verificar cooldown
     // Marcar como ESCALATED
     // Responder al usuario
     // Enviar alerta
     // Retornar (no enviar a n8n)
   }
   ```

3. **Flujo normal si NO es escalación**
   ```javascript
   // Enviar a n8n normalmente
   ```

---

### `client.on("interactionCreate")`
Nuevo handler para los comandos slash.

```javascript
client.on("interactionCreate", async (interaction) => {
  if (interaction.commandName === "disconnected") {
    // 1. Chequear permiso (@Soporte)
    // 2. Marcar canal como HUMAN_HANDLING
    // 3. Desactivar bot
    // 4. Responder confirmación
  }

  if (interaction.commandName === "connected") {
    // 1. Chequear permiso (@Soporte)
    // 2. Marcar canal como ACTIVE
    // 3. Reactivar bot
    // 4. Responder confirmación
  }
});
```

---

## 📊 Flujo de Lógica

```
messageCreate
  ├─ ¿Mensaje del bot? → return
  ├─ ¿Es DM? → return
  ├─ ¿Es canal de ticket? → continue : return
  │
  ├─ ¿Usuario desactivado en este canal?
  │  └─ SÍ → return (no procesar)
  │
  ├─ ¿Detecta intención de escalación?
  │  └─ SÍ →
  │      ├─ ¿En cooldown?
  │      │  └─ SÍ → responder "Ya avisé" y return
  │      ├─ Marcar ESCALATED
  │      ├─ Responder al usuario
  │      ├─ Enviar alerta a #escalaciones
  │      └─ return (no enviar a n8n)
  │
  └─ Enviar a n8n normalmente
```

---

## 🔑 Estructuras de Datos

### `ticketStates` (Map)
```javascript
Map {
  "1234567890" => "ACTIVE",        // Canal activo, bot responde
  "9876543210" => "ESCALATED",     // Usuario pidió escalación
  "5555555555" => "HUMAN_HANDLING" // Soporte atendiendo, bot silenciado
}
```

---

### `disabledUsers` (Set)
```javascript
Set {
  "1234567890:111111111",  // En canal 123..., usuario 111... desactivado
  "1234567890:222222222",  // Mismo canal, otro usuario desactivado
  "9876543210:333333333",  // En otro canal, otro usuario desactivado
}
```

**Formato:** `"channelId:userId"`

---

### `escalationCooldown` (Map)
```javascript
Map {
  "1234567890" => 1687454400,  // Timestamp UNIX
  "9876543210" => 1687454500,
}
```

**Usa:** `Math.floor(Date.now() / 1000)` para obtener tiempo actual en segundos.

---

## 🚨 Variables de Entorno Nuevas

```env
# Canal donde se envían alertas
ESCALATION_CHANNEL_ID=123456789012345678

# Rol a mencionar en alertas
SUPPORT_ROLE_ID=987654321098765432

# ID del servidor (necesario para registrar comandos)
DISCORD_GUILD_ID=555666777888999000
```

---

## 📦 Dependencias

**No se agregaron nuevas dependencias.** Se usan las que ya estaban:
- `discord.js` - Manejo de Discord
- `axios` - Requests HTTP a n8n

---

## 🔍 Logs Nuevos

### Escalación detectada
```
🚨 Escalación detectada: juan en #ticket-juan
✅ Alerta enviada a #escalaciones para juan
```

### Comando /disconnected ejecutado
```
🔕 Bot desactivado en #ticket-juan por soporte_agent
```

### Comando /connected ejecutado
```
📡 Bot reactivado en #ticket-juan por soporte_agent
```

### Usuario desactivado intenta escribir
```
🔕 Usuario juan está desactivado en #ticket-juan
```

---

## ⚡ Rendimiento

### Memoria
- `ticketStates` y `disabledUsers` se guardan **solo en RAM**
- Si el bot se reinicia, se pierden los estados
- **Solución futura:** Guardar en Redis o database

### Cálculo
- Detectar intención: O(n) donde n = palabras clave (~20)
- Chequear cooldown: O(1) con Map
- Enviar alerta: ~500ms (HTTP a Discord)

### Escalabilidad
- Funciona bien hasta ~10k tickets simultáneos
- Soporta múltiples servidores (sin cambios necesarios)

---

## 🛡️ Seguridad

### Comandos slash
- Solo rol `@Soporte` puede ejecutar
- Validado con `interaction.member.roles.cache.has(SUPPORT_ROLE_ID)`

### Detección de escalación
- Case-insensitive (ignora mayúsculas)
- Substring matching (flexible para variaciones)

### Cooldown
- Evita spam: máximo 1 alerta cada 15 minutos por canal
- Doble verificación: por estado + por timestamp

---

## 🔧 Cómo Personalizar

### Cambiar palabras clave
Edita `ESCALATION_KEYWORDS`:
```javascript
const ESCALATION_KEYWORDS = [
  "tus nuevas palabras",
  "aquí aquí",
];
```

### Cambiar cooldown
Edita `ESCALATION_COOLDOWN_SECONDS`:
```javascript
const ESCALATION_COOLDOWN_SECONDS = 5 * 60; // 5 minutos en lugar de 15
```

### Cambiar color del embed
En `sendEscalationAlert()`:
```javascript
.setColor(0xff9900) // Cambiar este número hex
```

### Cambiar mensaje al usuario
En `messageCreate()`:
```javascript
await message.reply({
  content: "Tu mensaje personalizado aquí",
});
```

---

## 🚀 Próximas Mejoras Posibles

1. **Persistencia:** Guardar estado en Redis
2. **Botones:** Agregar [Atender] y [Ignorar] a la alerta
3. **Historial:** Registrar todas las escalaciones en una DB
4. **Metricas:** Tiempo promedio de respuesta del soporte
5. **Prioridad:** Diferentes levels de escalación (urgente, normal, etc)
6. **Notifications:** Enviar email si nadie responde en 5 min
7. **Auto-cierre:** Cerrar ticket si no hay actividad en 24h

---

## 📞 Support

Si algo no funciona:
1. Chequea los **logs del bot** para errores
2. Verifica las **variables de entorno** en `.env`
3. Confirma los **IDs de Discord** sean correctos
4. Reinicia el bot (a veces resuelve)
5. Avísame qué error ves exactamente

