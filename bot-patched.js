const { Client } = require('discord.js-selfbot-v13');
const dotenv = require('dotenv');
const config = require('./config.json');
const { spawn } = require('child_process');

dotenv.config();

const client = new Client();

// Monkey-patch to fix null reference error
try {
  const ClientUserSettingManager = require('discord.js-selfbot-v13/src/managers/ClientUserSettingManager');
  const originalPatch = ClientUserSettingManager.prototype._patch;
  
  ClientUserSettingManager.prototype._patch = function(data) {
    if (data && !data.friend_source_flags) {
      data.friend_source_flags = { all: false, mutual_friends: false };
    }
    return originalPatch.call(this, data);
  };
  
  console.log('✅ Null reference patch applied');
} catch (err) {
  console.log('⚠️ Patch warning:', err.message);
}

function hasPermission(userId) {
  return config.whitelist.includes(userId);
}

client.on('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  console.log(`🎮 Selfbot is running`);
  console.log(`👑 Owner ID: ${config.ownerID}`);
  console.log(`📋 Whitelist: ${config.whitelist.length} user(s)\n`);
  setPresence();
  setInterval(setPresence, 10000);
});

function setPresence() {
  const activities = config.activities;
  const randomActivity = activities[Math.floor(Math.random() * activities.length)];
  client.user.setPresence({
    activities: [randomActivity],
    status: 'online'
  }).catch(err => console.error('Error setting presence:', err));
}

client.on('messageCreate', async (message) => {
  if (message.author.id !== client.user.id) return;
  if (!message.content.startsWith(config.prefix)) return;
  
  const args = message.content.slice(config.prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  const authorId = message.author.id;
  
  if (!hasPermission(authorId)) {
    await message.edit(`❌ You don't have permission!`);
    return;
  }
  
  if (command === 'stream') {
    const gameName = args.join(' ') || 'Streaming in Violet';
    await client.user.setPresence({
      activities: [{ name: gameName, type: 'STREAMING', url: 'https://twitch.tv/yourchannelname' }],
      status: 'online'
    });
    await message.edit(`🎮 Now streaming: ${gameName}`);
  }
  
  if (command === 'play') {
    const gameName = args.join(' ') || 'a game';
    await client.user.setPresence({
      activities: [{ name: gameName, type: 'PLAYING' }],
      status: 'online'
    });
    await message.edit(`🎮 Now playing: ${gameName}`);
  }
  
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
});

client.on('error', (err) => console.error('❌ Client error:', err));
process.on('unhandledRejection', (err) => console.error('❌ Unhandled rejection:', err));
client.login(process.env.DISCORD_TOKEN);
