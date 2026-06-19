# 🚗 Decentralized Edge-AI Traffic Grid
**Hệ thống giám sát hạ tầng giao thông phi tập trung — AI + Blockchain**

---

## 🏗 Kiến trúc tổng thể

```
[Camera/Video]
     │
     ▼
┌──────────────────────────────────┐
│  MODULE 1: Python AI (YOLOv8)   │  ← thư mục: python_ai/
│  - Phát hiện ổ gà               │
│  - Trích xuất GPS               │
│  - Gửi HTTP POST → Next.js      │
└──────────────┬───────────────────┘
               │ JSON qua HTTP POST
               ▼
┌──────────────────────────────────┐
│  MODULE 2: Next.js Dashboard    │  ← thư mục: nextjs_dashboard/
│  - API /api/sensor nhận data    │
│  - Bản đồ Leaflet hiển thị      │
│  - Polling cập nhật real-time   │
└──────────────┬───────────────────┘
               │ User bấm nút "Xác thực"
               ▼
┌──────────────────────────────────┐
│  MODULE 3: Blockchain (MeshSDK) │  ← tích hợp trong Dashboard
│  - Ví Eternl ký giao dịch       │
│  - Metadata CIP-20 lên Cardano  │
│  - TxHash lưu vĩnh viễn         │
└──────────────────────────────────┘
```

---

## 🚀 HƯỚNG DẪN CHẠY (đọc kỹ thứ tự!)

### Yêu cầu
- Python 3.10+
- Node.js 18+
- Ví **Eternl** đã cài trên Chrome (nạp tADA từ faucet Cardano Preprod)

---

### BƯỚC 1: Chạy Dashboard (Module 2 + 3)

```bash
cd nextjs_dashboard
npm install
npm run dev
```

Mở trình duyệt: **http://localhost:3000**

Giao diện hiển thị bản đồ Hà Nội với thông báo *"Đang chờ dữ liệu AI..."*.

Bấm **"Kết nối ví Eternl"** để chuẩn bị sẵn ví trước.

---

### BƯỚC 2: Chạy AI Detection (Module 1)

#### Option A — Chế độ giả lập (không cần camera, dùng để demo nhanh)
```bash
cd python_ai
pip install -r requirements.txt
python detect_and_send.py --demo
```
→ Gửi 5 sự kiện mẫu lên Dashboard, quan sát chấm đỏ xuất hiện trên bản đồ.

#### Option B — File video thực
```bash
# Đặt file video vào python_ai/sources/ (cùng file .gpx nếu có)
cd python_ai
python detect_and_send.py
```

#### Option C — Webcam (IP Webcam hoặc webcam laptop)
```bash
cd python_ai
python detect_and_send.py --webcam
```

---

### BƯỚC 3: Xác thực lên Blockchain

1. Trên Dashboard, chấm đỏ xuất hiện khi AI phát hiện ổ gà.
2. Bấm vào chấm hoặc card trong sidebar để xem chi tiết.
3. Bấm **"⚡ Xác thực & Đóng dấu Blockchain"**.
4. Ví Eternl bật lên → nhập mật khẩu → xác nhận.
5. **TxHash** xuất hiện → có thể xem trên [Cardano Preprod Explorer](https://preprod.cardanoscan.io).

---

## 📁 Cấu trúc thư mục

```
DecentralizedTrafficGrid/
├── python_ai/                    ← Module 1 (Python)
│   ├── detect_and_send.py        ★ File chạy chính
│   ├── requirements.txt
│   ├── weights/
│   │   └── best.pt              ← Đặt model YOLOv8 tại đây
│   ├── sources/                 ← Đặt file .mp4 và .gpx tại đây
│   ├── logs/                    ← Tự động lưu JSON sự kiện
│   └── modules/
│       └── gps_processor.py
│
└── nextjs_dashboard/             ← Module 2 + 3 (Next.js)
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx          ★ Dashboard + Blockchain UI
    │   │   ├── layout.tsx
    │   │   ├── globals.css
    │   │   └── api/
    │   │       ├── sensor/       ← Nhận POST từ Python AI
    │   │       │   └── route.ts  
    │   │       └── blockchain-status/
    │   │           └── route.ts  ← Cập nhật TxHash
    │   └── components/
    │       ├── MapComponent.tsx  ← Bản đồ Leaflet
    │       └── MeshProviderWrapper.tsx
    ├── package.json
    ├── next.config.ts
    └── tsconfig.json
```

---

## 🔧 Cấu hình

### Thay đổi URL Dashboard (nếu không chạy localhost)
Trong `python_ai/detect_and_send.py`, sửa dòng:
```python
DASHBOARD_API = "http://localhost:3000/api/sensor"
```

### Thay đổi toạ độ GPS mặc định
```python
DEFAULT_LAT = 21.0285  # Vĩ độ
DEFAULT_LNG = 105.8048 # Kinh độ
```

### Weights YOLOv8 tuỳ chỉnh
Đặt file `.pt` vào `python_ai/weights/best.pt`.
Nếu không có, hệ thống tự tải `yolov8n.pt` (model mặc định).

---

## 📊 Luồng dữ liệu chi tiết

```
Python detect_and_send.py
  │
  │ requests.post("http://localhost:3000/api/sensor", json={
  │   "lat": "21.0285",
  │   "lng": "105.8048",
  │   "type": "O_GA_NGUY_HIEM",
  │   "confidence": "96.5%",
  │   "timestamp": "14:32:05 15/06/2026",
  │   "device_id": "cam_001"
  │ })
  │
  ▼
Next.js /api/sensor/route.ts
  → Lưu vào global.sensorEvents[]
  
Frontend page.tsx
  → setInterval polling GET /api/sensor mỗi 2 giây
  → Hiển thị chấm trên bản đồ + card trong sidebar
  
User bấm "Xác thực"
  → MeshSDK tạo Transaction
  → tx.setMetadata(2026, { data: event })
  → Eternl wallet ký
  → Submit lên Cardano Preprod
  → POST /api/blockchain-status { event_id, tx_hash }
  → Sự kiện được đánh dấu verified ✅
```

---

## 🌐 Links hữu ích
- Cardano Preprod Explorer: https://preprod.cardanoscan.io
- Cardano Preprod Faucet: https://docs.cardano.org/cardano-testnets/tools/faucet
- MeshSDK Docs: https://meshjs.dev
- YOLOv8 Docs: https://docs.ultralytics.com

---

*© 2026 Nhóm Nghiên Cứu AI & Blockchain — Trường Đại học Giao thông Vận tải (UTC)*
