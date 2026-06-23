# 🛠️ Construcción Completa del Workflow en n8n

Este documento es un **paso a paso detallado** para construir el workflow que procesa los mensajes del bot y responde en Discord.

---

## Flujo del Workflow

```
┌─────────────┐
│   Webhook   │  ← Bot envía mensaje aquí
│ (POST)      │
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│  IF: Validar     │  ← Valida que el header secreto sea correcto
│  Secreto         │     Si no coincide → rechaza y para
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  OpenAI          │  ← Procesa el mensaje con IA
│ (Chat Model)     │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  HTTP Request    │  ← Envía respuesta a Discord
│ (POST a Discord) │     Con retry automático
└──────────────────┘
```

---

## Paso 1: Crear Workflow

1. En n8n, click en **"+"** → **"New Workflow"**
2. **Name**: `Discord Support Bot`
3. Verifica que está en **mode: "Editing"** (no Production)

---

## Paso 2: Webhook Node (Entrada - Recibe del Bot)

### 2.1 Crear el Node

1. Click en **"+"** (agregar node)
2. Search: `Webhook`
3. Selecciona **"Webhook"**

### 2.2 Configurar Webhook Node

**Settings:**

- **Method**: `POST` ✅
- **Path**: `discord-ticket` ✅
  - Esto genera: `https://tu-n8n.com/webhook/discord-ticket`
- **Respond Immediately**: `ON` ✅
  - El webhook responde 200 OK inmediatamente (sin esperar a que terminen los nodes siguientes)

**Test:**

1. Click en **"Test Webhook"** (abajo a la derecha)
2. En una terminal ejecuta:
   ```bash
   curl -X POST http://localhost:3000/webhook/discord-ticket \
     -H "Content-Type: application/json" \
     -H "X-Webhook-Secret: test-secret" \
     -d '{
       "message": "Test message",
       "userId": "123",
       "username": "testuser",
       "channelId": "456",
       "channelName": "ticket-001"
     }'
   ```
3. Deberías ver que el webhook recibió el POST en n8n

---

## Paso 3: IF Node - Validar Secreto (Seguridad)

⚠️ **CRÍTICO**: Sin esto el webhook es público y cualquiera puede abusar de tu cuota de OpenAI.

### 3.1 Agregar IF Node

1. Click en **"+"**
2. Search: `If`
3. Selecciona **"If"**
4. Conecta: Webhook → IF (arrastra el salida del Webhook al IF)

### 3.2 Configurar Validación

En el IF node, configura la **Condition**:

- **Data to test**: click en la "fx" → selecciona `$headers['x-webhook-secret']`
- **Operation**: `equals`
- **Value to compare**: El secreto que configuraste en EasyPanel (ej: `a1b2c3d4...`)

⚠️ **Debe coincidir exactamente** con `N8N_WEBHOOK_SECRET` de EasyPanel.

**Resultado:**
- Si el header coincide → continúa al siguiente node (rama "true")
- Si NO coincide → termina (rama "false") y rechaza el webhook

---

## Paso 4: OpenAI Node (Procesamiento con IA)

### 4.1 Crear Credential de OpenAI

⚠️ **Primero** debes crear una credencial con tu API key de OpenAI:

1. Click en **"Credentials"** (arriba a la izquierda)
2. Click en **"Create new credential"**
3. Selecciona **"OpenAI API"**
4. **API Key**: Pega tu API key de OpenAI (obtén de https://platform.openai.com/api-keys)
5. **Name**: `OpenAI - Trading Miami`
6. Click **"Save"**

### 4.2 Agregar OpenAI Node

1. Click en **"+"**
2. Search: `OpenAI`
3. Selecciona **"OpenAI"** (busca "Chat Completion" si hay varias opciones)

### 4.3 Configurar OpenAI Node

**Credentials:**
- Selecciona la credential que creaste arriba

**Model**: `gpt-4o-mini` (o la versión que uses)

**Messages** (clave):

Click en el icono de "A" (agregar mensaje dinámico):

```
Role: system
Content: Eres un agente de soporte técnico amigable para Trading Miami School. Responde de forma concisa y profesional. Si no sabes algo, ofrece escalar a un humano. Máximo 200 caracteres.
```

```
Role: user
Content: (click en "fx") → {{ $json.message }}
```

**Additional Settings:**
- **Max Tokens**: `150` (limita la respuesta para no exceder 2000 chars de Discord)
- **Temperature**: `0.7` (equilibrio entre determinista y creativo)

**Conectar:**
- Arrastra la salida del IF node → entrada del OpenAI node (rama "true")

---

## Paso 5: HTTP Request Node (Respuesta a Discord)

### 5.1 Crear Credential para Discord Token

⚠️ **Mejor práctica**: no hardcodees el token. Úsalo en una credential:

1. Click en **"Credentials"** (arriba)
2. Click en **"Create new credential"**
3. Selecciona **"Custom HTTP Authentication"** (o busca "Discord")
4. Si no existe Discord directamente:
   - **Auth Type**: `Bearer Token` o `Custom Header`
   - **Header Name**: `Authorization`
   - **Header Value**: `Bot <TU_DISCORD_TOKEN>`
   - **Name**: `Discord - Bot Auth`
5. Click **"Save"**

### 5.2 Agregar HTTP Request Node

1. Click en **"+"**
2. Search: `HTTP Request`
3. Selecciona **"HTTP Request"**
4. Conecta: OpenAI → HTTP Request

### 5.3 Configurar HTTP Request

**Basic:**
- **Method**: `POST`
- **URL**: 
  ```
  https://discord.com/api/v10/channels/{{ $json.channelId }}/messages
  ```

**Authentication:**
- **Authentication**: Selecciona la credential "Discord - Bot Auth" que creaste
- Si usas "Bearer Token", n8n automáticamente agrega el header `Authorization: Bot <token>`

**Headers** (agregar una más):
- **Key**: `Content-Type`
- **Value**: `application/json`

**Body** (Mode: `JSON`):
```json
{
  "content": "{{ $json.choices[0].message.content }}",
  "allowed_mentions": {
    "parse": []
  }
}
```

**Retry** (MUY IMPORTANTE):
- Click en **"Retry"** (arriba en el node)
- **Max Retries**: `3`
- **Wait Between Retries**: `1000` (1 segundo)
- **Retry on**: Selecciona `429, 500, 502, 503` (errores de rate limit y server)

**Error Handling:**
- **Continue on Error**: `OFF` (si Discord rechaza, queremos saber)
- Alternativamente puedes poner `ON` si prefieres que el flujo no falle

---

## Paso 6: Test del Workflow (Todo Junto)

### 6.1 Test desde n8n (Simulado)

1. En el **Webhook node**, click en **"Test Webhook"**
2. Llena los datos:
   ```json
   {
     "message": "Hola, prueba del bot",
     "userId": "123456789",
     "username": "testuser",
     "channelId": "1512817445260492800",
     "channelName": "ticket-0001",
     "guildId": "1512616856043782277",
     "timestamp": "2024-01-01T12:00:00Z",
     "messageId": "987654321"
   }
   ```
3. Click en **"Execute"**
4. Deberías ver:
   - Webhook recibe ✅
   - IF valida (pero sin header, puede rechazar — eso es correcto)
   - OpenAI genera respuesta
   - HTTP Request envía a Discord

⚠️ **Si falla en HTTP Request:** verifica que el channelId existe y el bot tiene permisos en ese canal.

### 6.2 Test Real (desde Discord)

1. **Abre tu n8n workflow**
2. Click en **"Webhook" node** → **"Copy Webhook URL"**
3. Copia esa URL y pónla en `.env` como `N8N_WEBHOOK_URL`
4. En EasyPanel, actualiza la variable `N8N_WEBHOOK_URL`
5. Reinicia el bot (EasyPanel redeploy o restart)
6. Ve a Discord y escribe en un canal `#ticket-*`
7. Espera 2-3 segundos
8. Deberías recibir una respuesta automática del bot

---

## Paso 7: Activar Workflow

⚠️ **CRÍTICO:** El workflow debe estar ON para funcionar en producción.

1. **Switch en la esquina superior derecha**: verifica que está **ON** (verde)
2. Workflow está **activo**

---

## Paso 8: Verificar que Todo Funciona

### Checklist:

- [ ] Webhook node recibe POST del bot (ver en Logs)
- [ ] IF node valida el secreto (si falla, aparece error)
- [ ] OpenAI node procesa sin errores
- [ ] HTTP Request node envía a Discord HTTP 200
- [ ] Mensaje aparece en el canal de Discord
- [ ] Workflow está **ON** (no paused)

### Debugging:

Si algo falla, abre el **Execution History** del workflow (tab "Executions" arriba):
- Verde = ejecutó bien
- Rojo = error en ese node
- Click para ver detalles del error

---

## Casos Comunes de Error

| Error | Causa | Solución |
|---|---|---|
| `404 Webhook not found` | Webhook node mal configurado | Verifica que el Path es `discord-ticket` y que tiene método POST |
| `401 Unauthorized` en HTTP Request | Token Discord inválido o expirado | Regenera un nuevo token en Discord Dev Portal |
| `403 Forbidden` en HTTP Request | Bot no tiene permisos en el canal | Invita el bot al servidor con permisos "Send Messages" |
| `429 Too Many Requests` | Rate limit de Discord | Ya configuramos retry automático (3 intentos) |
| IF node rechaza (falla) | Header `X-Webhook-Secret` no coincide | Verifica que el secreto en n8n es igual al de EasyPanel `N8N_WEBHOOK_SECRET` |
| OpenAI retorna error | API key inválida o sin créditos | Ve a https://platform.openai.com → verifica key y créditos |

---

## Resumen Configuración Final

```
WEBHOOK
  ↓
IF (valida secreto X-Webhook-Secret)
  ↓
OPENAI (procesa con IA)
  ↓
HTTP REQUEST (responde en Discord con retry)
```

**Env Vars (EasyPanel):**
```
DISCORD_TOKEN=token_nuevo
N8N_WEBHOOK_URL=https://tu-n8n.com/webhook/discord-ticket
N8N_WEBHOOK_SECRET=a1b2c3d4... (debe coincidir con IF node)
HEALTHCHECK_URL=https://hc-ping.com/...
```

**Credenciales (n8n):**
- OpenAI API
- Discord Bot Auth

**Workflow (n8n):**
- Webhook → IF → OpenAI → HTTP Request
- Todo activado (ON)

---

Una vez que esto esté listo, el bot funciona 24/7 automáticamente. ¡Listo para producción!
