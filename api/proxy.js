const fetch = require('node-fetch');

export default async function handler(req, res) {
  // GANTI DENGAN API KEY & WEBHOOK URL ANDA
  const SERPER_API_KEY = "7bdaceeb53e7779804418dabda1cbc871b26b364";
  const webhookUrl = "https://script.google.com/macros/s/AKfycbzyXfJNI9XT8END_gtlg-_LefICbbt25DKuAJvicAwgQB791YIH7GTZmfwihht_9OY/exec?token=rahasia123";
  
  const keyword = req.query.keyword;

  if (!keyword) {
    return res.status(400).json({ error: "Parameter 'keyword' wajib diisi" });
  }

  try {
    // 1. Ambil data dari Serper.dev
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ q: keyword, num: 10 }) 
    });

    const data = await response.json();
    const results = data.organic || [];
    const tanggalSekarang = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });

    // 2. Kirim data ke Google Sheets sesuai kolom A-Y
    for (const site of results) {
      const payload = {
        company: site.title,           // A: COMPANY
        name: "PIC / Procurement",     // B: NAME
        country: "Target Market",      // C: COUNTRY
        address: tanggalSekarang,      // D: ADDRESS
        phone: "",                     // E: PHONE
        email: "",                     // F: EMAIL
        web: site.link,                // G: WEB
        fb: "",                        // H: FB
        source: "Serper.dev Auto",     // I: SOURCE
        commodity: keyword,            // J: Commodity
        commodity2: "",                // K: Commodity2
        commodity3: "",                // L: Commodity3
        commodity4: "",                // M: Commodity4
        commodity5: "",                // N: Commodity5
        commodity6: "",                // O: Commodity6
        commodity7: "",                // P: Commodity7
        remarks: site.snippet,         // Q: Remarks (Snippet pencarian)
        lastSent: "",                  // R: LastSent
        by: "System",                  // S: By
        remarks2: "",                  // T: Remarks2
        timezone: "WIB",               // U: Timezone
        language: "en",                // V: Language
        autocratTrigger: "",           // W: AutocratTrigger
        remarks3: "",                  // X: Remarks3
        date: tanggalSekarang          // Y: Date
      };

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    res.status(200).json({ 
      status: "Sukses", 
      message: `Berhasil memproses ${results.length} website untuk keyword: ${keyword}` 
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}