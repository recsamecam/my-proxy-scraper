const fetch = require('node-fetch');

export default async function handler(req, res) {
  // GANTI URL DI BAWAH INI DENGAN URL WEB APP GOOGLE SHEETS ANDA
  const webhookUrl = "https://script.google.com/macros/s/AKfycbzyXfJNI9XT8END_gtlg-_LefICbbt25DKuAJvicAwgQB791YIH7GTZmfwihht_9OY/exec?token=rahasia123";
  
  const targetUrl = req.query.url;

  // 1. Validasi URL
  if (!targetUrl) {
    return res.status(400).json({ error: "Parameter 'url' wajib diisi" });
  }

  try {
    // 2. Ambil data dari situs target
    const response = await fetch(targetUrl);
    const htmlData = await response.text();

    // 3. Kirim log/data kunjungan ke Google Sheets
    // Anda bisa mengubah isi 'body' sesuai data yang ingin dicatat
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keyword: targetUrl,
        nama: "Scraper Proxy",
        email: "auto@sistem.com"
      })
    });

    // 4. Tampilkan hasil data situs ke browser
    res.status(200).send(htmlData);
    
  } catch (error) {
    console.error("Error pada Proxy:", error);
    res.status(500).json({ error: "Gagal mengambil data atau kirim ke Sheet: " + error.message });
  }
}