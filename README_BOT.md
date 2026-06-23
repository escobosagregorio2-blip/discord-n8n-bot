# Discord → n8n Support Bot

Bot de Discord que actúa como puente entre tickets de soporte y n8n para procesamiento con IA.

## ¿Qué hace?

1. 🎫 Lee mensajes en canales de tickets de Discord
2. 📨 Envía los mensajes a n8n vía Webhook
3. 🤖 n8n procesa con OpenAI (IA)
4. 💬 n8n responde automáticamente en Discord

## Requisitos Previos

- **Node.js** v18+ (https://nodejs.org/)
- **Cuenta de Discord** con un servidor
- **Ticket Tool** instalado en tu Discord (o canales que empiezan con "ticket")
- **Cuenta de n8n** (self-hosted o cloud)
- **API Key de OpenAI** (opcional, pero recomendado para IA)

## Instalación Rápida (5 minutos)

### 1. Clonar o descargar los archivos

```bash
# Si tienes git:
git clone https://github.com/tu-usuario/discord-n8n-bot.git
cd discord-n8n-bot

# Si descargaste como ZIP:
# Extrae los archivos en una carpeta
```

### 2. Instalar dependencias

```bash
npm install
```

Esto instala:
- `discord.js` (cliente de Discord)
- `axios` (para hacer requests HTTP)
- `dotenv` (para cargar variables de entorno)

### 3. Configurar variables de entorno

```bash
# Copia el archivo .env.example (si existe) o crea uno nuevo
# Edita .env y agrega:

DISCORD_TOKEN=tu_token_aqui
N8N_WEBHOOK_URL=https://tu-n8n.com/webhook/discord-support
```

📝 **Cómo obtener el token:**
1. Ve a https://discord.com/developers/applications
2. Selecciona tu aplicación
3. Ve a "Bot" y copia el token

### 4. Correr el bot

```bash
npm start
```

Deberías ver:
```
✅ Bot conectado como TradingMiamiSupportBot#1234
📡 Escuchando canales de soporte/tickets
```

---

## Setup Completo (Paso a Paso)

### Fase 1: Discord Developer Portal

📖 Lee: `SETUP_DISCORD_DEVELOPER_PORTAL.md`

1. Crear aplicación
2. Crear bot
3. Obtener token
4. Activar Message Content Intent
5. Invitar al servidor

### Fase 2: Ejecutar el Bot

```bash
npm install
npm start
```

### Fase 3: Configurar n8n

📖 Lee: `SETUP_N8N_WORKFLOW.md`

1. Crear webhook node
2. Agregar OpenAI node
3. Agregar HTTP Request node
4. Activar workflow

---

## Cómo Funciona

```
Usuario en Discord
        ↓
   escribe mensaje en #ticket-0001
        ↓
Bot de Discord escucha messageCreate
        ↓
Detecta que es un canal de ticket
        ↓
Prepara payload con datos:
{
  "message": "Hola, necesito ayuda",
  "userId": "123456789",
  "username": "usuario",
  "channelId": "1512817445260492800",
  "channelName": "ticket-0001",
  "guildId": "1512616856043782277",
  "timestamp": "2024-01-01T12:00:00Z"
}
        ↓
Envía a n8n via POST /webhook/discord-support
        ↓
n8n recibe en Webhook node
        ↓
OpenAI node procesa: "Genera una respuesta de soporte para: [mensaje]"
        ↓
HTTP Request node envía respuesta a Discord
        ↓
Mensaje aparece en el canal de ticket automáticamente
```

---

## Archivos Incluidos

| Archivo | Propósito |
|---------|-----------|
| `bot.js` | Código principal del bot |
| `package.json` | Dependencias y scripts |
| `.env` | Secretos (TOKEN, URLs) |
| `.gitignore` | Archivos a ignorar en git |
| `SETUP_DISCORD_DEVELOPER_PORTAL.md` | Guía de Discord |
| `SETUP_N8N_WORKFLOW.md` | Guía de n8n |
| `README_BOT.md` | Este archivo |

---

## Variables de Entorno (.env)

```env
# Token del Bot de Discord
DISCORD_TOKEN=MTUxMjg2OTY0Nzc4MTk5MDQwMA.G3mvoL.ffB8rewX2VZUi4_-ETSCUMKAUCssctb6Yl2Jis

# URL del Webhook de n8n
N8N_WEBHOOK_URL=https://funes-n8n.ud046x.easypanel.host/webhook/discord-support
```

⚠️ **IMPORTANTE:**
- Nunca compartas el `.env` públicamente
- Nunca commits `.env` a git
- Si alguien ve el token, regenera uno nuevo en Discord Developer Portal

---

## Ejemplos de Uso

### Ejemplo 1: Usuario abre un ticket

```
Usuario: "Hola, no puedo acceder a mi cuenta"
↓
Bot lo envía a n8n
↓
OpenAI responde: "Entiendo, vamos a resolverlo. ¿Qué error específico ves?"
↓
Respuesta aparece automáticamente en Discord
```

### Ejemplo 2: Múltiples tickets simultáneos

El bot y n8n pueden procesar múltiples mensajes a la vez sin problemas:

```
#ticket-0001: Usuario A pregunta X
#ticket-0002: Usuario B pregunta Y
#ticket-0003: Usuario C pregunta Z

Bot procesa los 3 simultáneamente
n8n responde a los 3 en paralelo
```

---

## Monitoreo y Debugging

### Ver logs en tiempo real

```bash
npm start
```

Logs útiles:
```
✅ Bot conectado                    → Bot está online
📨 Mensaje en ticket-0001: ...      → Mensaje detectado
✅ Enviado a n8n (HTTP 200)         → n8n recibió ok
⚠️ Error en n8n: HTTP 500           → Problema en workflow
❌ Error al enviar a n8n: Timeout   → n8n no responde
```

### Verificar que el bot está online

1. Ve a Discord
2. Mira la lista de miembros del servidor
3. Tu bot debería aparecer con un círculo **verde**

### Si el bot está offline (círculo gris)

El código no está corriendo. Soluciones:

```bash
# Asegúrate que estés en la carpeta correcta
cd /ruta/del/bot

# Verifica que las dependencias están instaladas
npm install

# Corre el bot
npm start
```

---

## Solución de Problemas

### "Error: DISCORD_TOKEN no encontrado"
→ Verifica que el archivo `.env` existe
→ Verifica que tiene `DISCORD_TOKEN=...`

### "Error: N8N_WEBHOOK_URL no encontrado"
→ Verifica que el archivo `.env` existe
→ Verifica que tiene `N8N_WEBHOOK_URL=...`

### "Bot no responde en Discord"
→ Verifica que `npm start` está corriendo
→ Verifica que el bot está online (círculo verde)
→ Verifica que estás escribiendo en un canal que empieza con "ticket"

### "n8n recibe el mensaje pero no responde"
→ Verifica que el workflow de n8n está ON (verde)
→ Verifica que OpenAI tiene créditos
→ Verifica que el HTTP Request node está configurado correctamente

### "Error 401 en Discord (HTTP Request)"
→ El token de Discord es inválido o expiró
→ Regenera un nuevo token en Discord Developer Portal
→ Actualiza el token en n8n

---

## Mejoras Futuras

Cosas que puedes agregar después:

1. **Logging a Base de Datos**
   - Guardar conversaciones en una DB
   - Crear historial de tickets

2. **Respuestas Personalizadas**
   - Agregar más inteligencia a OpenAI
   - Usar documentación de tu producto

3. **Notificaciones**
   - Alertar a humanos si algo falla
   - Enviar resumen diario

4. **Rate Limiting**
   - Limitar respuestas por usuario
   - Evitar spam

5. **Múltiples Servidores**
   - Manejar varios Discord servers
   - Diferentes configuraciones por servidor

---

## Comandos Útiles

```bash
# Instalar dependencias
npm install

# Correr el bot
npm start

# Ver versiones instaladas
npm list

# Actualizar dependencias
npm update

# Limpiar node_modules (y reinstalar después)
rm -rf node_modules
npm install
```

---

## Support

Si necesitas ayuda:

1. Verifica los archivos de setup (SETUP_DISCORD_DEVELOPER_PORTAL.md, SETUP_N8N_WORKFLOW.md)
2. Revisa los logs del bot (`npm start`)
3. Verifica que todas las variables de `.env` están correctas
4. Comprueba que el workflow de n8n está activado

---

## License

MIT - Libre para usar y modificar

---

**Versión:** 1.0.0  
**Última actualización:** 2024  
**Autor:** Trading Miami School Bot Team
