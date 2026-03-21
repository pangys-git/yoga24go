import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Award, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import YogaTreePose from '../components/YogaTreePose';
import Sticker from '../components/Sticker';
import { useSolarTerms } from '../hooks/useSolarTerms';

export default function YogaPractice() {
  const [showSticker, setShowSticker] = useState(false);
  const [stickerData, setStickerData] = useState<{ term: string; diff: string; dur: number } | null>(null);
  const [searchParams] = useSearchParams();
  const poseIndex = parseInt(searchParams.get('poseIndex') || '0', 10);
  const dateParam = searchParams.get('date');
  
  const { getTodaySolarTerm } = useSolarTerms();
  const practiceDate = dateParam ? new Date(dateParam) : new Date();
  const currentTerm = getTodaySolarTerm(practiceDate);

  const handleComplete = (difficulty: string, duration: number) => {
    const term = currentTerm.name;
    const poseName = currentTerm.poses?.[poseIndex]?.name || '瑜珈動作';
    
    setStickerData({ term: `${term} - ${poseName}`, diff: difficulty, dur: duration });

    // Save sticker
    const newSticker = {
      id: Date.now().toString(),
      solarTerm: `${term} - ${poseName}`,
      difficulty,
      duration,
      date: new Date().toISOString()
    };
    const existingStickers = JSON.parse(localStorage.getItem('yoga24_stickers') || '[]');
    localStorage.setItem('yoga24_stickers', JSON.stringify([newSticker, ...existingStickers]));

    // Save completed pose to unlock next
    const completedPoses = JSON.parse(localStorage.getItem('yoga24_completed_poses') || '[]');
    const poseId = `${term}-${poseName}`;
    if (!completedPoses.includes(poseId)) {
      completedPoses.push(poseId);
      localStorage.setItem('yoga24_completed_poses', JSON.stringify(completedPoses));
    }

    // 延遲一下再顯示貼紙，讓使用者先看到灑花特效
    setTimeout(() => {
      setShowSticker(true);
    }, 1500);
  };

  return (
    <div className="relative w-full min-h-screen bg-stone-100">
      {/* Back Button */}
      <Link to="/" className="absolute top-6 left-6 z-50 text-white/80 hover:text-white bg-black/20 p-2 rounded-full backdrop-blur-sm">
        <ArrowLeft className="w-6 h-6" />
      </Link>

      {/* Yoga Component */}
      <YogaTreePose onComplete={handleComplete} solarTerm={currentTerm} poseIndex={poseIndex} />

      {/* Sticker Modal */}
      <AnimatePresence>
        {showSticker && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.8, opacity: 0, rotate: 10 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative text-center"
            >
              <button 
                onClick={() => setShowSticker(false)}
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-600"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="w-24 h-24 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Award className="w-12 h-12" />
              </div>

              <h2 className="text-2xl font-black text-stone-800 mb-2">恭喜達成！</h2>
              <p className="text-stone-500 mb-6">您已成功完成今日的節氣瑜珈練習，獲得專屬貼紙一枚！</p>

              {stickerData && (
                <Sticker 
                  solarTerm={stickerData.term} 
                  difficulty={stickerData.diff} 
                  duration={stickerData.dur} 
                  className="-rotate-3 hover:rotate-0 mb-8 cursor-pointer"
                />
              )}

              <Link 
                to="/" 
                className="block w-full bg-stone-800 hover:bg-stone-900 text-white font-bold py-3 px-4 rounded-xl transition-colors"
              >
                回首頁
              </Link>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
