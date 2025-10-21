# Báo cáo Tài chính - Tình hình Đóng học

## 📊 Tổng quan

Trang **Báo cáo Tài chính** cung cấp cái nhìn tổng quan về tình hình đóng học phí của trung tâm, bao gồm:

- Doanh thu tổng thể
- Số lượng giao dịch
- Số học viên đã đóng tiền
- Tổng số buổi học đã thanh toán
- Biểu đồ doanh thu theo thời gian
- Phân tích theo loại thanh toán (Lẻ/Khóa)

## 🎯 Chức năng chính

### 1. Bộ lọc dữ liệu

- **Khoảng thời gian**: Chọn từ ngày đến ngày để xem báo cáo
- **Cơ sở**: Lọc theo từng cơ sở cụ thể
- **Lớp học**: Lọc theo lớp học
- **Loại thanh toán**: Lọc theo Lẻ hoặc Khóa

### 2. Thống kê tổng quan (Cards)

#### 💰 Tổng doanh thu

- Hiển thị tổng số tiền thu được
- Định dạng tiền tệ VNĐ
- Màu xanh lá (success)

#### 🧾 Số giao dịch

- Tổng số lần đóng tiền
- Màu xanh dương (primary)

#### 👥 Học viên đóng tiền

- Số lượng học viên unique đã thanh toán
- Màu xanh nhạt (info)

#### 📅 Tổng số buổi

- Tổng số buổi học đã thanh toán
- Màu vàng (warning)

### 3. Biểu đồ doanh thu

**Biểu đồ kết hợp (Dual-axis Bar Chart)**:

- **Trục Y trái**: Doanh thu (VNĐ) - Cột màu xanh lá
- **Trục Y phải**: Số giao dịch - Cột màu xanh dương
- **Trục X**: Tháng/Năm

Biểu đồ tự động cập nhật khi thay đổi bộ lọc.

### 4. Phân bổ theo loại thanh toán

Hiển thị:

- Loại thanh toán (Lẻ/Khóa)
- Tổng tiền theo loại
- Số giao dịch
- Progress bar
- Phần trăm so với tổng

### 5. Bảng chi tiết giao dịch

**Columns**:

- Ngày đóng
- Học viên (mã + tên)
- Lớp
- Loại (Lẻ/Khóa)
- Số buổi
- Số tiền
- Ghi chú
- Thao tác (Xem/Sửa)

**Features**:

- Tìm kiếm theo mã học viên, tên, ghi chú
- Sắp xếp theo cột
- Phân trang
- Click vào row để xem chi tiết
- Nút xem chi tiết và sửa

### 6. Xuất báo cáo

**Nút "Xuất Excel"**: Xuất toàn bộ dữ liệu đã lọc ra file Excel (Coming soon)

## 🚀 Hướng dẫn sử dụng

### Xem báo cáo tổng quan

1. Truy cập menu **"Báo cáo tài chính"**
2. Hệ thống tự động load toàn bộ dữ liệu
3. Xem các chỉ số trên cards
4. Xem biểu đồ và phân tích

### Lọc dữ liệu theo điều kiện

1. Chọn **Khoảng thời gian** (VD: 01/09/2025 - 30/09/2025)
2. Chọn **Cơ sở** (nếu muốn xem riêng 1 cơ sở)
3. Chọn **Lớp học** (nếu muốn xem riêng 1 lớp)
4. Chọn **Loại thanh toán** (Lẻ hoặc Khóa)
5. Hệ thống tự động cập nhật tất cả thống kê

### Tìm kiếm giao dịch cụ thể

1. Nhập từ khóa vào ô **"Tìm kiếm..."**
2. Có thể tìm theo:
   - Mã học viên
   - Tên học viên
   - Ghi chú

### Xem chi tiết giao dịch

1. Click vào row trong bảng
2. Hoặc click nút **"Xem"** (icon mắt)
3. Modal chi tiết sẽ hiển thị (Coming soon)

### Sửa giao dịch

1. Click nút **"Sửa"** (icon bút)
2. Modal sửa sẽ hiển thị (Coming soon)

## 📱 Responsive Design

Trang được tối ưu cho tất cả thiết bị:

### Mobile (< 640px)

- Cards xếp dọc 1 cột
- Filters xếp dọc
- Buttons full width
- Chart height: 300px

### Tablet (640px - 1024px)

- Cards 2 cột
- Filters 2 cột
- Chart height: 300px

### Desktop (> 1024px)

- Cards 4 cột
- Filters 4 cột
- Chart height: 400px
- Full features

## 🔧 Technical Details

### Data Source

- **Sheet chính**: `DongHoc` (Payment)
- **Sheet phụ**:
  - `DanhSach` (Student) - Để merge tên học viên
  - `CoSo` (Location) - Để filter theo cơ sở
  - `LopHoc` (Group) - Để filter theo lớp

### Date Format Handling

- **Input**: DD/MM/YYYY hoặc YYYY-MM-DD hoặc timestamp
- **Output**: DD/MM/YYYY (locale vi-VN)
- **Chart**: MM/YYYY

### Money Format

- **Input**: "1000000" hoặc "1.000.000"
- **Parse**: Remove dots → parseFloat
- **Display**: toLocaleString('vi-VN') → "1.000.000"

### Chart Library

- **Library**: Chart.js v4
- **Type**: Bar chart with dual Y-axis
- **Update**: Auto update when filters change
- **Responsive**: Yes

## 🎨 Color Scheme

### Status Colors

- **Success (Xanh lá)**: Doanh thu, Tiền
- **Primary (Xanh dương)**: Giao dịch
- **Info (Xanh nhạt)**: Học viên
- **Warning (Vàng)**: Buổi học

### Payment Type Colors

- **Lẻ**: Success (Xanh lá)
- **Khóa**: Primary (Xanh dương)

## 📝 TODO / Coming Soon

- [ ] Xuất Excel với formatting đẹp
- [ ] Modal xem chi tiết giao dịch
- [ ] Modal sửa giao dịch
- [ ] Biểu đồ Pie chart cho distribution
- [ ] So sánh theo năm
- [ ] Export PDF
- [ ] Print report
- [ ] Email report
- [ ] Lịch sử xem báo cáo
- [ ] Save filter presets

## 🐛 Known Issues

None currently.

## 📞 Support

Nếu có vấn đề hoặc cần hỗ trợ, vui lòng liên hệ team phát triển.
