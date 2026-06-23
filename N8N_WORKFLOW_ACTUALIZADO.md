# 🧠 Actualizar n8n para usar la Memoria de Conversación (15 mensajes)

Esta guía explica **únicamente los cambios** que hay que hacer en tu workflow de n8n
ya existente (`Webhook → IF → OpenAI → HTTP Request`) para que el bot recuerde los
últimos 15 mensajes de cada canal.

> **No hay que rehacer el workflow.** Solo cambia la configuración del **nodo OpenAI**.
> El bot ahora envía un campo nuevo llamado `history` dentro del mismo POST de siempre.

---

## ¿Qué cambió en el bot?

El bot ahora incluye un array `history` en el payload del webhook:

```jsonc
{
  "message": "¿Y cómo cancelo la suscripción?",
  "userId": "123456789",
  "username": "juan",
  "channelId": "1512817445260492800",
  "channelName": "ticket-0001",
  "guildId": "...",
  "timestamp": "2026-06-10T12:00:00.000Z",
  "messageId": "987654321",

  // ▼▼▼ NUEVO ▼▼▼  (los últimos 15 mensajes PREVIOS de ese canal)
  "history": [
    { "role": "user",      "username": "juan", "userId": "123", "content": "Hola, tengo un problema con mi cuenta", "timestamp": "2026-06-10T11:58:00.000Z" },
    { "role": "assistant", "username": "SupportBot", "userId": "999", "content": "Claro, ¿qué problema tienes exactamente?", "timestamp": "2026-06-10T11:58:05.000Z" },
    { "role": "user",      "username": "juan", "userId": "123", "content": "No puedo entrar al curso premium", "timestamp": "2026-06-10T11:59:00.000Z" }
  ]
}
```

- `role` es `"user"` (mensaje de un miembro) o `"assistant"` (respuesta previa del bot).
- `history` **NO** incluye el mensaje actual (ese va en `message`).
- Si es el primer mensaje del canal, `history` llega como `[]` (array vacío).

---

## Paso 1: Abrir el nodo OpenAI

1. Abre tu workflow `Discord Support Bot` en n8n.
2. Doble click en el **nodo OpenAI** (el de Chat Completion).

Hoy probablemente tienes solo 2 mensajes configurados:

```
[ system ]  Eres un agente de soporte...
[ user   ]  {{ $json.message }}
```

Vamos a **insertar el historial entre el `system` y el `user`**.

---

## Paso 2 (RECOMENDADO): Inyectar el historial con un nodo "Code" antes de OpenAI

La forma más limpia y robusta es construir el array de mensajes con un pequeño
nodo **Code**, y pasárselo a OpenAI ya armado.

### 2.1 Agregar nodo Code

1. Entre el nodo **IF** y el nodo **OpenAI**, agrega un nodo **"Code"**
   (Search: `Code`). Conéctalo: `IF (true) → Code → OpenAI`.
2. **Mode**: `Run Once for Each Item`.
3. Pega este código:

```javascript
// Construye el array de mensajes para OpenAI con la memoria del canal.
const data = $json;

const systemPrompt =
  "Eres un agente de soporte técnico amigable para Trading Miami School. " +
  "Usa el historial de la conversación para dar respuestas con contexto y no " +
  "repetir preguntas ya respondidas. Responde de forma concisa y profesional. " +
  "Si no sabes algo, ofrece escalar a un humano. Máximo 200 caracteres.";

const messages = [{ role: "system", content: systemPrompt }];

// Historial (últimos 15 mensajes previos del canal)
const history = Array.isArray(data.history) ? data.history : [];
for (const h of history) {
  // OpenAI solo acepta los roles user/assistant/system
  const role = h.role === "assistant" ? "assistant" : "user";
  // Para los mensajes de usuario, prefijamos el nombre para que el modelo
  // distinga entre varios miembros del mismo ticket.
  const content =
    role === "user" ? `${h.username || "Usuario"}: ${h.content}` : h.content;
  messages.push({ role, content });
}

// Mensaje actual del usuario (el que dispara esta ejecución)
messages.push({
  role: "user",
  content: `${data.username || "Usuario"}: ${data.message}`,
});

// Devolvemos los datos originales + el array messages listo para OpenAI
return { json: { ...data, messages } };
```

Este código:
- Mantiene el `system prompt`.
- Recorre `history` y lo convierte en mensajes `user` / `assistant`.
- Añade el mensaje actual al final.
- Conserva `channelId` y demás campos para el nodo HTTP Request posterior.

### 2.2 Configurar el nodo OpenAI para usar `messages`

En el nodo **OpenAI**:

- **Resource**: `Chat` / **Operation**: `Message a Model` (según tu versión).
- En vez de escribir los mensajes a mano, usa la expresión que apunta al array
  que construyó el nodo Code.

**Opción A (la más simple y compatible):** elimina los mensajes manuales y, en el
campo de mensajes, activa el modo expresión (`fx`) y pon:

```
{{ $json.messages }}
```

> En algunas versiones de n8n el nodo nativo de OpenAI no permite pasar el array
> completo por expresión. Si ese es tu caso, usa la **Opción B** (abajo), que es
> la más a prueba de versiones.

---

## Paso 2 (ALTERNATIVA B): Usar HTTP Request directo a OpenAI

Si tu nodo OpenAI no acepta `{{ $json.messages }}` directamente, reemplázalo por
un nodo **HTTP Request** que llama a la API de OpenAI. Es 100% compatible y te da
control total del array `messages`.

1. Deja el nodo **Code** del Paso 2.1 tal cual (construye `messages`).
2. Sustituye el nodo OpenAI por un **HTTP Request**:
   - **Method**: `POST`
   - **URL**: `https://api.openai.com/v1/chat/completions`
   - **Authentication**: credencial **OpenAI API** (Header Auth `Authorization: Bearer <API_KEY>`)
   - **Headers**: `Content-Type: application/json`
   - **Body** (Mode: `JSON`, usar expresión):
     ```
     {{ {
       "model": "gpt-4o-mini",
       "messages": $json.messages,
       "max_tokens": 150,
       "temperature": 0.7
     } }}
     ```
3. La respuesta del modelo queda en `{{ $json.choices[0].message.content }}`
   (igual que antes), así que el nodo HTTP Request que responde a Discord **no cambia**.

---

## Paso 3: Verificar el nodo de respuesta a Discord (NO cambia)

El nodo final que postea a Discord sigue igual:

- **URL**: `https://discord.com/api/v10/channels/{{ $json.channelId }}/messages`
- **Body**:
  ```json
  {
    "content": "{{ $json.choices[0].message.content }}",
    "allowed_mentions": { "parse": [] }
  }
  ```

> ⚠️ Asegúrate de que `channelId` siga disponible en ese punto. Como el nodo Code
> hace `return { json: { ...data, messages } }`, todos los campos originales
> (incluido `channelId`) se conservan.

---

## Paso 4: Probar con contexto

1. En el **Webhook node** → **"Test Webhook"**, envía este payload (simula 2 mensajes previos):

   ```json
   {
     "message": "¿Y cuánto cuesta el premium?",
     "userId": "123456789",
     "username": "juan",
     "channelId": "TU_CHANNEL_ID_REAL",
     "channelName": "ticket-0001",
     "history": [
       { "role": "user", "username": "juan", "content": "Hola quiero info de cursos" },
       { "role": "assistant", "username": "SupportBot", "content": "¡Hola! Tenemos cursos básico y premium." }
     ]
   }
   ```

2. Ejecuta. El nodo Code debe producir un array `messages` con: `system`, los 2 del
   historial, y el actual.
3. La respuesta de OpenAI debería tener sentido **con contexto** (entender que "el
   premium" se refiere al curso premium mencionado antes).

---

## Resumen de cambios

| Nodo | ¿Cambia? | Qué hacer |
|---|---|---|
| Webhook | No | Sigue recibiendo el POST (ahora trae `history`) |
| IF (secreto) | No | Igual |
| **Code (nuevo)** | ✅ Agregar | Construye el array `messages` con el historial |
| OpenAI / HTTP a OpenAI | ✅ Ajustar | Usar `{{ $json.messages }}` en vez de mensajes fijos |
| HTTP Request a Discord | No | Igual (`channelId` + `choices[0].message.content`) |

No se requieren cambios de variables de entorno ni de EasyPanel.
El array siempre trae como máximo 15 mensajes, así que el costo de tokens está acotado.
