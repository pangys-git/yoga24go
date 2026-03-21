import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Award, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import Sticker from '../components/Sticker';

interface StickerData {
  id: string;
  solarTerm: string;
  difficulty: string;
  duration: number;
  date: string;
}

export default function StickerCollection() {
  const [stickers, setStickers] = useState<StickerData[]>([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('yoga24_stickers') || '[]');
    setStickers(saved);
  }, []);

  const clearStickers = () => {
    if (window.confirm('確定要清除所有貼紙紀錄嗎？')) {
      localStorage.removeItem('yoga24_stickers');
      setStickers([]);
    }
  };

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-stone-50 pb-10">
      {/* Header */}
      <div className="w-full bg-stone-800 text-white p-6 rounded-b-3xl shadow-md mb-6 relative">
        <Link to="/" className="absolute top-6 left-6 text-white/80 hover:text-white">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl font-bold mt-8 mb-2 flex items-center gap-2">
          <Award className="w-6 h-6" />
          我的成就
        </h1>
        <p className="text-stone-300 text-sm">收集的節氣瑜珈認證貼紙</p>
      </div>

      <div className="w-full px-6">
        {stickers.length > 0 && (
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm font-bold text-stone-500">
              共收集了 <span className="text-stone-800 text-lg">{stickers.length}</span> 枚貼紙
            </div>
            <button 
              onClick={clearStickers}
              className="text-stone-400 hover:text-red-500 transition-colors"
              title="清除紀錄"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        )}

        {stickers.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100 text-center mt-10"
          >
            <div className="w-16 h-16 bg-stone-100 text-stone-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-stone-800 mb-2">尚未獲得貼紙</h2>
            <p className="text-stone-500 text-sm mb-6">完成「是日瑜珈練習」即可獲得專屬的節氣認證貼紙！</p>
            <Link 
              to="/practice" 
              className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
            >
              前往練習
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {stickers.map((sticker, index) => (
              <motion.div 
                key={sticker.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="flex flex-col"
              >
                <Sticker 
                  solarTerm={sticker.solarTerm} 
                  difficulty={sticker.difficulty} 
                  duration={sticker.duration} 
                  className="flex-1"
                />
                <div className="text-center mt-2 text-xs text-stone-400 font-medium">
                  {new Date(sticker.date).toLocaleDateString()}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
