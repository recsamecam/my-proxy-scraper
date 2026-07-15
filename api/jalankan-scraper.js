export default async function handler(req, res) {
  // Pastikan request datang dari Vercel Cron
  if (req.headers.get('x-vercel-cron') !== '1') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // 1. Masukkan logika scraper Anda di sini
    console.log("Memulai proses scraping...");
    
    // Contoh: Panggil fungsi scraper Anda
    // await runMyScraper(); 

    return res.status(200).json({ message: 'Scraping berhasil dijalankan!' });
  } catch (error) {
    console.error("Error saat scraping:", error);
    return res.status(500).json({ error: 'Gagal menjalankan scraping' });
  }
}
