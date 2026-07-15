export default async function handler(req, res) {
  try {
    console.log("Memulai proses scraping...");

    // --- LOGIKA SCRAPING ANDA ---
    // Ganti bagian ini dengan fungsi scraping asli Anda
    const dataHasilScrape = {
      nama: "Contoh Data Scraper",
      email: "hasil@scrape.com",
      // Tambahkan field lainnya sesuai kebutuhan
    };

    // --- MENGIRIM KE GOOGLE SHEETS ---
    const GOOGLE_URL = "https://script.google.com/macros/s/ISI_URL_WEB_APP_ANDA/exec";

    const response = await fetch(GOOGLE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dataHasilScrape)
    });

    const result = await response.text();
    console.log("Respon dari Google:", result);

    return res.status(200).json({ status: "Success", data: dataHasilScrape });
  } catch (err) {
    console.error("ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}
