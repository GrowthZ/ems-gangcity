# Fix Netlify SPA Routing Issues

## Vấn đề gặp phải

Khi deploy lên Netlify, sau khi login không chuyển trang được, gặp lỗi:

```
Failed to load module script: Expected a JavaScript-or-Wasm module script
but the server responded with a MIME type of "text/html"

TypeError: Failed to fetch dynamically imported module:
https://gangcity-ems.netlify.app/assets/AttendancePage-e68d2a7e.js
```

## Nguyên nhân

Đây là lỗi phổ biến với SPA (Single Page Application) trên Netlify:

1. **Routing vấn đề**: Khi truy cập route như `/attendance`, Netlify cố tìm file `attendance/index.html`
2. **404 fallback thiếu**: Netlify trả về 404 page thay vì `index.html`
3. **Dynamic imports fail**: Các lazy-loaded components không load được

## Giải pháp đã áp dụng

### 1. Cập nhật `vite.config.ts`

Thêm `base: '/'` và tối ưu rollup options:

```typescript
export default defineConfig({
  base: '/',
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  // ... rest of config
})
```

**Lý do:**

- `base: '/'` đảm bảo tất cả assets được load từ root domain
- `manualChunks: undefined` tắt manual chunking để Vite tự động quản lý

### 2. Tạo file `public/_redirects`

File này sẽ được copy vào `dist/_redirects` khi build:

```
/* /index.html 200
```

**Lý do:**

- Netlify đọc file `_redirects` để biết cách xử lý routing
- `/* /index.html 200` = redirect tất cả routes về `index.html` với status 200 (không phải 301/302)
- Status 200 quan trọng vì nó giữ URL hiện tại, Vue Router sẽ xử lý routing

### 3. File `netlify.toml` đã có sẵn

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/"
  status = 200
```

**Lưu ý:**

- Cả `_redirects` và `netlify.toml` đều hoạt động
- Nếu có cả 2, `_redirects` có priority cao hơn
- Recommend: Giữ cả 2 để đảm bảo hoạt động

## Cách deploy lại

### Option 1: Git-based deployment (Khuyến nghị)

```bash
# 1. Commit changes
git add .
git commit -m "Fix: Add SPA routing support for Netlify"
git push origin dev

# 2. Netlify sẽ tự động build và deploy
```

### Option 2: Manual deployment

```bash
# 1. Build
npm run build

# 2. Deploy bằng Netlify CLI
netlify deploy --prod

# Hoặc upload thủ công qua Netlify Dashboard
# Drag & drop folder `dist/`
```

## Kiểm tra sau khi deploy

### 1. Test basic routing

- Truy cập: `https://gangcity-ems.netlify.app/`
- Login thành công
- Chuyển sang `/attendance` hoặc `/students`
- Refresh trang → Không bị 404

### 2. Test dynamic imports

- Mở DevTools Console
- Không thấy lỗi "Failed to fetch dynamically imported module"
- Các lazy-loaded components load thành công

### 3. Test deep links

- Truy cập trực tiếp: `https://gangcity-ems.netlify.app/students/ABC123`
- Trang load thành công (không bị 404)

## Kiến thức bổ sung

### Tại sao cần `_redirects`?

**Cách SPA hoạt động:**

1. User truy cập `https://example.com/students`
2. Netlify tìm file `students/index.html` → Không tìm thấy
3. Không có `_redirects`: Netlify trả về 404
4. Có `_redirects`: Netlify trả về `index.html` với status 200
5. Vue Router nhận URL `/students` và render đúng component

### Status codes trong `_redirects`

- **200 (Rewrite)**: URL không đổi, nội dung thay đổi → Dùng cho SPA
- **301 (Permanent)**: Redirect vĩnh viễn, URL thay đổi → Dùng cho SEO
- **302 (Temporary)**: Redirect tạm thời, URL thay đổi → Dùng cho maintenance

### Các patterns trong `_redirects`

```bash
# Match tất cả (SPA)
/* /index.html 200

# Redirect cụ thể
/old-page /new-page 301

# API proxy
/api/* https://api.example.com/:splat 200

# Custom 404
/* /404.html 404
```

## Troubleshooting

### Vẫn gặp lỗi sau khi deploy?

**1. Clear Netlify cache:**

```bash
# Trong Netlify Dashboard
Site settings → Build & deploy → Clear cache and deploy site
```

**2. Kiểm tra file `_redirects` có trong `dist/`:**

```bash
ls -la dist/_redirects
# Phải thấy file này
```

**3. Kiểm tra Netlify logs:**

```bash
# Trong Netlify Dashboard
Deploys → Click vào deploy mới nhất → View deploy logs
```

**4. Test local trước:**

```bash
# Build
npm run build

# Serve local với routing support
npx serve -s dist -p 3000

# Test: http://localhost:3000
# Refresh trang /students → Phải hoạt động
```

### Assets không load được?

Kiểm tra `index.html` trong `dist/`:

```html
<!-- Phải là relative paths -->
<script type="module" src="/assets/index-xxx.js"></script>
<link rel="stylesheet" href="/assets/index-xxx.css" />

<!-- KHÔNG phải absolute với domain -->
<!-- ❌ WRONG -->
<script src="https://gangcity-ems.netlify.app/assets/index-xxx.js"></script>
```

## Kết luận

Với 3 thay đổi:

1. ✅ `vite.config.ts` - Thêm `base: '/'`
2. ✅ `public/_redirects` - Tạo file redirect
3. ✅ `netlify.toml` - Đã có sẵn

Netlify sẽ xử lý routing đúng cách cho SPA.

**Lưu ý quan trọng:**

- Rebuild sau mỗi thay đổi config
- File `_redirects` phải có trong `dist/` folder
- Test local trước khi deploy production
- Clear cache Netlify nếu vẫn gặp vấn đề

## References

- [Netlify SPA Setup](https://docs.netlify.com/routing/redirects/rewrites-proxies/#history-pushstate-and-single-page-apps)
- [Vite Base URL](https://vitejs.dev/config/shared-options.html#base)
- [Vue Router History Mode](https://router.vuejs.org/guide/essentials/history-mode.html#netlify)
