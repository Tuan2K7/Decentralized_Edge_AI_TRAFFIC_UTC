/**
 * Module 2: API /api/sensor
 * Đây là "cổng đón khách" nhận dữ liệu từ Module 1 (Python AI)
 * và lưu vào bộ nhớ toàn cục để Dashboard hiển thị.
 */

import { NextRequest, NextResponse } from 'next/server';

// Lưu trữ in-memory (thay bằng DB cho production)
interface SensorEvent {
  id: string;
  lat: string;
  lng: string;
  type: string;
  confidence: string;
  timestamp: string;
  device_id?: string;
  blockchain_tx?: string;
  verified: boolean;
}

// Global store (tồn tại trong toàn bộ vòng đời server)
declare global {
  // eslint-disable-next-line no-var
  var sensorEvents: SensorEvent[];
}

if (!global.sensorEvents) {
  global.sensorEvents = [];
}

// POST: Nhận dữ liệu từ Python AI
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { lat, lng, type, confidence, timestamp, device_id } = body;

    if (!lat || !lng || !type) {
      return NextResponse.json({ error: 'Thiếu trường bắt buộc: lat, lng, type' }, { status: 400 });
    }

    const newEvent: SensorEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      lat,
      lng,
      type,
      confidence: confidence || '0%',
      timestamp: timestamp || new Date().toLocaleString('vi-VN'),
      device_id: device_id || 'unknown_node',
      verified: false,
    };

    // Thêm vào đầu danh sách, giữ tối đa 50 sự kiện
    global.sensorEvents.unshift(newEvent);
    if (global.sensorEvents.length > 50) {
      global.sensorEvents.pop();
    }

    console.log(`[API/sensor] ✅ Nhận sự kiện từ ${device_id || 'unknown'}: ${type} @ ${lat},${lng}`);

    return NextResponse.json({
      message: 'Dữ liệu đã nhận thành công',
      event_id: newEvent.id,
      total_events: global.sensorEvents.length,
    });

  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }
}

// GET: Trả về danh sách sự kiện để Dashboard polling
export async function GET() {
  return NextResponse.json(global.sensorEvents);
}
