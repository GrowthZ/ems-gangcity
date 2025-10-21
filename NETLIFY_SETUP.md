# Quick Guide: Deploy to Netlify với Environment Variables

## 🚀 Cách Nhanh Nhất (CLI)

### 1. Run Script Tự Động
```bash
chmod +x setup-netlify-env.sh
./setup-netlify-env.sh
```

Script sẽ tự động:
- ✅ Cài Netlify CLI (nếu chưa có)
- ✅ Login vào Netlify
- ✅ Link site
- ✅ Set tất cả environment variables
- ✅ Verify

### 2. Deploy
```bash
netlify deploy --prod
```

---

## 🖱️ Cách Qua UI (Dashboard)

### Truy cập:
```
https://app.netlify.com/sites/YOUR-SITE-NAME/settings/env
```

### Thêm 3 biến sau:

**1. VITE_GOOGLE_SHEETS_API_KEY**
```
AIzaSyC9NlfiP4qs-Hfaej4RpmxxWXRcAoKM7ao
```

**2. VITE_GOOGLE_SHEET_ID**
```
1HhIpXU6Egq9MZmyCAvPnEjCT8V4n9soD7EY4LQ8Nt0w
```

**3. VITE_APPS_SCRIPT_URL**
```
https://script.google.com/macros/s/AKfycbwYzdx-Bswcg5OxvIg7uFD0ki3dRg6MI_z_BfGtHaRkLelqW4bjOFOsLEJVZxdjh6Rs/exec
```

### Sau đó:
- Click "Save"
- Trigger redeploy

---

## ⚡ Manual CLI Commands

```bash
# Login
netlify login

# Link site
netlify link

# Set variables
netlify env:set VITE_GOOGLE_SHEETS_API_KEY "AIzaSyC9NlfiP4qs-Hfaej4RpmxxWXRcAoKM7ao"
netlify env:set VITE_GOOGLE_SHEET_ID "1HhIpXU6Egq9MZmyCAvPnEjCT8V4n9soD7EY4LQ8Nt0w"
netlify env:set VITE_APPS_SCRIPT_URL "https://script.google.com/macros/s/AKfycbwYzdx-Bswcg5OxvIg7uFD0ki3dRg6MI_z_BfGtHaRkLelqW4bjOFOsLEJVZxdjh6Rs/exec"

# Verify
netlify env:list

# Deploy
netlify deploy --prod
```

---

## 📝 Note Quan Trọng

1. **Tất cả biến phải bắt đầu với `VITE_`** để Vite expose cho client
2. **Phải redeploy sau khi thêm biến**
3. **Không commit file `.env`** lên git (đã có trong .gitignore)

---

## ✅ Verify Thành Công

Sau khi deploy, kiểm tra:
- Site loads bình thường
- Console không có errors về missing env vars
- Data được load từ Google Sheets
- Có thể tạo/update data qua Apps Script

---

**Xem hướng dẫn đầy đủ:** `docs/NETLIFY_ENV_SETUP.md`
