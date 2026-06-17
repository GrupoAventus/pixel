const express = require("express");
const crypto = require("crypto");

const app = express();
app.use(express.json());

const PIXEL_ID = "823346850739984";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

// Nome exato da coluna "Ganho" no DKW
const COLUNA_GANHO = "Aguardando dados";

function hash(value) {
  if (!value) return null;
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

app.post("/webhook", async (req, res) => {
  try {
    const body = req.body;
    console.log("Evento recebido:", JSON.stringify(body, null, 2));

    // Filtra apenas quando o negócio for movido para a coluna correta
    const toStep = body?.data?.toStep;
    if (toStep !== COLUNA_GANHO) {
      console.log(`Ignorando evento — coluna destino: "${toStep}"`);
      return res.json({ success: true, message: "Evento ignorado" });
    }

    console.log(`✅ Negócio movido para "${COLUNA_GANHO}" — enviando para o Meta...`);

    const contact = body?.data?.contact || {};
    const name = contact.name || null;
    const phone = contact.number || null;
    const email = contact.email || null;

    const userData = {};
    if (email && email !== "") userData.em = [hash(email)];
    if (phone) userData.ph = [hash(phone.replace(/\D/g, ""))];
    if (name) {
      const parts = name.trim().split(" ");
      userData.fn = [hash(parts[0])];
      if (parts.length > 1) userData.ln = [hash(parts.slice(1).join(" "))];
    }

    const eventPayload = {
      data: [
        {
          event_name: "Purchase",
          event_time: Math.floor(Date.now() / 1000),
          action_source: "physical_store",
          user_data: userData,
          custom_data: {
  value: 1.00,
  currency: "BRL",
},
        },
      ],
      access_token: ACCESS_TOKEN,
    };

    const url = `https://graph.facebook.com/v19.0/${PIXEL_ID}/events`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventPayload),
    });

    const result = await response.json();
    console.log("Resposta do Meta:", JSON.stringify(result, null, 2));

    if (result.error) {
      console.error("Erro do Meta:", result.error);
      return res.status(500).json({ error: result.error });
    }

    res.json({ success: true, events_received: result.events_received });
  } catch (err) {
    console.error("Erro interno:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (req, res) => res.json({ status: "online" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
