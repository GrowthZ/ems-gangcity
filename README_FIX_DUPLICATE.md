# 🚀 Fix Duplicate Rows - Không cần Backend!

## ✅ Giải pháp: Apps Script + Idempotency Key

### Bước 1: Update Apps Script

Copy code trong file `SIMPLE_SOLUTION.md` và deploy lại Apps Script

### Bước 2: Setup .env

```bash
cp .env.example .env
```

Sửa `.env`:

```bash
VITE_GOOGLE_SHEETS_API_KEY=AIzaSyC9NlfiP4qs-Hfaej4RpmxxWXRcAoKM7ao
VITE_GOOGLE_SHEET_ID=1HhIpXU6Egq9MZmyCAvPnEjCT8V4n9soD7EY4LQ8Nt0w
VITE_APPS_SCRIPT_URL=YOUR_APPS_SCRIPT_URL
VITE_API_MODE=apps-script
```

### Bước 3: Restart

```bash
npm run dev
```

## 📖 Chi tiết

Xem file `SIMPLE_SOLUTION.md` để có:

- ✅ Code Apps Script hoàn chỉnh
- ✅ Hướng dẫn chi tiết
- ✅ Troubleshooting

## 🎯 Ưu điểm

- ✅ Không duplicate rows (có idempotency key)
- ✅ Không cần backend
- ✅ Không cần OAuth2
- ✅ Chỉ cần API key
- ✅ Setup đơn giản

## 📝 Lưu ý

Apps Script code cần điều chỉnh theo:

- Tên sheets của bạn
- Cấu trúc cột trong mỗi sheet

Nhưng cơ chế chống duplicate đã sẵn sàng! 🎉
