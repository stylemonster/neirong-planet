// api/auth.js  鈫?CommonJS锛屼笉鑳界敤 export default

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const { action, email, password, token } = body || {};

  // 鈹€鈹€ 鐢ㄦ埛琛紙鐢熶骇鐜鎹㈡垚鐪熷疄鏁版嵁搴擄級 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
  // 鐜鍙橀噺鏍煎紡: USER_ACCOUNTS = "email:password:token:plan:credits"
  const accountsRaw = process.env.USER_ACCOUNTS || '';
  const accounts = {};
  accountsRaw.split('|').forEach(entry => {
    const parts = entry.trim().split(':');
    if (parts.length >= 4) {
      const [e, p, t, plan, credits] = parts;
      accounts[e] = { password: p, token: t, plan, credits: parseInt(credits) || 0 };
    }
  });

  // 鈹€鈹€ 鐧诲綍 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
  if (action === 'login') {
    const user = accounts[email];
    if (!user || user.password !== password) {
      return res.status(401).json({ error: '閭鎴栧瘑鐮侀敊璇? });
    }
    return res.status(200).json({
      token: user.token,
      plan: user.plan,
      credits: user.credits,
      email
    });
  }

  // 鈹€鈹€ 楠岃瘉 token锛堥〉闈㈠埛鏂版椂鎭㈠鐧诲綍鐘舵€侊級 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
  if (action === 'verify') {
    const user = Object.values(accounts).find(u => u.token === token);
    if (!user) return res.status(401).json({ error: 'token 鏃犳晥鎴栧凡杩囨湡' });
    const email = Object.keys(accounts).find(e => accounts[e].token === token);
    return res.status(200).json({
      token,
      plan: user.plan,
      credits: user.credits,
      email
    });
  }

  return res.status(400).json({ error: '鏈煡鎿嶄綔' });
}
