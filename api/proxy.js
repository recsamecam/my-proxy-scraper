const fetch = require('node-fetch');

export default async function handler(req, res) {
  try {
    const targetUrl = req.query.url;
    if (!targetUrl) {
      return res.status(400).json({ error: "URL parameter diperlukan" });
    }

    const response = await fetch(targetUrl);
    const data = await response.text();
    
    res.status(200).send(data);
  } catch (error) {
    console.error("Detail Error:", error);
    res.status(500).json({ error: error.message });
  }
}