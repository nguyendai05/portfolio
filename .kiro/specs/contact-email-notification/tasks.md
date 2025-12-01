# Implementation Plan

- [x] 1. Setup EmailJS và cấu hình environment
  - [x] 1.1 Cài đặt EmailJS SDK
    - Chạy `npm install @emailjs/browser`
    - _Requirements: 1.1_
  - [x] 1.2 Tạo environment variables cho EmailJS credentials
    - Thêm VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, VITE_EMAILJS_PUBLIC_KEY vào .env.local
    - Cập nhật .env.example với placeholder values
    - _Requirements: 4.1_

- [x] 2. Implement Email Service
  - [x] 2.1 Tạo email service module
    - Tạo file `services/emailService.ts`
    - Implement interface ContactFormData và EmailResult
    - Implement function sendContactEmail() sử dụng EmailJS
    - Thêm timestamp vào email payload
    - _Requirements: 1.1, 3.1, 3.2, 3.3, 3.4, 3.5_
  - [x] 2.2 Write property test cho email payload completeness
    - **Property 1: Email payload completeness**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

- [x] 3. Cập nhật Contact Form



  - [x] 3.1 Tích hợp email service vào Contact form


    - Import và sử dụng sendContactEmail từ emailService trong pages/Contact.tsx
    - Thay thế setTimeout simulate trong handleSubmit bằng actual API call
    - Handle success và error responses từ sendContactEmail
    - _Requirements: 1.1, 1.2, 2.1_
  - [x] 3.2 Implement error handling và retry


    - Thêm error state vào form component
    - Hiển thị error message khi gửi thất bại (sử dụng error từ EmailResult)
    - Cho phép user retry khi có lỗi (reset error state khi submit lại)
    - _Requirements: 1.3, 2.2_
  - [x] 3.3 Write property test cho form validation











    - **Property 2: Form validation prevents invalid submissions**
    - **Validates: Requirements 2.3**
  - [ ] 3.4 Write property test cho UI state transitions






    - **Property 3: Success state consistency**
    - **Property 4: Error state consistency**
    - **Property 5: Loading state during submission**
    - **Validates: Requirements 1.2, 1.3, 1.4, 2.1, 2.2**

- [x] 4. Checkpoint - Đảm bảo tất cả tests pass








  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Tạo EmailJS Template hướng dẫn





  - [x] 5.1 Tạo file hướng dẫn setup EmailJS


    - Tạo EMAILJS_SETUP.md với hướng dẫn chi tiết setup EmailJS account
    - Bao gồm template variables cần thiết: from_name, from_email, topic, message, timestamp
    - Hướng dẫn cách lấy Service ID, Template ID, và Public Key
    - _Requirements: 4.1, 4.2_

- [x] 6. Final Checkpoint - Đảm bảo tất cả tests pass





  - Ensure all tests pass, ask the user if questions arise.
