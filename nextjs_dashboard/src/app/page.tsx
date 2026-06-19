'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWallet } from '@meshsdk/react';
import { Transaction, BrowserWallet } from '@meshsdk/core';
import dynamic from 'next/dynamic';

// Lazy load Map component (Leaflet không chạy trên server)
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div style={{ position: 'absolute', inset: 0, background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
      🗺 Đang khởi tạo bản đồ...
    </div>
  ),
});

// ── Kiểu dữ liệu ───────────────────────────────────────────────
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

// ── Component chính ─────────────────────────────────────────────
export default function Home() {
  const { connected, connecting, connect, disconnect, name } = useWallet();

  const [events, setEvents]               = useState<SensorEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<SensorEvent | null>(null);
  const [txHash, setTxHash]               = useState<string>('');
  const [loading, setLoading]             = useState<boolean>(false);
  const [txStatus, setTxStatus]           = useState<string>('');
  const [isMounted, setIsMounted]         = useState<boolean>(false);
  const [clock, setClock]                 = useState<string>('--:--:--');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab]         = useState<'feed' | 'blockchain'>('feed');
  const [flyToCoord, setFlyToCoord]       = useState<[number, number] | null>(null);
  const pollingRef                        = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setIsMounted(true);
    // Clock
    const clockTimer = setInterval(() => {
      setClock(new Date().toLocaleTimeString('vi-VN', { hour12: false }));
    }, 1000);
    // Polling dữ liệu từ API mỗi 2 giây
    pollingRef.current = setInterval(fetchEvents, 2000);
    fetchEvents();

    return () => {
      clearInterval(clockTimer);
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/sensor');
      if (res.ok) {
        const data: SensorEvent[] = await res.json();
        setEvents(data);
      }
    } catch {
      // Bỏ qua lỗi mạng — sẽ thử lại sau
    }
  }, []);

  // ── Đẩy dữ liệu lên Cardano Blockchain (Module 3) ────────────
  const handlePushToCardano = async (event: SensorEvent) => {
    if (!connected || !name) {
      alert('Vui lòng kết nối ví Eternl trước!');
      return;
    }
    setLoading(true);
    setTxHash('');
    setTxStatus('⏳ Đang xây dựng giao dịch...');

    try {
      const coreWallet = await BrowserWallet.enable(name);
      const myAddress  = await coreWallet.getChangeAddress();

      if (!myAddress) throw new Error('Không lấy được địa chỉ ví.');

      // Đóng gói dữ liệu AI vào Metadata CIP-20
      const metadata = {
        project:  'Decentralized Edge-AI Traffic Grid',
        module:   'AI Vision Node',
        data: {
          lat:        event.lat,
          lng:        event.lng,
          type:       event.type,
          confidence: event.confidence,
          timestamp:  event.timestamp,
          device_id:  event.device_id || 'unknown',
        },
      };

      const tx = new Transaction({ initiator: coreWallet });
      tx.setChangeAddress(myAddress);
      tx.sendLovelace(myAddress, '1000000');   // 1 tADA mồi giao dịch
      tx.setMetadata(2026, metadata);

      setTxStatus('🔐 Đang ký giao dịch — vui lòng xác nhận trên ví Eternl...');
      const unsignedTx = await tx.build();
      const signedTx   = await coreWallet.signTx(unsignedTx);
      const hash       = await coreWallet.submitTx(signedTx);

      setTxHash(hash);
      setTxStatus('✅ Giao dịch thành công!');

      // Cập nhật trạng thái verified lên API
      await fetch('/api/blockchain-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: event.id, tx_hash: hash }),
      });

      // Refresh danh sách
      await fetchEvents();

    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Lỗi không xác định';
      console.error('Blockchain error:', error);
      setTxStatus(`❌ Thất bại: ${errMsg}`);
      alert(`Giao dịch thất bại:\n${errMsg}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) return null;

  const verifiedCount = events.filter(e => e.verified).length;
  const pendingCount  = events.filter(e => !e.verified).length;

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* ── BẢN ĐỒ (fullscreen background) ── */}
      <MapComponent
        events={events}
        selectedEvent={selectedEvent}
        onSelectEvent={setSelectedEvent}
        flyToCoord={flyToCoord}
        sidebarCollapsed={sidebarCollapsed}
      />

      {/* ── SIDEBAR ── */}
      <div style={{
        position: 'absolute', top: 16, left: 16, bottom: 16,
        width: 380, zIndex: 200,
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 20,
        boxShadow: '0 8px 24px rgba(0,0,0,0.09)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        transform: sidebarCollapsed ? 'translateX(-400px)' : 'translateX(0)',
      }}>

        {/* Header */}
        <div style={{ padding: '16px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#6366f1,#0284c7)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 13, flexShrink: 0 }}>UTC</div>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e293b', letterSpacing: -0.5 }}>
                AI TRAFFIC <span style={{ color: '#f97316' }}>UTC</span>
              </div>
              <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>
                Decentralized Edge-AI Grid
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: 30, border: '1px solid rgba(16,185,129,0.2)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'statusPulse 1.8s infinite' }} />
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#10b981', letterSpacing: 0.5 }}>LIVE</span>
          </div>
        </div>

        {/* Wallet Banner */}
        <div style={{ padding: '10px 20px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
          {connected ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: 700 }}>⛓ Ví {name} đã kết nối</span>
              <button onClick={() => disconnect()} style={{ fontSize: '0.7rem', background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontWeight: 600 }}>
                Ngắt kết nối
              </button>
            </div>
          ) : (
            <button
              onClick={() => connect('eternl')}
              disabled={connecting}
              style={{ width: '100%', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 0', fontWeight: 700, fontSize: '0.8rem', cursor: connecting ? 'wait' : 'pointer', opacity: connecting ? 0.7 : 1 }}
            >
              {connecting ? '⏳ Đang gọi ví...' : '🔗 Kết nối ví Eternl để đóng dấu Blockchain'}
            </button>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: '12px 16px', background: '#fff', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
          {[
            { label: 'Tổng sự cố', value: events.length, color: '#ef4444', bg: '#fff5f5' },
            { label: 'Đã verify', value: verifiedCount, color: '#10b981', bg: '#f0fdf4' },
            { label: 'Chờ xử lý', value: pendingCount, color: '#f59e0b', bg: '#fff7ed' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: '8px 10px', border: `1px solid ${s.color}22` }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.2 }}>{s.label}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.1 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
          {(['feed', 'blockchain'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1, border: 'none', background: activeTab === tab ? '#fff' : 'transparent',
                padding: '10px 8px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                color: activeTab === tab ? '#0284c7' : '#64748b',
                borderBottom: activeTab === tab ? '2px solid #0284c7' : '2px solid transparent',
              }}
            >
              {tab === 'feed' ? '📡 LIVE FEED' : '⛓ BLOCKCHAIN'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>

          {/* Tab Feed */}
          {activeTab === 'feed' && (
            <>
              {events.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', gap: 10 }}>
                  <span style={{ fontSize: '2rem' }}>⏳</span>
                  <span>Đang chờ dữ liệu AI...</span>
                  <span style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>Chạy python detect_and_send.py để bắt đầu</span>
                </div>
              ) : (
                events.map(evt => (
                  <EventCard
                    key={evt.id}
                    event={evt}
                    selected={selectedEvent?.id === evt.id}
                    connected={connected}
                    loading={loading}
                    onSelect={() => {
                      setSelectedEvent(evt);
                      setFlyToCoord([parseFloat(evt.lat), parseFloat(evt.lng)]);
                      setTimeout(() => setFlyToCoord(null), 500);
                    }}
                    onVerify={() => handlePushToCardano(evt)}
                  />
                ))
              )}
            </>
          )}

          {/* Tab Blockchain */}
          {activeTab === 'blockchain' && (
            <>
              {/* Kết quả giao dịch vừa thực hiện */}
              {txStatus && (
                <div style={{ background: txHash ? '#f0fdf4' : '#fef3c7', border: `1px solid ${txHash ? '#86efac' : '#fde68a'}`, borderRadius: 10, padding: '10px 14px', fontSize: '0.8rem', color: txHash ? '#15803d' : '#92400e', marginBottom: 4 }}>
                  {txStatus}
                  {txHash && (
                    <div style={{ marginTop: 6 }}>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600, marginBottom: 2 }}>TxHash:</div>
                      <a href={`https://preprod.cardanoscan.io/transaction/${txHash}`} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: '0.65rem', color: '#2563eb', wordBreak: 'break-all', fontFamily: "'JetBrains Mono', monospace", display: 'block' }}>
                        {txHash}
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Danh sách đã verified */}
              {events.filter(e => e.verified).length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: '0.82rem', textAlign: 'center', gap: 8 }}>
                  <span style={{ fontSize: '2rem' }}>⛓</span>
                  <span>Chưa có giao dịch nào</span>
                  <span style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>Bấm &quot;Xác thực &amp; Đóng dấu&quot; trên từng sự cố</span>
                </div>
              ) : (
                events.filter(e => e.verified).map(evt => (
                  <div key={evt.id} style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 12px', animation: 'slideIn 0.25s ease', fontSize: '0.75rem', fontFamily: "'JetBrains Mono', monospace" }}>
                    <div style={{ color: '#15803d', fontWeight: 700, marginBottom: 4 }}>✅ {evt.type} — {evt.timestamp}</div>
                    <div style={{ color: '#64748b', marginBottom: 4 }}>📍 [{evt.lat}, {evt.lng}] | {evt.confidence}</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.65rem', marginBottom: 4 }}>TxHash:</div>
                    <a href={`https://preprod.cardanoscan.io/transaction/${evt.blockchain_tx}`} target="_blank" rel="noopener noreferrer"
                      style={{ color: '#2563eb', wordBreak: 'break-all', display: 'block', fontSize: '0.65rem' }}>
                      {evt.blockchain_tx}
                    </a>
                  </div>
                ))
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '10px 20px', borderTop: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: '0.78rem', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: '#1e293b' }}>{clock}</span>
          <span style={{ fontSize: '0.63rem', color: '#cbd5e1' }}>© 2026 Nhóm AI &amp; Blockchain UTC</span>
        </div>
      </div>

      {/* ── NÚT TOGGLE SIDEBAR ── */}
      <button
        onClick={() => setSidebarCollapsed(v => !v)}
        style={{
          position: 'absolute',
          top: '50%',
          left: sidebarCollapsed ? 20 : 404,
          transform: 'translateY(-50%)',
          zIndex: 201,
          width: 28, height: 52,
          background: '#fff',
          border: '1px solid #cbd5e1',
          borderRadius: 8,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '3px 0 8px rgba(0,0,0,0.06)',
          color: '#64748b',
          transition: 'left 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}
        title="Ẩn/Hiện bảng điều khiển"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
    </div>
  );
}

// ── EventCard component ─────────────────────────────────────────
function EventCard({
  event, selected, connected, loading, onSelect, onVerify
}: {
  event: SensorEvent;
  selected: boolean;
  connected: boolean;
  loading: boolean;
  onSelect: () => void;
  onVerify: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      style={{
        background: selected ? '#f0f9ff' : '#fff',
        border: `1px solid ${selected ? '#0284c7' : event.verified ? '#bbf7d0' : '#e2e8f0'}`,
        borderRadius: 12,
        padding: '10px 12px',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.18s ease',
        animation: 'slideIn 0.3s ease',
        flexShrink: 0,
      }}
    >
      {/* Thanh màu trái */}
      <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, background: event.verified ? '#10b981' : '#ef4444', borderRadius: '4px 0 0 4px' }} />

      <div style={{ paddingLeft: 8 }}>
        {/* Dòng 1: loại + thời gian */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ background: event.verified ? '#dcfce7' : '#fee2e2', color: event.verified ? '#15803d' : '#b91c1c', fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 6, border: `1px solid ${event.verified ? '#86efac' : '#fca5a5'}` }}>
            {event.type}
          </span>
          <span style={{ fontSize: '0.66rem', color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace" }}>{event.timestamp}</span>
        </div>

        {/* Dòng 2: toạ độ + node */}
        <div style={{ fontSize: '0.76rem', fontFamily: "'JetBrains Mono', monospace", color: '#1e293b', fontWeight: 600, marginBottom: 2 }}>
          [{event.lat}, {event.lng}]
        </div>
        <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: 6 }}>
          Node: <span style={{ color: '#6366f1', fontWeight: 600 }}>{event.device_id || 'unknown'}</span>
          {' · '}Độ tin cậy: <span style={{ color: event.verified ? '#10b981' : '#ef4444', fontWeight: 600 }}>{event.confidence}</span>
        </div>

        {/* Dòng 3: action button */}
        {!event.verified ? (
          <button
            onClick={e => { e.stopPropagation(); onVerify(); }}
            disabled={!connected || loading}
            style={{
              width: '100%',
              background: !connected ? '#f1f5f9' : 'linear-gradient(135deg,#2563eb,#4f46e5)',
              color: !connected ? '#94a3b8' : '#fff',
              border: 'none', borderRadius: 8,
              padding: '6px 0', fontWeight: 700, fontSize: '0.75rem',
              cursor: !connected || loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? '⏳ Đang xử lý...' : connected ? '⚡ Xác thực & Đóng dấu Blockchain' : '🔒 Kết nối ví để xác thực'}
          </button>
        ) : (
          <div style={{ fontSize: '0.7rem', color: '#15803d', fontWeight: 600, background: '#f0fdf4', padding: '4px 8px', borderRadius: 6 }}>
            ✅ Đã đóng dấu lên Cardano
            {event.blockchain_tx && (
              <a href={`https://preprod.cardanoscan.io/transaction/${event.blockchain_tx}`}
                target="_blank" rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                style={{ display: 'block', color: '#2563eb', fontSize: '0.65rem', wordBreak: 'break-all', marginTop: 2 }}>
                {event.blockchain_tx.slice(0, 24)}...
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
