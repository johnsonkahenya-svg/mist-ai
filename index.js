const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason
} = require("@whiskeysockets/baileys")

const pino = require("pino")

let phoneNumber = "255628071139" // ✅ namba yako halisi

async function startBot() {

    const { state, saveCreds } = await useMultiFileAuthState("./session")
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: "silent" }),
        browser: ["MIST AI", "Chrome", "1.0.0"]
    })

    sock.ev.on("creds.update", saveCreds)

    let pairingRequested = false

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update

        if (connection === "connecting") {
            console.log("⏳ MIST AI inaunganisha... tafadhali subiri 🔄")
        }

        if (!pairingRequested && !sock.authState.creds.registered) {
            pairingRequested = true

            setTimeout(async () => {
                try {
                    let code = await sock.requestPairingCode(phoneNumber)
                    code = code.match(/.{1,4}/g).join("-")

                    console.log("\n🔑 MIST AI PAIRING CODE GENERATED 🔑")
                    console.log("👉 CODE:", code)
                    console.log("📲 Ingiza code kwenye WhatsApp > Linked Devices\n")

                } catch (err) {
                    console.log("❌ Pairing error:", err.message)
                }
            }, 5000)
        }

        if (connection === "open") {
            console.log("✅ MIST AI IKO ONLINE NA IMEUNGANISHWA 🚀🔥")
        }

        if (connection === "close") {
            let reason = lastDisconnect?.error?.output?.statusCode

            console.log("❌ Connection imekufa:", reason)

            if (reason !== DisconnectReason.loggedOut) {
                console.log("🔄 MIST AI inajaribu kuconnect tena...")
                setTimeout(startBot, 5000)
            }
        }
    })

    // 🤖 MESSAGE HANDLER
    sock.ev.on("messages.upsert", async (m) => {
        const msg = m.messages[0]
        if (!msg.message) return

        const from = msg.key.remoteJid
        const text =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            ""

        const body = text.toLowerCase().trim()

        console.log("📩 Message received:", body)

        // 👋 HI COMMAND
        if (body === "hi") {
            await sock.sendMessage(from, {
                text: `👋✨ *HELLO FROM MIST AI BOT* ✨👋

🤖 Nimeamka na niko online tayari kukuhudumia 24/7 ⚡

📌 Mimi ni *MIST AI* – assistant yako smart kabisa 🚀
💡 Naweza kujibu messages zako, kusaidia kazi, na kukupa taarifa haraka sana!

🔥 Andika:
👉 *menu* kuona huduma zote
👉 *help* kupata msaada
👉 *info* kujua kuhusu mimi

💙 Karibu sana kwenye ulimwengu wa MIST AI 💙`
            })
        }

        // 📋 MENU COMMAND
        if (body === "menu") {
            await sock.sendMessage(from, {
                text: `📋✨ *MIST AI MAIN MENU* ✨📋

🤖 *COMMANDS ZILIZOPO:*

👉 hi - kuanza mazungumzo
👉 menu - orodha ya commands
👉 help - msaada wa bot
👉 info - taarifa za bot

🚀 *FEATURES ZITAKAZOONGEZEWA:*
⚡ AI smart replies
🔐 KYC system
🎯 Auto response
💬 Chat assistant
📊 Admin panel

💡 *MIST AI iko chini ya maendeleo lakini tayari iko LIVE!* 🔥

━━━━━━━━━━━━━━━━━━
💙 Powered by MIST AI
━━━━━━━━━━━━━━━━━━`
            })
        }

        // ℹ️ INFO COMMAND
        if (body === "info") {
            await sock.sendMessage(from, {
                text: `ℹ️🤖 *KUHUSU MIST AI* 🤖ℹ️

🚀 Hii ni bot ya kisasa ya WhatsApp iliyojengwa kwa Baileys

👨‍💻 Imeundwa kutoa:
✔ Auto replies
✔ Smart messaging
✔ Assistance services

⚡ Version: 1.0.0
📡 Status: ONLINE
🔥 Performance: FAST & STABLE

💙 Asante kwa kutumia MIST AI!`
            })
        }

    })
}

startBot()
