export default async function handler(req, res) {
  const GAS_URL = "https://script.google.com/macros/s/AKfycbzwavjSaWjF9G1t9w0iTSEfJKUt-51O06JV2nwhcAEoWJcKf-7GzMFZsjDB82u4jgM/exec";
  const SERPER_API_KEY = "7bdaceeb53e7779804418dabda1cbc871b26b364";
  const HUNTER_API_KEY = "a3726c29ee95939ac553de002379c3b2edeaa344";

  try {
    // 1. Ambil list keyword dari Google Sheets via doGet
    const kwRes = await fetch(GAS_URL);
    const keywords = await kwRes.json();
    
    let results = [];

    // 2. Loop setiap keyword
    for (const entry of keywords) {
      // Cari via Serper
      const serperRes = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: `${entry.keyword} in ${entry.country}`, num: 3 })
      });
      const serperData = await serperRes.json();

      if (!serperData.organic) continue;

      for (const item of serperData.organic) {
        const domain = new URL(item.link).hostname.replace('www.', '');
        
        // Scraping email via Hunter.io
        const hRes = await fetch(`https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${HUNTER_API_KEY}`);
        const hData = await hRes.json();

        // 3. Ambil dan bersihkan alamat dari snippet Serper
        let address = item.snippet || "N/A";
        // Menghapus nama negara jika ada di akhir (misal: ", USA" atau ", United States")
        address = address.replace(/,\s*(USA|United States|US)$/i, "").trim();

        // 4. Susun Payload
        const payload = {
          company: item.title,
          name: "N/A", // Default karena Serper/Hunter jarang memberikan nama kontak spesifik
          countryCode: entry.country,
          address: address,
          phone: "N/A",
          email: hData.data?.emails[0]?.value || "Not Found",
          website: domain,
          keyword: entry.keyword
        };

        // Kirim data ke GAS via doPost
        const gRes = await fetch(GAS_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        
        const status = await gRes.text();
        results.push(`Processed ${domain}: ${status}`);
      }
    }

    return res.status(200).json({ status: "Success", details: results });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
