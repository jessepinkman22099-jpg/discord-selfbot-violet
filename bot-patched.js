const { Client, MessageEmbed } = require('discord.js-selfbot-v13');
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
  
  console.log('Null reference patch applied');
} catch (err) {
  console.log('Patch warning:', err.message);
}

function hasPermission(userId) {
  return config.whitelist.includes(userId);
}

client.on('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  console.log(`Selfbot is running`);
  console.log(`Owner ID: ${config.ownerID}`);
  console.log(`Whitelist: ${config.whitelist.length} user(s)\n`);
  
  setPresence();
  setInterval(setPresence, 10000);
  
  // Ping owner when bot comes online
  try {
    const owner = await client.users.fetch(config.ownerID);
    owner.send(`Selfbot is now online`);
  } catch (err) {
    console.log('Could not fetch owner');
  }
});

function setPresence() {
  const activities = config.activities;
  const randomActivity = activities[Math.floor(Math.random() * activities.length)];
  client.user.setPresence({
    activities: [randomActivity],
    status: 'online'
  });
}

async function runMaigreatSearch(username) {
  return new Promise(async (resolve, reject) => {
    const maigretProcess = spawn('maigret', [username, '--json']);
    let output = '';
    
    maigretProcess.stdout.on('data', (data) => { output += data.toString(); });
    
    maigretProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Maigret process exited with code ${code}`));
        return;
      }
      try {
        const results = JSON.parse(output);
        resolve(results);
      } catch (e) {
        reject(new Error(`Failed to parse Maigret output`));
      }
    });
    
    setTimeout(() => {
      maigretProcess.kill();
      reject(new Error('Maigret search timed out'));
    }, 60000);
  });
}

function formatMaigreatResults(results, username) {
  if (!results || Object.keys(results).length === 0) {
    return 'No results found.';
  }
  
  let foundCount = 0;
  let foundSites = [];
  
  for (const [site, data] of Object.entries(results)) {
    if (data.exists === true) {
      foundSites.push({ site, url: data.url || 'N/A' });
      foundCount++;
    }
  }
  
  let formatted = `Search Results for: ${username}\n`;
  formatted += `Found on ${foundCount} platform(s)\n\n`;
  
  if (foundCount === 0) {
    formatted = `No accounts found on any tracked platforms.`;
  } else {
    foundSites.forEach((item, index) => {
      formatted += `[${index + 1}] ${item.site}\n    ${item.url}\n\n`;
    });
  }
  
  return formatted;
}

client.on('messageCreate', async (message) => {
  if (!message.content.startsWith(config.prefix)) return;
  
  const args = message.content.slice(config.prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  const authorId = message.author.id;
  
  if (!hasPermission(authorId)) {
    return;
  }
  
  if (command === 'help') {
    try {
      await message.delete();
    } catch (err) {
      console.log('Could not delete message');
    }
    return;
  }
  
  if (command === 'stream') {
    const gameName = args.join(' ') || 'Streaming';
    await client.user.setPresence({
      activities: [{ name: gameName, type: 'STREAMING' }],
      status: 'online'
    });
  }
  
  if (command === 'play') {
    const gameName = args.join(' ') || 'a game';
    await client.user.setPresence({
      activities: [{ name: gameName, type: 'PLAYING' }],
      status: 'online'
    });
  }
  
  if (command === 'watch') {
    const content = args.join(' ') || 'something';
    await client.user.setPresence({
      activities: [{ name: content, type: 'WATCHING' }],
      status: 'online'
    });
  }
  
  if (command === 'listen') {
    const content = args.join(' ') || 'music';
    await client.user.setPresence({
      activities: [{ name: content, type: 'LISTENING' }],
      status: 'online'
    });
  }
  
  if (command === 'status') {
    const statusArg = args[0]?.toLowerCase();
    const validStatuses = ['online', 'idle', 'dnd', 'invisible'];
    if (validStatuses.includes(statusArg)) {
      await client.user.setStatus(statusArg);
    }
  }
  
  if (command === 'osint' || command === 'search') {
    const username = args[0];
    if (!username) {
      return;
    }
    
    try {
      const results = await runMaigreatSearch(username);
      const formattedResults = formatMaigreatResults(results, username);
      
      const embed = new MessageEmbed()
        .setTitle(`OSINT Search Results`)
        .setDescription(formattedResults)
        .setColor('#2F3136')
        .setTimestamp();
      
      await message.channel.send({ embeds: [embed] });
    } catch (error) {
      const errorEmbed = new MessageEmbed()
        .setTitle(`Search Error`)
        .setDescription(`Error: ${error.message}`)
        .setColor('#2F3136');
      
      await message.channel.send({ embeds: [errorEmbed] });
    }
  }
});

client.on('error', (err) => console.error('Client error:', err));
process.on('unhandledRejection', (err) => console.error('Unhandled rejection:', err));

// Use DISCORD_TOKEN_MAIN from .env
const token = process.env.DISCORD_TOKEN_MAIN;
if (!token) {
  console.error('Error: DISCORD_TOKEN_MAIN not found in .env file');
  process.exit(1);
}

client.login(token);
