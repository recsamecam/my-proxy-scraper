export default async function handler(req, res) {
  const GAS_URL = "YOUR_GAS_URL"; // Pastikan sudah benar
  const SERPER_API_KEY = "7bdaceeb53e7779804418dabda1cbc871b26b364";
  const HUNTER_API_KEY = "a3726c29ee95939ac553de002379c3b2edeaa344";

  const blacklist = ["amazon.", "alibaba.", "shopee.", "tiktok.", "instagram.", "facebook.", "twitter.", "reddit.", "quora.", "linkedin.", "myshopify.", "lazada.", "tokopedia.", "ebay."];

  try {
    const kwRes = await fetch(GAS_URL);
    const keywords = await kwRes.json();
    let allPayloads = [];

    // 1. Scraping Serper (Bisa diparalelkan dengan Promise.all)
    for (const entry of keywords) {
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

        // 2. Fetch ke Hunter (Hanya 1x per domain)
        const hRes = await fetch(`https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${HUNTER_API_KEY}`);
        const hData = await hRes.json();

        allPayloads.push({
          company: item.title || domain,
          name: "",
          countryCode: entry.countryCode || "",
          address: item.snippet?.length > 50 ? "" : item.snippet || "",
          phone: "",
          email: hData.data?.emails?.[0]?.value || "",
          website: domain,
          keyword: entry.keyword
        });
      }
    }

    // 3. Kirim hasil dalam satu Batch besar ke Google Sheets
    if (allPayloads.length > 0) {
      await fetch(GAS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(allPayloads) // Mengirim array sekaligus
      });
    }

    return res.status(200).json({ status: "Success", processedCount: allPayloads.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
