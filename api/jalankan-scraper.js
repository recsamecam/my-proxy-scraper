export default async function handler(req, res) {
  const GAS_URL = "https://script.google.com/macros/s/AKfycbzwavjSaWjF9G1t9w0iTSEfJKUt-51O06JV2nwhcAEoWJcKf-7GzMFZsjDB82u4jgM/exec";
  const SERPER_API_KEY = "7bdaceeb53e7779804418dabda1cbc871b26b364";
  const HUNTER_API_KEY = "a3726c29ee95939ac553de002379c3b2edeaa344";
  const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY"; // Masukkan API Key Gemini Anda di sini

  // Fungsi delay acak antara 300ms sampai 800ms agar terlihat manusiawi
  const randomDelay = () => new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (800 - 300 + 1) + 300)));

  const blacklist = ["amazon.", "alibaba.", "shopee.", "tiktok.", "instagram.", "facebook.", "twitter.", "reddit.", "quora.", "linkedin.", "myshopify.", "lazada.", "tokopedia.", "ebay."];

  try {
    const kwRes = await fetch(GAS_URL);
    const keywords = await kwRes.json();
    let allPayloads = [];

    for (const entry of keywords) {
      await randomDelay();

      // 1. Cari domain mentah menggunakan Serper berdasarkan keyword dan negara
      const serperRes = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: `${entry.keyword} in ${entry.countryName}`, num: 5 })
      });
      const serperData = await serperRes.json();

      if (!serperData.organic) continue;

      for (const item of serperData.organic) {
        const domain = new URL(item.link).hostname.replace('www.', '').toLowerCase();
        if (blacklist.some(site => domain.includes(site))) continue;

        // 2. Gunakan Gemini untuk mengekstrak & merapikan Nama Perusahaan, Alamat, dan Kode Negara (ISO 2 huruf)
        let cleanedCompany = item.title || domain;
        let cleanedAddress = item.snippet || "";
        let resolvedCountryCode = entry.countryCode || "";

        try {
          const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `Analisis data berikut untuk domain ${domain} dengan konteks negara target: "${entry.countryName}".
                  Title: "${item.title}"
                  Snippet: "${item.snippet}"
                  
                  Berikan jawaban dalam format JSON murni TANPA markdown block (tanpa \`\`\`json), dengan struktur persis seperti ini:
                  {"company": "Nama perusahaan bersih tanpa slogan/lokasi", "address": "Alamat singkat jika ada, kosongkan jika tidak", "countryCode": "Kode negara ISO 2 huruf uppercase, contoh: ID, US, GB, SG, AU"}`
                }]
              }]
            })
          });
          
          const geminiData = await geminiRes.json();
          const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          
          if (rawText) {
            // Bersihkan format markdown block jika terlanjur ada
            const jsonText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(jsonText);
            
            if (parsed.company) cleanedCompany = parsed.company;
            if (parsed.address) cleanedAddress = parsed.address;
            if (parsed.countryCode) resolvedCountryCode = parsed.countryCode.toUpperCase();
          }
        } catch (geminiErr) {
          console.warn("Gemini parsing failed, fallback to default:", geminiErr);
        }

        await randomDelay();

        // 3. Fetch data email ke Hunter.io
        const hRes = await fetch(`https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${HUNTER_API_KEY}`);
        const hData = await hRes.json();

        allPayloads.push({
          company: cleanedCompany,        // Masuk ke Kolom A (Nama Perusahaan bersih)
          name: "",                       // Masuk ke Kolom B
          countryCode: resolvedCountryCode, // Masuk ke Kolom C (Kode Negara hasil Gemini / Sheet)
          address: cleanedAddress.length > 50 ? "" : cleanedAddress, // Masuk ke Kolom D
          phone: "",                      // Masuk ke Kolom E
          email: hData.data?.emails?.[0]?.value || "", // Masuk ke Kolom F
          website: domain,                // Masuk ke Kolom G
          keyword: entry.keyword          // Masuk ke Kolom H
        });
      }
    }

    // 4. Kirim hasil dalam satu Batch besar ke Google Sheets
    if (allPayloads.length > 0) {
      await fetch(GAS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(allPayloads)
      });
    }

    return res.status(200).json({ status: "Success", processedCount: allPayloads.length });
  } catch (err) {
    console.error("Critical Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
