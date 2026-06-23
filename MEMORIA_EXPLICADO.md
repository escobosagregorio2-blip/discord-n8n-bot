# 🧠 Cómo Funciona la Memoria de Conversación

Este documento explica el sistema de memoria que se agregó al bot de Discord
(`index.js`) para que recuerde los **últimos 15 mensajes de cada canal** y dé
respuestas con contexto.

---

## 1. Qué hace, en una frase

> Cada canal de ticket tiene su propia "libreta" con los últimos 15 mensajes.
> Cuando llega un mensaje nuevo, el bot adjunta esa libreta al envío a n8n, para
> que OpenAI responda teniendo en cuenta lo que ya se habló.

---

## 2. Dónde se guarda la memoria

- **En RAM** (un `Map` de JavaScript) → acceso instantáneo mientras el bot corre.
- **En un archivo JSON local** (`conversation_memory.json`, junto a `index.js`) →
  para sobrevivir reinicios suaves del proceso.

No se usa ninguna base de datos externa (ni Postgres, ni Redis, ni MongoDB).
Esto cumple el requisito de **simplicidad** y de funcionar en **EasyPanel sin
cambios de configuración**: el archivo se crea solo la primera vez.

> 🔸 Si EasyPanel recrea el contenedor desde cero (filesystem efímero), el archivo
> desaparece y la memoria arranca vacía. **Eso es aceptable** según los requisitos
> (la persistencia no es crítica). El historial se reconstruye solo con los
> siguientes mensajes.

---

## 3. Estructura de los datos

En memoria es un `Map`:

```
channelId  ->  [ entry, entry, ... ]   (máximo 15 por canal)
```

Cada `entry` es:

```jsonc
{
  "role": "user",            // "user" = miembro | "assistant" = respuesta del bot
  "username": "juan",        // nombre visible de Discord
  "userId": "123456789",     // ID del autor
  "content": "No puedo entrar al curso premium",
  "timestamp": "2026-06-10T12:00:00.000Z"
}
```

Incluye exactamente lo pedido: **usuario, contenido y timestamp** (más el rol e ID
para que OpenAI distinga quién habló).

El archivo en disco es simplemente ese Map serializado:

```json
{
  "1512817445260492800": [ { "role": "user", ... }, { "role": "assistant", ... } ],
  "1512817445260492801": [ ... ]
}
```

---

## 4. El ciclo completo de un mensaje

```
Usuario escribe en #ticket-001
        │
        ▼
[index.js] messageCreate
        │
        ├─ 1) getHistory(channelId)   → lee los 15 previos (SIN el actual)
        │
        ├─ 2) addToMemory(channelId)  → guarda el mensaje actual (role: "user")
        │                                y persiste a disco
        │
        ├─ 3) payload.history = historial   → adjunta los previos al POST
        │
        ▼
   n8n Webhook  →  Code (arma messages)  →  OpenAI (con contexto)  →  Discord
        │
        ▼
El bot responde en #ticket-001
        │
        ▼
[index.js] messageCreate (su propio mensaje)
        └─ addToMemory(channelId, role: "assistant")  → recuerda su respuesta
```

**Punto clave:** primero se lee el historial *previo* (paso 1) y **después** se
guarda el mensaje actual (paso 2). Así n8n recibe los mensajes anteriores como
contexto, y el mensaje nuevo va por separado en el campo `message`.

---

## 5. ¿Cómo recuerda también las respuestas del bot?

Cuando n8n postea la respuesta en Discord, ese mensaje lo escribe **el propio
bot**. Discord le reenvía ese evento `messageCreate` al bot. Normalmente el bot
ignora los mensajes de bots, pero ahora hay una excepción:

- Si el autor del mensaje es **este mismo bot** y el canal es de tipo ticket,
  se guarda en memoria con `role: "assistant"`.
- Cualquier **otro** bot se sigue ignorando.

Resultado: la libreta del canal queda como un diálogo real
(`user → assistant → user → assistant …`), que es justo lo que OpenAI necesita
para mantener el hilo.

---

## 6. Por qué es "thread-safe" (un usuario a la vez)

Node.js ejecuta JavaScript en **un solo hilo**, así que `addToMemory` y
`getHistory` nunca corren "a la mitad" de otra llamada: cada una termina antes de
empezar la siguiente. No hay condiciones de carrera sobre el `Map`.

El único punto realmente asíncrono es **escribir a disco**. Para evitar que dos
escrituras se pisen (y dejen el archivo a medias), se usan dos protecciones:

1. **Cola serializada (`writeChain`)**: las escrituras se encadenan con promesas,
   así que siempre se ejecutan **una después de la otra**, nunca en paralelo.
2. **Escritura atómica**: se escribe primero a `conversation_memory.json.tmp` y
   luego se hace `rename` al archivo final. El `rename` es atómico a nivel de
   sistema de archivos, así que nunca queda un JSON corrupto a medio escribir.
3. **Coalescing**: si llegan muchos mensajes seguidos, no se encola una escritura
   por cada uno; se agrupa para no saturar el disco.

---

## 7. El límite de 15 mensajes

Cada vez que se agrega un mensaje:

```js
entries.push(entry);
if (entries.length > MAX_HISTORY) {
  entries.splice(0, entries.length - MAX_HISTORY); // descarta los más viejos
}
```

Es una ventana deslizante: siempre se conservan los **15 más recientes** por canal.
Esto también acota el costo de tokens en OpenAI (nunca se manda un historial gigante).

Para cambiar el tamaño, edita una sola constante en `index.js`:

```js
const MAX_HISTORY = 15;
```

---

## 8. Qué pasa al reiniciar el bot

Al arrancar, `loadMemory()`:

1. Si **no existe** el archivo → arranca vacío y lo dirá en el log:
   `🧠 Memoria: archivo no existe, arrancando vacío.`
2. Si **existe** → lo carga, recorta cada canal a 15 por seguridad, y lo dirá:
   `🧠 Memoria cargada: N canal(es) recuperado(s).`
3. Si el archivo está **corrupto** → lo ignora y arranca vacío (sin crashear).

---

## 9. Comportamiento ante errores (no rompe el bot)

- Si falla **guardar** la memoria → solo se escribe un warning
  (`⚠️ No se pudo guardar la memoria`). El bot sigue respondiendo; solo se pierde
  la persistencia de ese momento.
- Si falla **cargar** la memoria → arranca vacío. No es crítico.

La memoria es un "nice to have" para el contexto, nunca un punto de fallo que
tumbe el bot.

---

## 10. Archivos involucrados

| Archivo | Rol |
|---|---|
| `index.js` | Lógica de memoria (cargar, guardar, leer historial, adjuntar al payload) |
| `conversation_memory.json` | Estado persistido (se crea solo; está en `.gitignore`) |
| `N8N_WORKFLOW_ACTUALIZADO.md` | Cómo hacer que n8n use el `history` como contexto en OpenAI |

---

## 11. Logs que verás en producción

```
🧠 Memoria cargada: 3 canal(es) recuperado(s).
...
📨 MENSAJE RECIBIDO
   Canal: #ticket-0001
   🧠 Historial adjunto: 4 mensaje(s) previo(s)
   📤 Enviando a n8n...
   ✅ Enviado a n8n (HTTP 200)
```

El renglón `🧠 Historial adjunto: N mensaje(s) previo(s)` confirma que la memoria
está viajando a n8n correctamente.
