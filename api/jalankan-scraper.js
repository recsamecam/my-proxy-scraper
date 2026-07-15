export default async function handler(req, res) {
  try {
    console.log("Memulai pengiriman data ke Google Sheets...");

    const GOOGLE_URL = "https://script.google.com/macros/s/AKfycbzwavjSaWjF9G1t9w0iTSEfJKUt-51O06JV2nwhcAEoWJcKf-7GzMFZsjDB82u4jgM/exec"; 

    // Pastikan data ini diisi dengan hasil scraping asli Anda
    const payload = { 
      company: "Contoh Perusahaan",
      name: "Kontak",
      countryCode: "US",       // Perhatikan: Gunakan countryCode sesuai doPost
      address: "Alamat",
      phone: "000",
      email: "test@test.com",
      website: "https://web.com",
      keyword: "CHARCOAL GRILLS",
      gmt: "GMT+7",
      lang: "en"
    };

    const response = await fetch(GOOGLE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await response.text();
    console.log("Respon dari Google:", result);

    return res.status(200).json({ status: "Success", dataSent: payload, googleResponse: result });

  } catch (err) {
    console.error("ERROR TERJADI:", err);
    return res.status(500).json({ error: err.message });
  }
}
