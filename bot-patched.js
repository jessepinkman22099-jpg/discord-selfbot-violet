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

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  console.log(`Selfbot is running`);
  console.log(`Owner ID: ${config.ownerID}`);
  console.log(`Whitelist: ${config.whitelist.length} user(s)\n`);
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

async function runMaigreatSearch(username, message) {
  return new Promise(async (resolve, reject) => {
    const maigretProcess = spawn('maigret', [username, '--json']);
    let output = '';
    let errorOutput = '';
    
    maigretProcess.stdout.on('data', (data) => { output += data.toString(); });
    maigretProcess.stderr.on('data', (data) => { errorOutput += data.toString(); });
    
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
  if (message.author.id !== client.user.id) return;
  if (!message.content.startsWith(config.prefix)) return;
  
  const args = message.content.slice(config.prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  const authorId = message.author.id;
  
  if (!hasPermission(authorId)) {
    await message.edit(`You don't have permission!`);
    return;
  }
  
  if (command === 'stream') {
    const gameName = args.join(' ') || 'Streaming in Violet';
    await client.user.setPresence({
      activities: [{ name: gameName, type: 'STREAMING', url: 'https://twitch.tv/yourchannelname' }],
      status: 'online'
    });
    await message.edit(`Now streaming: ${gameName}`);
  }
  
  if (command === 'play') {
    const gameName = args.join(' ') || 'a game';
    await client.user.setPresence({
      activities: [{ name: gameName, type: 'PLAYING' }],
      status: 'online'
    });
    await message.edit(`Now playing: ${gameName}`);
  }
  
  if (command === 'watch') {
    const content = args.join(' ') || 'something';
    await client.user.setPresence({
      activities: [{ name: content, type: 'WATCHING' }],
      status: 'online'
    });
    await message.edit(`Now watching: ${content}`);
  }
  
  if (command === 'listen') {
    const content = args.join(' ') || 'music';
    await client.user.setPresence({
      activities: [{ name: content, type: 'LISTENING' }],
      status: 'online'
    });
    await message.edit(`Now listening to: ${content}`);
  }
  
  if (command === 'status') {
    const statusArg = args[0]?.toLowerCase();
    const validStatuses = ['online', 'idle', 'dnd', 'invisible'];
    if (validStatuses.includes(statusArg)) {
      await client.user.setStatus(statusArg);
      await message.edit(`Status changed to: ${statusArg}`);
    } else {
      await message.edit(`Invalid status. Use: online, idle, dnd, invisible`);
    }
  }
  
  if (command === 'osint' || command === 'search') {
    const username = args[0];
    if (!username) {
      await message.edit(`Usage: ${config.prefix}osint <username>`);
      return;
    }
    
    await message.edit(`Scanning for: ${username}\nRunning Maigret...`);
    
    try {
      const results = await runMaigreatSearch(username, message);
      const formattedResults = formatMaigreatResults(results, username);
      
      const embed = new MessageEmbed()
        .setTitle(`OSINT Search Results`)
        .setDescription(formattedResults)
        .setColor('#2F3136')
        .setTimestamp();
      
      await message.edit({ embeds: [embed] });
    } catch (error) {
      const errorEmbed = new MessageEmbed()
        .setTitle(`Search Error`)
        .setDescription(`Error: ${error.message}\n\nSetup Maigret:\npip install maigret`)
        .setColor('#2F3136')
        .setTimestamp();
      
      await message.edit({ embeds: [errorEmbed] });
    }
  }
  
  if (command === 'help') {
    const helpEmbed = new MessageEmbed()
      .setTitle(`Commands`)
      .addField(`Activity`, `${config.prefix}stream\n${config.prefix}play\n${config.prefix}watch\n${config.prefix}listen\n${config.prefix}status`, false)
      .addField(`Search`, `${config.prefix}osint <username>\n${config.prefix}search <username>`, false)
      .setColor('#2F3136')
      .setTimestamp();
    
    await message.edit({ embeds: [helpEmbed] });
  }
});

client.on('error', (err) => console.error('Client error:', err));
process.on('unhandledRejection', (err) => console.error('Unhandled rejection:', err));
client.login(process.env.DISCORD_TOKEN);
