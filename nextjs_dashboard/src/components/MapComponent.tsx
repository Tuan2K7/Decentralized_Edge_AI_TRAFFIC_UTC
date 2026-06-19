'use client';

import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';

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

interface MapComponentProps {
  events: SensorEvent[];
  selectedEvent: SensorEvent | null;
  onSelectEvent: (e: SensorEvent) => void;
  flyToCoord: [number, number] | null;
  sidebarCollapsed: boolean;
}

export default function MapComponent({ events, selectedEvent, onSelectEvent, flyToCoord, sidebarCollapsed }: MapComponentProps) {
  const mapRef       = useRef<L.Map | null>(null);
  const markersRef   = useRef<Map<string, L.CircleMarker>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  // Khởi tạo bản đồ một lần
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const map = L.map(containerRef.current, {
      center: [21.0285, 105.8048],
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=vi', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: 'Map data &copy; Google | AI Traffic UTC',
    }).addTo(map);

    map.attributionControl.setPrefix(
      '<a href="https://utc.edu.vn" target="_blank" style="color:#0284c7;font-weight:700;">AI Traffic UTC</a>'
    );

    mapRef.current = map;
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cập nhật markers khi events thay đổi
  useEffect(() => {
    if (!mapRef.current) return;
    const map     = mapRef.current;
    const current = markersRef.current;
    const newIds  = new Set(events.map(e => e.id));

    // Xoá markers không còn trong danh sách
    for (const [id, marker] of current.entries()) {
      if (!newIds.has(id)) {
        map.removeLayer(marker);
        current.delete(id);
      }
    }

    // Thêm/cập nhật markers
    for (const event of events) {
      const lat  = parseFloat(event.lat);
      const lng  = parseFloat(event.lng);
      const isVf = event.verified;

      const popupContent = `
        <div style="font-family:'Inter',sans-serif;min-width:220px;padding:4px;">
          <div style="font-weight:800;font-size:13px;color:#1e293b;margin-bottom:6px;">🚨 ${event.type}</div>
          <div style="font-size:11px;color:#64748b;margin-bottom:3px;">📍 ${lat.toFixed(5)}, ${lng.toFixed(5)}</div>
          <div style="font-size:11px;color:#64748b;margin-bottom:3px;">🕐 ${event.timestamp}</div>
          <div style="font-size:11px;color:#64748b;margin-bottom:3px;">🤖 Độ tin cậy: <b style="color:#ef4444">${event.confidence}</b></div>
          <div style="font-size:11px;color:#6366f1;margin-bottom:6px;">Node: <b>${event.device_id || 'unknown'}</b></div>
          <div style="font-size:11px;background:${isVf ? '#f0fdf4' : '#fef3c7'};padding:5px 8px;border-radius:6px;font-weight:600;color:${isVf ? '#15803d' : '#92400e'}">
            ${isVf ? '✅ Đã xác thực trên Blockchain' : '⏳ Chờ xác thực Blockchain'}
          </div>
          ${event.blockchain_tx ? `<a href="https://preprod.cardanoscan.io/transaction/${event.blockchain_tx}" target="_blank" style="font-size:10px;color:#2563eb;display:block;margin-top:4px;word-break:break-all">${event.blockchain_tx.slice(0, 32)}...</a>` : ''}
        </div>`;

      if (current.has(event.id)) {
        // Cập nhật style nếu trạng thái verified thay đổi
        const marker = current.get(event.id)!;
        marker.setStyle({
          color:       isVf ? '#10b981' : '#ef4444',
          fillColor:   isVf ? '#34d399' : '#f87171',
          fillOpacity: isVf ? 0.95 : 0.7,
          radius:      isVf ? 10 : 7,
        });
        marker.bindPopup(popupContent);
      } else {
        const marker = L.circleMarker([lat, lng], {
          color:       isVf ? '#10b981' : '#ef4444',
          fillColor:   isVf ? '#34d399' : '#f87171',
          fillOpacity: isVf ? 0.95 : 0.7,
          radius:      isVf ? 10 : 7,
          weight:      2,
          className:   'blinking-marker',
        }).addTo(map);

        marker.bindPopup(popupContent);
        marker.on('click', () => onSelectEvent(event));
        current.set(event.id, marker);
      }
    }
  }, [events, onSelectEvent]);

  // Bay đến toạ độ khi người dùng click card
  useEffect(() => {
    if (!flyToCoord || !mapRef.current) return;
    mapRef.current.flyTo(flyToCoord, 17, { animate: true, duration: 1.2 });
    const marker = markersRef.current.get(selectedEvent?.id || '');
    if (marker) {
      setTimeout(() => marker.openPopup(), 1100);
    }
  }, [flyToCoord, selectedEvent]);

  // Resize bản đồ khi sidebar toggle
  const invalidate = useCallback(() => {
    if (mapRef.current) mapRef.current.invalidateSize();
  }, []);

  useEffect(() => {
    const timer = setTimeout(invalidate, 320);
    return () => clearTimeout(timer);
  }, [sidebarCollapsed, invalidate]);

  return (
    <div
      id="map"
      ref={containerRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1 }}
    />
  );
}
