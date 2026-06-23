# Dockerfile para Discord Bot en Easypanel
# Usa Node.js oficial como imagen base

FROM node:18-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install --production

# Copiar el resto del código
COPY . .

# Comando para iniciar el bot
# Copiar y ejecutar script de entrada que genera .env dinámicamente
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh
ENTRYPOINT ["/app/entrypoint.sh"]
