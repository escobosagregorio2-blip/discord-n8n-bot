# Dockerfile para Discord Bot en Easypanel
# Usa Node.js oficial como imagen base

FROM node:18-alpine
          

# Establecer directorio de trabajocommit
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install --production

# Copiar el resto del código
COPY . .

# Comando para iniciar el bot
# Copiar y ejecutar script de entrada que genera .env dinámicamente
RUN cat > /app/entrypoint.sh << 'EOF'
#!/bin/bash
cat > /app/.env << ENV_EOF
DISCORD_TOKEN=${DISCORD_TOKEN}
N8N_WEBHOOK_URL=${N8N_WEBHOOK_URL}
N8N_WEBHOOK_SECRET=${N8N_WEBHOOK_SECRET}
ESCALATION_CHANNEL_ID=${ESCALATION_CHANNEL_ID}
SUPPORT_ROLE_ID=${SUPPORT_ROLE_ID}
DISCORD_GUILD_ID=${DISCORD_GUILD_ID}
HUMAN_HANDLING_TTL_MS=${HUMAN_HANDLING_TTL_MS}
ESCALATION_COOLDOWN_SECONDS=${ESCALATION_COOLDOWN_SECONDS}
env_EOF
exec node bot.js
EOF
RUN chmod +x /app/entrypoint.sh
ENTRYPOINT ["/app/entrypoint.sh"]
