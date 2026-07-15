export default async function handler(req, res) {
  try {
    console.log("Memulai eksekusi...");

    // URL Web App Anda
    const GOOGLE_URL = "https://script.google.com/macros/s/ISI_URL_ANDA/exec"; 

    const payload = { 
      company: "Contoh Perusahaan",
      name: "Kontak",
      country: "US",
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

    return res.status(200).json({ status: "Success", response: result });

  } catch (err) {
    // INI ADALAH BAGIAN YANG TADI HILANG (PENTING!)
    console.error("ERROR TERJADI:", err);
    return res.status(500).json({ error: err.message });
  }
}
