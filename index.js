const express = require("express");
const crypto = require("crypto");

const app = express();
app.use(express.json());

const PIXEL_ID = "823346850739984";
const ACCESS_TOKEN = "COLE_SEU_NOVO_TOKEN_AQUI";

function hash(value) {
  if (!value) return null;
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

app.post("/webhook", async (req, res) => {
  try {
    const body = req.body;
    console.log("Evento recebido do DKW:", JSON.stringify(body, null, 2));

    // Adapte os campos abaixo conforme o payload real do DKW
    const email = body.email || body.cliente?.email || null;
    const phone = body.telefone || body.cliente?.telefone || null;
    const name = body.nome || body.cliente?.nome || null;
    const value = body.valor || body.deal?.value || 0;

    const userData = {};
    if (email) userData.em = [hash(email)];
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
            value: parseFloat(value) || 0,
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
