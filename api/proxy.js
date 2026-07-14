const fetch = require('node-fetch');
module.exports = async (req, res) => {
  const { url, webhookUrl } = req.body;
  const response = await fetch(url);
  const html = await response.text();
  // Contoh ekstraksi
  const data = { keyword: "test", nama: "Contoh", email: "test@mail.com" }; 

  // Kirim hasil ke Google Sheets via Webhook
  await fetch(webhookUrl + "?token=rahasia123", {
    method: 'POST',
    body: JSON.stringify(data)
  });
  res.send("Data dikirim!");
};