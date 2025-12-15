# Portfolio Website

Trang web portfolio cá nhân với React, TypeScript, Tailwind CSS và Lovable Cloud.

## 🚀 Demo & Admin

- **Website**: https://luxe-builder-site.vercel.app
- **Admin Panel**: https://luxe-builder-site.vercel.app/admin

**Tài khoản admin mặc định**:
- Email: `admin@trinhbalam.com`
- Password: `Admin@123456`

## ⚙️ Cài đặt & Chạy

```bash
# Clone repository
git clone <repository-url>
cd <project-folder>

# Cài đặt dependencies
npm install

# Chạy development
npm run dev
```

## 🔐 Environment Variables

Tạo file `.env`:

```env
VITE_SUPABASE_PROJECT_ID="hcigjefjrtkroeitictp"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjaWdqZWZqcnRrcm9laXRpY3RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MDE4MDUsImV4cCI6MjA3NjQ3NzgwNX0.o0rzJlzrYCPjflqB7KiQZGr9sl5WhZSDRGAeVS84Xfk"
VITE_SUPABASE_URL="https://hcigjefjrtkroeitictp.supabase.co"
```

## 📦 Deploy lên Vercel

1. Push code lên GitHub
2. Import vào Vercel
3. Thêm Environment Variables từ file `.env`
4. Deploy

**Fix lỗi 404**: File `vercel.json` đã được tạo sẵn để xử lý routing.

## 🎨 Tính năng Admin CMS

- **Về tôi**: Cập nhật thông tin, hình ảnh
- **Kỹ năng**: Quản lý danh sách kỹ năng
- **Kinh nghiệm**: Timeline kinh nghiệm (theo mốc thời gian)
- **Dự án**: Quản lý portfolio dự án
- **Liên hệ**: Email, phone, địa chỉ, Google Maps

## 🗺️ Google Maps Setup

1. Vào [Google Maps](https://www.google.com/maps)
2. Tìm địa điểm → Share → Embed a map
3. Copy URL trong `src="..."`
4. Paste vào Admin > Liên hệ > Google Maps Embed URL

## 🛠️ Tech Stack

- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Lovable Cloud (Supabase)
- Framer Motion

## 📧 Liên hệ

Email: trinhbalam@gmail.com

---

