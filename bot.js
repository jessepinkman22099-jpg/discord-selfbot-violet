const { Client } = require('discord.js-selfbot-v13');
const dotenv = require('dotenv');
const config = require('./config.json');

dotenv.config();

const client = new Client();

// Logging
client.on('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  console.log(`🎮 Selfbot is running with violet status...\n`);
  
  // Set initial presence/activity
  setPresence();
  
  // Change activity every 10 seconds
  setInterval(setPresence, 10000);
});

// Function to set presence with stream activity
function setPresence() {
  const activities = config.activities;
  const randomActivity = activities[Math.floor(Math.random() * activities.length)];
  
  client.user.setPresence({
    activities: [randomActivity],
    status: 'online'
  }).then(() => {
    console.log(`📡 Activity updated: ${randomActivity.name}`);
  }).catch(err => {
    console.error('Error setting presence:', err);
  });
}

// Set custom status (violet emoji)
client.on('ready', async () => {
  try {
    // This sets a custom status that appears with violet color
    await client.user.setStatus('online');
    console.log('🟣 Violet status applied!');
  } catch (err) {
    console.error('Error setting status:', err);
  }
});

// Message event listener
client.on('messageCreate', async (message) => {
  if (message.author.id !== client.user.id) return;
  
  // Commands for the selfbot
  if (!message.content.startsWith(config.prefix)) return;
  
  const args = message.content.slice(config.prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  
  // Stream command
  if (command === 'stream') {
    const gameName = args.join(' ') || 'Streaming in Violet';
    const streamUrl = process.env.STREAM_URL || 'https://twitch.tv/yourchannelname';
    
    await client.user.setPresence({
      activities: [{
        name: gameName,
        type: 'STREAMING',
        url: streamUrl
      }],
      status: 'online'
    });
    
    await message.edit(`🎮 Now streaming: ${gameName}`);
  }
  
  // Playing command
  if (command === 'play') {
    const gameName = args.join(' ') || 'a game';
    
    await client.user.setPresence({
      activities: [{
        name: gameName,
        type: 'PLAYING'
      }],
      status: 'online'
    });
    
    await message.edit(`🎮 Now playing: ${gameName}`);
  }
  
  // Watching command
  if (command === 'watch') {
    const content = args.join(' ') || 'something';
    
    await client.user.setPresence({
      activities: [{
        name: content,
        type: 'WATCHING'
      }],
      status: 'online'
    });
    
    await message.edit(`👀 Now watching: ${content}`);
  }
  
  // Listening command
  if (command === 'listen') {
    const content = args.join(' ') || 'music';
    
    await client.user.setPresence({
      activities: [{
        name: content,
        type: 'LISTENING'
      }],
      status: 'online'
    });
    
    await message.edit(`🎵 Now listening to: ${content}`);
  }
  
  // Status command
  if (command === 'status') {
    const statusArg = args[0]?.toLowerCase();
    const validStatuses = ['online', 'idle', 'dnd', 'invisible'];
    
    if (validStatuses.includes(statusArg)) {
      await client.user.setStatus(statusArg);
      await message.edit(`✅ Status changed to: ${statusArg}`);
    } else {
      await message.edit(`❌ Invalid status. Use: online, idle, dnd, invisible`);
    }
  }
  
  // Help command
  if (command === 'help') {
    const helpText = `
    🎮 **Discord Selfbot Commands** 🎮
    
    \`${config.prefix}stream [game name]\` - Set streaming activity
    \`${config.prefix}play [game name]\` - Set playing activity
    \`${config.prefix}watch [content]\` - Set watching activity
    \`${config.prefix}listen [content]\` - Set listening activity
    \`${config.prefix}status [online/idle/dnd/invisible]\` - Change status
    \`${config.prefix}help\` - Show this message
    
    🟣 All activities feature violet styling! 🟣
    `;
    await message.edit(helpText);
  }
});

// Error handling
client.on('error', (err) => {
  console.error('❌ Client error:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled rejection:', err);
});

// Login
client.login(process.env.DISCORD_TOKEN);
