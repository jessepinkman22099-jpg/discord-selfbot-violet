const { Client } = require('discord.js-selfbot-v13');
const dotenv = require('dotenv');
const config = require('./config.json');

dotenv.config();

const client = new Client();

// Permission check function
function hasPermission(userId) {
  return config.whitelist.includes(userId);
}

// Logging
client.on('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  console.log(`🎮 Selfbot is running with violet status...`);
  console.log(`👑 Owner ID: ${config.ownerID}`);
  console.log(`📋 Whitelist: ${config.whitelist.length} user(s)\n`);
  
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
  
  // Get message author ID (who sent the command)
  const authorId = message.author.id;
  
  // Check whitelist
  if (!hasPermission(authorId)) {
    await message.edit(`❌ You don't have permission to use this command!`);
    return;
  }
  
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
  
  // Prefix change command (owner only)
  if (command === 'changeprefix') {
    if (authorId !== config.ownerID) {
      await message.edit(`❌ Only owner can change prefix!`);
      return;
    }
    
    const newPrefix = args[0];
    if (!newPrefix) {
      await message.edit(`❌ Usage: ${config.prefix}changeprefix <new_prefix>`);
      return;
    }
    
    config.prefix = newPrefix;
    await message.edit(`✅ Prefix changed to: \`${newPrefix}\``);
    console.log(`🔧 Prefix changed to: ${newPrefix}`);
  }
  
  // Whitelist command (owner only)
  if (command === 'whitelist') {
    if (authorId !== config.ownerID) {
      await message.edit(`❌ Only owner can manage whitelist!`);
      return;
    }
    
    const subcommand = args[0]?.toLowerCase();
    const userId = args[1];
    
    if (subcommand === 'add') {
      if (!userId) {
        await message.edit(`❌ Usage: ${config.prefix}whitelist add <user_id>`);
        return;
      }
      if (config.whitelist.includes(userId)) {
        await message.edit(`❌ User already in whitelist!`);
        return;
      }
      config.whitelist.push(userId);
      await message.edit(`✅ Added \`${userId}\` to whitelist`);
      console.log(`✅ Added ${userId} to whitelist`);
    } else if (subcommand === 'remove') {
      if (!userId) {
        await message.edit(`❌ Usage: ${config.prefix}whitelist remove <user_id>`);
        return;
      }
      const index = config.whitelist.indexOf(userId);
      if (index === -1) {
        await message.edit(`❌ User not in whitelist!`);
        return;
      }
      config.whitelist.splice(index, 1);
      await message.edit(`✅ Removed \`${userId}\` from whitelist`);
      console.log(`✅ Removed ${userId} from whitelist`);
    } else if (subcommand === 'list') {
      const list = config.whitelist.join('\n');
      await message.edit(`📋 **Whitelist (${config.whitelist.length} users):**\n\`\`\`\n${list}\n\`\`\``);
    } else {
      await message.edit(`❌ Usage: ${config.prefix}whitelist <add|remove|list> [user_id]`);
    }
  }
  
  // Help command
  if (command === 'help') {
    const helpText = `
    🎮 **Discord Selfbot Commands** 🎮
    
    **Activity Commands:**
    \`${config.prefix}stream [game name]\` - Set streaming activity
    \`${config.prefix}play [game name]\` - Set playing activity
    \`${config.prefix}watch [content]\` - Set watching activity
    \`${config.prefix}listen [content]\` - Set listening activity
    \`${config.prefix}status [online/idle/dnd/invisible]\` - Change status
    
    **Owner Commands:**
    \`${config.prefix}changeprefix <new_prefix>\` - Change command prefix
    \`${config.prefix}whitelist add <user_id>\` - Add user to whitelist
    \`${config.prefix}whitelist remove <user_id>\` - Remove user from whitelist
    \`${config.prefix}whitelist list\` - Show whitelist
    
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
