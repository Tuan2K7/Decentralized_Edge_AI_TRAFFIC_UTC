# 🚦 Decentralized Edge-AI Traffic Grid

[![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Cardano](https://img.shields.io/badge/Cardano-Preprod-blue?style=flat&logo=cardano)](https://cardano.org/)
[![MeshSDK](https://img.shields.io/badge/MeshSDK-Web3-purple?style=flat)](https://meshjs.dev/)
[![YOLOv8](https://img.shields.io/badge/AI-YOLOv8-yellow?style=flat)](#)
[![UTC](https://img.shields.io/badge/UTC-CNTT_VA2_K66-red?style=flat)](#)

**Mạng lưới AI Giao thông Tự chữa lành** - Ứng dụng công nghệ Edge-AI và Blockchain Cardano để xây dựng hệ thống giám sát hạ tầng giao thông phi tập trung, minh bạch và theo thời gian thực.

---

## 📖 Giới thiệu Dự án

Hiện nay, các hệ thống báo cáo sự cố hạ tầng giao thông (như ổ gà, ngập nước, nắp cống hỏng) thường có độ trễ lớn và phụ thuộc vào báo cáo thủ công của người dân. 

**Decentralized Edge-AI Traffic Grid** biến các phương tiện tham gia giao thông thành một mạng lưới "mắt thần" phi tập trung:
- 📷 **Edge AI (Off-chain):** Sử dụng Camera hành trình (chạy YOLOv8) và Cảm biến gia tốc smartphone để tự động phát hiện sự cố trực tiếp trên thiết bị (Zero-video-transmission), bảo vệ 100% quyền riêng tư của người lái xe.
- 🔗 **Blockchain (On-chain):** Đóng dấu tọa độ sự cố lên sổ cái Cardano (Preprod Testnet) thông qua cơ chế Native Metadata của kiến trúc eUTXO. Dữ liệu trở thành bằng chứng bất biến (Proof of Event) không thể cạo sửa, phục vụ cho việc giải ngân quỹ bảo trì đường bộ minh bạch.

---

## ✨ Tính năng cốt lõi

- **Nhận diện Tức thời (Real-time Detection):** Giao tiếp qua API nội bộ giữa module Python (AI) và Next.js (Web).
- **Ví Web3 Tích hợp:** Kết nối mượt mà với ví Eternl thông qua `@meshsdk/core`.
- **Đóng dấu Metadata (CIP-20):** Ghi nhận tọa độ, loại sự cố và độ tin cậy của AI trực tiếp vào chuỗi khối Cardano.
- **Bản đồ Cảnh báo:** Trực quan hóa các điểm kẹt/ổ gà theo thời gian thực.
- **Zero-Cost Hardware:** Tận dụng thiết bị sẵn có của tài xế, không cần lắp đặt camera cố định đắt đỏ.

---

## 🛠 Công nghệ sử dụng

### Frontend (DApp)
- **Framework:** Next.js (React), TypeScript
- **Styling:** Tailwind CSS
- **Web3 Integration:** Mesh SDK (`@meshsdk/react`, `@meshsdk/core`)

### Blockchain Infrastructure
- **Network:** Cardano (Preprod Testnet)
- **API Provider:** Blockfrost
- **Wallet Support:** Eternl

### AI & IoT Node (Module rời)
- **Computer Vision:** YOLOv8 (Python)
- **Data Transfer:** RESTful API

---

## 🚀 Hướng dẫn Cài đặt & Chạy Local

Do yêu cầu bảo mật mã nguồn mở, khi clone repository về, dự án sẽ không bao gồm thư mục `node_modules` và file `.env.local`. Vui lòng thực hiện các bước sau để khởi chạy:

### Yêu cầu hệ thống
- Node.js (phiên bản 18.x trở lên)
- Tiện ích ví [Eternl](https://chrome.google.com/webstore/detail/eternl/kmhcihpebfmpgmihbkipmjlmmioamjva) đã cài đặt trên trình duyệt và chuyển sang mạng **Preprod Testnet**.
- Ví Eternl cần có sẵn tADA. (Nhận tADA miễn phí tại [Cardano Faucet](https://docs.cardano.org/cardano-testnets/tools/faucet/)).

### Bước 1: Cài đặt thư viện
Clone repository về máy và cài đặt các gói phụ thuộc:

```bash
git clone https://github.com/TENTAIKHOANCUABAN/Decentralized_Edge_AI_TRAFFIC_UTC.git
cd Decentralized_Edge_AI_TRAFFIC_UTC/my-dapp
npm install
```

### Bước 2: Cấu hình Biến môi trường
Tạo một file mới có tên .env.local ở thư mục gốc (ngang hàng với file package.json) và thêm Blockfrost API Key của bạn vào:

```bash
NEXT_PUBLIC_BLOCKFROST_API_KEY=preprod_YOUR_API_KEY_HERE
```

### Bước 3: Khởi chạy Dự án
```bash
npm run dev
```

💡 Hướng dẫn Sử dụng (Demo)
1.Mở tiện ích ví Eternl: Bật Single Address Mode và thiết lập Collateral (Tài sản thế chấp).
2.Trên giao diện DApp, bấm nút Kết nối ví Eternl.
2.Hệ thống Edge-AI phát hiện ổ gà và hiển thị tọa độ JSON.
3.Bấm Xác thực & Lưu lên Blockchain và ký giao dịch bằng mật khẩu ví.
4.Kiểm tra mã giao dịch (TxHash) trực tiếp trên CardanoScan!

👥 Thành viên Phát triển
Dự án được thực hiện bởi sinh viên lớp CNTT VA2 K66 - Trường Đại học Giao thông Vận tải (UTC).

Nguyễn Anh Tuấn (Trưởng nhóm / Lead Developer)

Hoàng Nhất Nam

Phạm Tuấn Kiệt

Cao Việt Cường

Đinh Đức Vương

