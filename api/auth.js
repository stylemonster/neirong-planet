// api/auth.js
// 处理登录、注册、套餐查询

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { action, email, password, token } = req.body || {};

  // ── 用户表（生产环境换成真实数据库） ─────────────────────────
  // 环境变量格式: USER_ACCOUNTS = "email:password:token:plan:credits"
  const accountsRaw = process.env.USER_ACCOUNTS || '';
  const accounts = {};
  accountsRaw.split('|').forEach(entry => {
    const parts = entry.trim().split(':');
    if (parts.length >= 4) {
      const [e, p, t, plan, credits] = parts;
      accounts[e] = { password: p, token: t, plan, credits: parseInt(credits) || 0 };
    }
  });

  // ── 登录 ────────────────────────────────────────────────────
  if (action === 'login') {
    const user = accounts[email];
    if (!user || user.password !== password) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }
    return res.status(200).json({
      token: user.token,
      plan: user.plan,
      credits: user.credits,
      email
    });
  }

  // ── 验证 token（页面刷新时恢复登录状态） ─────────────────────
  if (action === 'verify') {
    const user = Object.values(accounts).find(u => u.token === token);
    if (!user) return res.status(401).json({ error: 'token 无效或已过期' });
    const email = Object.keys(accounts).find(e => accounts[e].token === token);
    return res.status(200).json({
      token,
      plan: user.plan,
      credits: user.credits,
      email
    });
  }

  return res.status(400).json({ error: '未知操作' });
}
