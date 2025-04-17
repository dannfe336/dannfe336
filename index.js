const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth_info");

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "close") {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        } else if (connection === "open") {
            console.log("✅ Bot conectado com sucesso!");
        }
    });

    sock.ev.on("messages.upsert", async ({ messages, type }) => {
        if (type !== "notify") return;

        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const sender = msg.pushName || "amigo";
        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

        if (!text) return;

        console.log(`📩 Mensagem de ${sender}: ${text}`);

        let reply;
        if (text.toLowerCase().includes("oi") || text.toLowerCase().includes("olá")) {
            reply = `Olá, ${sender}! 👋
Aqui está o link que você pediu:
👉 https://example.com`;
        } else if (text.toLowerCase().includes("promoção")) {
            reply = `🎉 Promoção especial pra você, ${sender}!
Acesse: https://example.com/promo`;
        } else {
            reply = `Olá, ${sender}! Não entendi sua mensagem. 😅
Digite "promoção" para ver as ofertas!`;
        }

        await sock.sendMessage(from, { text: reply });
    });
}

startBot();
