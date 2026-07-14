export default async function handler(req, res) {
  // 1. Tambahkan pengecekan metode request agar tidak crash di browser
  if (req.method !== 'POST') {
    return res.status(200).json({ 
      status: "Ready", 
      message: "Scraper API siap. Silakan kirim data melalui metode POST." 
    });
  }

  // 2. Gunakan pengecekan keamanan sebelum melakukan destructuring
  const { keyword, countryCode } = req.body || {};
  
  if (!keyword || !countryCode) {
    return res.status(400).json({ error: "Missing keyword or countryCode" });
  }

  try {
    // ... sisa logika scraping Anda tetap sama di sini ...
    
    res.status(200).json({ status: 'Success' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
