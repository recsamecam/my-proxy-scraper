export default async function handler(req, res) {
  const GAS_URL = process.env.GAS_URL || "https://script.google.com/macros/s/AKfycbzwavjSaWjF9G1t9w0iTSEfJKUt-51O06JV2nwhcAEoWJcKf-7GzMFZsjDB82u4jgM/exec";
  const SERPER_API_KEY = process.env.SERPER_API_KEY;
  const HUNTER_API_KEY = process.env.HUNTER_API_KEY;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  // Fungsi delay acak antara 300ms sampai 800ms agar terlihat manusiawi
  const randomDelay = () => new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (800 - 300 + 1) + 300)));

  const blacklist = ["amazon.", "alibaba.", "shopee.", "tiktok.", "instagram.", "facebook.", "twitter.", "reddit.", "quora.", "linkedin.", "myshopify.", "lazada.", "tokopedia.", "ebay."];

  try {
    // 1. Ambil daftar keyword dari Google Sheets
    const kwRes = await fetch(GAS_URL);
    const keywords = await kwRes.json();

    // 2. Ambil daftar domain yang sudah ada sebelumnya di sheet untuk mencegah duplikat lintas waktu
    let existingDomainSet = new Set();
    try {
      const domainCheckRes = await fetch(`${GAS_URL}?action=getDomains`);
      const existingDomains = await domainCheckRes.json();
      if (Array.isArray(existingDomains)) {
        existingDomains.forEach(domain => {
          if (domain) existingDomainSet.add(String(domain).toLowerCase().trim());
        });
      }
    } catch (err) {
      console.warn("Gagal mengambil riwayat domain, melanjutkan tanpa pengecekan silang sheet:", err);
    }

    let allPayloads = [];

    for (const entry of keywords) {
      await randomDelay();

      // 3. Cari domain mentah menggunakan Serper berdasarkan keyword dan negara
      const serperRes = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: `${entry.keyword} in ${entry.countryName}`, num: 5 })
      });
      const serperData = await serperRes.json();

      if (!serperData.organic) continue;

      for (const item of serperData.organic) {
        const domain = new URL(item.link).hostname.replace('www.', '').toLowerCase();
        
        // Cek apakah domain masuk blacklist atau sudah pernah dicatat di Google Sheets
        if (blacklist.some(site => domain.includes(site))) continue;
        if (existingDomainSet.has(domain)) continue; // Lewati jika domain sudah ada di sheet

        // 4. Gunakan Gemini untuk mengekstrak & merapikan Nama Perusahaan, Alamat, dan Kode Negara (ISO 2 huruf)
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

        // 5. Fetch data email ke Hunter.io dengan penanganan error (Aman jika kredit habis)
        let extractedEmail = "";
        try {
          const hRes = await fetch(`https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${HUNTER_API_KEY}`);
          const hData = await hRes.json();
          
          if (hData && hData.data && hData.data.emails && hData.data.emails.length > 0) {
            extractedEmail = hData.data.emails[0].value || "";
          }
        } catch (hunterErr) {
          console.warn(`Hunter API error untuk domain ${domain} (kemungkinan kredit habis):`, hunterErr.message);
          extractedEmail = ""; // Tetap dilanjutkan dengan email kosong
        }

        // Masukkan ke set lokal agar tidak duplikat dalam batch eksekusi yang sama
        existingDomainSet.add(domain);

        allPayloads.push({
          company: cleanedCompany,        // Masuk ke Kolom A (Nama Perusahaan bersih)
          name: "",                       // Masuk ke Kolom B
          countryCode: resolvedCountryCode, // Masuk ke Kolom C (Kode Negara hasil Gemini / Sheet)
          address: cleanedAddress.length > 50 ? "" : cleanedAddress, // Masuk ke Kolom D
          phone: "",                      // Masuk ke Kolom E
          email: extractedEmail,          // Masuk ke Kolom F (Aman, bernilai "" jika gagal/kredit habis)
          website: domain,                // Masuk ke Kolom G
          keyword: entry.keyword          // Masuk ke Kolom H
        });
      }
    }

    // 6. Kirim hasil dalam satu Batch besar ke Google Sheets
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
