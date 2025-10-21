# Chuyển đổi từ Apps Script sang Google Sheets API

## 🎯 Mục đích

Giải quyết lỗi **duplicate append row** khi sử dụng Google Apps Script bằng cách chuyển sang Google Sheets API.

## ✅ Đã hoàn thành

### 1. Code Changes

- ✨ Tạo các hàm mới sử dụng Google Sheets API:

  - `appendDataToSheet()` - Thêm dữ liệu mới
  - `updateDataInSheet()` - Cập nhật dữ liệu theo range
  - `batchUpdateSheet()` - Xử lý nhiều operations cùng lúc
  - `findNextEmptyRow()` - Tìm dòng trống để append an toàn

- 🔄 Refactor `sendRequest()`:

  - Map tất cả actions sang Sheets API calls
  - Giữ nguyên interface để không ảnh hưởng code hiện tại
  - Fallback sang Apps Script nếu action chưa implement

- 🛡️ Error Handling:
  - Retry logic với exponential backoff
  - Xử lý lỗi 429 (Too Many Requests)
  - Xử lý lỗi 503 (Service Unavailable)

### 2. Documentation

- 📖 File `docs/SHEETS_API_SETUP.md` với 3 phương án:

  - **Phương án 1**: OAuth2 (Dev)
  - **Phương án 2**: Service Account + Backend (Production) ⭐ Khuyến nghị
  - **Phương án 3**: Cải thiện Apps Script (Tạm thời)

- 📝 File `.env.example` với các biến môi trường cần thiết

## 🚀 Các bước tiếp theo

### Bước 1: Chọn phương án

Đọc file `docs/SHEETS_API_SETUP.md` và chọn phương án phù hợp:

- **Development**: OAuth2
- **Production**: Service Account + Backend

### Bước 2: Setup theo phương án đã chọn

#### Nếu chọn OAuth2:

```bash
# 1. Tạo OAuth2 credentials trên Google Cloud Console
# 2. Tạo file src/services/google-auth.ts (có template trong docs)
# 3. Thêm route /auth/callback
# 4. Thêm button "Login with Google" trong Login page
```

#### Nếu chọn Service Account (Khuyến nghị):

```bash
# 1. Tạo service account và download JSON key
# 2. Share sheet với service account email
# 3. Setup backend server (có template trong docs)
npm init -y
npm install express googleapis cors

# 4. Tạo file server.js (copy từ docs)
# 5. Chạy backend
node server.js

# 6. Update VITE_BACKEND_URL trong .env
```

### Bước 3: Update .env

```bash
cp .env.example .env
# Sửa các giá trị trong .env theo setup của bạn
```

### Bước 4: Test

```bash
# Test với data mẫu
# Thử tạo student, payment, attendance...
# Kiểm tra không còn duplicate
```

## 📊 So sánh

| Tính năng        | Apps Script (Cũ) | Sheets API (Mới)       |
| ---------------- | ---------------- | ---------------------- |
| Duplicate rows   | ❌ Có            | ✅ Không               |
| Performance      | 🐌 Chậm          | ⚡ Nhanh               |
| Rate limiting    | ⚠️ Thường gặp    | ✅ Tốt hơn             |
| Error handling   | ❌ Cơ bản        | ✅ Tốt                 |
| Retry logic      | ⚠️ Đơn giản      | ✅ Exponential backoff |
| Batch operations | ❌ Không         | ✅ Có                  |

## 🔧 Troubleshooting

### Lỗi 401 Unauthorized

```
Nguyên nhân: Chưa có access token hoặc token hết hạn
Giải pháp: Login lại với Google hoặc refresh token
```

### Lỗi 403 Forbidden

```
Nguyên nhân: API key không có quyền ghi
Giải pháp: Dùng OAuth2 hoặc Service Account thay vì API key
```

### Vẫn còn duplicate

```
Nguyên nhân: Có thể do concurrent requests
Giải pháp: Sử dụng batchUpdateSheet() thay vì appendDataToSheet()
```

## 📝 Notes

- ⚠️ **QUAN TRỌNG**: Google Sheets API chỉ cho phép **ĐỌC** với API key, muốn **GHI** cần OAuth2 hoặc Service Account
- 🔒 **BẢO MẬT**: Không commit keys, tokens vào Git
- 📊 **MONITOR**: Theo dõi logs để đảm bảo không còn duplicate
- 🧪 **TEST**: Test kỹ trước khi deploy lên production

## 🤝 Cần hỗ trợ?

1. Đọc kỹ file `docs/SHEETS_API_SETUP.md`
2. Check logs trong console
3. Kiểm tra permissions của Sheet
4. Verify API credentials

## 📚 Tài liệu tham khảo

- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [OAuth2 for Web Apps](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Service Accounts](https://cloud.google.com/iam/docs/service-accounts)
