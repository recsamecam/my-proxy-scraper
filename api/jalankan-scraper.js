export default async function handler(req, res) {
  try {
    console.log("Memulai eksekusi...");

    // Ganti bagian di bawah ini dengan URL Web App Anda yang diakhiri dengan /exec
    const GOOGLE_URL = "https://script.google.com/macros/s/AKfycbzwavjSaWjF9G1t9w0iTSEfJKUt-51O06JV2nwhcAEoWJcKf-7GzMFZsjDB82u4jgM/exec"; 

    const payload = { 
      nama: "Test", 
      email: "test@test.com" 
    };

    console.log("Mencoba kirim ke:", GOOGLE_URL);

    const response = await fetch(GOOGLE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await response.text();
    console.log("Respon dari Google:", result);

    return res.status(200).json({ status: "Success", response: result });
  } catch (err) {
    console.error("ERROR TERJADI:", err);
    return res.status(500).json({ error: err.message });
  }
}
