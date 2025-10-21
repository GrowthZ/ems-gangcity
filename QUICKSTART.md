# 🚀 Quick Start Guide - Giải quyết lỗi Duplicate Append Row

## TL;DR

Code đã được cập nhật để sử dụng **Google Sheets API** thay vì Apps Script, giải quyết vấn đề duplicate rows.

## 🎯 Những gì đã thay đổi

### 1. Frontend (`src/stores/data-from-sheet.ts`)

- ✅ Thêm functions mới: `appendDataToSheet()`, `updateDataInSheet()`, `batchUpdateSheet()`
- ✅ Refactor `sendRequest()` để sử dụng Sheets API
- ✅ Giữ nguyên Apps Script như fallback
- ✅ Retry logic với exponential backoff

### 2. Backend (folder `backend/`)

- ✅ Node.js server hoàn chỉnh để handle Sheets API
- ✅ Endpoints: append, update, batch-update, get
- ✅ Ready to use với Service Account

### 3. Documentation

- ✅ `docs/SHEETS_API_SETUP.md` - Hướng dẫn chi tiết 3 phương án
- ✅ `docs/MIGRATION_TO_SHEETS_API.md` - Tổng quan về migration
- ✅ `backend/README.md` - Setup backend server

## 🏃 Để chạy ngay (Khuyến nghị)

### Bước 1: Setup Backend với Service Account

```bash
# 1. Vào Google Cloud Console và tạo Service Account
# 2. Download file JSON key
# 3. Đổi tên thành service-account-key.json

# 4. Install backend dependencies
cd backend
npm install

# 5. Copy service-account-key.json vào folder backend/

# 6. Share Google Sheet với service account email
# Mở Sheet → Share → Paste email từ JSON key → Editor permission

# 7. Setup .env
cp .env.example .env
# Edit SPREADSHEET_ID nếu cần

# 8. Start backend
npm start
```

Backend sẽ chạy ở `http://localhost:3000`

### Bước 2: Update Frontend Config

```bash
# Ở root project
# Thêm vào .env hoặc .env.local:
VITE_BACKEND_URL=http://localhost:3000
VITE_API_MODE=backend
```

### Bước 3: Restart Frontend

```bash
# Stop frontend (Ctrl+C)
npm run dev
```

## ✅ Test

Sau khi setup xong:

1. **Test backend**:

```bash
curl http://localhost:3000/health
```

2. **Test trong app**:

- Thử tạo student mới
- Thử điểm danh
- Thử thanh toán
- Kiểm tra không còn duplicate

## 🔄 Nếu muốn quay lại Apps Script

```bash
# Trong .env:
VITE_API_MODE=apps-script

# Hoặc comment dòng này trong data-from-sheet.ts:
# const useBackend = true
```

## 📊 Cấu trúc dữ liệu

**LƯU Ý QUAN TRỌNG**: Các hàm `prepareXXXRow()` trong `data-from-sheet.ts` cần match với cấu trúc cột trong Sheet của bạn.

Ví dụ:

```typescript
function prepareStudentRow(data: any): any[] {
  return [
    data.code || '', // Cột A
    data.fullname || '', // Cột B
    data.phone || '', // Cột C
    data.group || '', // Cột D
    // ... thêm các cột khác theo sheet của bạn
  ]
}
```

Bạn cần **kiểm tra và điều chỉnh** các hàm này cho phù hợp với sheet structure thực tế.

## 🐛 Troubleshooting

### Backend không start được

```
❌ Error loading service account key

✅ Giải pháp:
- Check file service-account-key.json có trong folder backend/
- Verify JSON format đúng
```

### Frontend báo lỗi CORS

```
❌ Access to fetch at 'http://localhost:3000' has been blocked by CORS

✅ Giải pháp:
- Backend đã có CORS enabled
- Check backend đang chạy
- Check URL trong .env đúng
```

### Vẫn bị duplicate

```
❌ Still seeing duplicate rows

✅ Giải pháp:
- Verify VITE_API_MODE=backend
- Check console logs xem có dùng backend không
- Xem log backend có nhận request không
- Có thể cần clear cache: Ctrl+Shift+R
```

### Permission denied

```
❌ The caller does not have permission

✅ Giải pháp:
- Check đã share sheet với service account email
- Verify service account có Editor permission
- Check spreadsheet ID trong backend/.env đúng
```

## 📝 Next Steps

1. ✅ Setup backend theo hướng dẫn trên
2. ✅ Test thoroughly với data thật
3. ✅ Adjust `prepareXXXRow()` functions cho đúng sheet structure
4. ✅ Monitor logs để đảm bảo không còn lỗi
5. ✅ Deploy backend lên production server khi ready

## 🎓 Học thêm

- Đọc `docs/SHEETS_API_SETUP.md` để hiểu chi tiết hơn
- Đọc `docs/MIGRATION_TO_SHEETS_API.md` để biết full migration plan
- Đọc `backend/README.md` để biết cách deploy production

## 💡 Tips

- Backend chạy local chỉ cho development
- Production nên deploy backend lên server riêng hoặc cloud function
- Keep service account key an toàn, NEVER commit to git
- Có thể sử dụng PM2 để keep backend running

## 🆘 Cần hỗ trợ?

1. Check console logs (Frontend: F12, Backend: terminal output)
2. Verify backend health: `curl http://localhost:3000/health`
3. Test với Postman/curl trước khi test trong app
4. Check Google Cloud Console > API & Services > Credentials
5. Verify Sheet permissions

---

**Ready to go! 🎉** Start backend, restart frontend, và test thôi!
