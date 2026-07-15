export default async function handler(req, res) {
  try {
    console.log("Memulai proses scraping...");
    
    // GANTI baris di bawah ini dengan pemanggilan fungsi scraper Anda yang sebenarnya
    // Contoh: await fungsiScraperAnda(); 
    
    console.log("Scraping selesai!");
    return res.status(200).json({ message: 'Scraping berhasil dijalankan!' });
    
  } catch (error) {
    // INI BAGIAN PENTING: Mencetak pesan error detail ke Logs
    console.error("DETAIL ERROR:", error.message);
    console.error("STACK TRACE:", error.stack);
    
    return res.status(500).json({ 
      error: 'Gagal menjalankan scraping', 
      details: error.message 
    });
  }
}
