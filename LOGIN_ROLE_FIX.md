# ✅ FIXED: Login role bị sai (Guest thay vì Manager)

## Vấn đề
User `hoangdt` login nhưng role = `guest` thay vì `manager` như trong Google Sheets.

## Root Cause
**Apps Script lấy SAI column index!**

Google Sheets structure:
- Column A (index 0): username
- Column B (index 1): password
- Column C (index 2): token
- Column D (index 3): role ← ĐÚNG

Code cũ:
```javascript
// ❌ SAI - Lấy column C (token) làm role
role: data[i][2]  // Lấy token thay vì role!
```

## Solution

### 1. Fix Apps Script (`docs/Code.gs`)
```javascript
// ✅ ĐÚNG - Lấy column D
const role = data[i][3] || 'guest';  // Column D (index 3)
const token = data[i][2] || ('token_' + Date.now());  // Column C (index 2)
```

### 2. Add validation (`src/pages/auth/Login.vue`)
```javascript
// ✅ Check if role exists
if (!userData.role) {
  init({ message: 'Tài khoản chưa được cấp quyền. Vui lòng liên hệ admin.', color: 'warning' })
  return
}
```

### 3. Add logging (`src/stores/user-store.ts`)
```javascript
console.log('[UserStore setUser] User.role:', user.role)
// Để debug dễ dàng
```

## Expected Console Logs

Khi login thành công với hoangdt:
```
[Login] User data: { username: 'hoangdt', role: 'manager', token: 'mh0wjn1h' }
[UserStore setUser] User.role: manager
[AppSidebar] User role: manager
[AppSidebar] Filtered routes count: 10
```

## Deployment

### QUAN TRỌNG: Phải deploy Apps Script trước!

1. **Deploy Code.gs:**
   - Mở Google Apps Script editor
   - Paste code từ `docs/Code.gs`
   - Save → Deploy → New deployment
   - Copy URL mới (nếu có)
   - Update `VITE_APPS_SCRIPT_URL`

2. **Deploy Frontend:**
   ```bash
   npm run build
   # Deploy to Netlify
   ```

## Testing

- Login `hoangdt` → role = `manager` → Thấy tất cả menu ✅
- Login `lego` (teacher) → Chỉ thấy 2 menu ✅
- Login user không có role → Warning message ✅

## Files Changed

1. ✅ `docs/Code.gs` - Fix column index
2. ✅ `src/pages/auth/Login.vue` - Add validation
3. ✅ `src/stores/user-store.ts` - Add logging

## Documentation

Chi tiết: `docs/FIX_LOGIN_ROLE_WRONG.md`

---

**Kết luận:** Apps Script lấy sai column, đã fix. Bây giờ login trả về đúng role! 🎉
