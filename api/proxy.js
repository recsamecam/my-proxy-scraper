const fetch = require('node-fetch');

export default async function handler(req, res) {
  const keyword = req.query.keyword; // Keyword dikirim dari Google Sheet
  const SERPER_API_KEY = "7bdaceeb53e7779804418dabda1cbc871b26b364";
  const webhookUrl = "https://script.google.com/macros/s/AKfycbzyXfJNI9XT8END_gtlg-_LefICbbt25DKuAJvicAwgQB791YIH7GTZmfwihht_9OY/exec?token=rahasia123";

  if (!keyword) {
    return res.status(400).json({ error: "Parameter 'keyword' wajib diisi" });
  }

  try {
    // 1. Cari website menggunakan Serper.dev
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ q: keyword, num: 5 }) // Mengambil 5 website teratas
    });

    const data = await response.json();
    const results = data.organic || [];

    // 2. Kirim hasil pencarian ke Google Sheet
    for (const site of results) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: site.title,
          link: site.link,
          snippet: site.snippet,
          status: "Ditemukan via Serper"
        })
      });
    }

    res.status(200).json({ message: `Berhasil menemukan ${results.length} website untuk: ${keyword}` });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}