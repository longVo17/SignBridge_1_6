# SignBridge — AI-Powered ASL Learning App 🤟

<div align="center">
  <img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/Zustand-4A4A55?style=for-the-badge&logo=react&logoColor=white" alt="Zustand" />
</div>

<br/>

**SignBridge** là ứng dụng di động hỗ trợ học Ngôn ngữ ký hiệu Mỹ (ASL) tương tác, tích hợp công nghệ AI (TFLite) nhận diện thủ ngữ qua camera thời gian thực. Dự án được thiết kế với giao diện Glassmorphism hiện đại, cung cấp lộ trình học tập từ cơ bản đến nâng cao.

> Được phát triển bởi [longVo17](https://github.com/longVo17).

---

## ✨ Tính Năng Chính
- **🔑 Xác thực người dùng:** Đăng nhập, đăng ký nhanh chóng bằng Email thông qua Firebase Authentication.
- **📚 Từ Điển Ký Hiệu (Dictionary):** Tra cứu từ vựng ASL, lọc theo danh mục, tích hợp video hướng dẫn trực quan.
- **🗺️ Lộ Trình Học Tập (Learning Path):** Flashcard các bài học được tổ chức theo cấp độ. Ghi nhận tiến độ ("Đã hiểu").
- **📈 Theo Dõi Tiến Độ (Progress Tracking):** Hệ thống XP (điểm kinh nghiệm), Level, Huy hiệu (Achievements) và chuỗi ngày học (Streak) để tạo động lực.
- **🎥 Video Cloudinary:** Video bài giảng được tối ưu hóa lưu trữ và phát trực tuyến bằng Cloudinary giúp giảm kích thước bộ cài.
- **🤖 Thực Hành AI (Sắp ra mắt):** Chia đôi màn hình cho phép người dùng mở camera thực hành trực tiếp theo video mẫu. Mô hình TFLite sẽ chấm điểm (Confidence Score) theo thời gian thực.

---

## 🛠 Cách Chạy Ứng Dụng (Local Development)

### 1. Yêu Cầu Hệ Thống
- [Node.js](https://nodejs.org/) (Khuyến nghị bản LTS)
- Ứng dụng **Expo Go** trên điện thoại Android/iOS (Hoặc Android Studio Emulator / iOS Simulator).
- Tài khoản [Firebase](https://firebase.google.com/) (Để thiết lập CSDL nếu cần).

### 2. Cài Đặt

Clone dự án về máy:
```bash
git clone https://github.com/longVo17/SignBridge.git
cd SignBridge/SignBridgeApp
```

Cài đặt thư viện:
```bash
npm install
```

Chạy Seed Script để tạo dữ liệu giả (nếu database Firebase đang trống):
> **Lưu ý:** Bạn cần mở Rules của Firestore thành `allow read, write: if true;` trước khi chạy lệnh này.
```bash
node scripts/seed.cjs
```

Khởi động ứng dụng bằng Expo:
```bash
npx expo start
```
*Sau đó, dùng app Expo Go quét mã QR trên terminal để xem trên điện thoại thực tế.*

---

## 🗺 Lộ Trình Phát Triển (Roadmap)

### ✅ Đã Hoàn Thành
- **Phase 1: Thiết lập Hệ Thống:** Khởi tạo Expo + TS, kết nối Firebase Auth và Firestore, thiết lập Zustand.
- **Phase 2: Authentication:** Hoàn thiện luồng đăng nhập, đăng ký với giao diện Glassmorphism.
- **Phase 3: Từ Điển (Dictionary):** Hoàn thiện UI tra cứu, lọc, video player. Chờ migration qua Cloudinary.
- **Phase 4: Learning Path & Progress:** Hiển thị bài học, cộng điểm XP, tính chuỗi Streak, cấp Level, tự động mở khóa thẻ thành tựu.

### ⏳ Đang Phát Triển / Cần Làm Tiếp
- **Phase 3.5: Cloudinary Video Migration:** Đưa 30 video từ vựng gốc lên Cloudinary và stream trực tiếp thay vì lưu trong file app (`local assets`).
- **Phase 5: Practice Screen:** Tính năng chia đôi màn hình: Nửa trên chạy video mẫu, nửa dưới bật camera để người dùng thực hành bắt chước. Lưu kết quả vào hệ thống.
- **Phase 6: Nhận diện AI TFLite (Lõi Ứng Dụng):**
  - Eject từ Expo Go sang Expo Dev Build để chạy mã Native trên Android.
  - Cài đặt `react-native-vision-camera` và `react-native-fast-tflite`.
  - Tích hợp mô hình `model.tflite` (từ SignDetect_AI) kết hợp thuật toán phân tích khung hình (Frame Processor) để đánh giá độ chính xác của thao tác tay.

### 📱 Build & Triển Khai
- Test toàn bộ luồng học + nhận diện AI trên thiết bị Android thật.
- Đóng gói file cài đặt (APK) thông qua EAS Cloud.

---

<div align="center">
  <i>Được phát triển với niềm đam mê phá vỡ rào cản ngôn ngữ. 🤟</i>
</div>
