# 📚 Ejemplos de Uso - Sistema de Escalación

## Ejemplo 1: Escalación Exitosa

### Escenario
Usuario en `#ticket-juan` tiene un problema técnico que el bot no puede resolver.

---

### PASO 1: Usuario pide ayuda humana

**En `#ticket-juan`:**
```
[14:32] juan: Hola, necesito hablar con un asesor de Capital Flow Trader
```

---

### PASO 2: Bot detecta y responde

**Bot responde automáticamente:**
```
✅ He avisado al equipo de soporte. A la brevedad se comunicará 
una persona de soporte técnico con usted. Mientras tanto puedes 
dejar más detalles aquí.
```

---

### PASO 3: Alerta en #escalaciones-soporte

**Se envía automáticamente a `#escalaciones-soporte`:**

```
@Soporte

┌─────────────────────────────────────┐
│ 🟠 ESCALACIÓN A HUMANO              │
├─────────────────────────────────────┤
│ 👤 Usuario: @juan (juan perez)      │
│ 🆔 ID: 123456789012345678          │
│ 💬 Canal: #ticket-juan → [Link]     │
│                                      │
│ 📝 Última pregunta:                 │
│ "Necesito hablar con un asesor..."  │
│                                      │
│ 🕐 14:32 · 22 jun 2026             │
└─────────────────────────────────────┘
```

---

### PASO 4: Soporte atiende

**Un miembro con rol @Soporte entra a `#ticket-juan`:**

```
[14:35] soporte_agent: Hola Juan, ¿en qué puedo ayudarte?
```

**Escribe el comando para silenciar al bot:**
```
/disconnected
```

**Bot responde:**
```
✅ Bot desactivado en este canal. El equipo de soporte está atendiendo.
```

---

### PASO 5: Soporte atiende normalmente

**Conversación normal sin interferencia del bot:**
```
[14:36] soporte_agent: ¿Cuál es el error exacto que ves?
[14:37] juan: Me sale "Error 403 - Acceso denegado"
[14:38] soporte_agent: Eso generalmente es un problema de permisos...
[14:45] soporte_agent: Listo, ya configuré tu acceso. Prueba ahora.
[14:46] juan: ¡Genial, funciona! Gracias
```

**El bot NO interfiere**, solo ve los mensajes (pero no responde).

---

### PASO 6: Cerrar atención

**Cuando termina, el soporte escribe:**
```
/connected
```

**Bot responde:**
```
✅ Bot reactivado en este canal.
```

**Ahora el bot vuelve a responder en ese canal.**

---

---

## Ejemplo 2: Usuario Insiste (Cooldown)

### Escenario
El usuario escribió "necesito un humano" hace 2 minutos, y ahora vuelve a escribir lo mismo.

---

### PASO 1: Primera escalación
```
[14:30] usuario: Necesito hablar con alguien, no entiendo esto
```

**Bot responde y alerta al soporte.**

---

### PASO 2: Usuario impaciente (2 minutos después)
```
[14:32] usuario: ¡¡¡NECESITO HABLAR CON UN HUMANO!!!
```

**Bot responde (pero NO envía segunda alerta):**
```
✅ Ya avisé al equipo de soporte. Un agente te atenderá en breve.
```

---

### Por qué no envía segunda alerta?

El bot tiene un **cooldown de 15 minutos** para evitar spam:
- Primera escalación en el mismo canal → Alerta ✅
- Segunda (dentro de 15 min) → Sin alerta, solo confirma que ya se avisó
- Después de 15 minutos → Siguiente alerta sí se envía

**Esto evita que el equipo de soporte reciba 10 notificaciones del mismo usuario.**

---

---

## Ejemplo 3: Múltiples Usuarios en el Mismo Canal

### Escenario
Un canal tiene múltiples usuarios (ej: un canal de grupo o comunidad).

---

### Situación
```
[14:00] usuario_a: ¿Cómo accedo al curso de volumétrica?
[14:02] usuario_b: Hola, necesito hablar con un asesor

[14:03] bot responde a usuario_b: "He avisado al soporte..."
[14:03] bot envía alerta: "usuario_b necesita escalación"

[14:05] soporte_agent: /disconnected
[14:05] bot: "Bot desactivado en este canal"

[14:06] usuario_b: [conversa con soporte_agent]
[14:07] usuario_a: ¿Alguien sabe del curso? ← Bot NO responde
[14:08] soporte_agent: [atiende a usuario_b]
[14:10] soporte_agent: /connected
[14:10] bot: "Bot reactivado"

[14:11] usuario_a: ¿Alguien? → Bot sí responde ahora
```

**Importante:** El `/disconnected` silencia el bot para **TODOS** en ese canal mientras se atiende la escalación.

---

---

## Ejemplo 4: Problemas y Soluciones

### Problema: Bot no responde al `/disconnected`

**Usuario intenta:**
```
/disconnected
```

**Bot no responde o dice "No sé ese comando"**

---

### Soluciones

**1. Verifica el rol @Soporte**
- ¿Tienes asignado el rol `@Soporte`?
- Comprueba: **User Profile** → **Roles** → ¿Aparece `@Soporte`?

**2. Verifica el DISCORD_GUILD_ID en .env**
- Debe coincidir con el ID real de tu servidor
- Ejemplo de ID correcto: `1234567890123456` (números sin caracteres especiales)

**3. Reinicia el bot**
- Si cambiaste `.env`, necesita reiniciar
- En EasyPanel: **Restart App**
- En terminal: `Ctrl+C` y `npm start`

**4. Espera 1-2 minutos**
- Discord cachea comandos slash
- A veces tarda en sincronizarse

**5. Verifica los logs**
- Busca mensajes de error en la consola del bot
- Si ves `❌ Error registrando comandos:`, hay un problema con el GUILD_ID

---

### Problema: Bot sigue respondiendo después de `/disconnected`

**Usuario escribió `/disconnected`, pero el bot sigue respondiendo**

---

### Soluciones

**1. Reinicia el bot**
```bash
# EasyPanel: Restart App
# Terminal: Ctrl+C y npm start
```

**2. Verifica ESCALATION_CHANNEL_ID**
- ¿Está configurado correctamente en `.env`?
- ¿Es el ID correcto del canal?

**3. Borra cache de Discord**
- En Discord, prueba: `Ctrl+R` (reload)
- Cierra y reabre Discord

---

### Problema: Alerta no llega a #escalaciones-soporte

**Usuario escribe "hablar con humano" pero no hay alerta**

---

### Soluciones

**1. Verifica ESCALATION_CHANNEL_ID**
```env
# ¿Está este valor configurado?
ESCALATION_CHANNEL_ID=123456789012345
```

**2. Verifica permisos del bot en #escalaciones-soporte**
- ¿El bot puede enviar mensajes ahí?
- ¿Puede incrustar enlaces (embeds)?
- Prueba mencionando al bot en el canal

**3. Verifica SUPPORT_ROLE_ID**
- ¿Es el ID correcto del rol `@Soporte`?
- ¿El rol existe en tu servidor?

**4. Mira los logs del bot**
```
✅ Alerta enviada a #escalaciones para juan
❌ Error al enviar alerta de escalación: ...
```

---

---

## Ejemplo 5: Flujo Completo en Tiempo Real

```
TIEMPO    | CANAL             | EVENTO
----------|-------------------|------------------------------------
14:30:00  | #ticket-carlos    | Usuario: "necesito un asesor"
14:30:01  | #ticket-carlos    | Bot: "Avisé al equipo..."
14:30:02  | #esc-soporte      | Bot envía ALERTA naranja
14:30:10  | #esc-soporte      | Soporte ve notificación
14:31:00  | #ticket-carlos    | Soporte: "/disconnected"
14:31:01  | #ticket-carlos    | Bot: "Desactivado..."
14:31:02  | #ticket-carlos    | Bot SILENCIADO ← no responde más
14:31:15  | #ticket-carlos    | Soporte: "Hola Carlos..."
14:31:30  | #ticket-carlos    | Carlos: "Gracias, necesito..."
14:35:00  | #ticket-carlos    | Soporte: "Problema resuelto"
14:35:01  | #ticket-carlos    | Soporte: "/connected"
14:35:02  | #ticket-carlos    | Bot: "Reactivado..."
14:35:03  | #ticket-carlos    | Bot ACTIVO ← responde de nuevo
14:36:00  | #ticket-carlos    | Usuario: "¿Cómo accedo al doc?"
14:36:01  | #ticket-carlos    | Bot responde normalmente
```

---

## 📝 Notas Importantes

### Anti-Spam
- **Cooldown:** 15 minutos entre alertas del mismo canal
- **Razón:** Evita notificaciones repetidas si el usuario insiste

### Estado del Ticket
El bot rastrea:
- `ACTIVE` → Funcionando normalmente
- `ESCALATED` → Un usuario pidió escalación
- `HUMAN_HANDLING` → Soporte está atendiendo (bot silenciado)

### Seguridad de Comandos
- Solo rol `@Soporte` puede usar `/disconnected` y `/connected`
- Si intentas sin el rol, el bot rechaza el comando
- Esto evita que usuarios normales silencien al bot

---

## ✅ Checklist para Soporte

Cuando recibas una alerta:
- [ ] Lee el embed con la info del usuario
- [ ] Haz clic en el link del canal para ir rápido
- [ ] Entra al canal del usuario
- [ ] Escribe `/disconnected` para silenciar bot
- [ ] Atiende al usuario normalmente
- [ ] Cuando termines, escribe `/connected`
- [ ] Bot se reactiva automáticamente

---

**¿Preguntas sobre los ejemplos?** Avísame.
