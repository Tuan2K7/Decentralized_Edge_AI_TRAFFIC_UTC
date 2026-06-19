'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@meshsdk/react';
import { Transaction, BrowserWallet } from '@meshsdk/core';

export default function Home() {
  const { connected, connecting, connect, disconnect, name } = useWallet();
  const [txHash, setTxHash] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 1. Đổi số thập phân (96.5) thành dạng chuỗi để qua mặt bộ lọc của Blockchain
  const safeAIData = {
    lat: "21.0285",
    lng: "105.8048",
    type: "O_GA_NGUY_HIEM",
    confidence: "96.5%",
    timestamp: new Date().toLocaleString('vi-VN'),
  };

  const handlePushToCardano = async () => {
    if (!connected || !name) return;
    setLoading(true);
    setTxHash('');

    try {
      // 2. Gọi thẳng Lõi Ví để diệt sạch lỗi TypeScript (bỏ qua Next.js proxy)
      const coreWallet = await BrowserWallet.enable(name);
      const myAddress = await coreWallet.getChangeAddress();

      if (!myAddress) throw new Error("Chưa lấy được địa chỉ ví. Vui lòng thử lại!");

      // 3. Khởi tạo giao dịch với coreWallet chuẩn
      const tx = new Transaction({ initiator: coreWallet });
      
      // Bắt buộc set cứng địa chỉ tiền thừa để chống lỗi 'reading address'
      tx.setChangeAddress(myAddress);
      
      // Gửi 1 tADA mồi giao dịch
      tx.sendLovelace(myAddress, '1000000'); 

      // Đính kèm dữ liệu AI an toàn
      tx.setMetadata(2026, {
        project: "Decentralized Edge-AI Traffic Grid",
        module: "Dashcam Edge Node",
        data: safeAIData
      });

      // 4. Đóng gói & Ký
      const unsignedTx = await tx.build();
      const signedTx = await coreWallet.signTx(unsignedTx);
      const hash = await coreWallet.submitTx(signedTx);
      
      setTxHash(hash);
    } catch (error: any) {
      console.error("Lỗi giao dịch chi tiết:", error);
      alert(`Giao dịch thất bại: ${error?.message || "Vui lòng kiểm tra lại số dư ADA"}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) return null;

  return (
    <main className="flex min-h-screen flex-col items-center bg-[#f8f9fa] text-gray-900 p-8 md:p-24">
      {/* Header Bar */}
      <div className="z-10 max-w-5xl w-full flex flex-col md:flex-row items-center justify-between mb-12 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-blue-900 tracking-tight">
            Decentralized Traffic Grid <span className="text-blue-500">Demo</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Mạng lưới AI thu thập dữ liệu hạ tầng phi tập trung</p>
        </div>
        
        <div className="mt-4 md:mt-0 flex items-center">
          {connected ? (
            <div className="flex items-center gap-3">
              <span className="bg-green-50 text-green-700 text-sm font-semibold px-4 py-2 rounded-xl border border-green-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Đã kết nối {name}
              </span>
              <button
                onClick={() => disconnect()}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              >
                Ngắt kết nối
              </button>
            </div>
          ) : (
            <button
              onClick={() => connect('eternl')}
              disabled={connecting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-200 transition-all disabled:bg-gray-400 flex items-center gap-2"
            >
              {connecting ? 'Đang gọi ví...' : '🔗 Kết nối ví Eternl'}
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            📸 Edge AI Sensor
          </h2>
          <span className="text-xs font-bold px-2 py-1 bg-purple-100 text-purple-700 rounded-lg">YOLOv8 Active</span>
        </div>
        
        <div className="bg-[#1e1e1e] text-[#d4d4d4] p-5 rounded-2xl font-mono text-sm mb-8 shadow-inner overflow-x-auto">
          <p className="text-blue-400">{"{"}</p>
          <p className="pl-4"><span className="text-sky-300">"lat"</span>: <span className="text-orange-300">"{safeAIData.lat}"</span>,</p>
          <p className="pl-4"><span className="text-sky-300">"lng"</span>: <span className="text-orange-300">"{safeAIData.lng}"</span>,</p>
          <p className="pl-4"><span className="text-sky-300">"type"</span>: <span className="text-orange-300">"{safeAIData.type}"</span>,</p>
          <p className="pl-4"><span className="text-sky-300">"confidence"</span>: <span className="text-orange-300">"{safeAIData.confidence}"</span>,</p>
          <p className="pl-4"><span className="text-sky-300">"timestamp"</span>: <span className="text-orange-300">"{safeAIData.timestamp}"</span></p>
          <p className="text-blue-400">{"}"}</p>
        </div>

        {connected ? (
          <button
            onClick={handlePushToCardano}
            disabled={loading}
            className={`relative w-full py-4 rounded-xl text-white font-bold text-base transition-all overflow-hidden ${
              loading 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang xác thực Đám đông...
              </span>
            ) : (
              '⚡ Xác thực & Lưu lên Blockchain'
            )}
          </button>
        ) : (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center text-sm font-medium border border-red-100">
            Vui lòng kết nối ví để bắt đầu đồng thuận
          </div>
        )}
      </div>

      {/* Box hiển thị kết quả thành công */}
      {txHash && (
        <div className="mt-8 p-6 bg-green-50/80 border border-green-200 rounded-2xl max-w-2xl w-full shadow-sm animate-[fadeIn_0.5s_ease-out]">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xl">✅</span>
            </div>
            <div>
              <h3 className="text-green-800 font-bold text-lg mb-1">Dữ liệu đã được ghi vĩnh viễn!</h3>
              <p className="text-sm text-green-700 mb-3">Tọa độ sự cố đã được đóng dấu thời gian lên sổ cái Cardano Preprod.</p>
              
              <div className="bg-white p-3 rounded-xl border border-green-100">
                <p className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wider">Mã Giao Dịch (TxHash):</p>
                <a
                  href={`https://preprod.cardanoscan.io/transaction/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline break-all block font-mono"
                >
                  {txHash}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}