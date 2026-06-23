# Setup del Bot en Discord Developer Portal

## Paso 1: Crear una Aplicación (si no existe)

1. Ve a https://discord.com/developers/applications
2. Click en "New Application"
3. Dale un nombre: `TradingMiamiSupportBot`
4. Click en "Create"

## Paso 2: Crear el Bot

1. En la página de la aplicación, ve a **"Bot"** (sidebar izquierdo)
2. Click en "Add Bot"
3. Se creará un bot automáticamente

## Paso 3: Obtener el Token

⚠️ **CRÍTICO: El token es como una contraseña. NUNCA lo expongas públicamente.**

1. En la sección **"TOKEN"** (en la página Bot)
2. Click en "Copy" (o "Reset Token" si ya existe)
3. **Copia el token y guárdalo en `.env`:**
   ```
   DISCORD_TOKEN=MTUxMjg2OTY0Nzc4MTk5MDQwMA.G3mvoL.ffB8rewX2VZUi4_-ETSCUMKAUCssctb6Yl2Jis
   ```

## Paso 4: Activar Message Content Intent

⚠️ **IMPORTANTE**: Sin esto, el bot NO puede leer el contenido de los mensajes.

1. En la página Bot, busca la sección **"PRIVILEGED GATEWAY INTENTS"**
2. **Activa estos toggles:**
   - ✅ **Message Content Intent** (para leer contenido de mensajes)
   - ✅ **Server Members Intent** (opcional, para ver miembros)
3. Click en "Save Changes"

## Paso 5: Dar Permisos al Bot

1. Ve a **"OAuth2"** → **"URL Generator"** (sidebar izquierdo)

2. En **"SCOPES"**, selecciona:
   - ✅ `bot`

3. En **"PERMISSIONS"**, selecciona:
   - ✅ `Send Messages`
   - ✅ `Read Messages/View Channels`
   - ✅ `Read Message History`
   - ✅ `Manage Messages` (si quieres que pueda borrar mensajes)

4. Copia la URL generada (al final de la página)

## Paso 6: Invitar el Bot al Servidor

1. Pega la URL en tu navegador
2. Selecciona el servidor: "Trading Miami School"
3. Click en "Authorize"
4. Completa el CAPTCHA si lo pide

## Paso 7: Verificar que está en el Servidor

1. Ve a Discord
2. Ve al servidor "Trading Miami School"
3. En la lista de miembros (lado derecho), debería aparecer tu bot
4. Debería tener un círculo **gris o naranja** (offline)
   - Cuando el código esté corriendo, cambiará a **verde** (online)

## ✅ Listo

Ya tienes:
- ✅ Aplicación creada
- ✅ Bot creado
- ✅ Token obtenido
- ✅ Message Content Intent activado
- ✅ Permisos configurados
- ✅ Bot invitado al servidor

**Ahora necesitas:**
1. Copiar el token a `.env`
2. Correr el código del bot
3. Configurar n8n

---

## Troubleshooting

**"El bot no aparece en el servidor"**
→ Verifica que copiaste la URL correcta de OAuth2 URL Generator
→ Asegúrate de tener permisos para invitar bots al servidor

**"El bot está offline (círculo gris)"**
→ El código del bot no está corriendo
→ Ejecuta `node bot.js` en tu terminal

**"El bot no lee los mensajes"**
→ Verifica que activaste "Message Content Intent"
→ Verifica que el bot tiene permisos "Send Messages" y "Read Messages"

**"Error: Invalid Token"**
→ El token está mal copiado
→ Vuelve a Discord Developer Portal y copia el token de nuevo
