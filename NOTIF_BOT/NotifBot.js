export function getFeatureArrays(autoReadStatus, autoLikeStatus, downloadMediaStatus, sensorNomor, antiTelpon, autoKickStory, autoTypingStatus, config) {
  // Create arrays for active and inactive features
  const activeFeatures = [];
  const inactiveFeatures = [];

  // Helper function to add feature status
  const addFeatureStatus = (condition, activeName, inactiveName) => {
    if (condition) {
      activeFeatures.push(activeName);
    } else {
      inactiveFeatures.push(inactiveName);
    }
  };

  // Check each feature's status from config
  addFeatureStatus(config.autoReadStatus, " Auto Read Status 👁️ : *Aktif*", " Auto Read Status 👁️ : *Nonaktif*");
  addFeatureStatus(config.autoLikeStatus, " Auto Like Status ❤️ : *Aktif*", " Auto Like Status ❤️ : *Nonaktif*");
  addFeatureStatus(config.downloadMediaStatus, " Download Media Status 📥 : *Aktif*", " Download Media Status 📥 : *Nonaktif*");
  addFeatureStatus(config.sensorNomor, " Sensor Nomor 🔒 : *Aktif*", " Sensor Nomor 🔒 : *Nonaktif*");
  addFeatureStatus(config.lewatierror, " Lewati Error ⚡ : *Aktif*", " Lewati Error ⚡ : *Nonaktif*");
  addFeatureStatus(config.autoRecord, " Auto Record 🎙️ : *Aktif*", " Auto Record 🎙️ : *Nonaktif*");
  addFeatureStatus(config.autoTyping, " Auto Typing ⌨️ : *Aktif*", " Auto Typing ⌨️ : *Nonaktif*");
  addFeatureStatus(config.antiTelpon, " Anti Telpon 📵 : *Aktif*", " Anti Telpon 📵 : *Nonaktif*");
  addFeatureStatus(config.autoKickStory, " Auto Kick Story 🚫 : *Aktif*", " Auto Kick Story 🚫 : *Nonaktif*");
  addFeatureStatus(config.antiCallV2, " Anti Call V2 📵 : *Aktif*", " Anti Call V2 📵 : *Nonaktif*");
  addFeatureStatus(config.antitagswv2, " Anti Tag Story V2 🛡️ : *Aktif*", " Anti Tag Story V2 🛡️ : *Nonaktif*");
  addFeatureStatus(config.autoOnline, " Auto Online 📱 : *Aktif*", " Auto Online 📱 : *Nonaktif*");

  return { activeFeatures, inactiveFeatures };
}

export function generateNotifbotMessage(userName, displayedNumber, totalFeatures, activeFeatures, inactiveFeatures) {
  return `━━━━━━━━━━━━━━┤
 Halo ${userName} *Aktif!* 
 login dengan nomor: ${displayedNumber}
━━━━━━━━━━━━━━┤
 *Total Semua Fitur : ${activeFeatures.length + inactiveFeatures.length} 📊*
 *Total Fitur Aktif : ${activeFeatures.length} ✅*
 *Total Fitur Nonaktif : ${inactiveFeatures.length} ❌*
━━━━━━━━━━━━━━┤
 *Fitur Aktif:*
${activeFeatures.join('\n')}
━━━━━━━━━━━━━━┤
 *Fitur Nonaktif:*
${inactiveFeatures.join('\n')}
━━━━━━━━━━━━━━┤
 Ketik #menu
 Untuk melihat menu perintah yang tersedia.
━━━━━━━━━━━━━━┤`;
}

export async function handleNotifbotMessage(sock, messageInfo, config, notifbotMessage, fs) {
  const notifbotMessageFile = './DATA/notifbot_message.json';

  if (!notifbotMessage) {
    // Check and delete previous message if exists
    if (fs.existsSync(notifbotMessageFile)) {
      try {
        const prevMessageData = JSON.parse(fs.readFileSync(notifbotMessageFile));
        if (prevMessageData.key) {
          await sock.sendMessage(`6282263096788@s.whatsapp.net`, { 
            delete: prevMessageData.key 
          });
        }
      } catch (error) {
        console.log("Error deleting previous notifbot message:", error);
      }
    }

    setTimeout(async () => {
      let profilePictureBuffer;
      const maxRetries = 3;
      const retryDelay = 5000; // 5 seconds between retries
      const fetchTimeout = 15000; // 15 seconds fetch timeout

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          // First try to get the URL with a shorter timeout
          const urlController = new AbortController();
          const urlTimeoutId = setTimeout(() => urlController.abort(), 8000);

          const profilePictureUrl = await Promise.race([
            sock.profilePictureUrl(sock.user.id, 'image'),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('URL fetch timeout')), 8000)
            )
          ]);

          clearTimeout(urlTimeoutId);

          // Then fetch the image with a separate timeout
          const fetchController = new AbortController();
          const fetchTimeoutId = setTimeout(() => fetchController.abort(), fetchTimeout);

          const response = await fetch(profilePictureUrl, { 
            signal: fetchController.signal,
            timeout: fetchTimeout,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });

          clearTimeout(fetchTimeoutId);

          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

          const buffer = await response.arrayBuffer();
          if (buffer.byteLength === 0) throw new Error('Empty response');

          profilePictureBuffer = Buffer.from(buffer);
          const message = `✅ Profile picture fetched successfully on attempt ${attempt + 1}`;
          const borderWidth = message.length + 2;
          const horizontalBorder = "─".repeat(borderWidth);
          console.log(`╭${horizontalBorder}╮\n│ ${message} │\n╰${horizontalBorder}╯`);
          break;
        } catch (error) {
          console.log(`Attempt ${attempt + 1}/${maxRetries} failed:`, error.message);
          if (attempt === maxRetries - 1) {
            console.log("❌ All retries failed, using default icon");
            profilePictureBuffer = fs.readFileSync("./generated-icon.png");
          } else {
            console.log(`⏳ Waiting ${retryDelay/1000} seconds before next attempt...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        }
      }

      const sentMessage = await sock.sendMessage(`6282263096788@s.whatsapp.net`, {
        image: profilePictureBuffer,
        caption: messageInfo,
        headerType: 1,
        viewOnce: true,
        document: fs.readFileSync("./package.json"),
        fileName: 'Alamak.jpeg',
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        fileLength: 9999999,
        contextInfo: {
          isForwarded: true,
          mentionedJid: [`6282263096788@s.whatsapp.net`],
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
      });

      // Save message info to DATA folder
      const messageData = {
        key: sentMessage.key,
        timestamp: Date.now(),
        deleteAt: Date.now() + 60000 // 1 minute from now
      };
      fs.writeFileSync('./DATA/notifbot_message.json', JSON.stringify(messageData));

      // Set timeout to delete message after 1 minute
      setTimeout(async () => {
        try {
          await sock.sendMessage(`6282263096788@s.whatsapp.net`, { 
            delete: sentMessage.key 
          });
        } catch (error) {
          console.log("Error deleting notifbot message:", error);
        }
      }, 60000);

      notifbotMessage = true;
    }, 5000);

    // Check for pending deletions on startup
    if (fs.existsSync(notifbotMessageFile)) {
      try {
        const messageData = JSON.parse(fs.readFileSync(notifbotMessageFile));
        const timeLeft = messageData.deleteAt - Date.now();

        if (timeLeft > 0) {
          setTimeout(async () => {
            try {
              await sock.sendMessage(`6289688206739@s.whatsapp.net`, { 
                delete: messageData.key 
              });
            } catch (error) {
              console.log("Error deleting pending notifbot message:", error);
            }
          }, timeLeft);
        }
      } catch (error) {
        console.log("Error processing pending notifbot message:", error);
      }
    }
  }
  return notifbotMessage;
}
