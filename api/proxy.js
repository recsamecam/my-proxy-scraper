export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ status: "Ready", message: "Scraper API siap." });
  }

  const { keyword, countryCode } = req.body || {};
  if (!keyword || !countryCode) {
    return res.status(400).json({ error: "Missing keyword or countryCode" });
  }

  try {
    const optimizedQuery = `${keyword} -site:amazon.com -site:alibaba.com -site:indiamart.com -site:wikipedia.org -site:instageram.com -site:youtube.com -site:facebook.com -site:linkedin.com`;

    const searchResponse = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: { "X-API-KEY": process.env.SERPER_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ q: optimizedQuery, gl: countryCode.toLowerCase() })
    });
    
    const searchData = await searchResponse.json();
    const organic = searchData.organic?.[0];

    if (!organic) throw new Error("Tidak ada hasil yang relevan");

    // --- TAMBAHKAN LOGIKA BLACKLIST DI SINI ---
    const domain = new URL(organic.link).hostname.toLowerCase();
    const blacklistedDomains = ['amazon', 'alibaba', 'indiamart', 'facebook', 'linkedin', 'carrefour'];
    
    if (blacklistedDomains.some(b => domain.includes(b))) {
       return res.status(200).json({ status: 'Ignored', message: 'Marketplace diblokir' });
    }
    // ------------------------------------------

    // Lanjut cari email via Hunter.io
    const domainForHunter = domain.replace('www.', '');
    let email = "Not Found";
    
    try {
      const hunterRes = await fetch(`https://api.hunter.io/v2/domain-search?domain=${domainForHunter}&api_key=${process.env.HUNTER_API_KEY}`);
      const hunterData = await hunterRes.json();
      if (hunterData.data?.emails?.length > 0) {
        email = hunterData.data.emails[0].value;
      }
    } catch (e) {
      console.log("Hunter error, lanjut...");
    }

    // Kirim data ke Google Sheets
    const payload = {
      company: organic.title,
      name: "N/A",
      country: countryCode,
      address: "N/A",
      phone: "N/A",
      email: email,
      website: organic.link
    };

    const gasRes = await fetch("https://script.google.com/macros/s/AKfycbzwavjSaWjF9G1t9w0iTSEfJKUt-51O06JV2nwhcAEoWJcKf-7GzMFZsjDB82u4jgM/exec", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    // Tambahkan baris ini untuk melihat hasil kiriman di log Vercel
    const textRes = await gasRes.text();
    console.log("Respon dari Google Sheets:", textRes);

    res.status(200).json({ status: 'Success', details: payload, googleResponse: textRes });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
