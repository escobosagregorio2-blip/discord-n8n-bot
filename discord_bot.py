import discord
import aiohttp
import asyncio
import logging
import os

# ---------------------------------------------------------------------------
# Configuration (from .env)
# ---------------------------------------------------------------------------
from dotenv import load_dotenv
load_dotenv()

DISCORD_TOKEN = os.getenv("DISCORD_TOKEN")
N8N_WEBHOOK_URL = os.getenv("N8N_WEBHOOK_URL")

# Validate required secrets
if not DISCORD_TOKEN:
    raise ValueError("❌ DISCORD_TOKEN no encontrado en .env")
if not N8N_WEBHOOK_URL:
    raise ValueError("❌ N8N_WEBHOOK_URL no encontrado en .env")

GUILD_ID = 1512616856043782277
TICKET_CHANNEL_PREFIX = "ticket-"

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Bot setup
# ---------------------------------------------------------------------------
intents = discord.Intents.default()
intents.message_content = True          # Required to read message text
intents.messages = True
intents.guilds = True                   # Required to read channel names

client = discord.Client(intents=intents)


@client.event
async def on_ready():
    log.info(f"Bot connected as {client.user} (id={client.user.id})")
    log.info(f"Listening for messages in channels starting with '{TICKET_CHANNEL_PREFIX}'")


@client.event
async def on_message(message: discord.Message):
    # --- Ignore bots (prevents loops) ---
    if message.author.bot:
        return

    # --- Only process channels whose name starts with "ticket-" ---
    if not message.channel.name.startswith(TICKET_CHANNEL_PREFIX):
        return

    payload = {
        "guild_id":    str(GUILD_ID),
        "channel_id":  str(message.channel.id),
        "channel_name": message.channel.name,
        "author":      message.author.name,
        "author_id":   str(message.author.id),
        "content":     message.content,
    }

    log.info(f"New message from {message.author.name} ({message.author.id}): {message.content[:80]}")

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                N8N_WEBHOOK_URL,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=10),
            ) as resp:
                if resp.status in (200, 201):
                    log.info(f"Webhook delivered (HTTP {resp.status})")
                else:
                    body = await resp.text()
                    log.warning(f"Webhook returned HTTP {resp.status}: {body[:200]}")
    except asyncio.TimeoutError:
        log.error("Webhook request timed out after 10 s")
    except aiohttp.ClientError as exc:
        log.error(f"Webhook request failed: {exc}")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    client.run(DISCORD_TOKEN)
