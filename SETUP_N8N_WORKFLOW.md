# Setup del Workflow en n8n

## Visión General

El workflow de n8n va a:
1. **Recibir** mensajes del bot de Discord vía Webhook
2. **Procesar** el mensaje con OpenAI (IA)
3. **Responder** en Discord enviando un mensaje al canal

## Paso 1: Crear un Nuevo Workflow

1. Ve a tu instancia de n8n: https://funes-n8n.ud046x.easypanel.host
2. Click en "+" → "New Workflow"
3. Dale nombre: `Discord Support Bot`

## Paso 2: Agregar Webhook Node (Entrada)

Este node recibe los mensajes del bot de Discord.

1. Click en "+" para agregar un node
2. Busca **"Webhook"**
3. Selecciona **"Webhook"**

### Configurar Webhook:
- **Method**: POST
- **Authentication**: None (por ahora)
- **Path**: `discord-support` (esto forma la URL: `https://...../webhook/discord-support`)

**Copia esta URL y pégala en el `.env` del bot:**
```
N8N_WEBHOOK_URL=https://funes-n8n.ud046x.easypanel.host/webhook/discord-support
```

4. Click en "Test Webhook"
5. Click en "Execute Workflow"

## Paso 3: Agregar OpenAI Node (Procesamiento)

Este node genera la respuesta con IA.

1. Click en "+" para agregar un node
2. Busca **"OpenAI"**
3. Selecciona **"OpenAI"** (chat completion)

### Configurar OpenAI:
- **Authentication**: Crea/selecciona tu credencial de OpenAI (necesitas API Key)
- **Model**: `gpt-4o-mini` (o la que uses)
- **Messages**:
  ```
  [
    {
      "role": "system",
      "content": "Eres un agente de soporte técnico amigable para Trading Miami School. Responde de forma concisa (máx 200 caracteres). Si no sabes algo, ofrece escalar a un humano."
    },
    {
      "role": "user",
      "content": "{{ $json.message }}"
    }
  ]
  ```

### Conectar Nodes:
- Arrastra la salida de **Webhook** a la entrada de **OpenAI**

## Paso 4: Agregar HTTP Request Node (Respuesta a Discord)

Este node envía la respuesta de la IA de vuelta a Discord.

1. Click en "+" para agregar un node
2. Busca **"HTTP Request"**
3. Selecciona **"HTTP Request"**

### Configurar HTTP Request:
- **Method**: POST
- **URL**:
  ```
  https://discord.com/api/v10/channels/{{ $json.channelId }}/messages
  ```
- **Headers**: 
  - **Key**: `Authorization`
  - **Value**: `Bot YOUR_DISCORD_TOKEN_HERE`
  
  ⚠️ **Reemplaza `YOUR_DISCORD_TOKEN_HERE` con tu token real del bot**

- **Headers** (segundo):
  - **Key**: `Content-Type`
  - **Value**: `application/json`

- **Body**:
  ```json
  {
    "content": "{{ $json.choices[0].message.content }}"
  }
  ```

### Conectar Nodes:
- Arrastra la salida de **OpenAI** a la entrada de **HTTP Request**

## Paso 5: Test del Workflow

### Opción A: Test Manual
1. Ejecuta el bot localmente: `node bot.js`
2. Ve a Discord y escribe un mensaje en un canal de ticket
3. Ve a n8n y verifica que el webhook recibió el mensaje
4. El workflow debería procesar y responder en Discord

### Opción B: Test desde n8n
1. En el Webhook node, click en "Test Webhook"
2. Pega datos de ejemplo:
```json
{
  "message": "Hola, necesito ayuda",
  "userId": "123456789",
  "username": "usuariotest",
  "channelId": "1512817445260492800",
  "channelName": "ticket-0001",
  "guildId": "1512616856043782277",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```
3. Click "Execute Workflow"
4. Verifica que n8n responda sin errores

## Paso 6: Activar el Workflow

1. En la esquina superior derecha, verifica que el toggle está en **ON** (verde)
2. El workflow debería estar activo ahora

---

## Estructura Visual del Workflow

```
┌─────────────────┐
│   Webhook       │  ← Recibe mensajes del bot
│ (Discord Input) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    OpenAI       │  ← Genera respuesta con IA
│  (Chat Model)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  HTTP Request   │  ← Envía respuesta a Discord
│ (Discord Output)│
└─────────────────┘
```

---

## Variables Dinámicas que Puedes Usar

En cualquier node, puedes usar los datos que llegan del webhook:

```
{{ $json.message }}         → el contenido del mensaje
{{ $json.userId }}          → ID del usuario
{{ $json.username }}        → nombre del usuario
{{ $json.channelId }}       → ID del canal
{{ $json.channelName }}     → nombre del canal
{{ $json.guildId }}         → ID del servidor
{{ $json.timestamp }}       → fecha/hora
```

---

## Troubleshooting n8n

**"Webhook no recibe mensajes"**
→ Verifica que la URL del webhook en `.env` es exactamente correcta
→ Verifica que el bot está corriendo y enviando datos

**"OpenAI retorna error"**
→ Verifica que tu API Key de OpenAI es válida
→ Verifica que tienes créditos suficientes

**"Discord no recibe la respuesta"**
→ Verifica que el token de Discord es correcto
→ Verifica que el bot tiene permiso "Send Messages" en el canal

**"HTTP Request retorna 401 Unauthorized"**
→ El token de Discord está mal o expirado
→ Regenera un nuevo token en Discord Developer Portal

---

## Ejemplo de Workflow Completo (JSON)

Si quieres importar un workflow completo, ve a n8n y crea uno manualmente siguiendo estos pasos. El JSON es más complejo, pero aquí está la estructura general.
