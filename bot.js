const { Client } = require('discord.js-selfbot-v13');
const dotenv = require('dotenv');
const config = require('./config.json');
const { spawn } = require('child_process');

dotenv.config();

const client = new Client();

function hasPermission(userId) {
  return config.whitelist.includes(userId);
}

client.on('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  console.log(`🎮 Selfbot is running with violet status...`);
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
  }).then(() => {
    console.log(`📡 Activity updated: ${randomActivity.name}`);
  }).catch(err => console.error('Error setting presence:', err));
}

client.on('ready', async () => {
  try {
    await client.user.setStatus('online');
    console.log('🟣 Violet status applied!');
  } catch (err) {
    console.error('Error setting status:', err);
  }
});

async function runMaigreatSearch(username, message) {
  return new Promise(async (resolve, reject) => {
    const maigretProcess = spawn('maigret', [username, '--json']);
    let output = '';
    let errorOutput = '';
    let updateCount = 0;
    const updateInterval = setInterval(async () => {
      try {
        if (output.length > 0) {
          updateCount++;
          if (updateCount % 3 === 0) {
            await message.edit(`🔍 **Scanning: ${username}**\n⏳ Checking platforms... (${updateCount} checks)\n\n📡 Maigret running...`).catch(() => {});
          }
        }
      } catch (e) {}
    }, 2000);
    
    maigretProcess.stdout.on('data', (data) => { output += data.toString(); });
    maigretProcess.stderr.on('data', (data) => { errorOutput += data.toString(); });
    
    maigretProcess.on('close', (code) => {
      clearInterval(updateInterval);
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
      clearInterval(updateInterval);
      maigretProcess.kill();
      reject(new Error('Maigret search timed out'));
    }, 60000);
  });
}

function formatMaigreatResults(results, username) {
  let formatted = `\`\`\`
╔════════════════════════════════════════╗
║         OSINT SEARCH RESULTS           ║
║  Username: ${username.padEnd(32)}║
╚════════════════════════════════════════╝
\`\`\`\n`;
  
  if (!results || Object.keys(results).length === 0) {
    return formatted + '❌ No results found.';
  }
  
  let foundCount = 0;
  let foundSites = [];
  
  for (const [site, data] of Object.entries(results)) {
    if (data.exists === true) {
      foundSites.push({ site, url: data.url || 'N/A' });
      foundCount++;
    }
  }
  
  if (foundCount === 0) {
    formatted += '❌ **No accounts found** on any tracked platforms.\n';
  } else {
    formatted += `✅ **Found on ${foundCount} platform(s):**\n\n`;
    foundSites.forEach((item, index) => {
      formatted += `\`[${index + 1}]\` **${item.site}**\n    └─ ${item.url}\n\n`;
    });
  }
  
  formatted += `\`\`\`
═══════════════════════════════════════
Search completed | Results: ${foundCount}
═══════════════════════════════════════
\`\`\``;
  return formatted;
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
  
  if (command === 'watch') {
    const content = args.join(' ') || 'something';
    await client.user.setPresence({
      activities: [{ name: content, type: 'WATCHING' }],
      status: 'online'
    });
    await message.edit(`👀 Now watching: ${content}`);
  }
  
  if (command === 'listen') {
    const content = args.join(' ') || 'music';
    await client.user.setPresence({
      activities: [{ name: content, type: 'LISTENING' }],
      status: 'online'
    });
    await message.edit(`🎵 Now listening to: ${content}`);
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
  }
  
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
        await message.edit(`❌ Already in whitelist!`);
        return;
      }
      config.whitelist.push(userId);
      await message.edit(`✅ Added \`${userId}\` to whitelist`);
    } else if (subcommand === 'remove') {
      if (!userId) {
        await message.edit(`❌ Usage: ${config.prefix}whitelist remove <user_id>`);\n        return;\n      }\n      const index = config.whitelist.indexOf(userId);\n      if (index === -1) {\n        await message.edit(`❌ User not in whitelist!`);\n        return;\n      }\n      config.whitelist.splice(index, 1);\n      await message.edit(`✅ Removed \`${userId}\` from whitelist`);\n    } else if (subcommand === 'list') {\n      await message.edit(`📋 **Whitelist:**\\n\`\`\`\\n${config.whitelist.join('\\n')}\\n\`\`\``);\n    }\n  }\n  \n  if (command === 'osint' || command === 'search') {\n    const username = args[0];\n    if (!username) {\n      await message.edit(`❌ Usage: ${config.prefix}osint <username>`);\n      return;\n    }\n    \n    await message.edit(`🔍 **OSINT Search Initiated**\\n\\nTarget: \`${username}\`\\n⏳ Running Maigret...\\n📡 Scanning 3000+ platforms...`);\n    \n    try {\n      const results = await runMaigreatSearch(username, message);\n      const formattedResults = formatMaigreatResults(results, username);\n      \n      if (formattedResults.length > 2000) {\n        const chunks = [];\n        let currentChunk = '';\n        formattedResults.split('\\n').forEach(line => {\n          if ((currentChunk + line + '\\n').length > 1900) {\n            chunks.push(currentChunk);\n            currentChunk = line + '\\n';\n          } else {\n            currentChunk += line + '\\n';\n          }\n        });\n        if (currentChunk) chunks.push(currentChunk);\n        for (let i = 0; i < chunks.length; i++) {\n          if (i === 0) await message.edit(chunks[i]);\n          else await message.channel.send(chunks[i]);\n        }\n      } else {\n        await message.edit(formattedResults);\n      }\n    } catch (error) {\n      await message.edit(`❌ Error: ${error.message}\\n\\n**Setup Maigret:**\\n\`\`\`bash\\npip install maigret\\n\`\`\``);\n    }\n  }\n  \n  if (command === 'help') {\n    const helpText = `🎮 **Discord Selfbot Commands**\\n\\n**Activity:**\\n\`${config.prefix}stream\` \`${config.prefix}play\` \`${config.prefix}watch\` \`${config.prefix}listen\` \`${config.prefix}status\`\\n\\n**OSINT (3000+ sites):**\\n\`${config.prefix}osint <username>\`\\n\\n**Owner:**\\n\`${config.prefix}changeprefix\` \`${config.prefix}whitelist add/remove/list\``;\n    await message.edit(helpText);\n  }\n});\n\nclient.on('error', (err) => console.error('❌ Client error:', err));\nprocess.on('unhandledRejection', (err) => console.error('❌ Unhandled rejection:', err));\nclient.login(process.env.DISCORD_TOKEN);