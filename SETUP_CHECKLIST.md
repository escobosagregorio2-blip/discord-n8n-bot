# ✅ Setup Checklist - Discord Bot Seguro en Replit

## 🚨 Acción Crítica 1: Regenerar Tokens

**URGENCIA: AHORA MISMO**

### Discord Bot Token
- [ ] Ve a https://discord.com/developers/applications
- [ ] Selecciona "TradingMiamiSchoolBot"
- [ ] Click en "Bot" → "Reset Token"
- [ ] Copia el token NUEVO
- [ ] Guarda en lugar seguro (NO en código)

### OpenAI API Key (si la usas)
- [ ] Ve a https://platform.openai.com/api-keys
- [ ] Delete la vieja key: `sk-proj-RlQJR6F5sLlvQQvVRXRvT3BlbkFJ3kVCz6HqRuDa5XZR9w9X`
- [ ] Create "New secret key"
- [ ] Copia la NUEVA key
- [ ] Guarda en lugar seguro (NO en código)

---

## 🔧 Acción 2: Crear Replit

- [ ] Ir a https://replit.com
- [ ] Crear nuevo Replit en Python
- [ ] Nombre: `trading-miami-discord-bot`

---

## 📝 Acción 3: Subir Archivos a Replit

### Opción A: Bot con N8N Webhook (recomendado)
- [ ] Copiar `discord_bot.py` → `main.py` en Replit
- [ ] Copiar `requirements.txt` tal cual está

### Opción B: Bot con OpenAI (respuestas automáticas)
- [ ] Copiar `discord_bot_openai.py` → `main.py` en Replit
- [ ] Copiar `requirements.txt` tal cual está

---

## 🔐 Acción 4: Agregar Secrets en Replit

**IMPORTANTE:** En Replit, usa "Secrets" (no crear archivo .env)

1. [ ] Click en icono de "lock" (Secrets) en sidebar
2. [ ] Click en "Add new secret"
3. [ ] Agrega estas variables:

**Si usas discord_bot.py:**
```
DISCORD_TOKEN = [paste token nuevo aquí]
N8N_WEBHOOK_URL = https://funes-n8n.ud046x.easypanel.host/webhook/discord-support
```

**Si usas discord_bot_openai.py:**
```
DISCORD_TOKEN = [paste token nuevo aquí]
OPENAI_API_KEY = [paste nueva key aquí]
```

---

## ▶️ Acción 5: Ejecutar el Bot

- [ ] Click en "Run" en Replit
- [ ] Espera 10-15 segundos
- [ ] Verifica que veas:
  ```
  ✅ Bot conectado como TradingMiamiSchoolBot
  📨 Escuchando en canales de tickets
  ```

---

## 🧪 Acción 6: Probar en Discord

- [ ] Ve al servidor Discord "Trading Miami School"
- [ ] Abre un canal de ticket (ej: `#ticket-0001`)
- [ ] Escribe un mensaje: "hola"
- [ ] El bot debe responder en 1-2 segundos

---

## 🌙 Acción 7 (Opcional): Uptime 24/7

Para que el bot corra todo el tiempo (no solo mientras trabajas):

- [ ] En Replit, click en avatar → Account
- [ ] Click en "Always On" ($7/mes)
- [ ] Confirmar pago

Sin esto, el bot solo corre mientras Replit esté activo.

---

## 📋 Resumen de archivos creados

| Archivo | Propósito |
|---------|-----------|
| `discord_bot.py` | Bot que envía mensajes a N8N vía webhook |
| `discord_bot_openai.py` | Bot que responde automáticamente con OpenAI |
| `.env.example` | Template de variables (para referencia) |
| `requirements.txt` | Dependencias Python |
| `.gitignore` | Asegura que `.env` nunca sea commiteado |
| `REPLIT_SETUP.md` | Guía completa de setup |

---

## ⚡ Próximos pasos después del setup

1. **Monitoreo:** Verifica los logs en Replit periódicamente
2. **Mejoras:** Personaliza el prompt del bot si es necesario
3. **Escalado:** Si crece a 50k+ miembros, considera mover a un server dedicado

---

## ❓ Dudas comunes

**¿Por qué Replit y no Docker/servidor propio?**
→ Replit es gratis, fácil, y no requiere gestionar infraestructura. Para producción con 12k miembros, considera un VPS dedicado después.

**¿Qué pasa si el token se expone de nuevo?**
→ Ve a Discord Developer Portal, "Reset Token" (lo invalida inmediatamente). Todos los bots usando ese token se desconectan.

**¿Es seguro guardar secrets en Replit?**
→ Sí, están cifrados. Mejor que hardcodear en el código.

**¿Puedo usar el mismo token para múltiples bots?**
→ No, cada bot tiene su token único. Si necesitas 2 bots, debes crear 2 aplicaciones en Developer Portal.
