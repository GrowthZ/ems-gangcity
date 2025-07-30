# Student Detail Page

## Tổng quan

Page Student Detail hiển thị đầy đủ thông tin chi tiết của một học viên, bao gồm thông tin cá nhân, học tập, lịch sử điểm danh và thanh toán.

## Cách truy cập

- Từ trang danh sách học viên (`/students`), click vào nút "Xem chi tiết" (icon mắt) trong cột "Thao tác"
- URL: `/students/{student_code}` hoặc `/students/{student_id}`

## Các thông tin hiển thị

### 1. Thông tin cá nhân

- Mã học viên
- Họ và tên
- Biệt danh
- Giới tính
- Ngày sinh
- Số điện thoại (có thể click để gọi)
- Cơ sở học tập
- Ngày bắt đầu học

### 2. Thông tin học tập

- Lớp học hiện tại
- Tổng số buổi học
- Số buổi đã học
- Số buổi còn lại (với màu sắc cảnh báo)
- Số lần đóng tiền
- Trạng thái học viên

### 3. Thống kê học tập

- Biểu đồ thống kê tổng buổi, đã học, còn lại
- Thanh tiến độ học tập (%)

### 4. Tabs lịch sử (3 tabs)

#### Tab 1: Lịch sử học tập

- Danh sách các buổi học đã tham gia
- Trạng thái điểm danh (có mặt/vắng/muộn)
- Thông tin giáo viên và lớp học
- Phân trang

#### Tab 2: Lịch sử thanh toán

- Danh sách các lần đóng tiền
- Số tiền và ngày thanh toán
- Phân trang

#### Tab 3: Lịch sử điều chỉnh

- Danh sách các lần điều chỉnh buổi học
- Lý do điều chỉnh và thông tin giáo viên
- Phân trang

## Các chức năng

### Nút "Cập nhật"

- Mở modal cập nhật thông tin học viên
- Cho phép chỉnh sửa thông tin cá nhân

### Nút "Đóng học"

- Mở modal thanh toán học phí
- Cho phép đóng tiền hoặc điều chỉnh buổi học

### Nút "Quay lại"

- Quay về trang trước đó

## Cấu trúc dữ liệu

### Student Object

```typescript
{
  id: number
  code: string
  location: string
  fullname: string
  nickname: string
  group: string
  gender: string
  birthday: string
  phone: string
  dateStart: string
  lanDongTien: number
  tongSoBuoi: number
  buoiDaHoc: number
  buoiConLai: number
  notes: string
  status: string
  active: boolean
}
```

## Components sử dụng

### StudentDetailPage.vue

- Component chính hiển thị thông tin học viên
- Quản lý state và API calls

### StudentHistory.vue

- Hiển thị lịch sử điểm danh
- Load dữ liệu từ sheets: attendance, attendaceDetail

### StudentPayments.vue

- Hiển thị lịch sử thanh toán
- Load dữ liệu từ sheet: payment

### StudentAdjustments.vue

- Hiển thị lịch sử điều chỉnh buổi học
- Load dữ liệu từ sheet: lessonUpdate

### StudentTabs.vue

- Component wrapper quản lý 3 tabs
- Tự động reset về tab đầu tiên khi thay đổi học viên

### PayModal.vue

- Modal thanh toán học phí
- Tái sử dụng từ StudentsPage

### NewStudentModal.vue

- Modal cập nhật thông tin học viên
- Tái sử dụng từ StudentsPage

## API Integration

### Data Sources

- **DanhSach**: Thông tin cơ bản học viên
- **KiemSoatBuoiHoc**: Thông tin buổi học (tongSoBuoi, buoiDaHoc, buoiConLai)
- **DiemDanh**: Lịch sử điểm danh
- **DiemDanhChiTiet**: Chi tiết điểm danh
- **DongHoc**: Lịch sử thanh toán
- **DieuChinh**: Lịch sử điều chỉnh buổi học
- **CoSo**: Danh sách cơ sở
- **LopHoc**: Danh sách lớp học

### Actions

- `createPayment`: Tạo thanh toán mới
- `updateLesson`: Cập nhật buổi học
- `updateStudent`: Cập nhật thông tin học viên

## Responsive Design

- Sử dụng Tailwind CSS grid system
- Responsive trên mobile, tablet, desktop
- Cards layout thích ứng với kích thước màn hình

## Error Handling

- Loading states cho từng section
- Error states khi không tìm thấy học viên
- Toast notifications cho các actions

## Performance

- Lazy loading cho các components con
- Pagination cho danh sách dài
- Caching data trong Pinia store
