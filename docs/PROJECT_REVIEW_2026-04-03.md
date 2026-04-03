# Đánh giá dự án EMS Gang City

Ngày đánh giá: 2026-04-03

## 1. Tóm tắt điều hành

Dự án hiện là một hệ thống quản trị vận hành trung tâm học tập được phát triển trên nền `Vue 3 + Vite + Pinia + Vuestic UI`, nhưng vẫn giữ khá nhiều dấu vết từ template `Vuestic Admin` gốc. Phần nghiệp vụ thực sự tập trung vào học viên, điểm danh, lịch dạy, thanh toán và báo cáo; trong khi nhiều module khác chỉ là phần thừa của template hoặc chưa được chuẩn hóa theo domain thật.

Kiến trúc hiện tại hoạt động theo mô hình lai:

- Frontend đọc dữ liệu trực tiếp từ Google Sheets API.
- Frontend ghi dữ liệu qua Google Apps Script.
- Có thêm một backend Node/Express cho Google Sheets nhưng chưa phải đường chính.

Mô hình này giúp triển khai nhanh và chi phí thấp, phù hợp giai đoạn MVP hoặc vận hành nội bộ. Tuy nhiên, ở trạng thái hiện tại, dự án đang có nợ kỹ thuật và rủi ro vận hành khá rõ ở 4 nhóm chính:

- Bảo mật và quản lý bí mật.
- Kiến trúc dữ liệu và trách nhiệm hệ thống chưa rõ.
- Chất lượng mã nguồn chưa đồng đều, còn nhiều mã debug và kiểu `any`.
- Thiếu lớp kiểm thử và quy trình phát hành đáng tin cậy.

Đánh giá tổng quan:

- Phù hợp để tiếp tục vận hành nội bộ ngắn hạn.
- Chưa đủ “production-grade” nếu muốn mở rộng người dùng, phân quyền chặt, audit tốt, hoặc thay người bảo trì.
- Nên ưu tiên một đợt chuẩn hóa kiến trúc thay vì tiếp tục vá từng lỗi riêng lẻ.

## 2. Hiện trạng kiến trúc

### 2.1 Frontend

Frontend dùng Vite và Vue 3, entry tương đối chuẩn tại [package.json](/home/hoangdt/Workspace/gang-city/ems-gangcity/package.json#L5) và [src/main.ts](/home/hoangdt/Workspace/gang-city/ems-gangcity/src/main.ts). Router hiện gom cả phần nghiệp vụ thật lẫn nhiều route còn sót từ template admin trong [src/router/index.ts](/home/hoangdt/Workspace/gang-city/ems-gangcity/src/router/index.ts).

Điểm đáng chú ý:

- Module nghiệp vụ chính đã hiện diện rõ: `students`, `attendances`, `calendars`, `reports`, `teacher-salary`.
- Navigation đã được cắt bớt phần template, nhưng repo vẫn còn nhiều page/demo không thuộc nghiệp vụ lõi.
- Store và data-fetching chưa được phân tầng rõ giữa “domain logic”, “transport” và “UI state”.

### 2.2 Tầng dữ liệu

Luồng dữ liệu hiện tại đi qua file [src/stores/data-from-sheet.ts](/home/hoangdt/Workspace/gang-city/ems-gangcity/src/stores/data-from-sheet.ts#L6):

- Đọc dữ liệu trực tiếp từ Google Sheets API bằng `API key`.
- Ghi/cập nhật qua Apps Script URL.
- Có thêm cơ chế `idempotency key` ở phía client để tránh duplicate.

Ưu điểm:

- Triển khai nhanh.
- Không cần hạ tầng backend phức tạp.
- Phù hợp team nhỏ, nghiệp vụ bám Google Sheet.

Nhược điểm:

- Frontend biết trực tiếp `sheetId`, `apiKey`, `scriptUrl`.
- Business logic bị phân tán giữa Vue component, Pinia store và Apps Script.
- Khi lỗi dữ liệu xảy ra, rất khó truy vết điểm sai vì không có một API layer trung tâm.

### 2.3 Apps Script

Apps Script trong [docs/Code.gs](/home/hoangdt/Workspace/gang-city/ems-gangcity/docs/Code.gs#L13) đang giữ vai trò backend chính cho các thao tác ghi, update và một phần xử lý nghiệp vụ. Đây là lựa chọn thực dụng, nhưng file đã rất dài và đang gom quá nhiều trách nhiệm:

- dispatch action,
- parse input,
- auth/login,
- xử lý ngày tháng,
- ghi dữ liệu,
- chống duplicate,
- kiểm tra nhất quán dữ liệu.

Điều này làm Apps Script trở thành “monolith script”, khó test, khó review, khó tách lỗi.

### 2.4 Backend Node

Backend trong [backend/server.js](/home/hoangdt/Workspace/gang-city/ems-gangcity/backend/server.js#L12) đã tồn tại nhưng có vẻ chưa phải đường chạy chính. Nó mới ở mức wrapper đơn giản quanh Google Sheets API:

- chưa có auth middleware,
- chưa có validation schema,
- chưa có logging chuẩn,
- chưa có rate limit,
- chưa có phân tầng controller/service/repository.

Nếu đội ngũ định chuyển dần khỏi Apps Script thì đây là nền tốt để mở rộng. Nếu không, backend hiện tại đang tạo cảm giác “kiến trúc dở dang”.

## 3. Điểm mạnh hiện tại

### 3.1 Bài toán nghiệp vụ đã được số hóa khá sâu

Các module chính phản ánh đúng quy trình vận hành thực tế của một trung tâm: học viên, lịch học, điểm danh, thiếu buổi, lương giáo viên, thanh toán, báo cáo tài chính. Đây là giá trị lớn nhất của repo: nghiệp vụ đã được encode vào sản phẩm, không còn là template rỗng.

### 3.2 Chọn stack dễ tuyển, dễ bảo trì ở mức cơ bản

`Vue 3 + Pinia + Vite` là lựa chọn hợp lý cho admin app. Về mặt năng lực triển khai nhanh, stack này ổn và đủ nhẹ.

### 3.3 Có ý thức xử lý lỗi vận hành thực tế

Trong luồng Sheets và Apps Script đã thấy dấu hiệu xử lý vấn đề đời thật:

- retry khi quota hoặc timeout ở [src/stores/data-from-sheet.ts](/home/hoangdt/Workspace/gang-city/ems-gangcity/src/stores/data-from-sheet.ts#L61),
- idempotency key để tránh ghi trùng ở [src/stores/data-from-sheet.ts](/home/hoangdt/Workspace/gang-city/ems-gangcity/src/stores/data-from-sheet.ts#L148),
- cache kết quả ở Apps Script tại [docs/Code.gs](/home/hoangdt/Workspace/gang-city/ems-gangcity/docs/Code.gs#L57).

Điều này cho thấy dự án không chỉ là code demo mà đã va vào vấn đề vận hành thật.

### 3.4 Có tài liệu nội bộ tương đối nhiều

Thư mục `docs/` chứa nhiều ghi chú fix, migration, deployment và troubleshooting. Dù tài liệu còn phân mảnh, đây vẫn là một tài sản tốt cho việc bàn giao.

## 4. Vấn đề chính và đánh giá

### 4.1 Mức độ nghiêm trọng cao

#### 1. Lộ thông tin cấu hình nhạy cảm ở frontend

Trong [src/stores/data-from-sheet.ts](/home/hoangdt/Workspace/gang-city/ems-gangcity/src/stores/data-from-sheet.ts#L6) và [.env.example](/home/hoangdt/Workspace/gang-city/ems-gangcity/.env.example#L9), các giá trị như `sheetId`, `Google Sheets API key` và `Apps Script URL` đang xuất hiện trực tiếp hoặc có fallback hard-code.

Rủi ro:

- Bất kỳ ai có bundle frontend đều đọc được endpoint và khóa.
- Tăng khả năng bị lạm dụng quota hoặc đọc dữ liệu ngoài ý muốn.
- Rất khó rotate secret hoặc thay môi trường an toàn.

Đề xuất:

- Loại bỏ mọi fallback hard-code khỏi source frontend.
- Chỉ đọc từ env ở build time.
- Nếu dữ liệu nhạy cảm hơn nữa, dừng mô hình đọc trực tiếp từ frontend và đưa qua backend/API gateway.

#### 2. Auth và phân quyền quá yếu

Luồng login và session hiện dựa trên `localStorage` tại [src/pages/auth/Login.vue](/home/hoangdt/Workspace/gang-city/ems-gangcity/src/pages/auth/Login.vue#L73) và [src/stores/user-store.ts](/home/hoangdt/Workspace/gang-city/ems-gangcity/src/stores/user-store.ts#L37).

Rủi ro:

- Token và role lưu plain trong `localStorage`.
- Route protection gần như dựa vào client-side state.
- Không thấy guard tập trung ở router cho authorization.
- Dễ bị sửa role thủ công nếu token không được backend xác thực chặt.

Đề xuất:

- Chuyển sang mô hình access token ngắn hạn hoặc session cookie `HttpOnly`.
- Thêm router guard tập trung dựa trên permission thực.
- Tách `authentication` và `authorization`, không dùng role từ localStorage như nguồn sự thật.

#### 3. Business logic bị dồn vào Apps Script monolith

File [docs/Code.gs](/home/hoangdt/Workspace/gang-city/ems-gangcity/docs/Code.gs#L13) đang gánh quá nhiều use case trong một file rất lớn.

Rủi ro:

- Khó debug khi lỗi nghiệp vụ chồng chéo.
- Khó onboarding dev mới.
- Khó unit test.
- Mỗi thay đổi nhỏ đều có nguy cơ ảnh hưởng chuỗi nghiệp vụ khác.

Đề xuất:

- Nếu tiếp tục dùng Apps Script, cần tách module theo domain: `auth`, `students`, `attendance`, `payments`, `reports`, `shared/utils`.
- Nếu có kế hoạch dài hạn, di chuyển dần write-side logic sang backend Node.

#### 4. Repository chưa có baseline kiểm thử

Không tìm thấy test suite unit/integration/e2e trong repo qua rà soát cấu trúc file. Điều này đặc biệt nguy hiểm vì hệ thống thao tác trực tiếp với dữ liệu thực trên Google Sheets.

Rủi ro:

- Sửa một flow dễ làm hỏng flow khác.
- Khó refactor Apps Script và payment logic.
- Không có confidence trước khi deploy.

Đề xuất:

- Frontend: thêm Vitest cho utility/store/domain function.
- Backend hoặc Apps Script bridge: thêm integration test cho các action quan trọng.
- E2E: thêm vài kịch bản tối thiểu cho login, tạo học viên, thu tiền, điểm danh.

### 4.2 Mức độ nghiêm trọng trung bình

#### 5. Repo còn lẫn nhiều mã template và mã nghiệp vụ

`README.md` hiện vẫn là README của `Vuestic Admin`, chưa phản ánh sản phẩm thật, xem [README.md](/home/hoangdt/Workspace/gang-city/ems-gangcity/README.md). Tên package cũng vẫn là `vuestic-admin` trong [package.json](/home/hoangdt/Workspace/gang-city/ems-gangcity/package.json#L2).

Tác động:

- Gây nhầm lẫn cho người mới.
- Làm việc bàn giao khó hơn.
- Khó xác định đâu là module đang dùng thật, đâu là tàn dư.

Đề xuất:

- Viết lại README theo domain EMS Gang City.
- Xóa hoặc di chuyển phần template/sample/demo sang khu vực riêng.
- Đổi package metadata, app title và tài liệu khởi chạy cho đúng sản phẩm.

#### 6. TypeScript đang dùng khá lỏng

Rất nhiều `any`, state shape động và payload không có schema. Điều này thấy rõ ở `data-from-sheet`, attendance widgets, student modals và report widgets.

Tác động:

- IDE hỗ trợ kém.
- Refactor khó.
- Lỗi runtime dễ lọt.

Đề xuất:

- Định nghĩa type/domain model chuẩn cho `Student`, `Payment`, `Attendance`, `Calendar`, `UserSession`.
- Dùng zod/yup hoặc schema validator cho payload vào/ra.
- Hạn chế `any` ở store và component props.

#### 7. Logging debug còn nằm trong code production

Rất nhiều `console.log` xuất hiện trong login, sidebar, attendance, student detail, calendar modal, report page. Đây là tín hiệu repo đang vận hành bằng debug thủ công.

Tác động:

- Noise lớn khi debug thật.
- Dễ lộ thông tin nhạy cảm lên browser console.
- Khó phân biệt log vận hành và log thử nghiệm.

Đề xuất:

- Tạo logger wrapper với mức `debug/info/warn/error`.
- Chỉ bật debug ở môi trường dev.
- Xóa log ad-hoc khỏi luồng production.

#### 8. Backend Node chưa đạt mức sẵn sàng production

File [backend/server.js](/home/hoangdt/Workspace/gang-city/ems-gangcity/backend/server.js#L40) mới chỉ là lớp pass-through.

Thiếu:

- request validation,
- auth,
- rate limiting,
- error envelope chuẩn,
- test,
- structured logging,
- config management rõ ràng.

Đề xuất:

- Nếu giữ backend, cần nâng nó thành API chính thức.
- Nếu không dùng, nên loại bỏ để giảm nhiễu kiến trúc.

### 4.3 Mức độ nghiêm trọng thấp nhưng nên xử lý

#### 9. Trộn ngôn ngữ và quy ước đặt tên

Code dùng lẫn tiếng Việt, tiếng Anh, tên sheet business-specific và convention không đồng nhất. Điều này không sai, nhưng làm đội dev mới tiếp cận chậm hơn.

Đề xuất:

- Chốt convention thống nhất:
  - UI text có thể tiếng Việt.
  - Code identifier nên thống nhất một ngôn ngữ.
  - Domain mapping giữa tên sheet và entity cần có bảng quy chiếu.

#### 10. Tài liệu hiện có nhưng phân mảnh

`docs/` chứa nhiều file fix theo từng sự cố, hữu ích cho lịch sử vận hành nhưng khó dùng như tài liệu hệ thống.

Đề xuất:

- Tổ chức lại `docs/` thành:
  - `architecture/`
  - `operations/`
  - `runbooks/`
  - `migration/`
  - `postmortems/`

## 5. Đánh giá theo tiêu chí

| Tiêu chí | Đánh giá | Nhận xét ngắn |
| --- | --- | --- |
| Phù hợp nghiệp vụ | 8/10 | Nghiệp vụ chính đã được số hóa khá sâu |
| Tốc độ triển khai | 8/10 | Google Sheets + Apps Script giúp đi nhanh |
| Bảo mật | 3/10 | Secret và session handling còn yếu |
| Khả năng mở rộng | 4/10 | Mô hình hiện tại sẽ khó scale khi tăng user và flow |
| Dễ bảo trì | 5/10 | Có tài liệu nhưng code phân tán, nhiều nợ kỹ thuật |
| Chất lượng mã | 5/10 | Hoạt động được nhưng thiếu chuẩn hóa |
| Kiểm thử | 2/10 | Gần như chưa có baseline test |
| Sẵn sàng production | 4/10 | Phù hợp nội bộ, chưa vững cho mở rộng |

## 6. Đề xuất cải tiến ưu tiên

### Giai đoạn 1: 1-2 tuần, xử lý rủi ro tức thì

1. Loại bỏ hard-code secret khỏi frontend và `.env.example`.
2. Viết lại README và tài liệu khởi chạy theo đúng sản phẩm.
3. Xóa log debug ở các flow nhạy cảm: login, sidebar, payment, attendance.
4. Tạo router guard cơ bản cho auth và role.
5. Chốt một đường dữ liệu duy nhất:
   - hoặc chỉ Apps Script,
   - hoặc chuyển dần sang backend Node.
   Tránh trạng thái “lai nhưng không rõ chuẩn”.

### Giai đoạn 2: 2-4 tuần, chuẩn hóa kỹ thuật

1. Tách `data-from-sheet.ts` thành:
   - `sheet-read-client`
   - `sheet-write-client`
   - `domain mappers`
   - `error handling`
2. Chuẩn hóa type cho entity chính.
3. Tách Apps Script thành module theo domain hoặc chuyển dần write action sang backend.
4. Bổ sung validation schema cho request/payload.
5. Tạo bộ test tối thiểu cho luồng:
   - đăng nhập,
   - thêm học viên,
   - thu học phí,
   - điểm danh.

### Giai đoạn 3: 1-2 tháng, nâng cấp nền tảng

1. Di chuyển từ Google Sheets-centric sang API-centric architecture.
2. Dùng database chuẩn cho transactional data nếu hệ thống tiếp tục mở rộng.
3. Tạo audit log cho các thao tác chỉnh sửa tài chính và điểm danh.
4. Tạo CI pipeline thực sự:
   - install,
   - lint,
   - type-check,
   - test,
   - build.
5. Thiết lập staging environment riêng trước production.

## 7. Kiến nghị kiến trúc dài hạn

### Phương án A: Tiếp tục tối ưu mô hình Google Sheets

Phù hợp nếu:

- hệ thống chủ yếu dùng nội bộ,
- số người dùng ít,
- cần tối ưu chi phí,
- không cần security/compliance cao.

Cần làm:

- Apps Script modular hơn,
- backend nhẹ cho auth và proxy,
- không để frontend chạm trực tiếp vào secret,
- tăng logging và backup sheet.

### Phương án B: Chuyển sang backend làm trung tâm

Phù hợp nếu:

- muốn mở rộng người dùng,
- cần phân quyền rõ,
- có nhu cầu audit/reporting ổn định,
- dự kiến bảo trì lâu dài.

Hướng đi hợp lý:

- giữ frontend hiện tại,
- chuyển write logic khỏi Apps Script,
- dần dần chuyển read logic khỏi Google Sheets API trực tiếp,
- dùng Google Sheets như import/export hoặc reporting bridge thay vì database chính.

Với trạng thái hiện tại, tôi khuyến nghị Phương án B nếu dự án còn sống ít nhất 12 tháng nữa.

## 8. Kết luận

Đây không còn là một template admin đơn thuần; dự án đã chứa khá nhiều logic vận hành có giá trị. Vấn đề chính không nằm ở chỗ “thiếu tính năng”, mà nằm ở chỗ kiến trúc đã đi xa hơn mức phù hợp của một giải pháp MVP nhưng chưa được nâng cấp tương ứng.

Nếu chỉ tiếp tục vá lỗi theo tình huống, chi phí bảo trì sẽ tăng nhanh và rủi ro dữ liệu sẽ ngày càng cao. Bước đi đúng lúc này là dành một nhịp ngắn để chuẩn hóa bảo mật, làm rõ kiến trúc và dựng baseline test trước khi phát triển tiếp.

## 9. Ghi chú kiểm chứng

- Đã rà soát cấu trúc repo, frontend, backend và Apps Script chính.
- Đã xác nhận repo có thay đổi cục bộ sẵn từ trước tại `docs/Code-2025.gs`; tài liệu này không đụng vào file đó.
- Đã thử chạy `npm run build:ci`, nhưng không chạy được trong workspace hiện tại vì thiếu dependency cài đặt (`vite: not found`). Vì vậy phần đánh giá thiên về cấu trúc mã nguồn và readiness, không phải kết quả build hoàn chỉnh.
