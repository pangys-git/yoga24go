import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Activity, BookOpen, Gamepad2, Award } from 'lucide-react';
import { motion } from 'motion/react';

export default function Home() {
  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-stone-50 pb-10">
      {/* Header */}
      <div className="w-full bg-emerald-700 text-white p-8 rounded-b-3xl shadow-md mb-8 flex flex-col items-center text-center">
        <img 
          src="https://i.ibb.co/qLmd8PGf/logo-yoga.png" 
          alt="YOGA24GO Logo" 
          className="w-28 h-28 object-contain mb-4 drop-shadow-md"
          referrerPolicy="no-referrer"
        />
        <h1 className="text-4xl font-bold mb-3 tracking-tight">YOGA24GO</h1>
        <p className="text-emerald-100 text-sm leading-relaxed max-w-sm">
          結合二十四節氣與瑜珈練習，順應自然，調養身心。
        </p>
      </div>

      {/* Menu Grid */}
      <div className="w-full px-6 grid grid-cols-1 gap-4">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Link to="/solar-term" className="flex items-center p-5 bg-white rounded-2xl shadow-sm border border-stone-100 hover:border-emerald-200 transition-colors">
            <div className="bg-amber-100 p-3 rounded-xl mr-4 text-amber-600">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-800">是日節氣</h2>
              <p className="text-sm text-stone-500">計算節氣與推薦瑜珈</p>
            </div>
          </Link>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Link to="/practice" className="flex items-center p-5 bg-white rounded-2xl shadow-sm border border-stone-100 hover:border-emerald-200 transition-colors">
            <div className="bg-emerald-100 p-3 rounded-xl mr-4 text-emerald-600">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-800">是日瑜珈練習</h2>
              <p className="text-sm text-stone-500">AI 視覺檢查與節氣貼紙</p>
            </div>
          </Link>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Link to="/knowledge" className="flex items-center p-5 bg-white rounded-2xl shadow-sm border border-stone-100 hover:border-emerald-200 transition-colors">
            <div className="bg-blue-100 p-3 rounded-xl mr-4 text-blue-600">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-800">二十四節氣知識庫</h2>
              <p className="text-sm text-stone-500">非物質文化遺產介紹</p>
            </div>
          </Link>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Link to="/game" className="flex items-center p-5 bg-white rounded-2xl shadow-sm border border-stone-100 hover:border-emerald-200 transition-colors">
            <div className="bg-purple-100 p-3 rounded-xl mr-4 text-purple-600">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-800">YOGA24 小遊戲</h2>
              <p className="text-sm text-stone-500">互動式節氣瑜珈遊戲</p>
            </div>
          </Link>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Link to="/collection" className="flex items-center p-5 bg-stone-800 rounded-2xl shadow-sm border border-stone-700 hover:border-stone-600 transition-colors">
            <div className="bg-stone-700 p-3 rounded-xl mr-4 text-amber-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">我的成就</h2>
              <p className="text-sm text-stone-400">節氣瑜珈認證貼紙收集冊</p>
            </div>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
