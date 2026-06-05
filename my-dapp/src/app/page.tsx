'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@meshsdk/react';
import { Transaction, BlockfrostProvider } from '@meshsdk/core';

export default function Home() {
  // Trích xuất các thuộc tính tự chế nút bấm từ useWallet
  const { wallet, connected, connecting, connect, disconnect, name } = useWallet();
  const [txHash, setTxHash] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // Đảm bảo giao diện chỉ render sau khi đã tải xong trên trình duyệt (Chống lỗi Hydration 100%)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const blockfrostProvider = new BlockfrostProvider(
    process.env.NEXT_PUBLIC_BLOCKFROST_API_KEY as string
  );

  const mockAIData = {
    lat: "21.0285",
    lng: "105.8048",
    type: "o_ga",
    confidence: 92
  };

const handlePushToCardano = async () => {
    if (!connected) return;
    setLoading(true);

    try {
      // 1. Kiểm tra xem Next.js đã nạp được API Key từ .env.local chưa
      if (!process.env.NEXT_PUBLIC_BLOCKFROST_API_KEY) {
        throw new Error("Ứng dụng chưa đọc được mã Blockfrost API Key. Bạn hãy kiểm tra lại file .env.local và KHỞI ĐỘNG LẠI terminal nhé!");
      }

      const tx = new Transaction({ initiator: wallet as any });

      tx.setMetadata(2026, {
        project: "Decentralized Edge-AI Traffic Grid",
        status: "Validated",
        data: mockAIData
      });

      // Lấy địa chỉ ví của bạn để tự gửi lại 1 ADA cho chính mình
      const myAddress = await wallet.getChangeAddress();
      tx.sendLovelace(myAddress, "1000000"); 

      const unsignedTx = await tx.build();
      const signedTx = await wallet.signTx(unsignedTx, false);
      const hash = await blockfrostProvider.submitTx(signedTx);
      
      setTxHash(hash);
    } catch (error: any) {
      console.error("Lỗi chi tiết từ hệ thống:", error);
      // Hiển thị trực tiếp thông báo lỗi gốc để biết nguyên nhân cụ thể
      alert(`Giao dịch thất bại! Chi tiết lỗi: ${error?.message || JSON.stringify(error)}`);
    } finally {
      setLoading(false);
    }
  };
  // Nếu chưa tải xong trên client thì tạm thời chưa hiện UI để tránh lệch cấu trúc HTML
  if (!isMounted) return null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50 text-gray-900">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex mb-8">
        <h1 className="text-2xl font-bold border-b border-gray-300 pb-2">
          Decentralized Edge-AI Traffic Grid (Demo)
        </h1>
        
        {/* KHU VỰC NÚT KẾT NỐI VÍ TỰ THIẾT KẾ */}
        <div className="mt-4 lg:mt-0">
          {connected ? (
            <div className="flex items-center gap-3">
              <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1.5 rounded-lg border border-green-300 capitalize">
                🟢 Đã kết nối: {name}
              </span>
              <button
                onClick={() => disconnect()}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors shadow-sm"
              >
                Ngắt kết nối
              </button>
            </div>
          ) : (
            <button
              onClick={() => connect('eternl')} // Gọi trực tiếp lệnh kích hoạt ví Eternl
              disabled={connecting}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-5 py-2 rounded-lg font-medium shadow-md transition-all disabled:bg-gray-400"
            >
              {connecting ? 'Đang gọi ví...' : 'Kết nối ví Eternl'}
            </button>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md max-w-md w-full border border-gray-200">
        <h2 className="text-lg font-semibold mb-3 text-blue-600">Khối nhận diện AI (Mock Data)</h2>
        <div className="bg-gray-900 text-green-400 p-4 rounded-md font-mono text-xs mb-4">
          <p>{`{`}</p>
          <p className="pl-4">"lat": "{mockAIData.lat}",</p>
          <p className="pl-4">"lng": "{mockAIData.lng}",</p>
          <p className="pl-4">"type": "{mockAIData.type}",</p>
          <p className="pl-4">"confidence": {mockAIData.confidence}</p>
          <p>{`}`}</p>
        </div>

        {connected ? (
          <button
            onClick={handlePushToCardano}
            disabled={loading}
            className={`w-full py-3 rounded-lg text-white font-medium transition-colors shadow-sm ${
              loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Đang gửi qua Blockfrost...' : 'Xác thực & Đóng dấu lên Blockchain'}
          </button>
        ) : (
          <p className="text-center text-sm text-red-500 font-medium animate-pulse">
            * Vui lòng bấm nút "Kết nối ví Eternl" ở góc trên bên phải.
          </p>
        )}
      </div>

      {txHash && (
        <div className="mt-6 p-4 bg-green-50 border border-green-300 rounded-lg max-w-md w-full">
          <p className="text-green-700 font-semibold mb-1">✓ Đã đẩy qua Blockfrost thành công!</p>
          <p className="text-xs text-gray-600 mb-2">Mã định danh giao dịch (TxHash):</p>
          <a
            href={`https://preprod.cardanoscan.io/transaction/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-500 hover:underline break-all block font-mono"
          >
            {txHash}
          </a>
        </div>
      )}
    </main>
  );
}