export default async function handler(req, res) {
  try {
    console.log("Memulai proses scraping...");

    // --- LOGIKA SCRAPING ANDA ---
    // Ganti bagian ini dengan fungsi scraping asli Anda
// --- LOGIKA SCRAPING ANDA ---
const dataHasilScrape = {
  company: "Nama Perusahaan Asli", // Ini akan masuk ke Kolom A
  name: "Nama Kontak/PIC",         // Ini akan masuk ke Kolom B
  countryCode: "US",              // Ini akan masuk ke Kolom C
  address: "Alamat Lengkap",      // Ini akan masuk ke Kolom D
  phone: "123456789",             // Ini akan masuk ke Kolom E
  email: "email@perusahaan.com",  // Ini akan masuk ke Kolom F
  website: "https://web.com",     // Ini akan masuk ke Kolom G
  keyword: "CHARCOAL GRILLS",     // Ini dipakai untuk cari Commodity di tab Keywords
  gmt: "GMT+7",                   // Ini akan masuk ke Kolom U
  lang: "en"                      // Ini akan masuk ke Kolom V
};
      // Tambahkan field lainnya sesuai kebutuhan
    };

    // --- MENGIRIM KE GOOGLE SHEETS ---
    const GOOGLE_URL = "https://script.google.com/macros/s/AKfycbzwavjSaWjF9G1t9w0iTSEfJKUt-51O06JV2nwhcAEoWJcKf-7GzMFZsjDB82u4jgM/exec";

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
