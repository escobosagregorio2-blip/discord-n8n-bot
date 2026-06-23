# 📊 Google Sheets como Tool en n8n — Base de Conocimiento Trading Miami

Esta guía documenta la base de conocimiento en Google Sheets y cómo quedó
conectada como **tool** del **AI Agent** en el workflow de n8n del bot de soporte
de Discord.

---

## 1. El Google Sheet

| Dato | Valor |
|---|---|
| **Nombre** | `Trading Miami Bot - Base de Conocimiento` |
| **Spreadsheet ID** | `1URRuAxBphXLNepwf5aRYr-8OjUtFrhBM-ArzJqGzbHY` |
| **Pestaña (hoja)** | `Hoja 1` (gid=0) |
| **Estructura** | `Tema` \| `Pregunta` \| `Respuesta` |
| **Filas** | 22 preguntas + 1 fila de encabezado |
| **URL** | https://docs.google.com/spreadsheets/d/1URRuAxBphXLNepwf5aRYr-8OjUtFrhBM-ArzJqGzbHY/edit |

Los datos provienen de la pestaña **"Base de Conocimiento"** del archivo
`TRADING_MIAMI_BOT_DATABASE.xlsx` (Capital Flow Trader, cuentas $25K–$150K,
reglas del challenge, Trading Miami School, plataformas DeepChart Web /
Volumétrica, mercados MNQ/NQ).

### ⚠️ Compartir públicamente (paso manual del usuario)

Por seguridad **no modifico permisos de uso compartido automáticamente**. Para
obtener el link público compartible, hazlo tú en 4 pasos:

1. Abre el Sheet (URL de arriba).
2. Botón **"Compartir"** (arriba a la derecha).
3. En **"Acceso general"** cambia de *"Restringido"* a
   **"Cualquier persona con el enlace"** → rol **"Lector"** (Viewer).
4. **"Copiar enlace"** → ese es tu link compartible.

> **Nota importante:** para que n8n lea el Sheet **NO hace falta que sea público**.
> n8n se autentica con la credencial OAuth `Google Sheets account` (la cuenta
> dueña del archivo), así que el bot ya puede leerlo aunque siga privado. El
> link público es solo para tu comodidad / compartir con el equipo.

---

## 2. Cómo quedó el workflow en n8n

**Workflow:** `Discord Support Bot` (ID `GcQdR0TS6QvzgLCU`) — **ya actualizado y publicado**.

```
Discord Ticket Webhook
        │
        ▼
Validate Webhook Secret  (IF: x-webhook-secret)
        │ (true)
        ▼
     AI Agent ──────────── ai_languageModel ──── OpenAI Chat Model (gpt-4o-mini)
        │      └────────── ai_tool ───────────── Buscar en Base de Conocimiento  ◀── NUEVO
        ▼
  Reply in Discord  (POST a Discord)
```

El nodo nuevo **"Buscar en Base de Conocimiento"** es un
`Google Sheets Tool` (no un nodo lineal). Está conectado al **input `ai_tool`**
del AI Agent. Esto significa que **el propio AI Agent decide cuándo consultar la
base de conocimiento** según la pregunta del usuario — es la forma moderna y
recomendada (mejor que un nodo fijo "antes de OpenAI", porque el agente
solo busca cuando lo necesita y razona sobre los resultados).

### Configuración del nodo `Buscar en Base de Conocimiento`

| Campo | Valor |
|---|---|
| Tipo de nodo | `Google Sheets Tool` (n8n-nodes-base.googleSheetsTool v4.7) |
| Credencial | `Google Sheets account` (OAuth2, ya existente) |
| Resource | `Sheet` |
| Operation | `Read` (Retrieve rows) |
| Document | By ID → `1URRuAxBphXLNepwf5aRYr-8OjUtFrhBM-ArzJqGzbHY` |
| Sheet | `Hoja 1` (gid=0) |
| Tool Description | (texto que le dice al agente cuándo y para qué usar la tool) |

**Tool Description configurada:**

> "Base de conocimiento oficial de Trading Miami School y Capital Flow Trader.
> Devuelve preguntas frecuentes con sus respuestas verificadas (columnas: Tema,
> Pregunta, Respuesta). Usa SIEMPRE esta herramienta antes de responder para
> obtener información exacta sobre precios, cuentas fondeadas, reglas del
> challenge, plataformas (DeepChart Web, Volumétrica), mercados y soporte. No
> inventes datos: si no está aquí, indica que derivarás a soporte humano."

### System Message del AI Agent (actualizado)

Se añadió una sección **HERRAMIENTA OBLIGATORIA** que ordena al agente llamar a
`Buscar en Base de Conocimiento` antes de responder cualquier consulta sobre
precios, cuentas, reglas, plataformas o mercados, dando prioridad absoluta a la
base de conocimiento sobre su conocimiento previo, y prohibiendo inventar datos.

---

## 3. Cómo funciona la búsqueda

1. Llega un ticket de Discord al webhook → se valida el secreto.
2. El AI Agent recibe la pregunta (`{{ $json.body.message }}`).
3. El agente, guiado por el system message y la *tool description*, **invoca la
   tool de Google Sheets**, que lee las filas de la `Hoja 1`.
4. Con la operación `Read` (sin filtro) la tool devuelve **todas las filas**
   (Tema/Pregunta/Respuesta). Como solo hay 22 preguntas, esto es liviano y
   permite al agente hacer **matching semántico** sobre todo el contenido
   (entiende sinónimos y errores de ortografía, no requiere coincidencia exacta).
5. El agente redacta la respuesta basándose en la fila más relevante y responde
   en el canal de Discord vía el nodo `Reply in Discord`.

> **Búsqueda exacta opcional:** si en el futuro la base crece a cientos de filas
> y quieres limitar lo que se lee, abre el nodo y en **Filters** añade
> `lookupColumn = Tema` (o `Pregunta`) con un `lookupValue` por expresión. Para
> 22 filas no es necesario y traer todo da mejores resultados al LLM.

---

## 4. Cómo replicar / re-conectar la tool manualmente (si hiciera falta)

1. Abre el workflow `Discord Support Bot` en n8n.
2. En el nodo **AI Agent**, en la sección **Tool**, click en **+**.
3. Busca y elige **Google Sheets Tool**.
4. Credencial: **Google Sheets account** (OAuth2).
5. Resource: **Sheet** · Operation: **Read (Get Rows)**.
6. Document → **By ID** → pega `1URRuAxBphXLNepwf5aRYr-8OjUtFrhBM-ArzJqGzbHY`.
7. Sheet → **Hoja 1**.
8. En **Tool Description** pega el texto del punto 2.
9. **Save** y **Publish** el workflow.

---

## 5. Mantenimiento

- **Para añadir o editar preguntas:** edita directamente el Google Sheet
  (columnas Tema / Pregunta / Respuesta). El bot toma los cambios al instante en
  la siguiente consulta — no hay que tocar n8n ni re-desplegar nada.
- **No** dejes celdas con fórmulas en las columnas de texto; usa texto plano.
- Mantén la fila 1 como encabezado (`Tema`, `Pregunta`, `Respuesta`).

---

_Última actualización: 2026-06-10 · Workflow publicado con la tool activa._
