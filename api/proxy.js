const fetch = require('node-fetch');

export default async function handler(req, res) {
  const SERPER_API_KEY = "7bdaceeb53e7779804418dabda1cbc871b26b364";
  const webhookUrl = "https://script.google.com/macros/s/AKfycbzwavjSaWjF9G1t9w0iTSEfJKUt-51O06JV2nwhcAEoWJcKf-7GzMFZsjDB82u4jgM/exec?token=rahasia123";
  
  const keyword = req.query.keyword;
  if (!keyword) return res.status(400).json({ error: "Parameter 'keyword' wajib diisi" });

  try {
    const response = await fetch('https://google.serper.dev/maps', {
      method: 'POST',
      headers: { 'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: keyword, num: 10 })
    });

    const data = await response.json();
    const results = data.places || [];
    if (results.length === 0) return res.status(200).json({ status: "Kosong", message: "Tidak ada data." });

    const tanggalSekarang = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });

    for (const place of results) {
      // ... (logika alamat tetap sama)
      let alamatFisik = place.address || "Alamat tidak tertera";
      let namaNegara = keyword.split(' ')[1] || "Target Market";
const promises = results.map(async (place) => {
      const rowData = [
        place.title || "No Title", "PIC / Procurement", namaNegara, alamatFisik, 
        place.phoneNumber || "", "", place.website || "", "", "Serper Maps API", 
        keyword, "", "", "", "", "", "", `Rating: ${place.rating || '-'}`, 
        "", "System", "", "WIB", "en", "", "", tanggalSekarang
      ];

      // PENTING: Kirim sebagai object dengan key "rowData"
      return fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowData: rowData })
      });
    }

// Tunggu semua proses pengiriman selesai sebelum Vercel berhenti
await Promise.all(promises);

    res.status(200).json({ status: "Sukses", count: results.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
