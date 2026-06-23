# GitHub Setup - Paso a Paso

## Objetivo
Subir el código del bot a GitHub para que EasyPanel pueda deployarlo.

---

## Paso 1: Crear Cuenta en GitHub (si no tienes)

1. Ve a https://github.com/signup
2. Crea una cuenta con un email
3. Verifica tu email
4. Listo

---

## Paso 2: Instalar Git en tu PC

### Windows:
1. Ve a https://git-scm.com/download/win
2. Descarga y ejecuta el instalador
3. Sigue los pasos (usa opciones por defecto)

### Mac:
```bash
brew install git
```

### Linux:
```bash
sudo apt-get install git
```

Verifica que funciona:
```bash
git --version
```

---

## Paso 3: Configurar Git por Primera Vez

```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu-email@example.com"
```

Usa el mismo email que en GitHub.

---

## Paso 4: Crear Repositorio en GitHub

1. Ve a https://github.com/new
2. **Repository name**: `discord-n8n-bot`
3. **Description**: "Discord bot connected to n8n for ticket support"
4. **Visibility**: **Public** (importante para EasyPanel)
5. Click en "Create repository"

---

## Paso 5: Crear Carpeta Local y Clonar

### Windows (PowerShell):
```powershell
# Navega a donde quieras guardar el código
cd C:\Users\TuUsuario\Desktop

# Clona el repo
git clone https://github.com/tu-usuario/discord-n8n-bot.git

# Entra a la carpeta
cd discord-n8n-bot
```

### Mac/Linux:
```bash
cd ~/Desktop
git clone https://github.com/tu-usuario/discord-n8n-bot.git
cd discord-n8n-bot
```

---

## Paso 6: Copiar los Archivos del Bot

Copia estos archivos a la carpeta `discord-n8n-bot`:

```
discord-n8n-bot/
├── index.js
├── package.json
├── Dockerfile
├── .gitignore
├── .env.example
└── README.md
```

Los archivos están en: `C:\Users\Usuario\claude\Projects\TRADINGMIAMISCHOOL 2\`

---

## Paso 7: Crear .gitignore

En la carpeta `discord-n8n-bot`, crea un archivo llamado `.gitignore`:

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
npm-debug.log*
```

---

## Paso 8: Crear .env.example

Crea un archivo `.env.example` (sin valores reales):

```env
# Template - copia a .env y rellena con tus valores
DISCORD_TOKEN=your_discord_token_here
N8N_WEBHOOK_URL=https://ud046x.easypanel.host/webhook/discord-ticket
```

---

## Paso 9: Crear README.md

Crea `README.md`:

```markdown
# Discord n8n Support Bot

Bot de Discord que conecta con n8n para procesamiento automático de soporte por tickets.

## Requisitos
- Node.js 18+
- Discord Bot Token
- n8n Webhook URL

## Setup Local

```bash
npm install
DISCORD_TOKEN=your_token npm start
```

## Deploy en EasyPanel

Ver: EASYPANEL_DEPLOY_GUIA.md

## Features
- Escucha canales de ticket en Discord
- Envía mensajes a n8n vía webhook
- n8n procesa con IA y responde automáticamente
- Corre 24/7 en EasyPanel
```

---

## Paso 10: Subir a GitHub

### Terminal/PowerShell:

```bash
# Navega a la carpeta
cd discord-n8n-bot

# Verifica que están todos los archivos
git status
# Deberías ver: index.js, package.json, Dockerfile, .gitignore, .env.example, README.md

# Agrega todos los archivos
git add .

# Crea un commit
git commit -m "Initial commit: Discord bot para n8n"

# Sube a GitHub
git push origin main
```

### Verifica que funcionó:

1. Ve a https://github.com/tu-usuario/discord-n8n-bot
2. Deberías ver todos los archivos en la página

---

## Paso 11: Generar Personal Access Token (Para EasyPanel)

1. Ve a https://github.com/settings/tokens
2. Click en "Generate new token" → "Generate new token (classic)"
3. **Token name**: `easypanel-access`
4. **Expiration**: "No expiration" (o elige una fecha)
5. **Scopes**: Selecciona `repo` (acceso a repositorios)
6. Click en "Generate token"
7. **Copia el token** (solo lo verás una vez)

Este token lo usarás en EasyPanel para conectar con GitHub.

---

## Checklist GitHub

- [ ] Cuenta de GitHub creada
- [ ] Git instalado en tu PC
- [ ] Repositorio creado: `discord-n8n-bot`
- [ ] Repositorio clonado localmente
- [ ] Archivos copiados a la carpeta
- [ ] `.gitignore` creado
- [ ] `.env.example` creado
- [ ] `README.md` creado
- [ ] `git add .` ejecutado
- [ ] `git commit -m "..."` ejecutado
- [ ] `git push origin main` ejecutado
- [ ] Archivos visibles en GitHub.com
- [ ] Personal Access Token generado

---

## Próximo Paso

Una vez que todo esté en GitHub, sigue: `EASYPANEL_DEPLOY_GUIA.md`
