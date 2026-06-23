# 🚨 Configuración de Sistema de Escalación a Soporte

Este documento te guía paso a paso para configurar el sistema de escalación a humano del bot Discord.

---

## 📋 Resumen Rápido

El bot ahora detecta cuando un usuario pide hablar con un humano y:
1. Responde: "A la brevedad se comunicará una persona de soporte técnico con usted"
2. Envía una alerta al canal `#escalaciones-soporte`
3. El soporte usa `/disconnected` para silenciar el bot mientras atiende
4. El soporte usa `/connected` para reactivar el bot cuando termina

---

## 🛠️ Paso 1: Crear el Canal de Escalaciones (Discord)

### En tu servidor Discord:
1. **Botón derecho en un canal cualquiera** → "Crear canal"
2. **Nombre:** `🔔-escalaciones-soporte`
3. **Tipo:** Texto
4. **Privacidad:** Privado (solo visible para rol @Soporte)

### Obtener el ID del canal:
1. En Discord, **haz clic derecho en `#🔔-escalaciones-soporte`**
2. Selecciona **"Copiar ID del canal"**
3. Copia ese ID y guárdalo (lo necesitarás después)

---

## 👥 Paso 2: Crear el Rol @Soporte (Discord)

### En tu servidor Discord:
1. **Server Settings** → **Roles**
2. **Click en "Crear Rol"**
3. **Nombre:** `Soporte` (o `Support`)
4. **Color:** Naranja o azul (a tu gusto)
5. **Permisos recomendados:**
   - ✅ Ver Canales
   - ✅ Enviar Mensajes
   - ✅ Leer Historial de Mensajes
   - ✅ Usar Comandos de Aplicación (slash commands)

### Obtener el ID del rol:
1. **Server Settings** → **Roles**
2. **Haz clic derecho en el rol `@Soporte`**
3. Selecciona **"Copiar ID del rol"**
4. Copia ese ID

### Asignar el rol al equipo de soporte:
- Abre el perfil de cada miembro del soporte
- Click en **"Agregar rol"**
- Selecciona `@Soporte`

---

## 🆔 Paso 3: Obtener el ID del Servidor (Guild ID)

### En tu servidor Discord:
1. **Haz clic derecho en el ícono del servidor** (arriba a la izquierda)
2. Selecciona **"Copiar ID del servidor"**
3. Copia ese ID

---

## ⚙️ Paso 4: Configurar Variables de Entorno

### En tu archivo `.env`:

Busca la sección:
```
# =================================================================
# ESCALACIÓN A SOPORTE
# =================================================================
```

Y reemplaza con tus IDs:

```env
ESCALATION_CHANNEL_ID=123456789012345678  # ID de #escalaciones-soporte
SUPPORT_ROLE_ID=987654321098765432       # ID del rol @Soporte
DISCORD_GUILD_ID=555666777888999000      # ID del servidor
```

**Ejemplo completo:**
```env
ESCALATION_CHANNEL_ID=1234567890123456
SUPPORT_ROLE_ID=9876543210987654
DISCORD_GUILD_ID=1111222233334444
```

---

## 🔐 Paso 5: Permisos del Bot en Discord

### El bot necesita estos permisos en `#escalaciones-soporte`:
1. **Server Settings** → **Roles**
2. **Busca el rol de tu bot** (ej: `Discord-Bot`)
3. **Click derecho** → **Editar rol**
4. En **Permisos**, activa:
   - ✅ Ver Canales
   - ✅ Enviar Mensajes
   - ✅ Incrustar Enlaces (para embeds bonitos)
   - ✅ Mencionar @aquí, @todos y Roles (para pingear @Soporte)

### Alternativa: Permisos por canal
1. **Click derecho en `#escalaciones-soporte`** → **Editar canal**
2. **Permisos** → **Agregar rol/usuario**
3. Busca el rol del bot
4. Activa:
   - ✅ Ver Canales
   - ✅ Enviar Mensajes
   - ✅ Incrustar Enlaces
   - ✅ Mencionar Roles

---

## 🚀 Paso 6: Reiniciar el Bot

Después de cambiar las variables en `.env`:

```bash
# Si usas EasyPanel:
# 1. Entra a tu app en https://ud046x.easypanel.host
# 2. Click en "Restart App" o "Redeploy"

# Si usas terminal local:
# npm install (si agregaste nuevas dependencias)
npm start
```

**Espera 30 segundos** para que el bot se conecte.

---

## ✅ Prueba del Sistema

### 1. En un canal de ticket (`#ticket-usuario`):
**Escribe como usuario normal:**
```
Hola, necesito hablar con una persona real
```

**El bot debe:**
- Responder: "✅ He avisado al equipo de soporte..."
- Enviar una alerta a `#escalaciones-soporte` (con embed naranja)

### 2. En `#escalaciones-soporte`:
**Como miembro con rol @Soporte, escribe:**
```
/disconnected
```

**El bot debe:**
- Responder: "✅ Bot desactivado en este canal"
- Ya no responder en `#ticket-usuario` mientras el soporte atiende

### 3. Terminar atención:
**Como soporte, escribe:**
```
/connected
```

**El bot debe:**
- Responder: "✅ Bot reactivado en este canal"
- Volver a responder mensajes en `#ticket-usuario`

---

## 🎯 Palabras Clave Detectadas

El bot detecta automáticamente estas frases (y variaciones):
- "hablar con un humano"
- "quiero un asesor"
- "necesito una persona"
- "quiero hablar con soporte"
- "persona real"
- Y más...

Si quieres agregar más palabras clave, avísame.

---

## 🔍 Solución de Problemas

### "El bot no envía alerta"
- ✅ Verifica que `ESCALATION_CHANNEL_ID` esté en `.env`
- ✅ Verifica que el bot tenga permiso en `#escalaciones-soporte`
- ✅ Verifica que el ID sea correcto (sin espacios)

### "El comando `/disconnected` no aparece"
- ✅ Verifica que `DISCORD_GUILD_ID` esté en `.env` con el ID correcto
- ✅ Reinicia el bot
- ✅ Espera 1-2 minutos (Discord cachea comandos)

### "El bot no responde a `/disconnected`"
- ✅ Verifica que tengas el rol `@Soporte`
- ✅ Verifica que el rol tenga permiso para usar "Comandos de Aplicación"
- ✅ Mira los logs del bot para errores

### "El bot sigue respondiendo después de `/disconnected`"
- ✅ Reinicia el bot (en EasyPanel o terminal)
- ✅ Verifica que el `ESCALATION_CHANNEL_ID` sea correcto

---

## 📊 Cómo Funciona Internamente

```
Usuario escribe en #ticket: "Hola necesito un humano"
                    ↓
        Bot detecta palabra clave
                    ↓
         ¿Ya fue escalado? → SÍ → Responder "Ya avisé"
                ↓ NO
        Marcar ticket como ESCALATED
                    ↓
    Responder al usuario en el canal
                    ↓
    Enviar ALERTA a #escalaciones-soporte
                    ↓
    Soporte entra y escribe /disconnected
                    ↓
    Marcar ticket como HUMAN_HANDLING
    Silenciar bot en ese canal
                    ↓
    Soporte atiende mientras bot callado
                    ↓
    Soporte escribe /connected
                    ↓
    Reactivar bot en ese canal
```

---

## 🎨 Personalización (Opcional)

### Cambiar el mensaje de respuesta al usuario
En `bot.js`, busca:
```javascript
content: "✅ He avisado al equipo de soporte. **A la brevedad se comunicará...**"
```

Y reemplaza con tu propio mensaje.

### Cambiar palabras clave de escalación
En `bot.js`, busca:
```javascript
const ESCALATION_KEYWORDS = [
  "hablar con un humano",
  "quiero un asesor",
  ...
];
```

Agrega o cambia las palabras que quieras.

### Cambiar colores/formato del embed
En `bot.js`, busca:
```javascript
.setColor(0xff9900) // Naranja
```

- `0xff9900` = Naranja
- `0xff0000` = Rojo
- `0x00ff00` = Verde
- `0x0000ff` = Azul

---

## 📝 Próximos Pasos

1. ✅ Configura las 3 variables en `.env`
2. ✅ Crea el canal y rol en Discord
3. ✅ Asigna permisos al bot
4. ✅ Reinicia el bot
5. ✅ Prueba con un usuario de test
6. ✅ Avísame si hay problemas

---

**¿Dudas?** Avísame el paso donde te trabas.
