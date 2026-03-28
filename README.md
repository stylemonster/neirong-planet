# 内容星球 SaaS — 部署指南

## 项目结构

```
saas-project/
├── api/
│   ├── generate.js      ← AI 生成接口（Key 藏在这里）
│   └── auth.js          ← 登录 / 验证接口
├── public/
│   └── index.html       ← 前端页面
├── vercel.json          ← Vercel 路由配置
└── .env.example         ← 环境变量模板
```

---

## 第一步：上传到 GitHub（5分钟）

1. 去 https://github.com/new 新建一个仓库，名称如 `neirong-planet`
2. 把整个 `saas-project` 文件夹拖进去上传（或用 GitHub Desktop）
3. 点击 Commit changes，完成

---

## 第二步：部署到 Vercel（5分钟）

1. 去 https://vercel.com，用 GitHub 账号登录
2. 点击 "Add New Project"，选择刚刚创建的仓库
3. 直接点 "Deploy"（不需要改任何设置）
4. 等待约 1 分钟，部署完成后会得到网址，如：
   `https://neirong-planet.vercel.app`

---

## 第三步：配置环境变量（最关键）

在 Vercel 控制台，点击项目 → Settings → Environment Variables，添加以下变量：

### ANTHROPIC_API_KEY
- 去 https://console.anthropic.com 注册并申请 API Key
- 值格式：`sk-ant-xxxxxxxxxxxxxxxx`
- 这个 Key 只存在 Vercel 服务器，用户永远看不到

### USER_ACCOUNTS
- 格式：`邮箱:密码:token:套餐:次数`
- 多个用户用 `|` 分隔
- 示例：
  ```
  wang@example.com:yourpassword:随机字符串abc:pro:200|zhu@example.com:zhupwd:随机字符串def:pro:200
  ```
- 生成随机 token：在终端运行 `openssl rand -hex 16`，或用 https://www.uuidgenerator.net

### USER_TOKENS
- 格式：`token:套餐:次数`，多个用逗号分隔
- 需与 USER_ACCOUNTS 中的 token 保持一致
- 示例：
  ```
  随机字符串abc:pro:200,随机字符串def:pro:200
  ```

配置完成后，点击 "Redeploy" 让新配置生效。

---

## 第四步：给学员开账号

每次有学员付款，在 Vercel 环境变量里追加一条用户记录，然后 Redeploy。
> 💡 提示：这是手动管理版本，适合学员人数 < 50 人时使用。
> 人数更多后，建议接入 Supabase 数据库（免费，下方有说明）。

---

## 收费怎么做

### 最快方案（今天就能收）
1. 微信/支付宝商家收款码，学员扫码付款
2. 付款截图发给您确认
3. 您手动在环境变量里开通账号

### 更自动的方案
- 国内：接入 "虎皮椒" 或 "Lemon Squeezy" 支付，付款后自动发送账号
- 国际：Stripe + Stripe Webhooks 自动开通

---

## 升级到真实数据库（100+用户后考虑）

推荐 Supabase（免费版 50000 行/月）：

1. 去 https://supabase.com 注册，新建项目
2. 创建 users 表：
   ```sql
   create table users (
     id uuid default gen_random_uuid() primary key,
     email text unique not null,
     password_hash text not null,
     token text unique not null,
     plan text default 'free',
     credits integer default 10,
     created_at timestamp default now()
   );
   ```
3. 把 `DATABASE_URL` 加入 Vercel 环境变量
4. 修改 `api/auth.js` 和 `api/generate.js` 中的注释部分，
   替换为真实的数据库查询

---

## 套餐对应关系

| plan 值 | 名称   | 每月次数 | 价格  |
|---------|--------|----------|-------|
| trial   | 体验版  | 3次      | 免费  |
| free    | 免费版  | 10次     | ¥0    |
| pro     | 专业版  | 200次    | ¥89   |
| team    | 团队版  | 无限     | ¥299  |

---

## 常见问题

**Q：学员忘记密码怎么办？**
A：在 Vercel 环境变量里找到该用户，修改密码字段，Redeploy 即可。

**Q：如何给某个用户增加次数？**
A：修改 USER_ACCOUNTS 和 USER_TOKENS 中对应用户的 credits 数字，Redeploy。

**Q：可以限制某个账号的访问吗？**
A：把该用户的 credits 改为 0，即可阻止使用。

**Q：Vercel 每月免费额度够用吗？**
A：Vercel 免费版支持 100GB 带宽/月、100 万次函数调用/月，
   100 个用户正常使用完全够用，超出才需要升级（$20/月）。
