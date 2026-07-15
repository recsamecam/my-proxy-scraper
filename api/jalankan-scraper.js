export default async function handler(req, res) {
  try {
    const GOOGLE_URL = "https://script.google.com/macros/s/AKfycbzwavjSaWjF9G1t9w0iTSEfJKUt-51O06JV2nwhcAEoWJcKf-7GzMFZsjDB82u4jgM/exec";
    
    const payload = {
      company: "Charcoal Grill Experts",
      name: "PIC Name",
      countryCode: "US", // Cukup kirim kode negara
      address: "123 Main St, Los Angeles", // Alamat tanpa negara
      phone: "+123456789",
      email: "email@target.com",
      website: "charcoalgrill.com", // Tanpa https
      keyword: "CHARCOAL GRILLS"    // Keyword yang dicari di tab Keywords
    };

    const response = await fetch(GOOGLE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await response.text();
    return res.status(200).json({ status: "Success", response: result });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
