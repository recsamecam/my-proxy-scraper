const publicDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'live.com', 'microsoft.com'];

export default async function handler(req, res) {
  const { keyword, countryCode } = req.body;
  
  // 1. Fetch dari Google Maps (via Serper API)
  const places = await fetch('https://google.serper.dev/places', {
    method: 'POST',
    headers: { 'X-API-KEY': process.env.SERPER_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: `${keyword} in ${countryCode}` })
  }).then(r => r.json());

  for (const place of places.places) {
    const domain = new URL(place.website).hostname.replace('www.', '');
    if (publicDomains.some(d => domain.includes(d))) continue;

    // 2. Fetch Email dari Hunter.io
    const hunter = await fetch(`https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${process.env.HUNTER_API_KEY}`);
    const hData = await hunter.json();
    
    if (hData.data?.emails.length > 0) {
      // 3. Kirim ke Google Sheets
      await fetch(process.env.GAS_WEBAPP_URL, {
        method: 'POST',
        body: JSON.stringify({
          name: place.title,
          website: place.website,
          email: hData.data.emails[0].value,
          gmt: 7, // Sesuaikan dengan Config/Mapping
          lang: 'id'
        })
      });
    }
  }
  res.status(200).json({ status: 'Done' });
}
