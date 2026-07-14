const fetch = require('node-fetch');

export default async function handler(req, res) {
  // Kredensial resmi Anda
  const SERPER_API_KEY = "7bdaceeb53e7779804418dabda1cbc871b26b364";
  const webhookUrl = "https://script.google.com/macros/s/AKfycbzwavjSaWjF9G1t9w0iTSEfJKUt-51O06JV2nwhcAEoWJcKf-7GzMFZsjDB82u4jgM/exec?token=rahasia123";
  
  const keyword = req.query.keyword;

  if (!keyword) {
    return res.status(400).json({ error: "Parameter 'keyword' wajib diisi" });
  }

  try {
    // 1. Panggil Endpoint Google Maps milik Serper.dev
    const response = await fetch('https://google.serper.dev/maps', {
      method: 'POST',
      headers: { 
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ q: keyword, num: 10 }) // Mengambil 10 data tempat teratas
    });

    const data = await response.json();
    const results = data.places || [];
    const tanggalSekarang = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });

    // 2. Kirim data ke Google Sheets dengan pemisahan Alamat & Negara yang akurat
    for (const place of results) {
      
      // Logika Pemisahan Alamat Fisik vs Negara
      let alamatFisik = place.address || "Alamat tidak tertera";
      let namaNegara = "Target Market";

      // Mendeteksi kata negara dari keyword input (misal: "Charcoal Saudi Arabia" -> "Saudi Arabia")
      const kataKunci = keyword.trim();
      const posisiSpasi = kataKunci.indexOf(' ');
      if (posisiSpasi !== -1) {
        namaNegara = kataKunci.substring(posisiSpasi + 1);
      }

      // Bersihkan nama negara dari bagian ujung alamat fisik jika terdeteksi, agar Kolom D bersih
      if (alamatFisik.toLowerCase().endsWith(namaNegara.toLowerCase())) {
        alamatFisik = alamatFisik.substring(0, alamatFisik.length - namaNegara.length).trim();
        // Hapus tanda koma tersisa di ujung jika ada
        if (alamatFisik.endsWith(',')) {
          alamatFisik = alamatFisik.substring(0, alamatFisik.length - 1).trim();
        }
      }

      const rowData = [
        place.title || "No Title",     // A: COMPANY (Nama Bisnis di Maps)
        "PIC / Procurement",           // B: NAME
        namaNegara,                    // C: COUNTRY (Hanya nama negara)
        alamatFisik,                   // D: ADDRESS (Alamat bersih tanpa nama negara di ujung)
        place.phoneNumber || "",       // E: PHONE (Nomor telepon resmi dari Google Maps!)
        "",                            // F: EMAIL (Kosong, karena Maps tidak menyediakan email)
        place.website || "",           // G: WEB (Website resmi perusahaan jika ada)
        "",                            // H: FB
        "Serper Maps API",             // I: SOURCE
        keyword,                       // J: Commodity
        "",                            // K: Commodity2
        "",                            // L: Commodity3
        "",                            // M: Commodity4
        "",                            // N: Commodity5
        "",                            // O: Commodity6
        "",                            // P: Commodity7
        `Rating: ${place.rating || '-'} (${place.ratingCount || 0} reviews) | Category: ${place.category || '-'}`, // Q: Remarks
        "",                            // R: LastSent
        "System",                      // S: By
        "",                            // T: Remarks2
        "WIB",                         // U: Timezone
        "en",                          // V: Language
        "",                            // W: AutocratTrigger
        "",                            // X: Remarks3
        tanggalSekarang                // Y: Date
      ];

      // Kirim hasil pemetaan ke Webhook Google Sheets
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowData: rowData })
      });
    }

    res.status(200).json({ 
      status: "Sukses", 
      message: `Berhasil mengambil ${results.length} data lokasi dari Google Maps untuk keyword: ${keyword}` 
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
