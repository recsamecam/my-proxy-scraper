export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ status: "Ready", message: "Scraper API siap." });
  }

  const { keyword, countryCode } = req.body || {};
  if (!keyword || !countryCode) {
    return res.status(400).json({ error: "Missing keyword or countryCode" });
  }

  try {
    // 1. Scraping via Serper
    const searchResponse = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: { "X-API-KEY": process.env.SERPER_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ q: keyword, gl: countryCode.toLowerCase() })
    });
    const searchData = await searchResponse.json();
    const organic = searchData.organic?.[0]; // Mengambil hasil pertama

    if (!organic) throw new Error("Tidak ada hasil pencarian");

    // 2. Cari Email via Hunter.io
    const domain = new URL(organic.link).hostname.replace('www.', '');
    let email = "Not Found";
    
    try {
      const hunterRes = await fetch(`https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${process.env.HUNTER_API_KEY}`);
      const hunterData = await hunterRes.json();
      if (hunterData.data?.emails?.length > 0) {
        email = hunterData.data.emails[0].value;
      }
    } catch (e) {
      console.log("Hunter error, lanjut proses...");
    }

    // 3. Siapkan data untuk dikirim ke Google Sheets
    const payload = {
      company: organic.title,
      name: "N/A", // Google Maps biasanya tidak memberikan nama spesifik perorangan
      country: countryCode,
      address: "N/A",
      phone: "N/A",
      email: email,
      website: organic.link
    };

    // 4. Kirim ke Google Sheets
    const gasRes = await fetch(process.env.GAS_WEBAPP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const gasResult = await gasRes.text();
    res.status(200).json({ status: 'Success', details: payload, googleSheetResponse: gasResult });

  } catch (error) {
    console.error("Scraper Error:", error);
    res.status(500).json({ error: error.message });
  }
}
