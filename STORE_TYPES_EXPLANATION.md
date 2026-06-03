# TÀI LIỆU GIẢI THÍCH STORES & TYPES TRONG SIGNBRIDGE
*(Tài liệu chuyên sâu phục vụ báo cáo Đồ án tốt nghiệp / DACN1)*

Trong kiến trúc React Native của dự án **SignBridge**, hai thư mục [src/store/](file:///d:/2SignBridgeApp/src/store/) và [src/types/](file:///d:/2SignBridgeApp/src/types/) đóng vai trò cực kỳ quan trọng trong việc **quản lý dữ liệu toàn cục** và **ràng buộc kiểu dữ liệu**.

Dưới đây là giải thích chi tiết mục đích, cách hoạt động và cấu trúc của từng file:

---

## PHẦN I. HỆ THỐNG QUẢN LÝ TRẠNG THÁI TOÀN CỤC (STORES)

Ứng dụng sử dụng thư viện **Zustand** để quản lý trạng thái toàn cục (Global State Management).
*   *Zustand là gì?* Đây là thư viện quản lý state cực kỳ nhẹ, nhanh và đơn giản. Nó thay thế hoàn toàn cho bộ Redux cồng kềnh hoặc React Context API (thường gây hiện tượng render lại dư thừa làm chậm ứng dụng di động).
*   *Cơ chế hoạt động:* Zustand tạo ra các "kho chứa" (Store) nằm ngoài cây giao diện. Các màn hình (Screens) hoặc Component có thể đăng ký lắng nghe trực tiếp các biến trong Store. Khi dữ liệu trong Store thay đổi, giao diện tương ứng sẽ tự động cập nhật ngay lập tức.

### 1. authStore.ts (Trạng thái Xác thực & Tài khoản đăng nhập)
Nằm tại [src/store/authStore.ts](file:///d:/2SignBridgeApp/src/store/authStore.ts), chịu trách nhiệm lưu trữ phiên làm việc của người dùng hiện tại.

*   **Các biến trạng thái chính:**
    *   `user` (Kiểu `AuthUser | null`): Chứa thông tin tài khoản đang đăng nhập (UID, Email, Tên hiển thị, Ảnh đại diện, và vai trò `STUDENT` hoặc `ADMIN`).
    *   `status` (Kiểu `AuthStatus`): Trạng thái xác thực hiện tại, gồm 3 giá trị:
        *   `loading`: Đang kiểm tra phiên đăng nhập cũ từ Firebase Auth khi mới mở app.
        *   `authenticated`: Đã đăng nhập (Điều hướng đưa học viên vào trang chủ `HomeScreen`).
        *   `unauthenticated`: Chưa đăng nhập (Điều hướng đưa học viên ra màn hình `WelcomeScreen`/`LoginScreen`).
*   **Các hàm điều khiển (Actions):**
    *   `setUser(user)`: Lưu thông tin tài khoản vào Store.
    *   `setStatus(status)`: Cập nhật trạng thái xác thực.

### 2. progressStore.ts (Trạng thái Tiến độ Học tập của Học viên)
Nằm tại [src/store/progressStore.ts](file:///d:/2SignBridgeApp/src/store/progressStore.ts), lưu trữ điểm số, chuỗi ngày học (streak) và danh sách bài học đã hoàn thành của người dùng.

*   **Tại sao cần Store này?** Thay vì mỗi lần học xong 1 từ hoặc hoàn thành 1 quiz, chúng ta phải gọi đọc/ghi trực tiếp lên Firestore (gây trễ mạng và tốn quota cơ sở dữ liệu), ứng dụng sẽ cập nhật ngay lập tức lên `progressStore` để cập nhật giao diện tức thì (như thanh kéo phần trăm tiến độ, điểm số XP tăng lên), sau đó tiến hành đồng bộ ngầm với Firestore.
*   **Các biến trạng thái chính:**
    *   `progress` (Kiểu `UserProfile | null`): Bản sao tiến độ học tập thực tế của học viên.
    *   `loading`: Trạng thái đang tải dữ liệu tiến độ khi học viên mở tab lộ trình.
*   **Các hàm điều khiển (Actions):**
    *   `setProgress(progress)`: Nạp toàn bộ dữ liệu tiến độ từ cơ sở dữ liệu Firestore vào Store.
    *   `addXP(amount)`: Cộng thêm điểm XP tích lũy và cập nhật lập tức trên UI.
    *   `completeLessonInStore(lessonId)`: Đưa ID bài học vừa hoàn thành vào danh sách bài học đã làm để vẽ vòng tròn đánh dấu trên sơ đồ Lộ trình học.

---

## PHẦN II. RÀN BUỘC KIỂU DỮ LIỆU (TYPES)

Dự án viết bằng **TypeScript**, do đó các file `types` đóng vai trò định nghĩa cấu trúc dữ liệu chuẩn (Data Contracts). Chúng đảm bảo lập trình viên không truyền thiếu tham số, sai chính tả tên trường dữ liệu và giúp trình biên dịch phát hiện lỗi ngay khi đang viết code thay vì đợi đến lúc chạy thử bị crash.

### 1. auth.types.ts (Kiểu dữ liệu xác thực & Tài khoản)
Nằm tại [src/types/auth.types.ts](file:///d:/2SignBridgeApp/src/types/auth.types.ts).

*   **`UserProfile`:** Định nghĩa chính xác cấu trúc tài liệu của học viên lưu trên Firestore, bao gồm:
    ```typescript
    export interface UserProfile {
      uid: string;           // Mã ID định danh tài khoản duy nhất của Firebase Auth
      displayName: string;   // Tên hiển thị của học viên
      email: string;         // Địa chỉ email
      photoURL?: string;     // Đường dẫn ảnh đại diện (Unsplash hoặc Google Avatar)
      totalXP: number;       // Tổng điểm tích lũy học tập
      streakDays: number;    // Chuỗi ngày học liên tục (Streak)
      lastActiveDate: string;// Ngày hoạt động gần nhất (Định dạng YYYY-MM-DD để tính streak)
      phoneNumber?: string;  // Số điện thoại học viên (tùy chọn)
      role?: 'STUDENT' | 'ADMIN'; // Quyền hạn: Học viên thường hoặc Quản trị viên
    }
    ```
*   **`AuthUser` & `AuthState`:** Định nghĩa kiểu dữ liệu lưu trữ cho Zustand `authStore` để quản lý kiểu đầu vào/đầu ra của hàm đăng nhập.

### 2. data.types.ts (Kiểu dữ liệu nghiệp vụ học tập & Từ điển)
Nằm tại [src/types/data.types.ts](file:///d:/2SignBridgeApp/src/types/data.types.ts).

*   **`Sign` (Từ vựng thủ ngữ):** Định nghĩa cấu trúc của một từ vựng cử chỉ trong từ điển:
    *   `id`: ID của từ.
    *   `word`: Từ tiếng Anh gốc (ví dụ: "hello").
    *   `vietnamese`: Từ dịch nghĩa tiếng Việt (ví dụ: "xin chào").
    *   `description`: Mô tả chi tiết cách thực hiện cử chỉ (ví dụ: "Đặt tay lên trán đưa ra ngoài...").
    *   `videoURL`: Link video mẫu đuôi `.mp4` lưu trên đám mây Cloudinary.
    *   `category`: Danh mục từ vựng (Basics, Greetings, Colors...).
    *   `examples`: Mảng các câu ví dụ sử dụng từ này.
*   **`Lesson` (Bài học):** Định nghĩa cấu trúc của một bài học nhỏ:
    *   `id`: ID bài học.
    *   `pathId`: ID lộ trình lớn chứa bài học này (ví dụ: `vocab_1`).
    *   `title`: Tiêu đề bài học (ví dụ: "Từ vựng cơ bản 1").
    *   `signId`: ID của từ vựng cử chỉ tương ứng trong bài học này.
    *   `xpReward`: Số điểm thưởng XP nhận được khi hoàn thành bài học (thường là 30 XP).
*   **`LearningPath` (Lộ trình học):** Định nghĩa cấu trúc của một chặng lớn trên bản đồ học tập:
    *   `id`: ID lộ trình (ví dụ: `intro`, `vocab_1`, `alphabet_1`).
    *   `title`: Tên lộ trình (ví dụ: "Introduction to ASL").
    *   `description`: Mô tả nội dung chặng học.
    *   `icon`: Ký tự hình ảnh biểu thị (Ví dụ: 🤟, 💬, 🔤, ✨).
    *   `order`: Thứ tự sắp xếp hiển thị trên sơ đồ chặng học từ trên xuống dưới.
*   **`QuizQuestion` & `Quiz`:** Định nghĩa định dạng câu hỏi trắc nghiệm (câu hỏi, các phương án lựa chọn, chỉ số đáp án đúng) dùng cho mô-đun kiểm tra cuối bài học.
