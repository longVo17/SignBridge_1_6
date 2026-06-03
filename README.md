# SignBridge — AI-Powered ASL Learning App 
*(Ứng dụng học Ngôn ngữ ký hiệu Mỹ ASL tương tác thông minh)*

<div align="center">
  <img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/Zustand-4A4A55?style=for-the-badge&logo=react&logoColor=white" alt="Zustand" />
</div>

<br/>

**SignBridge** là ứng dụng di động đa nền tảng hỗ trợ học Ngôn ngữ ký hiệu Mỹ (ASL) và định hướng ký hiệu Ả Rập (WASL) tương tác, tích hợp công nghệ AI nhận diện thủ ngữ thông qua camera thiết bị thời gian thực. Ứng dụng được thiết kế tỉ mỉ theo ngôn ngữ giao diện kính mờ cao cấp (Light Theme Glassmorphism), mang lại trải nghiệm học tập lôi cuốn và mượt mà.

> **GitHub Repository:** [longVo17/SignBridge_1_6](https://github.com/longVo17/SignBridge_1_6)
> **Firebase Firestore Console:** [Project SignBridge Console](https://console.firebase.google.com/u/1/project/signbridge-c0b9c/firestore)

---

##  Các Tính Năng Hiện Tại (Tính đến 04/06/2026)

Hệ thống đã hoàn thiện toàn diện các mô-đun cốt lõi sẵn sàng cho môi trường sản xuất (Production-Ready):

1.  ** Xác thực người dùng (Authentication):**
    *   Đăng ký và Đăng nhập bảo mật thông qua **Firebase Authentication**.
    *   **Google Sign-In:** Hỗ trợ đăng nhập nhanh bằng tài khoản Google, tự động cấu hình và kiểm tra SDK, đi kèm cơ chế chẩn đoán lỗi chi tiết (DEVELOPER_ERROR 10, Network Error) bằng tiếng Việt cho quá trình chạy máy ảo/thiết bị thực.
    *   Giao diện Glassmorphism mượt mà mới với nền màu sáng Slate nhã nhặn, sang trọng, loại bỏ các chi tiết màu xanh/viền cứng gây rối mắt.
2.  ** Bài học Mở đầu & Lộ trình Học tập (Learning Path):**
    *   **Introduction to ASL (Cấp độ 1):** Bài học mở đầu truyền cảm hứng, giới thiệu về ASL, ngữ pháp cơ bản và bảng chữ cái với 3 slides tương tác tuyệt đẹp. Hỗ trợ cuộn tự động và đã tối ưu hóa bố cục giao diện (không bị thu hẹp màn hình).
    *   **Không có Quiz/Flashcards cho bài mở đầu:** Bỏ qua màn hình Quiz và kết quả 0% không cần thiết ở bài học Introduction, tự động chuyển đến màn hình ăn mừng nhận XP khi đọc xong slide.
    *   **ASL Alphabet Part 1 & Part 2:** Phân tách bảng chữ cái A-Z khoa học giúp người dùng không bị quá tải.
    *   Các bài học giao tiếp nâng cao: *Greetings & Meetings, Essential Communication, Colors, Numbers, v.v.*
3.  ** Ôn tập Thẻ ghi nhớ thông minh (Flashcards Hub):**
    *   Tích hợp cử chỉ vuốt thẻ **PanResponder 60fps** cực nhạy: Vuốt **Phải** để đánh dấu đã thuộc (*Mastered*), vuốt **Trái** để tiếp tục ôn luyện (*Still Learning*).
    *   Hiển thị viền màu động theo thời gian thực khi kéo thẻ (Xanh lá/Đỏ) cùng hiệu ứng lật thẻ 3D xem video.
    *   **Khôi phục tiến trình dang dở:** Tự động lưu tiến trình và cho phép học viên ôn tập tiếp tục các từ chưa thuộc để đạt mục tiêu 100%.
4.  ** Trợ lý AI hỏi đáp ASL chuyên sâu (OpenRouter & Gemini 2.5):**
    *   Tích hợp chatbot chuyên nghiệp giải đáp mọi thắc mắc về Ngôn ngữ ký hiệu Mỹ (ASL), ngữ pháp, văn hóa người Điếc.
    *   Sử dụng API của **OpenRouter** thông qua mô hình **`google/gemini-2.5-flash`** cực nhanh và ổn định, giải quyết triệt để lỗi giới hạn cuộc gọi (`limit: 0`) của tài khoản Google Cloud miễn phí.
    *   **Truy cập nhanh chóng:** Nút chat AI dạng bong bóng được tích hợp ngay tại **Header trang chủ** (kế bên nút thông báo) và trong trang **Profile** giúp người dùng trò chuyện bất kỳ lúc nào.
5.  ** Phân tích Tiến trình & Bảng xếp hạng thực tế (Analytics & Leaderboard):**
    *   Bảng xếp hạng toàn hệ thống chỉ hiển thị học viên thật từ cơ sở dữ liệu Firestore dựa trên XP tích lũy thực tế.
    *   Biểu đồ phân tích điểm số Quiz dạng **Lollipop Chart** thuần Native tuyệt đẹp với tooltip điểm bay lơ lửng và chấm tròn phát sáng ở đỉnh cột.
6.  ** Thông báo thông minh & Lập lịch Streak (Push Notifications & Streaks):**
    *   Nút Chuông thông báo kính mờ tại Header trang chủ, kết nối trực tiếp vào trang **Notifications Screen**.
    *   **Smart Streak Scheduler:** Tự động phân tích xem hôm nay người dùng đã học chưa để lên lịch nhắc nhở chuỗi ngày linh hoạt (Cảnh báo lúc 20:00 tối nay nếu chưa học, hoặc hẹn 20:00 tối mai nếu đã hoàn thành bài học).
    *   Hỗ trợ **Deep Linking** thời gian thực (Nhấn vào thông báo đẩy ngoài màn hình khóa tự động mở app và chuyển trang thẳng vào danh sách thông báo).
7.  ** Công cụ hỗ trợ quản trị viên (Admin Tools):**
    *   **Obsolete Paths Purger:** Script seed dữ liệu tự động quét sạch các bài học lỗi thời trên Firestore trước khi nạp cấu trúc mới.
    *   **User Progress Reset Utility:** Khôi phục tiến trình học tập của bất kỳ học viên nào về 0% qua terminal chỉ bằng UID mà không làm mất thông tin tài khoản hay gây lỗi xếp hạng.
8.  ** Màn hình tĩnh chuyên nghiệp:**
    *   Trang tĩnh Trợ giúp FAQ **Help & Support** với các hộp accordion thu gọn mượt mà.
    *   Trang chính sách bảo mật **Privacy Policy** chuẩn mực.

---

##  Hướng Dẫn Cài Đặt & Khởi Chạy (Local Development)

### 1. Chuẩn Bị Môi Trường
*   Đã cài đặt [Node.js](https://nodejs.org/) (Khuyên dùng bản LTS v18 trở lên).
*   Điện thoại Android/iOS đã cài ứng dụng **Expo Go** (Để chạy thử lập tức) hoặc máy ảo tương ứng.

### 2. Cài Đặt Thư Viện
Clone dự án về máy tính cá nhân của bạn:
```bash
git clone https://github.com/longVo17/SignBridge_1_6.git
cd SignBridge_1_6
```

Cài đặt các gói phụ thuộc cần thiết:
```bash
npm install
```

### 3. Đồng bộ Dữ liệu mẫu (Database Seeding)
Trước khi chạy app lần đầu, bạn cần khởi tạo các Lộ trình học và từ vựng chuẩn lên Cloud Firestore bằng cách chạy script seeding sau:
```bash
node scripts/seed.cjs
```
*Script sẽ tự động dọn dẹp các tài liệu cũ và nạp 56 từ vựng cùng 9 Lộ trình học tiêu chuẩn lên database.*

### 4. Khởi Chạy Ứng Dụng
Kích hoạt máy chủ Expo Development:
```bash
npx expo start
```
*Dùng camera điện thoại quét mã QR hiển thị trên Terminal để mở ứng dụng ngay lập tức thông qua Expo Go.*

### 5. Tiện ích Đặt lại tiến độ (Reset Progress Tool)
Nếu muốn reset toàn bộ tiến độ học tập và ôn tập flashcard của một tài khoản học viên về 0% phục vụ kiểm thử, hãy mở terminal chạy lệnh:
```bash
node scripts/resetProgress.cjs <USER_UID>
```

---

##  Hướng Phát Triển Tiếp Theo Trong Tương Lai (Roadmap)

Dự án đã sẵn sàng cho các giai đoạn nâng cấp kỹ thuật tiếp theo để trở thành ứng dụng thương mại hoàn chỉnh:

1.  ** Nhận diện Cử chỉ cử động tay qua AI thời gian thực (Local TFLite Model):**
    *   **Eject dự án sang Dev Client:** Thực hiện lệnh `npx expo prebuild --platform android` để can thiệp sâu vào mã nguồn Native.
    *   **Tích hợp AI Engine:** Cài đặt các thư viện `react-native-vision-camera` (lấy luồng khung hình) và `react-native-fast-tflite` (chạy mô hình học máy trực tiếp trên phần cứng máy).
    *   **So khớp Landmarks ngón tay:** Tải mô hình `hand_landmark.tflite` vào thư mục assets, sử dụng Frame Processor Worklet để bắt tọa độ xương ngón tay của người học và chấm điểm tự tin (Confidence Score) trực quan so với video mẫu.
2.  ** Đa ngôn ngữ và Bản địa hóa nâng cao (i18n & Localization):**
    *   Tích hợp gói `i18next` để hỗ trợ dịch thuật động.
    *   Bổ sung 3 ngôn ngữ cốt lõi: Tiếng Anh (ASL), Tiếng Việt (ASL hỗ trợ học viên Việt), và Tiếng Ả Rập (WASL).
3.  ** Tích hợp Đẩy thông báo đám mây (Cloud Push Notifications):**
    *   Thiết lập Firebase Cloud Messaging (FCM) kết hợp Expo Notifications Services để gửi các chương trình tiếp thị và khuyến khích học tập động từ trang quản trị tập trung.

---

<div align="center">
  <i>Được phát triển với niềm đam mê phá vỡ rào cản ngôn ngữ, kết nối cộng đồng. 🤟</i>
</div>
