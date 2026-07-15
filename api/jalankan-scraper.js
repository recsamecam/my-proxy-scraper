export default async function handler(req, res) {
  // Ganti dengan URL Web App Google Script Anda
  const GAS_URL = "https://script.google.com/macros/s/AKfycbzwavjSaWjF9G1t9w0iTSEfJKUt-51O06JV2nwhcAEoWJcKf-7GzMFZsjDB82u4jgM/exec";
  const SERPER_API_KEY = "7bdaceeb53e7779804418dabda1cbc871b26b364";
  const HUNTER_API_KEY = "a3726c29ee95939ac553de002379c3b2edeaa344";

  // Fungsi pembantu untuk membersihkan domain menjadi nama perusahaan
  function cleanDomainToName(domain) {
    let name = domain.split('.')[0];
    name = name.replace(/[-_]/g, ' ');
    return name.replace(/\b\w/g, c => c.toUpperCase());
  }

  try {
    const kwRes = await fetch(GAS_URL);
    if (!kwRes.ok) throw new Error("Gagal mengambil data dari Google Sheets");
    const keywords = await kwRes.json();
    
    let processedLogs = [];

    for (const entry of keywords) {
      const serperRes = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 
          'X-API-KEY': SERPER_API_KEY, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          q: `${entry.keyword} in ${entry.countryName}`, 
          num: 3 
        })
      });
      const serperData = await serperRes.json();

      if (!serperData.organic) continue;

      for (const item of serperData.organic) {
        try {
          const domain = new URL(item.link).hostname.replace('www.', '').toLowerCase();
          
          const blacklist = [
            "amazon.", "alibaba.", "shopee.", "tiktok.", "instagram.", 
            "facebook.", "twitter.", "reddit.", "quora.", "linkedin.", 
            "myshopify.", "lazada.", "tokopedia.", "ebay."
          ];
          
          const isBlacklisted = blacklist.some(site => domain.includes(site));
          if (isBlacklisted) {
            processedLogs.push(`Skipped ${domain}: Blacklisted`);
            continue; 
          }
          
          const hRes = await fetch(`https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${HUNTER_API_KEY}`);
          const hData = await hRes.json();

          let rawAddress = item.snippet || "";
          let cleanAddress = rawAddress.length > 50 ? "" : rawAddress.replace(/,\s*(USA|United States|US)$/i, "").trim();

          // LOGIKA PEMBERSIHAN NAMA PERUSAHAAN
          let companyName = item.title || "";
          if (companyName.length > 40 || companyName.toLowerCase().includes("|") || companyName.toLowerCase().includes("home")) {
            companyName = cleanDomainToName(domain);
          }

          const payload = {
            company: companyName,
            name: "",
            countryCode: entry.countryCode || "",
            address: cleanAddress,
            phone: "",
            email: hData.data?.emails?.[0]?.value || "",
            website: domain || "",
            keyword: entry.keyword || ""
          };

          const gRes = await fetch(GAS_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          
          const status = await gRes.text();
          processedLogs.push(`Processed ${domain}: ${status}`);
        } catch (err) {
          console.error(`Gagal memproses domain: ${item.link}`, err);
        }
      }
    }

    return res.status(200).json({ status: "Success", details: processedLogs });
  } catch (err) {
    console.error("Critical Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
