// api/generate.js  鈫?Vercel Serverless Function
// 蹇呴』鐢?CommonJS (module.exports)锛屼笉鑳界敤 export default

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // 鈹€鈹€ 1. 瑙ｆ瀽璇锋眰浣擄紙Vercel 鏈夋椂 body 鏄瓧绗︿覆锛夆攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const { token, prompt, maxTokens = 1000 } = body || {};
  if (!prompt) return res.status(400).json({ error: '缂哄皯 prompt 鍙傛暟' });

  // 鈹€鈹€ 2. 妫€鏌?API Key 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
  const CLAUDE_KEY = process.env.ANTHROPIC_API_KEY;
  if (!CLAUDE_KEY) {
    console.error('[generate] ANTHROPIC_API_KEY 鏈厤缃?);
    return res.status(500).json({
      error: '鏈嶅姟閰嶇疆閿欒锛欰NTHROPIC_API_KEY 鏈缃紝璇峰湪 Vercel 鐜鍙橀噺涓厤缃悗閲嶆柊閮ㄧ讲'
    });
  }

  // 鈹€鈹€ 3. 楠岃瘉鐢ㄦ埛 token 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
  const usersRaw = process.env.USER_TOKENS || '';
  const users = {};
  usersRaw.split(',').forEach(entry => {
    const parts = entry.trim().split(':');
    if (parts.length >= 2) {
      const [t, plan, credits] = parts;
      if (t) users[t] = { plan: plan || 'free', credits: parseInt(credits) || 0 };
    }
  });

  const user = token ? users[token] : null;
  const allowedCredits = user ? user.credits : 3;
  const planName = user ? user.plan : 'trial';

  if (planName !== 'team' && allowedCredits <= 0) {
    return res.status(403).json({ error: '鐢熸垚娆℃暟宸茬敤瀹岋紝璇峰崌绾у椁?, code: 'NO_CREDITS' });
  }

  // 鈹€鈹€ 4. 璋冪敤 Claude API 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
  try {
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: Math.min(maxTokens, 2000),
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!claudeRes.ok) {
      const errText = await claudeRes.text();
      console.error('[generate] Claude API 閿欒', claudeRes.status, errText);
      return res.status(502).json({
        error: `Claude API 杩斿洖閿欒 (${claudeRes.status})锛岃绋嶅悗閲嶈瘯`
      });
    }

    const data = await claudeRes.json();
    const text = data.content?.[0]?.text || '';

    return res.status(200).json({
      text,
      creditsLeft: planName === 'team' ? 9999 : allowedCredits - 1,
      plan: planName
    });

  } catch (e) {
    console.error('[generate] 閿欒:', e.message);
    return res.status(500).json({ error: '璋冪敤 AI 鏈嶅姟鏃跺嚭閿欙細' + e.message });
  }
};
