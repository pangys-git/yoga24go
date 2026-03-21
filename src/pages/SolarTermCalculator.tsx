import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Info, Activity, Lock, Unlock, Database, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useSolarTerms } from '../hooks/useSolarTerms';

export default function SolarTermCalculator() {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [completedPoses, setCompletedPoses] = useState<string[]>([]);
  const { getTodaySolarTerm, loading, dataSource } = useSolarTerms();
  const navigate = useNavigate();
  
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('yoga24_completed_poses') || '[]');
    setCompletedPoses(saved);
  }, []);

  const dateObj = new Date(selectedDate);
  const term = getTodaySolarTerm(dateObj);

  const handleStartPractice = (poseIndex: number, isLocked: boolean) => {
    if (isLocked) return;
    navigate(`/practice?date=${selectedDate}&poseIndex=${poseIndex}`);
  };

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-stone-50 pb-10">
      {/* Header */}
      <div className="w-full bg-amber-600 text-white p-6 rounded-b-3xl shadow-md mb-6 relative">
        <Link to="/" className="absolute top-6 left-6 text-white/80 hover:text-white">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl font-bold mt-8 mb-2 flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          是日節氣
        </h1>
        <p className="text-amber-100 text-sm mb-4">選擇日期，探索對應的節氣與瑜珈練習</p>
        
        {/* Data Source Badge */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-black/20 text-white/90 backdrop-blur-sm">
          {loading ? (
            <span className="flex items-center gap-1"><Database className="w-3.5 h-3.5 animate-pulse" /> 載入中...</span>
          ) : dataSource === 'sheet' ? (
            <span className="flex items-center gap-1 text-emerald-200"><CheckCircle2 className="w-3.5 h-3.5" /> 已連線 Google Sheet</span>
          ) : dataSource === 'error' ? (
            <span className="flex items-center gap-1 text-rose-200"><AlertCircle className="w-3.5 h-3.5" /> Sheet 連線失敗，使用預設資料</span>
          ) : (
            <span className="flex items-center gap-1 text-amber-200"><Database className="w-3.5 h-3.5" /> 使用內建預設資料</span>
          )}
        </div>
      </div>

      <div className="w-full px-6 flex flex-col gap-6">
        {/* Date Picker */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100">
          <label className="block text-sm font-bold text-stone-700 mb-2">請選擇日期</label>
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 text-stone-800 rounded-xl p-3 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
          />
        </div>

        {/* Result Card */}
        <motion.div 
          key={term.name}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden"
        >
          <div className="bg-amber-50 p-6 text-center border-b border-amber-100">
            <h2 className="text-sm font-bold text-amber-600 tracking-widest mb-1">當前節氣</h2>
            <div className="text-5xl font-black text-stone-800 mb-2">{term.name}</div>
          </div>
          
          <div className="p-6">
            <h3 className="text-sm font-bold text-stone-500 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4" /> 推薦瑜珈練習 (完成解鎖下一關)
            </h3>
            
            <div className="space-y-3 mb-6">
              {term.poses?.map((pose, index) => {
                // 第一個動作永遠解鎖，後續動作需要前一個動作完成才能解鎖
                const isFirst = index === 0;
                const prevPoseId = !isFirst ? `${term.name}-${term.poses[index - 1].name}` : '';
                const isUnlocked = isFirst || completedPoses.includes(prevPoseId);
                const isCompleted = completedPoses.includes(`${term.name}-${pose.name}`);

                return (
                  <div 
                    key={index}
                    onClick={() => handleStartPractice(index, !isUnlocked)}
                    className={`relative border rounded-xl p-4 transition-all ${
                      isUnlocked 
                        ? 'bg-emerald-50 border-emerald-200 cursor-pointer hover:bg-emerald-100 hover:shadow-md' 
                        : 'bg-stone-100 border-stone-200 opacity-70 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded-md ${isUnlocked ? 'bg-emerald-200 text-emerald-800' : 'bg-stone-200 text-stone-600'}`}>
                          動作 {index + 1}
                        </span>
                        <h4 className={`text-lg font-bold ${isUnlocked ? 'text-emerald-800' : 'text-stone-500'}`}>
                          {pose.name}
                        </h4>
                      </div>
                      <div>
                        {isCompleted ? (
                          <span className="text-emerald-600 text-xs font-bold flex items-center gap-1">
                            <Activity className="w-3 h-3" /> 已完成
                          </span>
                        ) : isUnlocked ? (
                          <Unlock className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <Lock className="w-5 h-5 text-stone-400" />
                        )}
                      </div>
                    </div>
                    <p className={`text-sm leading-relaxed ${isUnlocked ? 'text-emerald-700' : 'text-stone-500'}`}>
                      {pose.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            <h3 className="text-sm font-bold text-stone-500 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4" /> 中醫經絡對應
            </h3>
            <div className="bg-stone-50 border border-stone-100 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center border-b border-stone-200 pb-2">
                <span className="text-sm font-bold text-stone-500">對應經絡</span>
                <span className="text-sm font-bold text-stone-800">{term.meridian}</span>
              </div>
              <div className="flex justify-between items-center border-b border-stone-200 pb-2">
                <span className="text-sm font-bold text-stone-500">經脈</span>
                <span className="text-sm font-bold text-stone-800">{term.meridianVessel}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-stone-500">經筋</span>
                <span className="text-sm font-bold text-stone-800">{term.meridianSinew}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
