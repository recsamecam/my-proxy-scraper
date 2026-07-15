export default async function handler(req, res) {
  // Hanya ijinkan Vercel Cron untuk menjalankan ini
  if (req.headers.get('x-vercel-cron') !== '1') {
    // Bisa dihapus jika Anda ingin bisa akses via browser
  }

  try {
    console.log("Memulai proses scraping...");
    
    // 1. Logika Scraper Anda (contoh ambil data)
    // const data = await scrapeData(); 
    const data = { 
      nama: "Contoh Perusahaan", 
      email: "info@contoh.com", 
      keyword: "Teknologi" 
    }; 

    // 2. Kirim ke Google Apps Script (Web App URL)
    const response = await fetch(process.env.GOOGLE_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" }
    });

    const result = await response.json();
    console.log("Data terkirim, hasil:", result);

    return res.status(200).json({ message: 'Scraping berhasil!', result });
  } catch (error) {
    console.error("DETAIL ERROR:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
