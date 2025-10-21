# Hướng Dẫn Cấu Hình Environment Variables Trên Netlify

## 📋 Các Biến Môi Trường Cần Thiết

### 1. **VITE_GOOGLE_SHEETS_API_KEY**
```
AIzaSyC9NlfiP4qs-Hfaej4RpmxxWXRcAoKM7ao
```
**Mục đích:** API key để đọc dữ liệu từ Google Sheets (API v4)

### 2. **VITE_GOOGLE_SHEET_ID**
```
1HhIpXU6Egq9MZmyCAvPnEjCT8V4n9soD7EY4LQ8Nt0w
```
**Mục đích:** ID của Google Sheet chứa dữ liệu

### 3. **VITE_APPS_SCRIPT_URL**
```
https://script.google.com/macros/s/AKfycbwYzdx-Bswcg5OxvIg7uFD0ki3dRg6MI_z_BfGtHaRkLelqW4bjOFOsLEJVZxdjh6Rs/exec
```
**Mục đích:** URL của Apps Script Web App (để ghi dữ liệu)

### 4. **VITE_API_MODE** (Optional)
```
apps-script
```
**Mục đích:** Chế độ API (mặc định: apps-script)

---

## 🚀 Cách Cấu Hình Trên Netlify

### Cách 1: Qua Netlify Dashboard (UI)

#### Bước 1: Vào Site Settings
```
1. Login vào Netlify: https://app.netlify.com
2. Chọn site của bạn (ems-gangcity)
3. Click vào "Site settings"
```

#### Bước 2: Mở Environment Variables
```
1. Sidebar → Environment variables
2. Hoặc trực tiếp: Site settings → Environment variables
```

#### Bước 3: Thêm Từng Biến

**Thêm VITE_GOOGLE_SHEETS_API_KEY:**
```
1. Click "Add a variable" hoặc "Add variable"
2. Key: VITE_GOOGLE_SHEETS_API_KEY
3. Value: AIzaSyC9NlfiP4qs-Hfaej4RpmxxWXRcAoKM7ao
4. Scopes: All deploys (hoặc Production only)
5. Click "Create variable"
```

**Thêm VITE_GOOGLE_SHEET_ID:**
```
1. Click "Add a variable"
2. Key: VITE_GOOGLE_SHEET_ID
3. Value: 1HhIpXU6Egq9MZmyCAvPnEjCT8V4n9soD7EY4LQ8Nt0w
4. Scopes: All deploys
5. Click "Create variable"
```

**Thêm VITE_APPS_SCRIPT_URL:**
```
1. Click "Add a variable"
2. Key: VITE_APPS_SCRIPT_URL
3. Value: https://script.google.com/macros/s/AKfycbwYzdx-Bswcg5OxvIg7uFD0ki3dRg6MI_z_BfGtHaRkLelqW4bjOFOsLEJVZxdjh6Rs/exec
4. Scopes: All deploys
5. Click "Create variable"
```

**Thêm VITE_API_MODE (Optional):**
```
1. Click "Add a variable"
2. Key: VITE_API_MODE
3. Value: apps-script
4. Scopes: All deploys
5. Click "Create variable"
```

#### Bước 4: Trigger Redeploy
```
1. Sau khi thêm xong các biến
2. Vào Deploys tab
3. Click "Trigger deploy" → "Deploy site"
4. Hoặc push code mới lên git để auto deploy
```

---

### Cách 2: Qua Netlify CLI

#### Bước 1: Cài Netlify CLI
```bash
npm install -g netlify-cli
```

#### Bước 2: Login
```bash
netlify login
```

#### Bước 3: Link Site
```bash
cd /home/hoangdt/Workspace/gang-city/ems-gangcity
netlify link
```

#### Bước 4: Set Environment Variables
```bash
# Set VITE_GOOGLE_SHEETS_API_KEY
netlify env:set VITE_GOOGLE_SHEETS_API_KEY "AIzaSyC9NlfiP4qs-Hfaej4RpmxxWXRcAoKM7ao"

# Set VITE_GOOGLE_SHEET_ID
netlify env:set VITE_GOOGLE_SHEET_ID "1HhIpXU6Egq9MZmyCAvPnEjCT8V4n9soD7EY4LQ8Nt0w"

# Set VITE_APPS_SCRIPT_URL
netlify env:set VITE_APPS_SCRIPT_URL "https://script.google.com/macros/s/AKfycbwYzdx-Bswcg5OxvIg7uFD0ki3dRg6MI_z_BfGtHaRkLelqW4bjOFOsLEJVZxdjh6Rs/exec"

# Set VITE_API_MODE (Optional)
netlify env:set VITE_API_MODE "apps-script"
```

#### Bước 5: Verify
```bash
# List all environment variables
netlify env:list

# Expected output:
# VITE_GOOGLE_SHEETS_API_KEY: AIzaSyC9NlfiP4qs-Hfaej4RpmxxWXRcAoKM7ao
# VITE_GOOGLE_SHEET_ID: 1HhIpXU6Egq9MZmyCAvPnEjCT8V4n9soD7EY4LQ8Nt0w
# VITE_APPS_SCRIPT_URL: https://script.google.com/macros/s/...
# VITE_API_MODE: apps-script
```

#### Bước 6: Deploy
```bash
netlify deploy --prod
```

---

### Cách 3: Qua netlify.toml (Không khuyến nghị cho sensitive data)

⚠️ **Lưu ý:** Không nên đặt API keys trực tiếp trong `netlify.toml` vì nó sẽ được commit lên Git.

Nếu muốn dùng cho development:
```toml
# netlify.toml
[build.environment]
  VITE_API_MODE = "apps-script"
  # KHÔNG ĐẶT API KEYS Ở ĐÂY!
```

---

## 📸 Screenshot Guide

### 1. Netlify Dashboard
```
https://app.netlify.com/sites/YOUR-SITE-NAME/settings/env
```

### 2. Environment Variables Page
```
┌─────────────────────────────────────────────────┐
│ Environment variables                            │
├─────────────────────────────────────────────────┤
│                                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ + Add a variable                            │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ Key                          Value              │
│ ────────────────────────────────────────────── │
│ VITE_GOOGLE_SHEETS_API_KEY   AIza...          │
│ VITE_GOOGLE_SHEET_ID         1HhI...          │
│ VITE_APPS_SCRIPT_URL         https://...      │
│ VITE_API_MODE                apps-script       │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## ✅ Verification Checklist

### Sau khi cấu hình, kiểm tra:

- [ ] Tất cả 3 biến bắt buộc đã được thêm:
  - [ ] VITE_GOOGLE_SHEETS_API_KEY
  - [ ] VITE_GOOGLE_SHEET_ID
  - [ ] VITE_APPS_SCRIPT_URL

- [ ] Deploy lại site (trigger redeploy)

- [ ] Check build logs:
  ```
  Building with environment variables:
  VITE_GOOGLE_SHEETS_API_KEY: defined
  VITE_GOOGLE_SHEET_ID: defined
  VITE_APPS_SCRIPT_URL: defined
  ```

- [ ] Test trên production site:
  - [ ] Site loads successfully
  - [ ] Can read data from Google Sheets
  - [ ] Can write data via Apps Script
  - [ ] No console errors about missing env vars

---

## 🐛 Troubleshooting

### Issue 1: Biến không được load
```
❌ import.meta.env.VITE_GOOGLE_SHEETS_API_KEY is undefined
```

**Giải pháp:**
1. Check tên biến phải bắt đầu với `VITE_`
2. Trigger redeploy sau khi thêm biến
3. Clear build cache: Deploys → Options → Clear cache and deploy

### Issue 2: API Key không hoạt động
```
❌ Google Sheets API error: API key not valid
```

**Giải pháp:**
1. Verify API key trong Google Cloud Console
2. Check API key restrictions (HTTP referrers)
3. Enable Google Sheets API v4

### Issue 3: Apps Script URL không hoạt động
```
❌ Failed to fetch from Apps Script
```

**Giải pháp:**
1. Verify Apps Script deployment
2. Check "Anyone" has access
3. Test URL trực tiếp trong browser

---

## 🔒 Security Best Practices

### 1. API Key Restrictions

**Google Cloud Console:**
```
1. APIs & Services → Credentials
2. Click vào API key
3. Application restrictions:
   - HTTP referrers (web sites)
   - Add: https://your-site.netlify.app/*
   - Add: https://*.netlify.app/* (cho preview deploys)

4. API restrictions:
   - Restrict key
   - Select: Google Sheets API
```

### 2. Separate Keys for Environments

```bash
# Production
VITE_GOOGLE_SHEETS_API_KEY=AIza...production...

# Preview/Branch deploys (optional)
VITE_GOOGLE_SHEETS_API_KEY=AIza...staging...
```

**Trong Netlify:**
```
Variable scopes:
- Production only
- All deploys
- Deploy previews only
```

### 3. Rotate Keys Regularly

```
1. Tạo API key mới
2. Update trong Netlify
3. Trigger redeploy
4. Delete key cũ sau 1 tuần
```

---

## 📋 Command Cheat Sheet

```bash
# Netlify CLI Commands
netlify login                    # Login to Netlify
netlify link                     # Link to existing site
netlify env:list                 # List all env vars
netlify env:get KEY              # Get specific var
netlify env:set KEY "value"      # Set env var
netlify env:unset KEY            # Remove env var
netlify deploy --prod            # Deploy to production
netlify open:site                # Open site in browser
netlify open:admin               # Open Netlify dashboard
```

---

## 🎯 Quick Setup Script

Tạo file `setup-netlify-env.sh`:

```bash
#!/bin/bash

echo "🚀 Setting up Netlify environment variables..."

netlify env:set VITE_GOOGLE_SHEETS_API_KEY "AIzaSyC9NlfiP4qs-Hfaej4RpmxxWXRcAoKM7ao"
netlify env:set VITE_GOOGLE_SHEET_ID "1HhIpXU6Egq9MZmyCAvPnEjCT8V4n9soD7EY4LQ8Nt0w"
netlify env:set VITE_APPS_SCRIPT_URL "https://script.google.com/macros/s/AKfycbwYzdx-Bswcg5OxvIg7uFD0ki3dRg6MI_z_BfGtHaRkLelqW4bjOFOsLEJVZxdjh6Rs/exec"
netlify env:set VITE_API_MODE "apps-script"

echo "✅ Environment variables set!"
echo ""
echo "Verifying..."
netlify env:list

echo ""
echo "🎉 Done! Now run: netlify deploy --prod"
```

**Usage:**
```bash
chmod +x setup-netlify-env.sh
./setup-netlify-env.sh
```

---

## 📝 Important Notes

1. **Vite Prefix:** Tất cả environment variables phải bắt đầu với `VITE_` để được expose cho client
2. **Redeploy Required:** Sau khi thêm/sửa biến, phải deploy lại
3. **Build Time:** Biến được inject lúc build, không phải runtime
4. **Security:** Chỉ đặt public data trong env vars (API keys được restricted)
5. **Git:** Không commit `.env` file (đã có trong `.gitignore`)

---

## ✅ Final Checklist

- [ ] Netlify CLI đã cài đặt
- [ ] Đã login và link site
- [ ] Tất cả env vars đã được set
- [ ] Đã verify bằng `netlify env:list`
- [ ] Đã deploy lại site
- [ ] Site hoạt động bình thường
- [ ] Không có errors trong console
- [ ] API key đã được restrict (Google Cloud Console)

---

**Deploy thành công! 🎉**
