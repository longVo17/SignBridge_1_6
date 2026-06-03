# GIẢI THÍCH CHI TIẾT CÁC SERVICES TRONG SIGNBRIDGE
*(Tài liệu chuyên sâu phục vụ báo cáo Đồ án tốt nghiệp / DACN1)*

Hệ thống dịch vụ (Services) của dự án **SignBridge** đóng vai trò là lớp nghiệp vụ (Business Logic Layer) trung gian. Chúng chịu trách nhiệm giao tiếp với cơ sở dữ liệu Firebase Firestore, API xác thực Firebase Auth, API trí tuệ nhân tạo OpenRouter, YouTube API, và các dịch vụ native của hệ điều hành (Notifications).

Dưới đây là mô tả chi tiết cách hoạt động của toàn bộ **8 Services** trong thư mục [src/services/](file:///d:/2SignBridgeApp/src/services/):

---

## 1. auth.service.ts (Dịch vụ Xác thực & Người dùng)
Chịu trách nhiệm quản lý tài khoản người dùng, thiết lập hồ sơ cá nhân và hiển thị bảng xếp hạng thành tích.

*   **Đăng ký bằng Email & Mật khẩu (`signUpWithEmail`):**
    *   Sử dụng hàm `createUserWithEmailAndPassword` của Firebase Auth để tạo tài khoản mới.
    *   Cập nhật tên hiển thị (`displayName`) của người dùng trong hệ thống xác thực.
    *   Gọi hàm `createUserProfile` để tạo một tài liệu (document) đại diện cho người dùng đó tại đường dẫn `/users/{uid}` trên Cloud Firestore nhằm khởi tạo tiến trình học (`totalXP = 0`, `streakDays = 0`).
*   **Đăng nhập bằng Email & Mật khẩu (`signInWithEmail`):**
    *   Gọi hàm `signInWithEmailAndPassword` của Firebase Auth để kiểm tra và thiết lập phiên đăng nhập.
*   **Đăng nhập bằng tài khoản Google (`signInWithGoogle`):**
    *   *Xem chi tiết cơ chế hoạt động tại phần giải thích trước đó.* Sử dụng Google Sign-In SDK native để lấy `idToken`, hoán đổi với Firebase Auth thông qua `signInWithCredential` và khởi tạo hồ sơ Firestore nếu là học viên mới.
*   **Quản lý thông tin hồ sơ (`updateUserProfile`):**
    *   Cập nhật tên và ảnh đại diện lên cả Firebase Auth (cho phiên đăng nhập) và tài liệu người dùng trên Firestore `/users/{uid}`.
*   **Bảng xếp hạng toàn cầu (`getLeaderboard`):**
    *   Thực hiện truy vấn (Query) bảng `/users` trên Firestore, sắp xếp giảm dần theo điểm tích lũy (`orderBy('totalXP', 'desc')`) và giới hạn số lượng học viên trả về (`limit(limitCount)`).

---

## 2. ai.service.ts (Dịch vụ Trợ lý AI - OpenRouter)
Tích hợp chatbot thông minh chuyên biệt về ngôn ngữ ký hiệu ASL cho học viên.

*   **Định tuyến API OpenRouter (`askAI` / `askGemini`):**
    *   Gửi yêu cầu POST HTTPS trực tiếp tới endpoint `https://openrouter.ai/api/v1/chat/completions`.
    *   Sử dụng mô hình **`google/gemini-2.5-flash`** với ưu điểm tốc độ xử lý nhanh, hiểu ngữ cảnh tốt và chi phí sử dụng tối ưu.
*   **Cấu hình Prompt chỉ dẫn hệ thống (System Instruction):**
    *   Nhúng sẵn một chỉ dẫn hệ thống cố định trong danh sách tin nhắn. Chỉ dẫn này yêu cầu AI đóng vai là "SignBridge AI" - trợ lý hỗ trợ Đồ án tốt nghiệp (DACN1), hướng dẫn AI tập trung trả lời các câu hỏi về ASL (lịch sử, văn hóa, ngữ pháp Time-First, Topic-Comment), và từ chối các câu hỏi không liên quan một cách lịch sự.
*   **Duy trì lịch sử hội thoại:**
    *   Nhận mảng lịch sử chat (`history`) từ giao diện chat và ánh xạ (map) sang định dạng chuẩn OpenAI (`role: 'user' | 'assistant'`) trước khi gửi lên API để AI có thể hiểu được mạch trò chuyện trước đó của học viên.

---

## 3. learning.service.ts (Dịch vụ Lộ trình Học tập & Tiến độ)
Quản lý việc truy vấn cấu trúc bài học và cập nhật tiến độ học của từng tài khoản.

*   **Tải Lộ trình Học tập (`getLearningPaths`):**
    *   Truy vấn bộ sưu tập `/paths` trên Firestore, sắp xếp theo thứ tự hiển thị định sẵn (`orderBy('order', 'asc')`).
*   **Tải Bài học theo Lộ trình (`getLessonsForPath`):**
    *   Truy vấn bộ sưu tập `/lessons` trên Firestore, lọc các bài học có trường `pathId` khớp với lộ trình được chọn, sắp xếp theo thứ tự bài học (`orderBy('order', 'asc')`).
*   **Đồng bộ Tiến độ Học tập (`getUserProgress` / `saveUserProgress`):**
    *   Đọc và ghi nhận danh sách các bài học đã hoàn thành (`completedLessons`) và các lộ trình học đã hoàn tất (`completedPaths`) của từng học viên tại tài liệu tiến độ `/users/{uid}/progress/current`.

---

## 4. dictionary.service.ts (Dịch vụ Từ điển & Trình dựng câu ASL)
Cung cấp dữ liệu từ vựng cử chỉ và thuật toán chuyển đổi câu tiếng Anh/Việt sang cấu trúc ký hiệu ASL.

*   **Tải & Tìm kiếm Từ vựng (`getSigns` / `searchSigns`):**
    *   Lấy toàn bộ từ vựng hoặc lọc các từ trong bộ sưu tập `/signs` trên Firestore theo từ khóa hoặc theo danh mục (chào hỏi, màu sắc, chữ số...).
*   **Thuật toán Dựng câu ASL (ASL Sentence Visualizer):**
    *   Hàm này nhận vào một câu văn nhập bởi học viên, sau đó tách câu thành các từ đơn lẻ và thực hiện phân tích ngữ pháp.
    *   Nó sẽ tìm kiếm các từ vựng tương ứng có sẵn video trong cơ sở dữ liệu từ điển `/signs`.
    *   Kết quả trả về là một chuỗi video mẫu nối tiếp nhau để chạy liên tục trên giao diện `SentencePlayerModal`, giúp học viên hình dung cách ghép các từ đơn thành một câu ký hiệu ASL hoàn chỉnh.

---

## 5. flashcard.service.ts (Dịch vụ Thẻ ghi nhớ thông minh)
Hỗ trợ lưu trữ trạng thái ôn tập flashcard để học viên học đi học lại các từ khó cho đến khi thuộc lòng.

*   **Lưu tiến trình ôn tập (`saveFlashcardProgress`):**
    *   Ghi nhận tiến độ ôn tập của học viên đối với một lộ trình học cụ thể vào đường dẫn `/users/{uid}/flashcardProgress/{pathId}` trên Firestore.
    *   Lưu trữ danh sách các từ đã thuộc (`masteredSignIds`) và danh sách các từ cần học lại (`learningSignIds`).
*   **Khôi phục trạng thái ôn tập (`getFlashcardProgress`):**
    *   Khi học viên quay lại học dở dang, service này sẽ tải lại danh sách các từ chưa thuộc để học viên tiếp tục ôn tập từ điểm dừng trước đó, giúp tối ưu hóa khả năng ghi nhớ dài hạn.

---

## 6. notification.service.ts (Dịch vụ Thông báo & Streak Reminder)
Quản lý thông báo đẩy (Push Notifications) cục bộ của thiết bị để tạo động lực học tập.

*   **Yêu cầu quyền & Đăng ký Token (`registerForPushNotifications`):**
    *   Sử dụng thư viện `expo-notifications` để xin quyền thông báo từ người dùng.
    *   Lấy mã token thông báo của thiết bị và lưu vào tài liệu người dùng Firestore để sẵn sàng nhận tin nhắn từ máy chủ Admin sau này.
*   **Lập lịch nhắc nhở học tập linh hoạt (`scheduleDailyReminder`):**
    *   *Thuật toán Streak thông minh:* Đọc dữ liệu tiến độ của ngày hôm nay.
    *   Nếu hôm nay học viên **chưa học bài**: Lên lịch gửi thông báo khẩn cấp lúc 20:00 tối nay để nhắc học viên học bài giữ chuỗi ngày học (streak).
    *   Nếu học viên **đã học bài**: Hủy lịch nhắc tối nay và lên lịch hẹn học bài mới vào 20:00 tối mai.
*   **Hỗ trợ Deep Linking:**
    *   Thiết lập sự kiện lắng nghe khi người dùng bấm vào thông báo ngoài màn hình khóa, tự động khởi động ứng dụng và chuyển hướng màn hình đến mục thông báo trong ứng dụng.

---

## 7. youtube.service.ts (Dịch vụ Tích hợp API YouTube)
Tìm kiếm và hiển thị các video hướng dẫn học ASL trực quan từ nền tảng YouTube làm tư liệu tham khảo thêm cho học viên.

*   **Truy vấn API YouTube Data v3 (`searchASLVideos`):**
    *   Gửi yêu cầu GET HTTPS đến API của Google: `https://www.googleapis.com/youtube/v3/search`.
    *   Sử dụng khóa API Key (`EXPO_PUBLIC_YT_API_KEY`) cấu hình trong file `.env`.
    *   Lọc từ khóa tìm kiếm (mặc định kèm hậu tố `"ASL sign language"`) để chỉ hiển thị các video dạy ngôn ngữ ký hiệu chất lượng.
    *   Trả về danh sách đối tượng chứa: `videoId` (để nhúng trình phát iframe `react-native-youtube-iframe`), tiêu đề video, ảnh thu nhỏ (thumbnail) và mô tả ngắn.

---

## 8. admin.service.ts (Dịch vụ Quản trị viên)
Cung cấp các công cụ tương tác đặc quyền dành cho tài khoản có vai trò `ADMIN` quản lý dữ liệu ứng dụng.

*   **Thêm/Sửa Lộ trình học (`createOrUpdatePath`):**
    *   Cho phép ADMIN ghi đè hoặc tạo mới tài liệu cấu hình lộ trình học trong bộ sưu tập `/paths` trên Firestore.
*   **Thêm/Sửa Từ vựng từ điển (`createOrUpdateSign`):**
    *   Cho phép ADMIN tạo mới từ vựng, cập nhật liên kết video Cloudinary hoặc thay đổi các câu ví dụ liên kết trực tiếp trên giao diện Admin Panel.
*   **Quản lý câu hỏi Quiz (`createOrUpdateQuiz`):**
    *   Cho phép ADMIN cập nhật ngân hàng câu hỏi trắc nghiệm tương ứng cho từng bài học để kiểm tra học viên cuối mỗi buổi học.
