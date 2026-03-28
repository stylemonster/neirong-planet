// api/generate.js
// Vercel Serverless Function — 所有 AI 请求都走这里
// API Key 存在环境变量里，前端永远看不到

export default async function handler(req, res) {
  // 只允许 POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── 1. 读取请求体 ──────────────────────────────────────────
  const { token, prompt, maxTokens = 1000 } = req.body || {};

  if (!prompt) {
    return res.status(400).json({ error: '缺少 prompt 参数' });
  }

  // ── 2. 验证用户 token，查询套餐和剩余次数 ───────────────────
  // 生产环境：接入真实数据库（如 Vercel KV、PlanetScale、Supabase）
  // 这里用环境变量模拟一个用户表，格式：
  // USER_TOKENS = "token1:pro:200,token2:free:30,token3:team:999"
  const usersRaw = process.env.USER_TOKENS || '';
  const users = {};
  usersRaw.split(',').forEach(entry => {
    const [t, plan, credits] = entry.trim().split(':');
    if (t) users[t] = { plan, credits: parseInt(credits) || 0 };
  });

  const user = token ? users[token] : null;

  // 免费试用：无 token 也给 3 次体验
  let allowedCredits = 3;
  let planName = 'trial';
  if (user) {
    allowedCredits = user.credits;
    planName = user.plan;
  }

  if (allowedCredits <= 0) {
    return res.status(403).json({
      error: '生成次数已用完，请升级套餐',
      code: 'NO_CREDITS'
    });
  }

  // ── 3. 调用 Claude API（Key 只在服务端） ────────────────────
  const CLAUDE_KEY = process.env.ANTHROPIC_API_KEY;
  if (!CLAUDE_KEY) {
    return res.status(500).json({ error: '服务配置错误，请联系管理员' });
  }

  try {
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: Math.min(maxTokens, 2000),
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!claudeRes.ok) {
      const err = await claudeRes.text();
      console.error('Claude API error:', err);
      return res.status(502).json({ error: 'AI 服务暂时不可用，请稍后重试' });
    }

    const data = await claudeRes.json();
    const text = data.content?.[0]?.text || '';

    // ── 4. 扣减次数（生产环境写回数据库） ──────────────────────
    // TODO: 接入数据库后在这里 UPDATE credits -= 1
    // 示例：await db.run('UPDATE users SET credits = credits - 1 WHERE token = ?', token)

    return res.status(200).json({
      text,
      creditsLeft: allowedCredits - 1,
      plan: planName
    });

  } catch (e) {
    console.error('Generate error:', e);
    return res.status(500).json({ error: '服务器错误，请稍后重试' });
  }
}
