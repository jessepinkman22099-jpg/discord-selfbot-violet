# Discord Selfbot Violet 🟣

A Discord selfbot built with discord.js that features stream activity, custom status, and a violet-themed color scheme.

## Features 🎮

- ✨ **Stream Activity** - Display streaming status on Twitch/YouTube
- 🎯 **Multiple Activity Types** - Play, Watch, Listen, or Stream
- 🟣 **Violet Theming** - Violet color scheme throughout
- 📡 **Auto-Rotating Status** - Automatically cycle through activities
- 🔧 **Easy Configuration** - Simple config.json setup
- 🛡️ **Selfbot Features** - Self-bot specific commands and controls

## Requirements

- Node.js 16.0.0 or higher
- Discord account (your own user account)
- Discord token

## Installation

1. Clone the repository:
```bash
git clone https://github.com/uzmaneugene-tech/discord-selfbot-violet.git
cd discord-selfbot-violet
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```

4. Add your Discord token to `.env`:
```
DISCORD_TOKEN=your_token_here
STREAM_URL=https://twitch.tv/yourchannelname
```

## Usage

Start the bot:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Commands

| Command | Usage | Description |
|---------|-------|-------------|
| `!stream` | `!stream Game Name` | Set streaming activity |
| `!play` | `!play Game Name` | Set playing activity |
| `!watch` | `!watch Movie/Show` | Set watching activity |
| `!listen` | `!listen Song/Podcast` | Set listening activity |
| `!status` | `!status online\|idle\|dnd\|invisible` | Change account status |
| `!help` | `!help` | Show all commands |

## Configuration

Edit `config.json` to customize:

```json
{
  "prefix": "!",
  "statusColor": "#8B5CF6",
  "statusColorName": "violet",
  "streamingStatus": {
    "type": "STREAMING",
    "name": "Streaming with violet vibes",
    "url": "https://twitch.tv/yourchannelname"
  },
  "activities": [
    // Add your activities here
  ]
}
```

## Violet Color Scheme

- **Hex**: `#8B5CF6`
- **RGB**: `139, 92, 246`
- **Used throughout**: Status indicators, embeds, and UI elements

## ⚠️ Disclaimer

Selfbots are against Discord's Terms of Service. Use at your own risk. This project is for educational purposes only.

## License

MIT
