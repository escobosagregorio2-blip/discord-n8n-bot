# Setup Discord Bot en Replit (Seguro)

## ⚠️ PRIMERO: Regenerar Tokens (CRÍTICO)

Los tokens anteriores estaban expuestos. Debes regenerar INMEDIATAMENTE:

### 1. Regenerar Discord Bot Token
1. Ve a https://discord.com/developers/applications
2. Selecciona tu aplicación "TradingMiamiSchoolBot"
3. Click en "Bot" (sidebar izquierdo)
4. Click en "Reset Token"
5. Copia el token nuevo

### 2. Regenerar OpenAI API Key (si usas la versión con OpenAI)
1. Ve a https://platform.openai.com/api-keys
2. Delete la key antigua
3. Create "New secret key"
4. Copia la nueva key

---

## Paso 1: Crear cuenta en Replit
1. Ve a https://replit.com
2. Crea cuenta (GitHub es lo más fácil)
3. Si ya tienes, inicia sesión

## Paso 2: Crear nuevo Replit
1. Click en "Create" → "New Replit"
2. Elige "Python" como lenguaje
3. Dale nombre: `trading-miami-discord-bot`

## Paso 3: Subir archivos

### 3a. Archivo principal (elige UNO):

**Opción A: Con n8n Webhook (recomendado para escala)**
- Copia el contenido de `discord_bot.py` a `main.py` en Replit

**Opción B: Con OpenAI integrado (respuestas automáticas)**
- Copia el contenido de `discord_bot_openai.py` a `main.py` en Replit

### 3b. Dependencies
- Crea archivo `requirements.txt` con:
```
discord.py>=2.3.2
aiohttp>=3.9.0
openai>=0.27.8
requests>=2.31.0
python-dotenv>=1.0.0
```

### 3c. Variables de entorno (el paso importante)
1. Click en "Secrets" (icono de lock en sidebar izquierdo)
2. Click en "Add new secret"
3. Agrega CADA una de estas variables:

**Si usas discord_bot.py (webhook):**
```
DISCORD_TOKEN = tu_token_nuevo_aqui
N8N_WEBHOOK_URL = https://funes-n8n.ud046x.easypanel.host/webhook/discord-support
```

**Si usas discord_bot_openai.py:**
```
DISCORD_TOKEN = tu_token_nuevo_aqui
OPENAI_API_KEY = sk-proj-tu_nueva_key_aqui
```

⚠️ En Replit, los "Secrets" son el equivalente a `.env` — Replit los inyecta como variables de entorno automáticamente.

## Paso 4: Ejecutar
1. Click en "Run" (arriba)
2. Espera 10-15 segundos
3. Deberías ver: `✅ Bot conectado como TradingMiamiSchoolBot`

## Paso 5: Probar en Discord
1. Ve a tu servidor Discord
2. Escribe en un canal de ticket (ej: `#ticket-0001`)
3. El bot debe responder en 1-2 segundos

## Después: Uptime 24/7 (opcional)

**Replit gratis:** el bot corre mientras Replit esté activo, pero puede dormir.

**Replit Always On ($7/mes):** 
1. Click en tu avatar (arriba derecha) → Account
2. Selecciona Replit → "Always On"
3. Paga $7/mes para que corra 24/7

---

## 🔄 Cómo migrar a otra comunidad

1. En Discord Developer Portal, crea un BOT NUEVO para ese servidor
2. Copia su token
3. En Replit, actualiza el secret `DISCORD_TOKEN` con el nuevo token
4. ¡Listo! El bot funciona en el nuevo servidor

---

## ⚡ Solución de problemas

**"❌ DISCORD_TOKEN no encontrado en .env"**
→ Verificaste que agregaste el secret DISCORD_TOKEN en Replit?

**"Bot no responde en Discord"**
→ Verifica que el bot esté online en el servidor (debería estar con círculo verde)
→ Verifica que el bot tiene permisos en el canal (Admin debería funcionar)

**"Error: Invalid Token"**
→ El token está mal copiado. Regenera uno nuevo en Developer Portal.

**"Webhook delivered pero n8n no procesa"**
→ Verifica que el N8N_WEBHOOK_URL es correcto
→ Verifica que el workflow de n8n está activo

---

## 📝 Notas finales

- **Nunca** hardcodes tokens en el código (ya lo aprendimos)
- **Siempre** usa `.env` (Replit Secrets) para credenciales
- El bot escucha **solo canales que empiezan con `ticket-`** (configurable)
- Si necesitas escuchar otros canales, edita `TICKET_CHANNEL_PREFIX` en el código
