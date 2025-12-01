# Hướng dẫn Setup EmailJS

Tài liệu này hướng dẫn cách cấu hình EmailJS để nhận email thông báo từ contact form.

## Bước 1: Tạo tài khoản EmailJS

1. Truy cập [https://www.emailjs.com/](https://www.emailjs.com/)
2. Click **Sign Up** và tạo tài khoản miễn phí
3. Xác nhận email đăng ký

## Bước 2: Thêm Email Service

1. Đăng nhập vào EmailJS Dashboard
2. Vào **Email Services** từ menu bên trái
3. Click **Add New Service**
4. Chọn email provider (Gmail, Outlook, Yahoo, etc.)
5. Kết nối tài khoản email của bạn
6. **Lưu lại Service ID** (ví dụ: `service_abc123`)

## Bước 3: Tạo Email Template

1. Vào **Email Templates** từ menu bên trái
2. Click **Create New Template**
3. Cấu hình template với các biến sau:

### Template Variables cần thiết

| Variable | Mô tả | Ví dụ trong template |
|----------|-------|---------------------|
| `from_name` | Tên người gửi | `{{from_name}}` |
| `from_email` | Email người gửi | `{{from_email}}` |
| `topic` | Chủ đề tin nhắn | `{{topic}}` |
| `message` | Nội dung tin nhắn | `{{message}}` |
| `timestamp` | Thời gian gửi | `{{timestamp}}` |

### Mẫu Email Template

**Subject:**
```
New Contact Form: {{topic}} - from {{from_name}}
```

**Content:**
```html
<h2>Tin nhắn mới từ Contact Form</h2>

<p><strong>Từ:</strong> {{from_name}}</p>
<p><strong>Email:</strong> {{from_email}}</p>
<p><strong>Chủ đề:</strong> {{topic}}</p>
<p><strong>Thời gian:</strong> {{timestamp}}</p>

<hr>

<h3>Nội dung tin nhắn:</h3>
<p>{{message}}</p>
```

4. Click **Save** để lưu template
5. **Lưu lại Template ID** (ví dụ: `template_xyz789`)

## Bước 4: Lấy Public Key

1. Vào **Account** từ menu bên trái
2. Tìm mục **Public Key** trong phần API Keys
3. **Copy Public Key** (ví dụ: `user_ABC123XYZ`)

## Bước 5: Cấu hình Environment Variables

Tạo hoặc cập nhật file `.env.local` trong thư mục gốc của project:

```env
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```

Thay thế các giá trị:
- `your_service_id` → Service ID từ Bước 2
- `your_template_id` → Template ID từ Bước 3
- `your_public_key` → Public Key từ Bước 4

## Bước 6: Kiểm tra

1. Khởi động lại development server
2. Truy cập trang Contact
3. Điền form và gửi thử
4. Kiểm tra email đã nhận được

## Xử lý lỗi thường gặp

### Lỗi: "The Public Key is invalid"
- Kiểm tra lại Public Key trong `.env.local`
- Đảm bảo không có khoảng trắng thừa

### Lỗi: "Service ID not found"
- Kiểm tra Service ID đã đúng chưa
- Đảm bảo email service đã được kết nối thành công

### Lỗi: "Template ID not found"
- Kiểm tra Template ID đã đúng chưa
- Đảm bảo template đã được save

### Email không nhận được
- Kiểm tra thư mục Spam
- Xác nhận email service đã được kết nối đúng
- Kiểm tra quota miễn phí (200 emails/tháng)

## Giới hạn Free Plan

- 200 emails/tháng
- 2 email templates
- EmailJS branding trong email

Để nâng cấp, truy cập [EmailJS Pricing](https://www.emailjs.com/pricing/).

## Tài liệu tham khảo

- [EmailJS Documentation](https://www.emailjs.com/docs/)
- [EmailJS React Integration](https://www.emailjs.com/docs/examples/reactjs/)
