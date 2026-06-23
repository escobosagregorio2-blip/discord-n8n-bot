import discord
from discord.ext import commands
import openai
import logging
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configuración de logs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuración desde .env
DISCORD_TOKEN = os.getenv("DISCORD_TOKEN")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GUILD_ID = int(os.getenv("GUILD_ID", "1512616856043782277"))

# Validar que tengamos los secretos
if not DISCORD_TOKEN:
    raise ValueError("❌ DISCORD_TOKEN no encontrado en .env")
if not OPENAI_API_KEY:
    raise ValueError("❌ OPENAI_API_KEY no encontrado en .env")

# Configurar OpenAI
openai.api_key = OPENAI_API_KEY

# Intents
intents = discord.Intents.default()
intents.message_content = True
intents.messages = True

# Bot
bot = commands.Bot(command_prefix="!", intents=intents)

@bot.event
async def on_ready():
    logger.info(f"✅ Bot conectado como {bot.user}")
    logger.info(f"🎫 Escuchando en canales de tickets (ticket-*)")
    logger.info(f"📚 Usando OpenAI GPT-4o-mini para respuestas")

@bot.event
async def on_message(message):
    # Ignorar mensajes del bot
    if message.author.bot:
        return

    # SOLO procesar mensajes en canales que comienzan con "ticket-"
    if not message.channel.name.startswith("ticket-"):
        return

    logger.info(f"📨 Mensaje en {message.channel.name}: {message.author.name} - {message.content[:50]}")

    try:
        # Mostrar que el bot está escribiendo
        async with message.channel.typing():
            # Llamar a OpenAI
            response = openai.ChatCompletion.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "Eres un bot de soporte técnico amigable para Trading Miami School. Responde de forma concisa y profesional. Si no sabes algo, di que escalarás a un humano. Máximo 200 caracteres."
                    },
                    {
                        "role": "user",
                        "content": message.content
                    }
                ],
                max_tokens=100,
                temperature=0.7
            )

            # Extraer respuesta
            bot_response = response.choices[0].message.content

            # Enviar respuesta a Discord
            await message.reply(bot_response)
            logger.info(f"✅ Respuesta enviada: {bot_response[:50]}")

    except Exception as e:
        logger.error(f"❌ Error al procesar mensaje: {e}")
        await message.reply("❌ Hubo un error procesando tu mensaje. Por favor intenta de nuevo.")

# Correr el bot
if __name__ == "__main__":
    try:
        logger.info("🚀 Iniciando bot...")
        bot.run(DISCORD_TOKEN)
    except Exception as e:
        logger.error(f"❌ Error fatal: {e}")
