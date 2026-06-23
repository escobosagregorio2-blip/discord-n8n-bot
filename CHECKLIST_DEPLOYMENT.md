# ✅ CHECKLIST FINAL - Bot Listo para Producción

Opus encontró bugs, los arreglé. Ahora usa este checklist para deployar sin problemas.

---

## 🔴 BLOQUEADORES RESUELTOS

- [x] **package.json**: Ahora apunta a `index.js` (no `bot.js`)
- [x] **EASYPANEL_DEPLOY_GUIA.md**: Actualizada con las 4 env vars
- [x] **N8N_WORKFLOW_COMPLETO.md**: Guía detallada de construcción con validación de secreto + retry
- [x] **Seguridad**: Webhook autenticado, retry logic, healthcheck, validaciones

---

## 📋 ORDEN EXACTO DE IMPLEMENTACIÓN

### FASE 0: Preparación (10 min)

- [ ] Lee `SECURITY_IMPROVEMENTS.md` (entiende qué se arregló)
- [ ] Lee `N8N_WORKFLOW_COMPLETO.md` (entiende cómo construir el workflow)
- [ ] Genera un secreto:
  ```bash
  openssl rand -hex 32
  ```
  Cópialo y guárdalo en un lugar seguro (lo usarás en EasyPanel Y en n8n)

### FASE 1: Discord Setup (5 min)

- [ ] Ve a https://discord.com/developers/applications
- [ ] Selecciona tu aplicación (o crea una nueva)
- [ ] **Bot**: Click en "Reset Token"
- [ ] Copia el **NUEVO TOKEN** (este es diferente al anterior)
- [ ] Guárdalo en lugar seguro (no lo publiques)
- [ ] Verifica que **Message Content Intent** está ACTIVADO (toggle verde)
- [ ] Ve a **OAuth2 → URL Generator**:
  - Scopes: `bot`
  - Permissions: `View Channels`, `Read Message History`, `Send Messages`
  - Copia la URL generada
- [ ] Abre la URL → Autoriza → Invita el bot al servidor "Trading Miami School"

### FASE 2: GitHub (5 min)

- [ ] Abre terminal en tu carpeta del bot
- [ ] Verifica estado:
  ```bash
  git status
  ```
  - No debe listar `.env` (está en `.gitignore` ✅)
  - Debe listar `index.js`, `package.json`, `Dockerfile`, etc.
- [ ] Agrega cambios:
  ```bash
  git add .
  git commit -m "Implementar bot con retry, healthcheck y autenticación"
  git push origin main
  ```
- [ ] Verifica en GitHub que todos los archivos están

### FASE 3: n8n Workflow (10 min)

Sigue **N8N_WORKFLOW_COMPLETO.md** paso a paso:

- [ ] Crear credential OpenAI (con tu API key)
- [ ] Crear credential Discord Auth (con tu token)
- [ ] Crear Webhook node (Path: `discord-ticket`)
- [ ] Crear IF node (valida header `X-Webhook-Secret`)
- [ ] Crear OpenAI node
- [ ] Crear HTTP Request node (con **retry: 3 intentos**)
- [ ] **Activar workflow** (switch ON en la esquina superior derecha)
- [ ] Copiar la URL del webhook

### FASE 4: EasyPanel Deploy (10 min)

Sigue **EASYPANEL_DEPLOY_GUIA.md**:

- [ ] Ve a EasyPanel
- [ ] Click en "Add App"
- [ ] Selecciona tu repo de GitHub
- [ ] **Build Command**: `npm install`
- [ ] **Start Command**: `node index.js` (verifica que dice `index.js`, no `bot.js`)
- [ ] Agregar las **4 env vars**:

```
DISCORD_TOKEN = <TU_TOKEN_NUEVO_DISCORD>
N8N_WEBHOOK_URL = <COPIA_DEL_WEBHOOK_DE_N8N>
N8N_WEBHOOK_SECRET = <TU_SECRETO_ALEATORIO>
HEALTHCHECK_URL = (dejar en blanco por ahora, lo agregaremos después)
```

- [ ] **Forzar Dockerfile** (en settings si es necesario)
- [ ] Click **"Deploy"**
- [ ] Esperar 1-2 minutos
- [ ] Revisar **Logs**: debe decir "✅ Bot conectado"

### FASE 5: Verificación (5 min)

- [ ] Discord: el bot debe tener círculo **verde** (online)
- [ ] EasyPanel Logs: "✅ Bot conectado como TradingMiamiSupportBot"
- [ ] Escribir en un canal `#ticket-*` en Discord
- [ ] Esperar 2-3 segundos
- [ ] **Debe aparecer respuesta automática de IA**

### FASE 6: Healthcheck (5 min)

Una vez que todo funciona, agregar monitoreo:

- [ ] Ve a https://healthchecks.io
- [ ] Create new check
- [ ] Copia la **Ping URL** (ej: `https://hc-ping.com/abc123...`)
- [ ] En EasyPanel, agrega env var:
  ```
  HEALTHCHECK_URL = <TU_PING_URL>
  ```
- [ ] Reinicia el bot (EasyPanel: Redeploy o Restart)
- [ ] Espera 5 minutos
- [ ] En Healthchecks.io el check debe estar **VERDE** (recibió ping)
- [ ] Si configuras alerta por email → tendrás notificación automática si el bot cae

---

## 🎯 Después del Deploy: Verificaciones Diarias

Durante la primera semana:

- [ ] **Diario**: Escribir en un ticket, verificar que recibe respuesta
- [ ] **Diario**: Revisar EasyPanel Logs por errores
- [ ] **Diario**: Verificar Healthchecks.io (check debe estar verde)
- [ ] **Si algo falla**: leer los logs, buscar el error, debuggear

Si todo funciona 3 días seguidos sin problemas: **¡bot está en producción!**

---

## 📊 Checklist Visual

```
Preparación ✓
  └─ Secreto generado
  
Discord ✓
  └─ Token nuevo
  └─ Message Content Intent ON
  └─ Bot invitado
  
GitHub ✓
  └─ Código pusheado
  └─ index.js presente
  └─ .env NO presente
  
n8n ✓
  └─ Webhook node
  └─ IF node (validación secreto)
  └─ OpenAI node (con API key)
  └─ HTTP Request node (con retry)
  └─ Workflow ON
  
EasyPanel ✓
  └─ App creada
  └─ 4 env vars
  └─ Build command: npm install
  └─ Start command: node index.js
  └─ Deploy completado
  
Verificación ✓
  └─ Bot online (círculo verde)
  └─ Logs: "Bot conectado"
  └─ Test real: ticket → respuesta
  
Healthcheck ✓
  └─ Check creado
  └─ HEALTHCHECK_URL agregada
  └─ Ping recibido
  └─ Alerta configurada

Bot Dado de Alta ✅✅✅
```

---

## 🆘 Si Algo Sale Mal

| Problema | Checklist |
|----------|-----------|
| EasyPanel deployment falla | ¿`npm install` completa sin errores? ¿Dockerfile visible? |
| Bot no conecta a Discord | ¿Token válido? ¿Token nuevo (no el anterior)? |
| Bot en Discord pero offline (círculo gris) | ¿Logs dicen "✅ Bot conectado"? ¿Ver log completo? |
| Bot recibe mensaje pero no responde | ¿n8n workflow está ON? ¿OpenAI tiene créditos? |
| n8n falla | ¿Los secrets (OpenAI API key, Discord token) están en Credentials? |
| Respuesta no llega a Discord | ¿HTTP Request tiene retry activado? ¿Bot tiene permisos "Send Messages"? |
| Healthcheck no recibe ping | ¿HEALTHCHECK_URL en EasyPanel? ¿Bot redeployeado después de agregar variable? |

---

## 🚀 ¡LISTO!

Una vez completes TODO este checklist, tu bot estará:
- ✅ Online 24/7 en EasyPanel
- ✅ Escuchando tickets en Discord
- ✅ Procesando con IA automáticamente
- ✅ Respondiendo en Discord
- ✅ Con retry automático ante fallos
- ✅ Con healthcheck para alertas
- ✅ Con autenticación del webhook
- ✅ Con logging para debugging

**Tiempo total: ~45 minutos de setup, luego funciona automáticamente.**

---

## 📚 Referencia Rápida de Archivos

| Archivo | Para qué |
|---------|----------|
| `index.js` | Código del bot (con todas las mejoras) |
| `package.json` | Dependencias y scripts |
| `.env` | Variables locales (no subir a git) |
| `Dockerfile` | Para EasyPanel |
| `.gitignore` | Qué no subir a GitHub |
| `SECURITY_IMPROVEMENTS.md` | Detalle de mejoras implementadas |
| `EASYPANEL_DEPLOY_GUIA.md` | Paso a paso EasyPanel |
| `N8N_WORKFLOW_COMPLETO.md` | Paso a paso n8n (workflow) |
| `GITHUB_SETUP_GUIA.md` | Paso a paso GitHub |
| `CHECKLIST_DEPLOYMENT.md` | **Este archivo — orden exacto** |

---

**¡Adelante! El bot está listo, solo falta que lo despliegues.** 🚀
