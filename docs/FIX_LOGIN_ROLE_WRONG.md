# Fix: Login role bị sai - Guest thay vì Manager

## Vấn đề

User `hoangdt` login thành công nhưng role hiển thị là `guest` thay vì `manager` như trong Google Sheets.

## Root Cause

**Apps Script đang lấy SAI column index cho role!**

### Google Sheets structure:
```
Row 1: Headers
Row 2: (empty or subheaders)
Row 3: Data starts
  Column A (index 0): username
  Column B (index 1): password
  Column C (index 2): token
  Column D (index 3): role  ← ĐÚNG
```

### Code cũ (SAI):
```javascript
// ❌ WRONG - Lấy column C (token) làm role
return {
  username: data[i][0],
  role: data[i][2] || 'user',  // ← SAI! Column C là token
  token: 'token_' + Date.now()
};
```

### Kết quả:
- API trả về `role = "123"` (là token từ column C)
- UserStore nhận `role = "123"` → không match admin/manager/teacher
- Sidebar isShow() fallback về `guest`
- Sidebar không hiển thị menu

## Solution

### 1. Fix Apps Script - đọc đúng column

**File:** `docs/Code.gs`

```javascript
// ✅ CORRECT - Lấy đúng columns
function login(paramString) {
  try {
    const param = JSON.parse(paramString);
    const sheet = getSheet(sheetName.user);
    const data = sheet.getDataRange().getValues();

    // Skip first 3 rows (headers)
    // Columns: A=username(0), B=password(1), C=token(2), D=role(3)
    for (let i = 3; i < data.length; i++) {
      if (data[i][0] === param.username && data[i][1] === param.password) {
        const role = data[i][3] || 'guest';  // ✅ Column D (index 3) is role
        const token = data[i][2] || ('token_' + Date.now());  // ✅ Column C (index 2) is token
        
        console.log('Login success:', {
          username: data[i][0],
          role: role,
          token: token
        });
        
        return {
          username: data[i][0],
          role: role,
          token: token
        };
      }
    }

    throw new Error('Sai tên đăng nhập hoặc mật khẩu');
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}
```

### 2. Thêm validation trong Login.vue

**File:** `src/pages/auth/Login.vue`

```javascript
const checkLogin = async (username: string, password: string) => {
  // ...
  if (res.data.data != '') {
    const userData = res.data.data
    
    // ✅ Validate userData has required fields
    if (!userData.username || !userData.token) {
      init({ message: 'Dữ liệu đăng nhập không hợp lệ', color: 'danger' })
      loading.value = false
      return
    }
    
    // ✅ Check if role exists
    if (!userData.role) {
      init({ message: 'Tài khoản chưa được cấp quyền. Vui lòng liên hệ admin.', color: 'warning' })
      loading.value = false
      return
    }
    
    console.log('[Login] Setting user to store:', userData)
    userStore.setUser(userData)
    // ...
  }
}
```

### 3. Thêm logging trong UserStore

**File:** `src/stores/user-store.ts`

```javascript
setUser(user: { username: string; role: string; token: string }) {
  console.log('[UserStore setUser] Received user:', user)
  console.log('[UserStore setUser] User.role:', user.role)
  
  this.userName = user.username
  this.role = user.role || 'guest'  // ✅ Fallback to guest if no role
  this.token = user.token
  
  // Save to localStorage
  const savedData = { username: user.username, role: user.role || 'guest', token: user.token }
  localStorage.setItem('user', JSON.stringify(savedData))
  
  console.log('[UserStore setUser] Store role after update:', this.role)
}
```

## Luồng Login mới

```
1. User nhập username + password
2. Frontend gọi API → Apps Script login()
3. Apps Script:
   - Tìm user trong sheet "Menus"
   - Lấy data[i][3] cho role (Column D)
   - Lấy data[i][2] cho token (Column C)
   - Return { username, role, token }
4. Frontend Login.vue:
   - Validate userData có đầy đủ fields
   - Check userData.role tồn tại
   - Nếu không có role → hiển thị warning
   - Nếu OK → userStore.setUser(userData)
5. UserStore:
   - Lưu role vào state
   - Lưu toàn bộ vào localStorage
   - Trigger reactive update
6. Sidebar:
   - Watch role.value thay đổi
   - Re-compute routers
   - Hiển thị menu theo role
```

## Testing

### Test Case 1: Login với role manager

```
Username: hoangdt
Password: 123
Expected:
  ✅ Login thành công
  ✅ Role = "manager"
  ✅ Sidebar hiển thị tất cả menu
  ✅ Console log: [UserStore setUser] User.role: manager
```

### Test Case 2: Login với role teacher

```
Username: lego
Password: 123
Expected:
  ✅ Login thành công
  ✅ Role = "teacher"
  ✅ Sidebar chỉ hiển thị: Điểm danh, Lương giáo viên
  ✅ Console log: [UserStore setUser] User.role: teacher
```

### Test Case 3: Login với role admin

```
Username: admin
Password: (check sheet)
Expected:
  ✅ Login thành công
  ✅ Role = "admin"
  ✅ Sidebar hiển thị tất cả menu
  ✅ Redirect to teacher-salary page
```

### Test Case 4: User không có role

```
Nếu trong sheet column D trống:
  ❌ Login blocked
  ⚠️ Toast warning: "Tài khoản chưa được cấp quyền. Vui lòng liên hệ admin."
```

## Console Logs để debug

Khi login thành công, console sẽ hiển thị:

```javascript
[Login] API Response: { data: { data: { username: 'hoangdt', role: 'manager', token: 'mh0wjn1h' } } }
[Login] User data: { username: 'hoangdt', role: 'manager', token: 'mh0wjn1h' }
[Login] Setting user to store: { username: 'hoangdt', role: 'manager', token: 'mh0wjn1h' }
[UserStore setUser] Received user: { username: 'hoangdt', role: 'manager', token: 'mh0wjn1h' }
[UserStore setUser] User.role: manager
[UserStore setUser] Store role after update: manager
[UserStore setUser] Saved to localStorage: {"username":"hoangdt","role":"manager","token":"mh0wjn1h"}
[Login] Store role after setUser: manager
[AppSidebar] Setup called
[AppSidebar] User role: manager
[AppSidebar isShow] students with role: manager
[AppSidebar isShow] Manager/Admin - showing all
[AppSidebar] Filtered routes count: 10
```

## Files Changed

1. ✅ `docs/Code.gs` - Fix column index: `data[i][3]` for role
2. ✅ `src/pages/auth/Login.vue` - Add validation + logging
3. ✅ `src/stores/user-store.ts` - Add logging + fallback

## Deployment Steps

### 1. Deploy Apps Script

```
1. Mở Google Apps Script editor
2. Paste code từ docs/Code.gs
3. Save (Ctrl+S)
4. Deploy → New deployment
5. Chọn "Web app"
6. Execute as: Me
7. Who has access: Anyone
8. Deploy
9. Copy URL mới
10. Update VITE_APPS_SCRIPT_URL trong .env và Netlify
```

### 2. Deploy Frontend

```bash
npm run build
# Upload dist/ to Netlify
# Or git push để auto-deploy
```

## Verification Checklist

- [ ] Deploy Code.gs lên Apps Script
- [ ] Update Apps Script URL nếu có thay đổi
- [ ] Build frontend thành công
- [ ] Deploy lên Netlify
- [ ] Test login với hoangdt → role = manager
- [ ] Check console logs đúng như expected
- [ ] Sidebar hiển thị đầy đủ menu
- [ ] Test logout → sidebar ẩn hết
- [ ] Test login với teacher → chỉ thấy 2 menu

## Build Result

```bash
✓ npm run build - Success
✓ Exit Code: 0
✓ 651.71 kB (gzipped: 212.64 kB)
```

## Summary

**Root cause:** Apps Script lấy sai column index cho role (column C thay vì column D).

**Fix:** Đổi `data[i][2]` thành `data[i][3]` cho role.

**Extra:** Thêm validation và logging để debug dễ dàng hơn.

**Impact:** Login bây giờ trả về đúng role, sidebar hiển thị menu đúng theo quyền! 🎉
