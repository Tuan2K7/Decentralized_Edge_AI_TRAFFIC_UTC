/**
 * Module 3: API /api/blockchain-status
 * Cập nhật trạng thái sau khi người dùng ký giao dịch Cardano thành công
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event_id, tx_hash } = body;

    if (!event_id || !tx_hash) {
      return NextResponse.json({ error: 'Cần event_id và tx_hash' }, { status: 400 });
    }

    // Tìm và cập nhật sự kiện đã được verify
    const event = global.sensorEvents?.find((e) => e.id === event_id);
    if (!event) {
      return NextResponse.json({ error: 'Không tìm thấy sự kiện' }, { status: 404 });
    }

    event.blockchain_tx = tx_hash;
    event.verified = true;

    console.log(`[API/blockchain] ⛓ Đã verify sự kiện ${event_id} → TxHash: ${tx_hash.slice(0, 16)}...`);

    return NextResponse.json({ message: 'Cập nhật blockchain thành công', event });
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
}
