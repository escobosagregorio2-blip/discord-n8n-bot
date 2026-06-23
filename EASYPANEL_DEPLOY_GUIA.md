# 🚀 Deploying Discord Bot en EasyPanel - Guía Completa

## 📋 Resumen del Proceso

```
1. Crear repo en GitHub
2. Subir código del bot
3. Conectar GitHub a EasyPanel
4. Configurar variables de entorno
5. Deploy automático
6. Verificar que funciona
```

---

## PARTE 1: GitHub Setup

### Paso 1.1: Crear Repositorio en GitHub

1. Ve a https://github.com/new
2. Nombre del repo: `discord-n8n-bot`
3. Descripción: "Discord bot que conecta con n8n para soporte por tickets"
4. Elige: **Public** (para que EasyPanel pueda acceder)
5. Click en "Create repository"

### Paso 1.2: Preparar tu Máquina Local (Git)

Si no tienes git instalado:
- Windows: https://git-scm.com/download/win
- Mac: `brew install git`
- Linux: `sudo apt-get install git`

Verifica que funciona:
```bash
git --version
```

### Paso 1.3: Clonar el Repo

```bash
# En tu terminal/PowerShell
git clone https://github.com/tu-usuario/discord-n8n-bot.git
cd discord-n8n-bot
```

### Paso 1.4: Copiar los Archivos del Bot

Copia estos archivos a la carpeta `discord-n8n-bot`:

```
discord-n8n-bot/
├── index.js                 (código del bot)
├── package.json             (dependencias)
├── Dockerfile               (para EasyPanel)
├── .gitignore               (qué NO subir)
├── .env.example             (template de variables)
└── README.md                (documentación)
```

### Paso 1.5: Crear .gitignore

Crea un archivo llamado `.gitignore` en la raíz con:

```
# No subir variables secretas
.env
.env.local
node_modules/

# Sistema
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp

# Logs
logs/
*.log
```

### Paso 1.6: Crear .env.example

Crea `.env.example` (SIN los valores reales):

```env
# Template de variables de entorno
# Copia esto a .env y rellena con tus valores
DISCORD_TOKEN=tu_token_aqui
N8N_WEBHOOK_URL=https://tu-n8n.com/webhook/discord-ticket
```

### Paso 1.7: Subir a GitHub

```bash
# Navega a la carpeta del repo
cd discord-n8n-bot

# Agregar todos los archivos
git add .

# Crear commit
git commit -m "Initial commit: Discord bot para n8n"

# Subir a GitHub
git push origin main
```

Verifica en https://github.com/tu-usuario/discord-n8n-bot que están todos los archivos.

---

## PARTE 2: EasyPanel Setup

### Paso 2.1: Crear Nueva App en EasyPanel

1. Ve a tu EasyPanel: https://ud046x.easypanel.host
2. Click en **"Add App"** (o **"+"**)
3. Busca **"GitHub Repository"**

### Paso 2.2: Conectar con GitHub

1. Click en **"Connect with GitHub"**
2. Autoriza EasyPanel para acceder a GitHub
3. Selecciona el repo: **`discord-n8n-bot`**

### Paso 2.3: Configurar la App

**Nombre de la App:**
```
discord-bot
```

**Tipo:** Node.js

**Branch:** `main`

**Build Command:**
```
npm install
```

**Start Command:**
```
node index.js
```

### Paso 2.4: Agregar Variables de Entorno (⚠️ TODAS LAS 4 SON CRÍTICAS)

En la sección **"Environment Variables"**, haz click en **"Add Variable"** 4 veces:

**Variable 1: DISCORD_TOKEN** (REQUERIDO)
   - **Key**: `DISCORD_TOKEN`
   - **Value**: Tu token de Discord NUEVO (obtén de Discord Developer Portal → Bot → Reset Token)
   - ⚠️ Debe ser un token **nuevo** (no uno expuesto previamente)

**Variable 2: N8N_WEBHOOK_URL** (REQUERIDO)
   - **Key**: `N8N_WEBHOOK_URL`
   - **Value**: `https://ud046x.easypanel.host/webhook/discord-ticket`

**Variable 3: N8N_WEBHOOK_SECRET** (CRÍTICO para Seguridad)
   - **Key**: `N8N_WEBHOOK_SECRET`
   - **Value**: Secreto aleatorio (genéralo: `openssl rand -hex 32`)
   - Ejemplo: `a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0`
   - ⚠️ Guarda este valor, lo necesitarás también en n8n

**Variable 4: HEALTHCHECK_URL** (Recomendado para Monitoreo 24/7)
   - **Key**: `HEALTHCHECK_URL`
   - **Value**: URL de Healthchecks.io (ej: `https://hc-ping.com/a1b2c3d4-e5f6-...`)
   - Cómo obtener: https://healthchecks.io → Create check → copia Ping URL
   - Si no tienes, puedes dejarlo vacío por ahora (pero agregalo luego)

### Paso 2.5: Deploy

1. Click en **"Deploy"**
2. EasyPanel:
   - Descargará el código de GitHub
   - Instalará las dependencias (`npm install`)
   - Iniciará el bot (`node index.js`)

3. Espera 1-2 minutos a que termine

### Paso 2.6: Verificar Logs

1. En EasyPanel, abre tu app `discord-bot`
2. Ve a **"Logs"**
3. Deberías ver:

```
🚀 Iniciando bot de Discord...

✅ Configuración cargada correctamente
📡 Webhook de n8n: https://ud046x.easypanel.host/webhook/discord-ticket

============================================================
✅ Bot conectado como: TradingMiamiSupportBot#1234
✅ ID del Bot: 1512869647781990400
✅ Servidores: 1
📡 Escuchando canales: ticket, soporte, support
============================================================
```

Si ves esto: **¡El bot está online!** ✅

---

## PARTE 3: Verificar que Funciona

### Paso 3.1: Ver el Bot en Discord

1. Ve a Discord → Tu servidor "Trading Miami School"
2. Mira la lista de miembros (lado derecho)
3. Tu bot debería aparecer con un **círculo verde** (online)

### Paso 3.2: Probar el Bot

1. Abre un canal de ticket (ej: `#ticket-0001`)
2. Escribe un mensaje: "Hola, prueba"
3. Ve a EasyPanel → Logs
4. Deberías ver:

```
📨 MENSAJE RECIBIDO
   Canal: #ticket-0001
   Usuario: tu_usuario (123456789)
   Contenido: Hola, prueba
   📤 Enviando a n8n...
   ✅ Enviado a n8n (HTTP 200)
```

Si ves esto: **¡El bot está escuchando!** ✅

### Paso 3.3: Verificar Webhook en n8n

1. Ve a n8n → Tu workflow
2. En el Webhook node, haz click en **"Test Webhook"**
3. Deberías ver que recibió datos del bot

---

## PARTE 4: Configurar n8n

### Paso 4.1: Crear Workflow

1. En n8n, click en **"+"** → **"New Workflow"**
2. Nombre: `Discord Support Bot`

### Paso 4.2: Webhook Node (Entrada)

1. Click en **"+"** → Busca **"Webhook"**
2. **Method**: POST
3. **Path**: `discord-ticket`

**Copia esta URL (la necesitarás):**
```
https://ud046x.easypanel.host/webhook/discord-ticket
```

### Paso 4.3: OpenAI Node (Procesamiento)

1. Click en **"+"** → Busca **"OpenAI"**
2. **Model**: `gpt-4o-mini`
3. **System Prompt**:
   ```
   Eres un agente de soporte técnico amigable para Trading Miami School. 
   Responde de forma concisa y profesional (máximo 200 caracteres). 
   Si no sabes algo, ofrece escalar a un humano.
   ```
4. **Messages**: 
   ```json
   [
     {
       "role": "user",
       "content": "{{ $json.message }}"
     }
   ]
   ```
5. **Conectar**: Arrastra Webhook → OpenAI

### Paso 4.4: HTTP Request Node (Respuesta a Discord)

1. Click en **"+"** → Busca **"HTTP Request"**
2. **Method**: POST
3. **URL**:
   ```
   https://discord.com/api/v10/channels/{{ $json.channelId }}/messages
   ```
4. **Headers** - Agregar dos:
   - **Header 1**: 
     - Key: `Authorization`
     - Value: `Bot <TU_DISCORD_TOKEN_AQUI>`
     - ⚠️ **CRÍTICO:** Reemplaza `<TU_DISCORD_TOKEN_AQUI>` con tu token real de Discord Developer Portal

   - **Header 2**:
     - Key: `Content-Type`
     - Value: `application/json`

5. **Body**:
   ```json
   {
     "content": "{{ $json.choices[0].message.content }}",
     "allowed_mentions": {"parse": []}
   }
   ```

**NOTA IMPORTANTE sobre Seguridad:**
No recomendamos tener el token visible en el node. Mejor usar n8n Credentials:
1. Click en "n8n" (arriba izquierda)
2. Credentials
3. Create → Custom HTTP Authentication
4. Guardar el token ahí
5. En el HTTP Request node, seleccionar esa credential

6. **Conectar**: Arrastra OpenAI → HTTP Request

### Paso 4.5: Activar Workflow

1. En la esquina superior derecha, verifica que el toggle está **ON** (verde)
2. El workflow está activo

---

## PARTE 5: Actualizar el Código (Flujo Futuro)

Si necesitas cambiar el código después:

```bash
# 1. Navega a tu repo local
cd discord-n8n-bot

# 2. Haz cambios en los archivos (ej: index.js)

# 3. Agrega los cambios
git add .

# 4. Commit
git commit -m "Descripción del cambio"

# 5. Push a GitHub
git push origin main

# 6. EasyPanel detecta el cambio automáticamente
#    y redeploy el bot en 1-2 minutos
```

---

## ❌ Troubleshooting

### "Bot offline en Discord"
- Verifica los logs en EasyPanel
- Busca errores como "Invalid Token"
- Regenera el token en Discord Developer Portal

### "Bot no envía mensajes a n8n"
- Verifica que `N8N_WEBHOOK_URL` es correcta en EasyPanel
- Prueba escribir en un canal de ticket
- Verifica los logs: debe decir "✅ Enviado a n8n"

### "n8n no responde en Discord"
- Verifica que el workflow está ON (verde)
- Verifica que el token de Discord en HTTP Request es correcto
- Verifica que el bot tiene permisos "Send Messages"

### "Error en EasyPanel: npm install failed"
- Verifica que `package.json` está correcto
- Verifica que no hay errores de sintaxis en `index.js`
- Ve a GitHub y asegúrate que se subieron todos los archivos

---

## ✅ Checklist Final

- [ ] Repositorio creado en GitHub
- [ ] Archivos subidos: `index.js`, `package.json`, `Dockerfile`
- [ ] `.gitignore` creado (no subir `.env`)
- [ ] EasyPanel conectado con GitHub
- [ ] Variables de entorno agregadas en EasyPanel
- [ ] Deploy completado
- [ ] Bot online en Discord (círculo verde)
- [ ] Logs muestran "✅ Bot conectado"
- [ ] n8n workflow creado y activado
- [ ] Prueba manual: escribir en ticket, bot responde

---

## 📞 Ayuda

Si algo no funciona:
1. Verifica los logs en EasyPanel
2. Lee los mensajes de error
3. Verifica que las variables de entorno sean correctas
4. Regenera tokens si es necesario
5. Prueba el webhook directamente en n8n
