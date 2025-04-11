import {
  makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  Browsers,
  jidNormalizedUser,
  downloadMediaMessage,
} from "@whiskeysockets/baileys";
import { getFeatureArrays, generateNotifbotMessage, handleNotifbotMessage } from "./NOTIF_BOT/NotifBot.js";
import pino from "pino";
import readline from "readline";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let connectionAttempts = 0;

import colors from "colors";
import moment from "moment-timezone";
import chalk from "chalk";
import CFonts from 'cfonts';
import qrcode from 'qrcode-terminal';

// Display fancy title
// Define WhatsApp compatible colors
const waColors = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];

// Get 2 random colors
const randomColor1 = waColors[Math.floor(Math.random() * waColors.length)];
const randomColor2 = waColors[Math.floor(Math.random() * waColors.length)];

console.log('\n\n'); // Add spacing before title
CFonts.say('auto-read-sw\nby-wily-kun', {
  font: 'tiny',       
  align: 'center',
  colors: [randomColor1, randomColor2],
  background: 'transparent', 
  letterSpacing: 1,
  lineHeight: 1,
  space: true,
  maxLength: '0',
  gradient: true,
  independentGradient: true,
  transitionGradient: true,
  env: 'node'
});
console.log('\n\n'); // Add spacing after title

let useCode = true;
let loggedInNumber;

function logCuy(message, type = "green") {
  moment.locale("id");
  const now = moment().tz("Asia/Jakarta");
  const colors = ["red", "green", "yellow", "blue", "magenta", "cyan"];
  const randomColor1 = colors[Math.floor(Math.random() * colors.length)];
  const randomColor2 = colors[Math.floor(Math.random() * colors.length)];
  const randomColor3 = colors[Math.floor(Math.random() * colors.length)];
  console.log(
    `\n${now.format(" dddd ")[`bg${randomColor1.charAt(0).toUpperCase() + randomColor1.slice(1)}`]}${
      now.format(" D MMMM YYYY ")[
        `bg${randomColor2.charAt(0).toUpperCase() + randomColor2.slice(1)}`
      ].black
    }${now.format(" HH:mm:ss ")[`bg${randomColor3.charAt(0).toUpperCase() + randomColor3.slice(1)}`].black}\n`,
  );
  console.log(`${message.bold[type]}`);
}

const configPath = path.join(__dirname, "config.json");
let config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

import emojiList from "./EMOJI/emoji.js";
let {
  autoReadStatus,
  autoLikeStatus,
  downloadMediaStatus,
  sensorNomor,
  antiTelpon,
  autoKickStory,
  blackList,
  whiteList,
  autoTypingStatus = false,
  antiCallV2 = false,
  lewatierror = false,
} = config;

const emojis = emojiList;

const updateConfig = (key, value) => {
  config[key] = value;
  fs.writeFileSync(configPath, JSON.stringify(config, null, 4), "utf-8");
};

let notifbotMessage = false;

// Security Login functionality
const maskInput = (query) => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    const stdin = process.openStdin();
    process.stdin.on("data", char => {
      char = char + "";
      switch (char) {
        case "\n": case "\r": case "\u0004":
          stdin.pause();
          break;
        default:
          process.stdout.clearLine(0);
          process.stdout.cursorTo(0);
          process.stdout.write(query + Array(rl.line.length + 1).join("*"));
          break;
      }
    });
    rl.question(query, value => {
      rl.history = rl.history.slice(1);
      resolve(value);
    });
  });
};

// Import required functions early
const { loadCounter, saveCounter, incrementRestartCounter, loadCredentials, saveCredentials, checkGithubCredentials } = await import("./FITUR_WILY/DataManager.js");

let lastValidCredentials = { username: '', password: '' };
let credentialCheckInterval;

async function verifyCredentials(inputUsername, inputPassword) {
  try {
    // Check saved credentials first
    const savedCreds = loadCredentials();

    // If we have saved credentials and no input credentials, use saved ones
    if (savedCreds && !inputUsername && !inputPassword) {
      inputUsername = savedCreds.username;
      inputPassword = savedCreds.password;
    }

    // Get GitHub credentials
    const response = await fetch('https://raw.githubusercontent.com/hitlabmodv2/SECURITY/refs/heads/main/keamanan.json');
    const data = await response.text();

    const usernameMatch = data.match(/USERNAME=([^\s\n]+)/);
    const passwordMatch = data.match(/PASSWORD=([^\s\n]+)/);

    if (!usernameMatch || !passwordMatch) {
      console.log("\n❌ Format kredensial tidak valid di GitHub.".red.bold);
      return false;
    }

    const correctUsername = usernameMatch[1].trim();
    const correctPassword = passwordMatch[1].trim();

    const isValidUsername = inputUsername === correctUsername;
    const isValidPassword = inputPassword === correctPassword;
    const isValid = isValidUsername && isValidPassword;

    let message = '';
    if (!isValidUsername && !isValidPassword) {
      message = 'Username dan Password salah!';
    } else if (!isValidUsername) {
      message = 'Username salah!';
    } else if (!isValidPassword) {
      message = 'Password salah!';
    }

    if (isValid) {
      lastValidCredentials = { username: correctUsername, password: correctPassword };
      saveCredentials(correctUsername, correctPassword);

      if (!credentialCheckInterval) {
        let lastCheck = Date.now();

        credentialCheckInterval = setInterval(async () => {
          try {
            const githubCreds = await checkGithubCredentials();
            if (githubCreds) {
              const timeSinceLastCheck = Date.now() - lastCheck;
              lastCheck = Date.now();

              if (githubCreds.username !== lastValidCredentials.username || githubCreds.password !== lastValidCredentials.password) {
                console.log("\n" + "╭─".red.bold + "━".repeat(60).red + "─╮".red.bold);
                console.log("│".red.bold + " ❌ PERINGATAN KEAMANAN".padEnd(60).red.bold + "│".red.bold);
                console.log("│".red.bold + "─".repeat(60).red + "│".red.bold);
                console.log("│".red.bold + " Username dan Password telah diubah! Bot akan berhenti.".padEnd(60).red.bold + "│".red.bold);
                console.log("│".red.bold + " Silakan login ulang dengan Username/Password baru.".padEnd(60).yellow.bold + "│".red.bold);
                console.log("╰─".red.bold + "━".repeat(60).red + "─╯".red.bold);

                // Clear saved credentials
                saveCredentials('', '');
                clearInterval(credentialCheckInterval);
                process.exit(1);
              }
            }
          } catch (error) {
            console.error("Error checking credentials:", error);
          }
        }, Math.max(60000 - (Date.now() - lastCheck), 1000)); // Maintain 1 minute interval
      }
    }

    return {
      isValid,
      username: isValidUsername,
      password: isValidPassword,
      message
    };
  } catch (error) {
    console.error('Error fetching credentials:', error);
    return false;
  }
}

async function promptLogin() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(async (resolve) => {
    console.log("\n╔═══════════════════════════╗".cyan.bold);
    console.log("║        LOGIN DULU         ║".cyan.bold);
    console.log("╚═══════════════════════════╝".cyan.bold);
    console.log("║".cyan.bold);
    rl.question("║ Username ➜ ".yellow.bold, async (username) => {
      console.log("║".cyan.bold);
      const password = await maskInput("║ Password ➜ ".yellow.bold);
      console.log("║".cyan.bold);
      console.log("╚═══════════════════════════╝".cyan.bold);
      const validationResult = await verifyCredentials(username, password);
      rl.close();

      if (!validationResult.isValid) {
        console.log("\n" + "╭─".red.bold + "━".repeat(60).red + "─╮".red.bold);
        console.log("│".red.bold + " 🔒 VALIDASI LOGIN WHATSAPP".padEnd(60).red.bold + "│".red.bold);
        console.log("│".red.bold + "─".repeat(60).red + "│".red.bold);
        // Get GitHub credentials
        const response = await fetch('https://raw.githubusercontent.com/hitlabmodv2/SECURITY/refs/heads/main/keamanan.json');
        const data = await response.text();

        const usernameMatch = data.match(/USERNAME=(.*)/);
        const passwordMatch = data.match(/PASSWORD=(.*)/);

        if (!usernameMatch || !passwordMatch) {
          console.log("\n❌ Format kredensial tidak valid di GitHub.".red.bold);
          process.exit(1);
        }

        const calculateSimilarity = (str1, str2) => {
          if (!str1 || !str2) return 0;
          let matches = 0;
          const longer = str1.length > str2.length ? str1 : str2;
          const shorter = str1.length > str2.length ? str2 : str1;
          for (let i = 0; i < shorter.length; i++) {
            if (shorter[i].toLowerCase() === longer[i]?.toLowerCase()) matches++;
          }
          return Math.floor((matches / longer.length) * 100);
        };

        const correctUsername = usernameMatch[1].trim();
        const correctPassword = passwordMatch[1].trim();

        const usernameSimilarity = calculateSimilarity(username, correctUsername);
        const passwordSimilarity = calculateSimilarity(password, correctPassword);

        const getSuccessMessage = (percentage) => {
          if (percentage === 100) return '✨ Sempurna';
          if (percentage >= 80) return '🎯 Sangat Dekat';
          if (percentage >= 60) return '👍 Cukup Dekat';
          if (percentage >= 40) return '🤔 Masih Jauh';
          if (percentage >= 20) return '😅 Sangat Jauh';
          return '❌ Tidak Cocok';
        };

        console.log("│".red.bold + ` Username: ${validationResult.username ? '✅ Benar' : '❌ Salah'}`.padEnd(60).yellow.bold + "│".red.bold);
        console.log("│".red.bold + ` ▸ (${validationResult.username ? '100% - ✨ Sempurna' : `${usernameSimilarity}% - ${getSuccessMessage(usernameSimilarity)}`}) » ${username}`.padEnd(60).yellow.bold + "│".red.bold);
        console.log("│".red.bold + ` Password: ${validationResult.password ? '✅ Benar' : '❌ Salah'}`.padEnd(60).yellow.bold + "│".red.bold);
        console.log("│".red.bold + ` ▸ (${validationResult.password ? '100% - ✨ Sempurna' : `${passwordSimilarity}% - ${getSuccessMessage(passwordSimilarity)}`}) » ${password}`.padEnd(60).yellow.bold + "│".red.bold);
        console.log("│".red.bold + "─".repeat(60).red + "│".red.bold);
        if (!validationResult.isValid) {
          if (!validationResult.username && !validationResult.password) {
            console.log("│".red.bold + " ❌ Mohon maaf, Username dan Password yang Anda masukkan salah".padEnd(60).red.bold + "│".red.bold);
            console.log("│".red.bold + " 🔄 Silakan coba lagi dengan data yang benar".padEnd(60).yellow.bold + "│".red.bold);
          } else if (!validationResult.username) {
            console.log("│".red.bold + " ❌ Mohon maaf, Username yang Anda masukkan Salah".padEnd(60).red.bold + "│".red.bold);
            console.log("│".red.bold + " 🔄 Silakan periksa kembali Username Anda".padEnd(60).yellow.bold + "│".red.bold);
          } else if (!validationResult.password) {
            console.log("│".red.bold + " ❌ Mohon maaf, Password yang Anda masukkan Salah".padEnd(60).red.bold + "│".red.bold);
            console.log("│".red.bold + " 🔄 Silakan periksa kembali Password Anda".padEnd(60).yellow.bold + "│".red.bold);
          }
        } else {
          console.log("│".red.bold + " ✅ Selamat! Login berhasil".padEnd(60).green.bold + "│".red.bold);
          console.log("│".red.bold + " 🎉 Anda akan dialihkan ke menu utama".padEnd(60).yellow.bold + "│".red.bold);
        }
        console.log("╰─".red.bold + "━".repeat(60).red + "─╯".red.bold + "\n");
        process.exit(1);
      }
      console.log("\n✅ Login berhasil! Memulai bot...".green.bold);
      console.log("====================================================\n".cyan.bold);
      resolve();
    });
  });
}

async function connectToWhatsApp() {
  const savedCreds = loadCredentials();
  if (!savedCreds || !savedCreds.username || !savedCreds.password) {
    await promptLogin();
  } else {
    const isValid = await verifyCredentials();
    if (!isValid) {
      await promptLogin();
    }
  }
  const sessionPath = path.join(__dirname, "sessions");
  if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath, { recursive: true });
  }
  const { state, saveCreds } = await useMultiFileAuthState("sessions");
  const sessionExists = fs.existsSync(path.join(sessionPath, "creds.json"));

  const sock = makeWASocket({
    logger: pino({ level: "silent" }),
    auth: state,
    defaultQueryTimeoutMs: undefined,
    keepAliveIntervalMs: 30000,
    browser: Browsers.macOS("Chrome"),
    shouldSyncHistoryMessage: () => true,
    syncFullHistory: true,
    generateHighQualityLinkPreview: true,
  });

  // Handle QR code
  if (!useCode) {
    sock.ev.on('connection.update', ({ qr }) => {
      if (qr) {
        console.log('\nScan QR code below to login:');
        qrcode.generate(qr, { small: true });
      }
    });
  }

  if (useCode && !sessionExists) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    console.log("\n" + "╭─".cyan.bold + "━".repeat(60).cyan + "─╮".cyan.bold);
    console.log("│".cyan.bold + " 📱 KONFIGURASI BOT WHATSAPP".padEnd(60).yellow.bold + "│".cyan.bold);
    console.log("│".cyan.bold + "─".repeat(60).cyan + "│".cyan.bold);
    console.log("│".cyan.bold + " Terima kasih telah menggunakan Bot WhatsApp".padEnd(60).yellow + "│".cyan.bold);
    console.log("│".cyan.bold + " Silakan ikuti petunjuk untuk memulai konfigurasi".padEnd(60).yellow + "│".cyan.bold);
    console.log("╰─".cyan.bold + "━".repeat(60).cyan + "─╯\n".cyan.bold);

    const askPairingCode = () => {
      rl.question(
        "  Apakah Anda ingin menggunakan kode pemasangan untuk masuk? (Y/n): "
          .yellow.bold,
        async (answer) => {
          if (answer.toLowerCase() === "y" || answer.trim() === "") {
            console.log("\n" + "  [ ! ]".red.bold + " Please enter your WhatsApp number, for example +628xxxx\n".cyan.bold);

            const askWaNumber = () => {
              rl.question(
                chalk.green.bold("Your Number : "),
                async (phoneNumber) => {
                  if (!/^\d+$/.test(phoneNumber)) {
                    logCuy(
                      "Nomor harus berupa angka!\nSilakan masukkan nomor WhatsApp kembali!.",
                      "red",
                    );
                    askWaNumber();
                  } else if (!phoneNumber.startsWith("62")) {
                    logCuy(
                      "Nomor harus diawali dengan 62!\nContoh : 628123456789\nSilakan masukkan nomor WhatsApp kembali!.",
                      "red",
                    );
                    askWaNumber();
                  } else {
                    // Delete existing sessions folder if it exists
                    if (fs.existsSync("sessions")) {
                      fs.rmSync("sessions", { recursive: true, force: true });
                      console.log(
                        "\n📁 Folder sesi dihapus di:".cyan,
                        process.cwd() + "/sessions",
                      );
                    }

                    // Create new sessions folder
                    fs.mkdirSync("sessions", { recursive: true });
                    console.log(
                      "📁 Folder sesi dibuat di:".cyan,
                      process.cwd() + "/sessions\n",
                    );

                    // Request and show the real pairing code with hyphen
                    const realCode = await sock.requestPairingCode(phoneNumber);
                    const formattedCode = realCode.slice(0, 4) + "-" + realCode.slice(4);
                    console.log(chalk.green.bold("- Your Pairing Code : ") + chalk.yellow.bold(formattedCode) + "\n\n");
                    console.log(
                      "🔗 Gunakan kode di atas untuk menghubungkan bot dengan WhatsApp Anda."
                        .yellow,
                    );
                    console.log(
                      "📋 Cara memasukkan pairing code di WhatsApp terbaru:"
                        .yellow,
                    );
                    console.log("1️⃣  Buka aplikasi WhatsApp di ponsel Anda.");
                    console.log(
                      "2️⃣  Ketuk ikon tiga titik di pojok kanan atas untuk membuka menu.",
                    );
                    console.log('3️⃣  Pilih "Perangkat Tertaut" dari menu.');
                    console.log(
                      '4️⃣  Ketuk "Tautkan Perangkat" dan masukkan pairing code yang ditampilkan di atas.',
                    );
                    console.log(
                      "5️⃣  Ikuti instruksi di layar untuk menyelesaikan proses pairing.",
                    );
                    console.log("\n✨ Menunggu koneksi...".cyan);
                    rl.close();
                  }
                },
              );
            };
            askWaNumber();
          } else if (answer.toLowerCase() === "n") {
            useCode = false;
            logCuy(
              "Buka WhatsApp Anda lalu klik tiga titik di kanan atas kemudian klik perangkat tertaut setelah itu Silahkan scan QR code dibawah untuk login ke WhatsApp",
              "cyan",
            );
            connectToWhatsApp();
            rl.close();
          } else {
            logCuy('Input tidak valid. Silakan masukkan "y" atau "n".', "red");
            askPairingCode();
          }
        },
      );
    };

    askPairingCode();
  }

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      connectionAttempts++;
      const shouldReconnect =
        lastDisconnect.error?.output.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect && connectionAttempts < config.autodeletesessions) {
        logCuy(
          `Mencoba menghubungkan ke WhatsApp... (Percobaan ${connectionAttempts}/${config.autodeletesessions})\n`,
          "cyan",
        );
        connectToWhatsApp();
      } else {
        if (connectionAttempts >= config.autodeletesessions) {
          logCuy(
            `Gagal terhubung setelah ${config.autodeletesessions} percobaan. Menghapus sesi dan memulai ulang...`,
            "red",
          );
          fs.rmSync(sessionPath, { recursive: true, force: true });
          connectionAttempts = 0;
        } else {
          logCuy(
            "Nampaknya kamu telah logout dari WhatsApp, silahkan login ke WhatsApp kembali!",
            "red",
          );
        }
        connectToWhatsApp();
      }
    } else if (connection === "open") {
      loggedInNumber = sock.user.id.split("@")[0].split(":")[0];
      let displayedLoggedInNumber = loggedInNumber;
      if (sensorNomor) {
        displayedLoggedInNumber =
          displayedLoggedInNumber.slice(0, 3) +
          "****" +
          displayedLoggedInNumber.slice(-2);
      }
      let totalFitur = 9; // Total all features
      let totalAktif = [autoReadStatus, autoLikeStatus, downloadMediaStatus, sensorNomor, antiTelpon, autoKickStory, autoTypingStatus, config.autoRecord, config.lewatierror].filter(Boolean).length;
      let totalNonaktif = totalFitur - totalAktif;

      // Get feature arrays from NotifBot
      const { activeFeatures, inactiveFeatures } = getFeatureArrays(
        autoReadStatus,
        autoLikeStatus,
        downloadMediaStatus,
        sensorNomor,
        antiTelpon,
        autoKickStory,
        autoTypingStatus,
        config
      );

      // Sort arrays alphabetically
      activeFeatures.sort();
      inactiveFeatures.sort();

      const messageInfo = generateNotifbotMessage(
        sock.user.name || 'Hen V1',
        displayedLoggedInNumber,
        totalFitur,
        activeFeatures,
        inactiveFeatures
      );
      global.totalViewed = loadCounter();
      const totalRestarts = incrementRestartCounter();

      console.log("\n" + "╭─".cyan.bold + "━".repeat(40).cyan + "─╮".cyan.bold);
      console.log("│".cyan.bold + " ▸ Bot Auto Lihat Status".padEnd(40).green.bold + "│".cyan.bold);
      console.log("╰─".cyan.bold + "━".repeat(40).cyan + "─╯".cyan.bold);
      console.log("│".cyan.bold + " ▸ Status Bot : Aktif ✓".padEnd(40).yellow.bold + "│".cyan.bold);
      console.log("│".cyan.bold + ` ▸ Nomor Login : ${displayedLoggedInNumber}`.padEnd(40).yellow.bold + "│".cyan.bold);
      let timeDisplay;
      const speedInSeconds = config.SpeedReadStory/1000;
      if (speedInSeconds < 60) {
        timeDisplay = `${speedInSeconds} Detik`;
      } else if (speedInSeconds < 3600) {
        timeDisplay = `${Math.floor(speedInSeconds/60)} Menit`;
      } else if (speedInSeconds < 86400) {
        timeDisplay = `${Math.floor(speedInSeconds/3600)} Jam`;
      } else if (speedInSeconds < 31536000) {
        timeDisplay = `${Math.floor(speedInSeconds/86400)} Hari`;
      } else {
        timeDisplay = `${Math.floor(speedInSeconds/31536000)} Tahun`;
      }
      console.log("│".cyan.bold + ` ▸ Kecepatan Lihat : ${timeDisplay}`.padEnd(40).yellow.bold + "│".cyan.bold);
      console.log("│".cyan.bold + ` ▸ Total Emoji : ${emojis.length}`.padEnd(40).yellow.bold + "│".cyan.bold);
      console.log("│".cyan.bold + ` ▸ Total Status View : ${global.totalViewed}`.padEnd(40).yellow.bold + "│".cyan.bold);
      console.log("│".cyan.bold + ` ▸ Total Bot Restart : ${totalRestarts}`.padEnd(40).yellow.bold + "│".cyan.bold);
      console.log("│".cyan.bold + " ".padEnd(40) + "│".cyan.bold);
      console.log("│".cyan.bold + " Script ini base dari".padEnd(40).yellow.bold + "│".cyan.bold);
      console.log("│".cyan.bold + " ▸ Bang Jauhariel".padEnd(40).red.bold + "│".cyan.bold);
      console.log("│".cyan.bold + " Dan Di Recode/Edit Ulang Oleh".padEnd(40).yellow.bold + "│".cyan.bold);
      console.log("│".cyan.bold + " ▸ Bang Wily, Dan Add Fitur Lainnya".padEnd(40).red.bold + "│".cyan.bold);
      console.log("╰─".cyan.bold + "━".repeat(40).cyan + "─╯".cyan.bold + "\n");

      notifbotMessage = await handleNotifbotMessage(sock, messageInfo, config, notifbotMessage, fs);
    }
  });
  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("call", async (call) => {
    const { id, status, from } = call[0];
    if (status === "offer") {
      if (antiTelpon) return sock.rejectCall(id, from);
      if (antiCallV2) {
        await sock.rejectCall(id, from);
        await sock.sendMessage(from, {
          text: "Maaf tuan kami sedang off :V",
        });
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    try {
      const msg = messages[0];
      if (!msg.message) return;

    // Trigger new message animation
    if (global.triggerNewMessage) {
      global.triggerNewMessage();
    }

    const { handleAutoTyping } = await import("./FITUR_WILY/AutoTyping.js");
    const { handleAutoRecord } = await import("./FITUR_WILY/Autorecord.js");
    const { handleAutoOnline } = await import("./FITUR_WILY/Autoonline.js");
    await handleAutoTyping(sock, msg, config);
    await handleAutoRecord(sock, msg, config);
    await handleAutoOnline(sock, msg, config);

    const { handleStatusUpdate } = await import("./FITUR_WILY/CodeAutoReadStory.js");
    await handleStatusUpdate(
      sock,
      msg,
      {
        autoReadStatus,
        autoLikeStatus,
        downloadMediaStatus,
        sensorNomor,
        loggedInNumber,
        blackList,
        whiteList,
        emojis,
      },
      logCuy,
    );

    msg.type = msg.message.imageMessage
      ? "imageMessage"
      : msg.message.videoMessage
        ? "videoMessage"
        : msg.message.audioMessage
          ? "audioMessage"
          : msg.message.extendedTextMessage
            ? "extendedTextMessage"
            : Object.keys(msg.message)[0];

    msg.text =
      msg.type === "conversation"
        ? msg.message.conversation
        : msg.type === "extendedTextMessage"
          ? msg.message.extendedTextMessage.text
          : msg.message[msg.type]?.caption || "";

    msg.isQuoted =
      msg.type === "extendedTextMessage"
        ? msg.message.extendedTextMessage.contextInfo?.quotedMessage
        : msg.type === "imageMessage"
          ? msg.message.imageMessage.contextInfo?.quotedMessage
          : msg.type === "videoMessage"
            ? msg.message.videoMessage.contextInfo?.quotedMessage
          : msg.type === "audioMessage"
            ? msg.message.audioMessage.contextInfo?.quotedMessage
            : null;

    msg.quoted = msg.isQuoted
      ? msg.message.extendedTextMessage?.contextInfo ||
        msg.message.imageMessage?.contextInfo ||
        msg.message.videoMessage?.contextInfo ||
        msg.message.audioMessage?.contextInfo
      : null;

    const prefixes = [".", "#", "!", "/"];
    let prefix = prefixes.find((p) => msg.text.startsWith(p));

    if (prefix && msg.key.fromMe) {
      msg.cmd = msg.text.trim().split(" ")[0].replace(prefix, "").toLowerCase();

      // args
      msg.args = msg.text
        .replace(/^\S*\b/g, "")
        .trim()
        .split("|");

      async function validateNumber(commandname, type, sc, data) {
        if (!data) {
          await sock.sendMessage(
            msg.key.remoteJid, // Send to original chat
            {
              text: `Nomor harus diisi.\ncontoh ketik :\n\`${commandname} blacklist 628123456789\`\n\nArgumen yang tersedia:\n\n\`${commandname} blacklist nomornya\`\nuntuk ${type} nomor ${sc} blacklist\n\n\`${commandname} whitelist nomornya\`\nuntuk ${type} nomor ${sc} whitelist`,
            },
            { quoted: msg },
          );
          return false;
        }
        if (!/^\d+$/.test(data)) {
          await sock.sendMessage(
            msg.key.remoteJid, // Send to original chat
            {
              text: `Nomor harus berupa angka.\ncontoh ketik :\n\`${commandname} blacklist 628123456789\`\n\nArgumen yang tersedia:\n\n\`${commandname} blacklist nomornya\`\nuntuk ${type} nomor ${sc} blacklist\n\n\`${commandname} whitelist nomornya\`\nuntuk ${type} nomor ${sc} whitelist`,
            },
            { quoted: msg }
          );
          return false;
        }
        if (!data.startsWith("62")) {
          await sock.sendMessage(
            msg.key.remoteJid, // Send to original chat
            {
              text: `Nomor harus diawali dengan 62.\ncontoh ketik :\n\`${commandname} blacklist 628123456789\`\n\nArgumen yang tersedia:\n\n\`${commandname} blacklist nomornya\`\nuntuk ${type} nomor ${sc} blacklist\n\n\`${commandname} whitelist nomornya\`\nuntuk ${type} nomor ${sc} whitelist`,
            },
            { quoted: msg },
          );
          return false;
        }
        return true;
      }

      // command
      switch (msg.cmd) {
        case "on":
          msg.args[0].trim() === ""
            ? await sock.sendMessage(
                msg.key.remoteJid, // Send to original chat
                {
                  text: `mana argumennya ?\ncontoh ketik : \`#on autolike\`\n\nArgumen yang tersedia:\n\n\`#on autoread\`\nuntuk mengaktifkan fitur autoread story\n\n\`#on autolike\`\nuntuk mengaktifkan fitur autolike story\n\n\`#on dlmedia\`\nuntuk mengaktifkan fitur download media(foto,video, dan audio) dari story\n\n\`#on sensornomor\`\nuntuk mengaktifkan sensor nomor\n\n\`#on antitelpon\`\nuntuk mengaktifkan anti-telpon\n\n\`#on kickstory\`\nuntuk mengaktifkan auto kick story grup\n\n\`#on autotyping\`\nuntuk mengaktifkan fitur auto typing\n\n\`#on antitagswv2\`\nuntuk mengaktifkan fitur anti tag story v2`,},
                { quoted: msg },
              )
            : msg.args.forEach(async (arg) => {
                switch (arg.trim().toLowerCase()) {
                  case "autoread":
                    autoReadStatus = true;
                    updateConfig("autoReadStatus", true);
                    logCuy("Kamu mengaktifkan fitur Auto Read Status", "blue");
                    await sock.sendMessage(
                      msg.key.remoteJid, // Send to original chat
                      { text: "Auto Read Status aktif" },
                      { quoted: msg },
                    );
                    break;
                  case "autolike":
                    autoLikeStatus = true;
                    updateConfig("autoLikeStatus", true);
                    logCuy("Kamu mengaktifkan fitur Auto Like Status", "blue");
                    await sock.sendMessage(
                      msg.key.remoteJid, // Send to original chat
                      { text: "Auto Like Status aktif" },
                      { quoted: msg },
                    );
                    break;
                  case "dlmedia":
                    downloadMediaStatus = true;
                    updateConfig("downloadMediaStatus", true);
                    logCuy(
                      "Kamu mengaktifkan fitur Download Media Status",
                      "blue",
                    );
                    await sock.sendMessage(
                      msg.key.remoteJid, // Send to original chat
                      { text: "Download Media Status aktif" },
                      { quoted: msg }
                    );
                    break;
                  case "sensornomor":
                    sensorNomor = true;
                    updateConfig("sensorNomor", true);
                    logCuy("Kamu mengaktifkan fitur sensorNomor", "blue");
                    await sock.sendMessage(
                      msg.key.remoteJid, // Send to original chat
                      { text: "Sensor Nomor aktif" },
                      { quoted: msg },
                    );
                    break;
                  case "antitelpon":
                    antiTelpon = true;
                    updateConfig("antiTelpon", true);
                    logCuy("Kamu mengaktifkan fitur Anti-telpon", "blue");
                    await sock.sendMessage(
                      msg.key.remoteJid, // Send to original chat
                      { text: "Anti-telpon aktif" },
                      { quoted: msg },
                    );
                    break;
                  case "kickstory":
                    autoKickStory = true;
                    updateConfig("autoKickStory", true);
                    logCuy(
                      "Kamu mengaktifkan fitur auto kick tag grup di story",
                      "blue",
                    );
                    await sock.sendMessage(
                      msg.key.remoteJid, // Send to original chat
                      { text: "Auto Kick Tag Grup di Story aktif" },
                      { quoted: msg },
                    );
                    break;
                  case "autotyping":
                    autoTypingStatus = true;
                    config.autoTyping = true;
                    updateConfig("autoTyping", true);
                    logCuy("Kamu mengaktifkan fitur Auto Typing", "blue");
                    await sock.sendMessage(
                      msg.key.remoteJid, // Send to original chat
                      { text: "Auto Typing aktif" },
                      { quoted: msg },
                    );
                    break;
                  case "antitagswv2":
                    config.antitagswv2 = true;
                    updateConfig("antitagswv2", true);
                    logCuy("Kamu mengaktifkan fitur Anti Tag Story V2", "blue");
                    await sock.sendMessage(
                      msg.key.remoteJid, // Send to original chat
                      { text: "Anti Tag Story V2 aktif" },
                      { quoted: msg },
                    );
                    break;
                  
                  case "autoonline":
                    config.autoOnline = true;
                    updateConfig("autoOnline", true);
                    logCuy("Kamu mengaktifkan fitur Auto Online", "blue");
                    await sock.sendMessage(
                      msg.key.remoteJid,
                      { text: "Auto Online aktif" },
                      { quoted: msg },
                    );
                    break;
                    
                  case "autorecord":                    config.autoRecord = true;
                    updateConfig("autoRecord", true);
                    logCuy("Kamu mengaktifkan fitur Auto Record", "blue");
                    await sock.sendMessage(
                      msg.key.remoteJid, // Send to original chat
                      { text: "Auto Record aktif" },
                      { quoted: msg },
                    );
                    break;
                  case "anticallv2":
                    config.antiCallV2 = true;
                    updateConfig("antiCallV2", true);
                    logCuy("Kamu mengaktifkan fitur Anti Call V2", "blue");
                    await sock.sendMessage(
                      msg.key.remoteJid, // Send to original chat
                      { text: "Anti Call V2 aktif" },
                      { quoted: msg },
                    );
                    break;
                    break;
                  case "lewatierror":
                    config.lewatierror = true;
                    updateConfig("lewatierror", true);
                    logCuy("Kamu mengaktifkan fitur Lewati Error", "blue");
                    await sock.sendMessage(
                      msg.key.remoteJid, // Send to original chat
                      { text: "Lewati Error aktif" },
                      { quoted: msg },
                    );
                    break;
                  default:
                    await sock.sendMessage(
                      msg.key.remoteJid, // Send to original chat
                      {
                        text: `Argumen tidak valid: ${arg}. Pilihan yang tersedia: autoread, autolike, dlmedia, sensornomor, kickstory, antitelpon dan autotyping`,
                      },
                      { quoted: msg },
                    );
                    break;
                }
              });
          break;
        case "off":
          msg.args[0].trim() === ""
            ? await sock.sendMessage(
                msg.key.remoteJid, // Send to original chat
                {
                  text: `mana argumennya ?\ncontoh ketik : \`#off autolike\`\n\nArgumen yang tersedia:\n\n\`#off autoread\`\nuntuk menonaktifkan fitur autoread story\n\n\`#off autolike\`\nuntuk menonaktifkan fitur autolike story\n\n\`#off dlmedia\`\nuntuk menonaktifkan fitur download media(foto,video, dan audio) dari story\n\n\`#off sensornomor\`\nuntuk menonaktifkan sensor nomor\n\n\`#off antitelpon\`\nuntuk menonaktifkan anti-telpon\n\n\`#off anticallv2\`\nuntuk menonaktifkan anti-call v2\n\n\`#off kickstory\`\nuntuk menonaktifkan auto kick story grup\n\n\`#off autotyping\`\nuntuk menonaktifkan fitur auto typing\n\`#off lewatierror\`\nuntuk menonaktifkan fitur lewati error`,
                },
                { quoted: msg },
              )
            : msg.args.forEach(async (arg) => {
                switch (arg.trim().toLowerCase()) {
                  case "autoread":
                    autoReadStatus = false;
                    updateConfig("autoReadStatus", false);
                    logCuy("Kamu mematikan fitur Auto Read Status", "blue");
                    await sock.sendMessage(
                      msg.key.remoteJid, // Send to original chat
                      { text: "Auto Read Status nonaktif" },
                      { quoted: msg },
                    );
                    break;
                  case "autolike":
                    autoLikeStatus = false;
                    updateConfig("autoLikeStatus", false);
                    logCuy("Kamu mematikan fitur Auto Like Status", "blue");
                    await sock.sendMessage(
                      msg.key.remoteJid, // Send to original chat
                      { text: "Auto Like Status nonaktif" },
                      { quoted: msg },
                    );
                    break;
                  case "dlmedia":
                    downloadMediaStatus = false;
                    updateConfig("downloadMediaStatus", false);
                    logCuy(
                      "Kamu mematikan fitur Download Media Status",
                      "blue",
                    );
                    await sock.sendMessage(
                      msg.key.remoteJid, // Send to original chat
                      { text: "Download Media Status nonaktif" },
                      { quoted: msg },
                    );
                    break;
                  case "sensornomor":
                    sensorNomor = false;
                    updateConfig("sensorNomor", false);
                    logCuy("Kamu mematikan fitur Sensor Nomor", "blue");
                    await sock.sendMessage(
                      msg.key.remoteJid, // Send to original chat
                      { text: "Sensor Nomor nonaktif" },
                      { quoted: msg },
                    );
                    break;
                  case "antitelpon":
                    antiTelpon = false;
                    updateConfig("antiTelpon", false);
                    logCuy("Kamu mematikan fitur Anti-telpon", "blue");
                    await sock.sendMessage(
                      msg.key.remoteJid, // Send to original chat
                      { text: "Anti-telpon nonaktif" },
                      { quoted: msg },
                    );
                    break;
                  case "anticallv2":
                    config.antiCallV2 = false;
                    updateConfig("antiCallV2", false);
                    logCuy("Kamu mematikan fitur Anti Call V2", "blue");
                    await sock.sendMessage(
                      msg.key.remoteJid, // Send to original chat
                      { text: "Anti Call V2 nonaktif" },
                      { quoted: msg },
                    );
                    break;
                  case "kickstory":
                    autoKickStory = false;
                    updateConfig("autoKickStory", false);
                    logCuy(
                      "Kamu mematikan fitur auto kick tag grup di story",
                      "blue",
                    );
                    await sock.sendMessage(
                      msg.key.remoteJid, // Send to original chat
                      { text: "Auto Kick Tag Grup di Story nonaktif" },
                      { quoted: msg },
                    );
                    break;
                  case "autotyping":
                    autoTypingStatus = false;
                    config.autoTyping = false;
                    updateConfig("autoTyping", false);
                    logCuy("Kamu mematikan fitur Auto Typing", "blue");
                    await sock.sendMessage(
                      msg.key.remoteJid, // Send to original chat
                      { text: "Auto Typing nonaktif" },
                      { quoted: msg },
                    );
                    break;
                  
                  case "autorecord":
                    config.autoRecord = false;
                    updateConfig("autoRecord", false);
                    logCuy("Kamu mematikan fitur Auto Record", "blue");
                    await sock.sendMessage(
                      msg.key.remoteJid, // Send to original chat
                      { text: "Auto Record nonaktif" },
                      { quoted: msg },
                    );
                    break;
                  case "anticallv2":
                    config.antiCallV2 = false;
                    updateConfig("antiCallV2", false);
                    logCuy("Kamu mematikan fitur Anti Call V2", "blue");
                    await sock.sendMessage(
                      msg.key.remoteJid, // Send to original chat
                      { text: "Anti Call V2 nonaktif" },
                      { quoted: msg },
                    );
                    break;
                  case "lewatierror":
                    config.lewatierror = false;
                    updateConfig("lewatierror", false);
                    logCuy("Kamu mematikan fitur Lewati Error", "blue");
                    await sock.sendMessage(
                      msg.key.remoteJid, // Send to original chat
                      { text: "Lewati Error nonaktif" },
                      { quoted: msg },
                    );
                    break;
                  case "antitagswv2":
                    config.antitagswv2 = false;
                    updateConfig("antitagswv2", false);
                    logCuy("Kamu mematikan fitur Anti Tag Story V2", "blue");
                    await sock.sendMessage(
                      msg.key.remoteJid,
                      { text: "Anti Tag Story V2 nonaktif" },
                      { quoted: msg },
                    );
                    break;

                  default:
                    await sock.sendMessage(
                      msg.key.remoteJid, // Send to original chat
                      {
                        text: `Argumen tidak valid: ${arg}. Pilihan yang tersedia: autoread, autolike, dlmedia, sensornomor, kickstory, antitelpon, autotyping, autorecord, anticallv2, antitagswv2 dan lewatierror. Pastikan ejaan command sudah benar.`,
                      },
                      { quoted: msg },
                    );
                    break;
                }
              });
          break;
        case "add":
          msg.args[0].trim() === ""
            ? await sock.sendMessage(
                msg.key.remoteJid, // Send to original chat
                {
                  text: `mana argumennya ?\ncontoh ketik :\n\`#add blacklist 628123456789\`\n\nArgumen yang tersedia:\n\n\`#add blacklist nomornya\`\nuntuk menambahkan nomor ke blacklist\n\n\`#add whitelist nomornya\`\nuntuk menambahkan nomor ke whitelist\n\n\`#add emojis emojinya\`\nuntuk menambahkan emoji ke emojis`,
                },
                { quoted: msg },
              )
            : msg.args.forEach(async (arg) => {
                const [list, data] = arg.trim().split(" ");
                if (list === "emojis") {
                  let emojiRegex = /^[\p{Emoji}\u200D\uFE0F]$/gu;
                  if (!data) {
                    await sock.sendMessage(
                      msg.key.remoteJid, // Send to original chat
                      {
                        text: `emoji harus diisi.\ncontoh ketik :\n\`#add emojis 👍\``,
                      },
                      { quoted: msg },
                    );
                    return;
                  }
                  if (!emojiRegex.test(data)) {
                    await sock.sendMessage(
                      msg.key.remoteJid, // Send to original chat
                      {
                        text: `hanya boleh mengisi 1 emoji.\ncontoh ketik :\n\`#add emojis 👍\``,
                      },
                      { quoted: msg },
                    );
                    return;
                  }
                  if (!emojis.includes(data)) {
                    emojis.push(data);
                    updateConfig("emojis", emojis);
                    logCuy(
                      `Kamu menambahkan emoji ${data} ke daftar emojis`,
                      "blue",
                    );
                    await sock.sendMessage(
                      msg.key.remoteJid, // Send to original chat
                      {
                        text: `emoji ${data} berhasil ditambahkan ke daftar emojis`,
                      },
                      { quoted: msg },
                    );
                  } else {
                    await sock.sendMessage(
                      msg.key.remoteJid, // Send to original chat
                      { text: `emoji ${data} sudah ada di daftar emojis` },
                      { quoted: msg },
                    );
                  }
                } else if (list === "blacklist") {
                  const isValid = await validateNumber(
                    "#add",
                    "menambahkan",
                    "ke",
                    data,
                  );
                  if (!isValid) return;
                  let displayNumber = data;
                  if (sensorNomor) {
                    displayNumber =
                      displayNumber.slice(0, 3) +
                      "****" +
                      displayNumber.slice(-2);
                  }
                  if (!blackList.includes(data)) {
                    blackList.push(data);
                    updateConfig("blackList", blackList);
                    logCuy(
                      `Kamu menambahkan nomor ${displayNumber} ke blacklist`,
                      "blue",
                    );
                    await sock.sendMessage(
                      msg.key.remoteJid, // Send to original chat
                      {
                        text: `Nomor ${displayNumber} berhasil ditambahkan ke blacklist`,
                      },
                      { quoted: msg },
                    );
                  } else {
                    await sock.sendMessage(
                      msg.key.remoteJid, // Send to original chat
                      { text: `Nomor ${displayNumber} sudah ada di blacklist` },
                      { quoted: msg },
                    );
                  }
                } else if (list === "whitelist") {
                  const isValid = await validateNumber(
                    "#add",
                    "menambahkan",
                    "ke",
                    data,
                  );
                  if (!isValid) return;
                  let displayNumber = data;
                  if (sensorNomor) {
                    displayNumber =
                      displayNumber.slice(0, 3) +
                      "****" +
                      displayNumber.slice(-2);
                  }
                  if (!whiteList.includes(data)) {
                    whiteList.push(data);
                    updateConfig("whiteList", whiteList);
                    logCuy(
                      `Kamu menambahkan nomor ${displayNumber} ke whitelist`,
                      "blue",
                    );
                    await sock.sendMessage(
                      msg.key.remoteJid, // Send to original chat
                      {
                        text: `Nomor ${displayNumber} berhasil ditambahkan ke whitelist`,
                      },
                      { quoted: msg },
                    );
                  } else {
                    await sock.sendMessage(
                      msg.key.remoteJid, // Send to original chat
                      { text: `Nomor ${displayNumber} sudah ada di whitelist` },
                      { quoted: msg },
                    );
                  }
                } else {
                  await sock.sendMessage(
                    msg.key.remoteJid, // Send to original chat
                    {
                      text: `Argumen tidak valid: ${arg}. Pilihan yang tersedia: blacklist, whitelist, emojis`,
                    },
                    { quoted: msg },
                  );
                }
              });
          break;
        case "remove":
          msg.args[0].trim() === ""
            ? await sock.sendMessage(
                msg.key.remoteJid, // Send to original chat
                {
                  text: `mana argumennya ?\ncontoh ketik :\n\`#remove blacklist 628123456789\`\n\nArgumen yang tersedia:\n\n\`#remove blacklist nomornya\`\nuntuk menghapus nomor dari blacklist\n\n\`#remove whitelist nomornya\`\nuntuk menghapus nomor dari whitelist\n\n\`#remove emojis emojinya\`\nuntuk menghapus emoji dari daftar emojis`,
                },
                { quoted: msg },
              )
            : msg.args.forEach(async (arg) => {
                const [list, data] = arg.trim().split(" ");
                if (list === "emojis") {
                  let emojiRegex = /^[\p{Emoji}\u200D\uFE0F]$/gu;
                  if (!data) {
                    await sock.sendMessage(
                      msg.key.remoteJid, // Send to original chat
                      {
                        text: `emoji harus diisi.\ncontoh ketik :\n\`#remove emojis 👍\``,
                      },
                      { quoted: msg },
                    );
                    return;
                  }
                  if (!emojiRegex.test(data)) {
                    await sock.sendMessage(
                      msg.key.remoteJid, // Send to original chat
                      {
                        text: `hanya boleh mengisi 1 emoji.\ncontoh ketik :\n\`#remove emojis f\``,
                      },
                      { quoted: msg },
                    );
                    return;
                  }
                  if (emojis.length === 1) {
                    await sock.sendMessage(
                      msg.key.remoteJid, // Send to original chat
                      {
                        text: `Tidak bisa menghapus emoji terakhir. Harus ada minimal satu emoji.\n\nKetik \`#info\` untuk mengecek daftar emoji yang tersedia`,
                      },
                      { quoted: msg },
                    );
                    return;
                  }
                  if (emojis.includes(data)) {
                    emojis = emojis.filter((n) => n !== data);
                    updateConfig("emojis", emojis);
                    logCuy(`Kamu menghapus emoji ${data} dari emojis`, "blue");
                    await sock.sendMessage(
                      msg.key.remoteJid, // Send to original chat
                      {
                        text: `emoji ${data} berhasil dihapus dari daftar emojis`,
                      },
                      { quoted: msg },
                    );
                  } else {
                    await sock.sendMessage(
                      msg.key.remoteJid, // Send to original chat
                      {
                        text: `emoji ${data} tidak ada di daftar emojis\n\nKetik \`#info\` untuk mengecek daftar emoji yang tersedia`,
                      },
                      { quoted: msg },
                    );
                  }
                } else if (list === "blacklist") {
                  const isValid = await validateNumber(
                    "#remove",
                    "menghapus",
                    "dari",
                    data,
                  );
                  if (!isValid) return;
                  let displayNumber = data;
                  if (sensorNomor) {
                    displayNumber =
                      displayNumber.slice(0, 3) +
                      "****" +
                      displayNumber.slice(-2);
                  }
                  if (blackList.includes(data)) {
                    blackList = blackList.filter((n) => n !== data);
                    updateConfig("blackList", blackList);
                    logCuy(
                      `Kamu menghapus nomor ${displayNumber} dari blacklist`,
                      "blue",
                    );
                    await sock.sendMessage(
                      msg.key.remoteJid, // Send to original chat
                      {
                        text: `Nomor ${displayNumber} berhasil dihapus dari blacklist`,
                      },
                      { quoted: msg },
                    );
                  } else {
                    await sock.sendMessage(
                      msg.key.remoteJid, // Send to original chat
                      {
                        text: `Nomor ${displayNumber} tidak ada di blacklist\n\nKetik \`#info\` untuk mengecek daftar nomor yang tersedia`,
                      },
                      { quoted: msg },
                    );
                  }
                } else if (list === "whitelist") {
                  const isValid = await validateNumber(
                    "#remove",
                    "menghapus",
                    "dari",
                    data,
                  );
                  if (!isValid) return;
                  let displayNumber = data;
                  if (sensorNomor) {
                    displayNumber =
                      displayNumber.slice(0, 3) +
                      "****" +
                      displayNumber.slice(-2);
                  }
                  if (whiteList.includes(data)) {
                    whiteList = whiteList.filter((n) => n !== data);
                    updateConfig("whiteList", whiteList);
                    logCuy(
                      `Kamu menghapus nomor ${displayNumber} dari whitelist`,
                      "blue",
                    );
                    await sock.sendMessage(
                      msg.key.remoteJid, // Send to original chat
                      {
                        text: `Nomor ${displayNumber} berhasil dihapus dari whitelist`,
                      },
                      { quoted: msg },
                    );
                  } else {
                    await sock.sendMessage(
                      msg.key.remoteJid, // Send to original chat
                      {
                        text: `Nomor ${displayNumber} tidak ada di whitelist\n\nKetik \`#info\` untuk mengecek daftar nomor yang tersedia`,
                      },
                      { quoted: msg },
                    );
                  }
                } else {
                  await sock.sendMessage(
                    msg.key.remoteJid, // Send to original chat
                    {
                      text: `Argumen tidak valid: ${arg}. Pilihan yang tersedia: blacklist, whitelist, emojis`,
                    },
                    { quoted: msg },
                  );
                }
              });
          break;
        case "menu":
          let profilePictureBuffer;
          try {
            profilePictureBuffer = await sock.profilePictureUrl(sock.user.id, 'image').then(async url => {
              const response = await fetch(url);
              const buffer = await response.arrayBuffer();
              return Buffer.from(buffer);
            });
          } catch (error) {
            console.log("Error fetching profile picture:", error);
            profilePictureBuffer = fs.readFileSync("./generated-icon.png");
          }

          const menuMessage = `
╔═════════『 DAFTAR MENU 』
║ *Untuk Melihat Fitur Aktif/Nonaktif*
║ *ketik : #info*
╠═════════『 PENGATURAN BOT 』           
║ • Lewati Error                          
║   On  : #on lewatierror                 
║   Off : #off lewatierror                
║                                         
╠═════════『 FITUR STORY 』 
║ • Auto Read Story                       
║   On  : #on autoread                    
║   Off : #off autoread                   
║                                         
║ • Auto Like Story                       
║   On  : #on autolike                    
║   Off : #off autolike                   
║                                         
║ • Download Media Story                  
║   On  : #on dlmedia                     
║   Off : #off dlmedia                    
║                                         
╠═════════『 FITUR GRUP 』
║ • Anti Tag Story                        
║   On  : #on antitagswv2                    
║   Off : #off antitagswv2                    
║                                         
║ • Auto Kick Story                       
║   On  : #on kickstory                   
║   Off : #off kickstory                  
║                                         
╠═════════『 FITUR CHAT 』 
║ • Auto Typing                           
║   On  : #on autotyping                  
║   Off : #off autotyping                 
║                                        
║ • Auto Record                          
║   On  : #on autorecord                  
║   Off : #off autorecord                 
║                                         
║ • Auto Online                           
║   On  : #on autoonline                  
║   Off : #off autoonline                 
║         
╠═════════『 KEAMANAN 』
║ • Sensor Nomor                          
║   On  : #on sensornomor                 
║   Off : #off sensornomor                
║                                         
║ • Anti Call                             
║   On  : #on antitelpon                  
║   Off : #off antitelpon                 
║                                         
║ • Anti Call V2                          
║   On  : #on anticallv2                  
║   Off : #off anticallv2                 
║                                         
╠═════════『 PENGATURAN 』
║ • Blacklist                             
║   Add    : #add blacklist nomor         
║   Remove : #remove blacklist nomor      
║                                         
║ • Whitelist                             
║   Add    : #add whitelist nomor         
║   Remove : #remove whitelist nomor      
║                                         
║ • Emoji Reactions                        
║   Add    : #add emojis emoji       
║   Remove : #remove emojis emoji         
║                                         
╠═════════『 LAINNYA 』
║ • #info                                 
║   Menampilkan informasi status fitur    
║                                         
║ • #viewonce                             
║   Download media dari pesan sementara
║                                         
╚═════════════════════════════════════╝`;

          await sock.sendMessage(
            msg.key.remoteJid, // Send to original chat
            {
              image: profilePictureBuffer,
              caption: menuMessage,
              headerType: 1,
              viewOnce: true,
              document: fs.readFileSync("./package.json"),
              fileName: 'Alamak.jpeg',
              mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              fileLength: 9999999,
              contextInfo: {
                isForwarded: true,
                mentionedJid: [`${loggedInNumber}@s.whatsapp.net`],
                forwardedNewsletterMessageInfo: {
                  newsletterJid: config.idSaluran,
                  newsletterName: config.namaSaluran
                },
                externalAdReply: {
                  title: `${config.botname} - ${config.versi}`,
                  body: `Hari ini : ${(() => {
                    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                    const now = new Date();
                    const day = days[now.getDay()];
                    const date = String(now.getDate()).padStart(2, '0');
                    const month = months[now.getMonth()];
                    const year = now.getFullYear();
                    return `${day}/${date}/${month}/${year}`;
                  })()}`,
                  thumbnail: profilePictureBuffer,
                  sourceUrl: 'https://whatsapp.com/channel/' + config.idSaluran,
                  mediaType: 1,
                  renderLargerThumbnail: true
                }
              }
            }
          );
          break;
        case "info":
          let profilePictureBufferInfo;
          try {
            profilePictureBufferInfo = await sock.profilePictureUrl(sock.user.id, 'image').then(async url => {
              const response = await fetch(url);
              const buffer = await response.arrayBuffer();
              return Buffer.from(buffer);
            });
          } catch (error) {
            console.log("Error fetching profile picture:", error);
            profilePictureBufferInfo = fs.readFileSync("./generated-icon.png");
          }

          const formatList = (list) =>
            list
              .map((number, index) =>{
                let displayNumber = number;
                if (sensorNomor) {
                  displayNumber =
                    displayNumber.slice(0, 3) +
                    "****" +
                    displayNumber.slice(-2);
                }
                return `\u25CF ${displayNumber}`;
              })
              .join("\n");
          const formatEmojiList = (list) =>
            list.map((emoji, index) => `${emoji}`).join(", ");

          const blacklistMessage =
            blackList.length > 0
              ? `╭──────『 Blacklist 』──────╮\n${formatList(blackList)}\n╰─────────────────────────╯`
              : "╭──────『 Blacklist 』──────╮\n┃ Blacklist kosong.\n╰─────────────────────────╯";
          const whitelistMessage =
            whiteList.length > 0
              ? `╭──────『 Whitelist 』──────╮\n${formatList(whiteList)}\n╰─────────────────────────╯`
              : "╭──────『 Whitelist 』──────╮\n┃ Whitelist kosong.\n╰─────────────────────────╯";
          const emojisMessage =
            emojis.length > 0
              ? `╭──────『 Emoji List 』──────╮\n┃ ${formatEmojiList(emojis)}\n╰─────────────────────────╯`
              : "╭──────『 Emoji List 』──────╮\n┃ Emoji list kosong.\n╰─────────────────────────╯";
          const listMessage = `\n\n${blacklistMessage}\n\n${whitelistMessage}\n\n${emojisMessage}\n\n╭──────『 Perintah 』──────╮\n┃ • \`#add\` - Tambah nomor/emoji\n┃ • \`#remove\` - Hapus nomor/emoji\n┃ • \`#on\` - Aktifkan fitur\n┃ • \`#off\` - Nonaktifkan fitur\n┃ • \`#menu\` - Lihat menu\n╰─────────────────────────╯`;

          const infoMessage = `╭─『 Informasi Status 』─╮

│ ➤ Fitur Aktif:
${autoReadStatus ? "│ 👁️ Auto Read Status: *Aktif*\n" : ""}${autoLikeStatus ? "│ ❤️ Auto Like Status: *Aktif*\n" : ""}${downloadMediaStatus ? "│ 📥 Download Media Status: *Aktif*\n" : ""}${sensorNomor ? "│ 🔒 Sensor Nomor: *Aktif*\n" : ""}${antiTelpon ? "│ 📵 Anti Telpon: *Aktif*\n" : ""}${autoKickStory ? "│ 🚫 Auto Kick tag Story: *Aktif*\n" : ""}${autoTypingStatus ? "│ ⌨️ Auto Typing: *Aktif*\n" : ""}${config.autoRecord ? "│ 🎙️ Auto Record: *Aktif*\n" : ""}${config.lewatierror ? "│ ⚡ Lewati Error: *Aktif*\n" : ""}${config.antitagswv2 ? "│ 🛡️ Anti Tag Story V2: *Aktif*\n" : ""}${config.antiCallV2 ? "│ 📞 Anti Call V2: *Aktif*\n" : ""}${config.autoOnline ? "│ 🟢 Auto Online: *Aktif*\n" : ""}│
│ ➤ Fitur Nonaktif:
${!autoReadStatus ? "│ 👁️ Auto Read Status: *Nonaktif*\n" : ""}${!autoLikeStatus ? "│ ❤️ Auto Like Status: *Nonaktif*\n" : ""}${!downloadMediaStatus ? "│ 📥 Download Media Status: *Nonaktif*\n" : ""}${!sensorNomor ? "│ 🔒 Sensor Nomor: *Nonaktif*\n" : ""}${!antiTelpon ? "│ 📵 Anti Telpon: *Nonaktif*\n" : ""}${!autoKickStory ? "│ 🚫 Auto Kick tag Story: *Nonaktif*\n" : ""}${!autoTypingStatus ? "│ ⌨️ Auto Typing: *Nonaktif*\n" : ""}${!config.autoRecord ? "│ 🎙️ Auto Record: *Nonaktif*\n" : ""}${!config.lewatierror ? "│ ⚡ Lewati Error: *Nonaktif*\n" : ""}${!config.antitagswv2 ? "│ 🛡️ Anti Tag Story V2: *Nonaktif*\n" : ""}${!config.antiCallV2 ? "│ 📞 Anti Call V2: *Nonaktif*\n" : ""}${!config.autoOnline ? "│ 🟢 Auto Online: *Nonaktif*\n" : ""}
╰───────────────────╯`;

          await sock.sendMessage(
            msg.key.remoteJid, // Send to original chat
            {
              image: profilePictureBufferInfo,
              caption: infoMessage + listMessage,
              headerType: 1,
              viewOnce: true,
              document: fs.readFileSync("./package.json"),
              fileName: 'Alamak.jpeg',
              mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              fileLength: 9999999,
              contextInfo: {
                isForwarded: true,
                mentionedJid: [`${loggedInNumber}@s.whatsapp.net`],
                forwardedNewsletterMessageInfo: {
                  newsletterJid: config.idSaluran,
                  newsletterName: config.namaSaluran
                },
                externalAdReply: {
                  title: `${config.botname} - ${config.versi}`,
                  body: `Hari ini : ${(() => {
                    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                    const now = new Date();
                    const day = days[now.getDay()];
                    const date = String(now.getDate()).padStart(2, '0');
                    const month = months[now.getMonth()];
                    const year = now.getFullYear();
                    return `${day}/${date}/${month}/${year}`;
                  })()}`,
                  thumbnail: profilePictureBufferInfo,
                  sourceUrl: 'https://whatsapp.com/channel/' + config.idSaluran,
                  mediaType: 1,
                  renderLargerThumbnail: true
                }
              }
            }
          );
          break;
        case "viewonce":
          if (msg.isQuoted && msg.quoted && msg.quoted.quotedMessage) {
            if (msg.quoted.quotedMessage.imageMessage) {
              let buffer = await downloadMediaMessage(
                {
                  message: {
                    imageMessage: msg.quoted.quotedMessage.imageMessage,
                  },
                  key: msg.quoted.key,
                },
                "buffer",
                {},
                {
                  logger: pino({ level: "fatal" }),
                },
              );

              await sock.sendMessage(
                msg.key.remoteJid, // Send to original chat
                {
                  image: Buffer.from(buffer),
                },
                { quoted: msg },
              );

              logCuy(
                `Berhasil mengambil gambar sekali liat dari yang kamu reply`,
                "blue",
              );

              buffer = null;
            } else if (msg.quoted.quotedMessage.videoMessage) {
              let buffer = await downloadMediaMessage(
                {
                  message: {
                    videoMessage: msg.quoted.quotedMessage.videoMessage,
                  },
                  key: msg.quoted.key,
                },
                "buffer",
                {},
                {
                  logger: pino({ level: "fatal" }),
                },
              );

              await sock.sendMessage(
                msg.key.remoteJid, // Send to original chat
                {
                  video: Buffer.from(buffer),
                },
                { quoted: msg },
              );

              logCuy(
                `Berhasil mengambil video sekali liat dari yang kamu reply`,
                "blue",
              );

              buffer = null;
            } else if (msg.quoted.quotedMessage.audioMessage) {
              let buffer = await downloadMediaMessage(
                {
                  message: {
                    audioMessage: msg.quoted.quotedMessage.audioMessage,
                  },
                  key: msg.quoted.key,
                },
                "buffer",
                {},
                {
                  logger: pino({ level: "fatal" }),
                },
              );

              await sock.sendMessage(
                msg.key.remoteJid, // Send to original chat
                {
                  audio: Buffer.from(buffer),
                },
                { quoted: msg },
              );

              logCuy(
                `Berhasil mengambil audio sekali liat dari yang kamu reply`,
                "blue",
              );

              buffer = null;
            } else {
              await sock.sendMessage(
                msg.key.remoteJid, // Sendto original chat
                {
                  text: `Pesan yang kamu reply bukan pesan yang bertipe foto, video, audio dan sekali liat`,
                },
                { quoted: msg },
              );
              logCuy(
                `Pesan yang kamu reply bukan pesan yang bertipe foto, videoaudio dan sekali liat`,
                "yellow",
              );
            }
          } else {
            await sock.sendMessage(
              msg.key.remoteJid, // Send to original chat
              {
                text: `Reply/balas pesan sekali liat dengan perintah #viewonce`,
              },
              { quoted: msg },
            );
          }
          break;
        case "antitagswv2":
          if (!msg.key.fromMe) {
            await sock.sendMessage(
              msg.key.remoteJid,
              { text: "Maaf, hanya owner yang bisa menggunakan command ini" },
              { quoted: msg }
            );
            return;
          }

          if (msg.args[0].trim() === "") {
            await sock.sendMessage(
              msg.key.remoteJid,
              { text: "Fitur Anti Tag Story V2\n\nKetik:\n#on antitagswv2 - untuk mengaktifkan\n#off antitagswv2 - untuk menonaktifkan" },
              { quoted: msg }
            );
            return;
          }

          if (msg.args[0] === "1" || msg.args[0].toLowerCase() === "on") {
            config.antitagswv2 = true;
            updateConfig("antitagswv2", true);
            await sock.sendMessage(
              msg.key.remoteJid,
              { text: "Anti Tag Story V2 telah diaktifkan ✅" },
              { quoted: msg }
            );
          } else if (msg.args[0] === "2" || msg.args[0].toLowerCase() === "off") {
            config.antitagswv2 = false;
            updateConfig("antitagswv2", false);
            await sock.sendMessage(
              msg.key.remoteJid,
              { text: "Anti Tag Story V2 telah dinonaktifkan ❌" },
              { quoted: msg }
            );
          }
          break;


      }
    }

    const { handleAntiTagSWV2 } = await import("./FITUR_WILY/FITUR_ANTI_GC/AntiTagGroup.js");
    if (msg.message && (autoKickStory || config.antitagswv2)) {
      try {
        await handleAntiTagSWV2(sock, msg, config, logCuy);
      } catch (error) {
        console.error("Error in handleAntiTagSWV2:", error);
      }
    }
  } catch (error) {
    if (config.lewatierror) {
      console.log('\n[ERROR HANDLER]'.red.bold + ' An error occurred in message handler:'.yellow, error);
      console.log('[INFO]'.cyan.bold + ' Continuing execution due to lewatierror enabled...'.yellow);
    } else {
      throw error;
    }
  }
  });
}

connectToWhatsApp();