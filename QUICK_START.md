# 🚀 Quick Start (10 minutos)

## Paso 1: Token de Discord (2 min)

1. Ve a https://discord.com/developers/applications
2. Click en tu aplicación (o crea una nueva)
3. **Bot** → **Reset Token** → Copia
4. Edita `.env` y pega:
   ```
   DISCORD_TOKEN=tu_token_aqui
   ```

**Asegúrate que en la página Bot está activado:**
- ✅ Message Content Intent (toggle verde)

## Paso 2: Instalar y Correr (2 min)

```bash
# En tu terminal/PowerShell
npm install
npm start
```

Deberías ver:
```
✅ Bot conectado como TradingMiamiSupportBot#1234
📡 Escuchando canales de soporte/tickets
```

El bot está online. Vai a Discord y verás que tiene un **círculo verde**.

## Paso 3: Crear Workflow en n8n (5 min)

1. Ve a tu n8n: https://funes-n8n.ud046x.easypanel.host
2. Click en "+" → "New Workflow"
3. Agregar nodes:

### Node 1: Webhook (entrada)
- Search "Webhook" → Add
- Method: POST
- Path: `discord-support`
- **Copia esta URL:**
  ```
  https://funes-n8n.ud046x.easypanel.host/webhook/discord-support
  ```

### Node 2: OpenAI (procesamiento)
- Search "OpenAI" → Add
- Model: `gpt-4o-mini`
- System: `"Eres un agente de soporte técnico amigable. Responde brevemente (máx 200 caracteres)."`
- Messages: `[{"role": "user", "content": "{{ $json.message }}"}]`
- Conecta: Webhook → OpenAI

### Node 3: HTTP Request (respuesta)
- Search "HTTP Request" → Add
- Method: POST
- URL: `https://discord.com/api/v10/channels/{{ $json.channelId }}/messages`
- Headers:
  - `Authorization`: `Bot TU_DISCORD_TOKEN_AQUI`
  - `Content-Type`: `application/json`
- Body:
  ```json
  {
    "content": "{{ $json.choices[0].message.content }}"
  }
  ```
- Conecta: OpenAI → HTTP Request

### Node 4: Pega N8N_WEBHOOK_URL en `.env`

```env
N8N_WEBHOOK_URL=https://funes-n8n.ud046x.easypanel.host/webhook/discord-support
```

Reinicia el bot:
```bash
npm start
```

## ✅ Listo

Ahora:
1. Abre un ticket en Discord (`#ticket-0001`)
2. Escribe un mensaje
3. El bot lo envía a n8n
4. n8n procesa con OpenAI
5. Aparece respuesta automáticamente en Discord

---

## Si Algo No Funciona

| Problema | Solución |
|----------|----------|
| Bot offline (gris) | Corre `npm start` en terminal |
| Bot no lee mensajes | Activa Message Content Intent en Discord Developer Portal |
| n8n no responde | Verifica que el workflow está ON (toggle verde) |
| Error 401 en n8n | Token de Discord incorrecto. Regenera uno nuevo |

---

## Archivos Detallados

- `SETUP_DISCORD_DEVELOPER_PORTAL.md` → Guía completa de Discord
- `SETUP_N8N_WORKFLOW.md` → Guía completa de n8n
- `README_BOT.md` → Documentación completa
- `bot.js` → Código del bot
- `package.json` → Dependencias

**Próximo paso:** Lee uno de estos si necesitas más detalles.
