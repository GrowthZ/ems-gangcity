# ✅ Netlify Environment Variables - Checklist

## 📋 Pre-Deployment Checklist

- [ ] Đã có account Netlify
- [ ] Site đã được tạo trên Netlify (hoặc sẽ tạo mới)
- [ ] Netlify CLI đã cài đặt: `npm install -g netlify-cli`
- [ ] Đã có các giá trị env cần thiết

---

## 🔧 Setup Environment Variables

### Option 1: Automated Script (RECOMMENDED)

```bash
./setup-netlify-env.sh
```

**Checklist:**

- [ ] Script chạy thành công
- [ ] Đã login vào Netlify
- [ ] Site đã được link
- [ ] 4 biến đã được set:
  - [ ] VITE_GOOGLE_SHEETS_API_KEY
  - [ ] VITE_GOOGLE_SHEET_ID
  - [ ] VITE_APPS_SCRIPT_URL
  - [ ] VITE_API_MODE
- [ ] Verify bằng `netlify env:list` thành công

### Option 2: Manual UI Setup

**Access:** https://app.netlify.com → Your Site → Site settings → Environment variables

**Variables to add:**

- [ ] **VITE_GOOGLE_SHEETS_API_KEY**

  - Value: `AIzaSyC9NlfiP4qs-Hfaej4RpmxxWXRcAoKM7ao`
  - Scope: All deploys ✓

- [ ] **VITE_GOOGLE_SHEET_ID**

  - Value: `1HhIpXU6Egq9MZmyCAvPnEjCT8V4n9soD7EY4LQ8Nt0w`
  - Scope: All deploys ✓

- [ ] **VITE_APPS_SCRIPT_URL**

  - Value: `https://script.google.com/macros/s/AKfycbwYzdx-Bswcg5OxvIg7uFD0ki3dRg6MI_z_BfGtHaRkLelqW4bjOFOsLEJVZxdjh6Rs/exec`
  - Scope: All deploys ✓

- [ ] **VITE_API_MODE** (Optional)
  - Value: `apps-script`
  - Scope: All deploys ✓

---

## 🚀 Deployment

### Deploy Commands

```bash
# Deploy to production
netlify deploy --prod

# Or push to git (if auto-deploy is enabled)
git push origin main
```

**Checklist:**

- [ ] Build started
- [ ] Build logs show env vars: "VITE_GOOGLE_SHEETS_API_KEY: defined"
- [ ] Build succeeded
- [ ] Site deployed
- [ ] Deploy URL received

---

## ✅ Post-Deployment Verification

### 1. Check Build Logs

- [ ] No warnings about missing env vars
- [ ] Build completed successfully
- [ ] Assets optimized and generated

### 2. Test Production Site

- [ ] Site loads without errors
- [ ] Open browser console (F12)
- [ ] No errors about:
  - `import.meta.env.VITE_GOOGLE_SHEETS_API_KEY is undefined`
  - `import.meta.env.VITE_GOOGLE_SHEET_ID is undefined`
  - `import.meta.env.VITE_APPS_SCRIPT_URL is undefined`

### 3. Test Functionality

- [ ] **Read Operations:**

  - [ ] Can load student list
  - [ ] Can load attendance records
  - [ ] Can load payment records
  - [ ] Data displays correctly

- [ ] **Write Operations:**
  - [ ] Can create new student
  - [ ] Can mark attendance
  - [ ] Can create payment
  - [ ] Can update records
  - [ ] Can delete records (Financial Report)

### 4. Test Different Pages

- [ ] Dashboard loads
- [ ] Student page loads with data
- [ ] Attendance page works
- [ ] Payment page works
- [ ] Financial Report page works
- [ ] Settings page works

---

## 🔒 Security Checklist

### Google Cloud Console

- [ ] API key restrictions configured:
  - [ ] Application restrictions: HTTP referrers
  - [ ] Added: `https://your-site.netlify.app/*`
  - [ ] Added: `https://*.netlify.app/*`
  - [ ] API restrictions: Google Sheets API only

### Apps Script

- [ ] Deployment settings:
  - [ ] "Who has access": Anyone
  - [ ] Web App URL is correct
  - [ ] Latest version deployed

### Netlify

- [ ] Environment variables scoped correctly
- [ ] No sensitive data in git
- [ ] `.env` file in `.gitignore`
- [ ] Build logs don't expose sensitive values

---

## 🐛 Troubleshooting Checklist

### If env vars not working:

- [ ] **Checked variable names:**

  - All start with `VITE_`
  - No typos in names
  - Case-sensitive match

- [ ] **Triggered redeploy:**

  - Changes only apply after redeploy
  - Clear cache if needed

- [ ] **Checked build logs:**

  - Variables are "defined" in build
  - No errors during build

- [ ] **Verified in code:**
  - Using `import.meta.env.VITE_*`
  - Not using `process.env.*`

### If API calls fail:

- [ ] **API Key:**

  - Valid and not expired
  - Restrictions allow domain
  - Google Sheets API enabled

- [ ] **Sheet ID:**

  - Correct sheet ID
  - Sheet is shared (view access)
  - Range names correct

- [ ] **Apps Script:**
  - URL is correct
  - Deployed as web app
  - "Anyone" has access
  - Latest version

---

## 📊 Success Metrics

After successful deployment:

```
✅ Build Time: < 5 minutes
✅ Deploy Status: Published
✅ Site Status: Live
✅ Console Errors: 0
✅ API Calls: Working
✅ Data Loading: Fast
✅ User Experience: Smooth
```

---

## 📞 Support Resources

**Documentation:**

- `docs/NETLIFY_ENV_SETUP.md` - Detailed setup guide
- `NETLIFY_SETUP.md` - Quick reference
- `.env.example` - Template

**Commands:**

```bash
netlify help              # Help
netlify status           # Site status
netlify env:list         # List env vars
netlify logs             # View logs
netlify open:admin       # Open dashboard
netlify open:site        # Open site
```

**Links:**

- Netlify Dashboard: https://app.netlify.com
- Google Cloud Console: https://console.cloud.google.com
- Apps Script: https://script.google.com

---

## 🎉 Completion

When all checkboxes are marked:

```
✅ Environment variables configured
✅ Site deployed successfully
✅ All features working
✅ Security configured
✅ Ready for production use
```

**Your site is now live on Netlify with proper environment configuration! 🚀**
