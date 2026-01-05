# Hướng dẫn Setup Site Mới cho Năm 2026

## Tổng quan

Hướng dẫn này giúp bạn tạo một site mới trên Netlify với Google Sheet riêng cho dữ liệu năm 2026, trong khi vẫn giữ nguyên repo hiện tại.

---

## Bước 1: Tạo Google Sheet Mới

### 1.1. Copy Sheet hiện tại

1. Mở Google Sheet hiện tại: `1HhIpXU6Egq9MZmyCAvPnEjCT8V4n9soD7EY4LQ8Nt0w`
2. **File** → **Make a copy**
3. Đặt tên: `EMS GangCity 2026`
4. Lưu vào Google Drive của bạn

### 1.2. Xóa dữ liệu cũ (giữ cấu trúc)

Trong sheet mới, xóa dữ liệu từ **dòng 4 trở đi** ở các sheet:

- `DanhSach` - Danh sách học sinh
- `DiemDanh` - Điểm danh
- `DiemDanhChiTiet` - Chi tiết điểm danh
- `DiemDanhNghi` - Học sinh nghỉ
- `LichDay` - Lịch dạy
- `DongHoc` - Đóng học phí
- `DieuChinh` - Điều chỉnh
- `KiemSoatBuoiHoc` - Kiểm soát buổi học

> **Lưu ý:** Giữ nguyên 3 dòng đầu (tiêu đề) và các sheet cấu hình như `GiaoVien`, `LopHoc`, `CoSo`, `TKB`, `TaiKhoan`

### 1.3. Lấy Sheet ID mới

URL sheet mới sẽ có dạng:

```
https://docs.google.com/spreadsheets/d/[SHEET_ID_MỚI]/edit
```

Copy phần `[SHEET_ID_MỚI]` để dùng sau.

---

## Bước 2: Tạo Google Apps Script Mới

### 2.1. Mở Apps Script Editor

1. Trong Google Sheet mới, vào **Extensions** → **Apps Script**
2. Xóa code mặc định

### 2.2. Copy code từ file Code.gs

1. Mở file `docs/Code.gs` trong repo
2. Copy toàn bộ nội dung
3. Paste vào Apps Script Editor

### 2.3. Cập nhật Sheet ID trong code

Tìm dòng (khoảng dòng 6):

```javascript
let spreadsheetId_Data = '1HhIpXU6Egq9MZmyCAvPnEjCT8V4n9soD7EY4LQ8Nt0w'
```

Đổi thành Sheet ID mới của bạn.

### 2.4. Deploy Apps Script

1. Click **Deploy** → **New deployment**
2. Type: **Web app**
3. Description: `EMS GangCity 2026`
4. Execute as: **Me**
5. Who has access: **Anyone**
6. Click **Deploy**
7. **Copy URL** của deployment (dạng `https://script.google.com/macros/s/.../exec`)

---

## Bước 3: Bật Google Sheets API

### 3.1. Tạo API Key mới (nếu cần)

1. Vào [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc dùng project cũ
3. Enable **Google Sheets API**
4. Tạo **API Key** mới trong Credentials
5. Restrict API key cho Google Sheets API

### 3.2. Chia sẻ Sheet

1. Mở Google Sheet mới
2. Click **Share**
3. Thêm quyền **Viewer** cho **Anyone with the link**

---

## Bước 4: Tạo Site Mới trên Netlify

### 4.1. Đăng nhập Netlify

1. Vào [Netlify](https://app.netlify.com/)
2. Click **Add new site** → **Import an existing project**

### 4.2. Connect Repository

1. Chọn **GitHub**
2. Tìm repo `ems-gangcity`
3. Click để kết nối

### 4.3. Cấu hình Build

```
Build command: npm run build
Publish directory: dist
```

### 4.4. Thêm Environment Variables

Vào **Site settings** → **Environment variables** → **Add variable**

| Variable                     | Value                   |
| ---------------------------- | ----------------------- |
| `VITE_GOOGLE_SHEET_ID`       | `[SHEET_ID_MỚI]`        |
| `VITE_GOOGLE_SHEETS_API_KEY` | `[API_KEY]`             |
| `VITE_APPS_SCRIPT_URL`       | `[URL_APPS_SCRIPT_MỚI]` |

### 4.5. Deploy

1. Click **Deploy site**
2. Đợi build hoàn tất

### 4.6. Custom Domain (tùy chọn)

1. Vào **Domain settings**
2. Click **Add custom domain**
3. Nhập domain mong muốn (ví dụ: `ems-2026.yourdomain.com`)

---

## Bước 5: Kiểm tra

### 5.1. Test đăng nhập

1. Mở site mới trên Netlify
2. Đăng nhập với tài khoản trong sheet `TaiKhoan`

### 5.2. Test tạo lịch dạy

1. Vào trang Lịch dạy
2. Tạo lịch mới cho tháng 1/2026
3. Kiểm tra dữ liệu trong Google Sheet mới

### 5.3. Test điểm danh

1. Điểm danh một buổi học
2. Kiểm tra sheet `DiemDanhChiTiet`

---

## Tóm tắt các thông tin cần lưu

| Thông tin           | Giá trị             |
| ------------------- | ------------------- |
| Sheet ID mới        | `_________________` |
| Apps Script URL mới | `_________________` |
| API Key             | `_________________` |
| Netlify Site URL    | `_________________` |
| Custom Domain       | `_________________` |

---

## Lưu ý quan trọng

1. **Backup thường xuyên**: Export Google Sheet hàng tuần
2. **Không xóa sheet cũ**: Giữ nguyên để tra cứu lịch sử
3. **Cập nhật code**: Khi có thay đổi trong `Code.gs`, nhớ cập nhật cả 2 Apps Script
4. **Sync Users**: Nếu thêm user mới, thêm vào cả 2 sheet `TaiKhoan`
