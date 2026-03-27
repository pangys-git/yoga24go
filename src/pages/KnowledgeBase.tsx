import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Leaf, Sun, Snowflake, CloudRain, Database, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useSolarTerms } from '../hooks/useSolarTerms';

export default function KnowledgeBase() {
  const { dataSource, loading } = useSolarTerms();

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-stone-50 pb-10">
      {/* Header */}
      <div className="w-full bg-blue-700 text-white p-6 rounded-b-3xl shadow-md mb-6 relative">
        <Link to="/" className="absolute top-6 left-6 text-white/80 hover:text-white">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl font-bold mt-8 mb-2 flex items-center gap-2">
          <BookOpen className="w-6 h-6" />
          二十四節氣知識庫
        </h1>
        <p className="text-blue-100 text-sm">認識非物質文化遺產，順應自然法則</p>
      </div>

      <div className="w-full px-6 flex flex-col gap-6">
        {/* Data Source Status */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-stone-600 text-sm">
            <Database className="w-4 h-4" />
            <span>資料來源：</span>
          </div>
          <div className="flex items-center gap-2">
            {loading ? (
              <span className="text-stone-400 text-xs animate-pulse">正在連線...</span>
            ) : dataSource === 'sheet' ? (
              <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                <CheckCircle className="w-3 h-3" />
                <span>Google Sheet (雲端)</span>
              </div>
            ) : dataSource === 'local' ? (
              <div className="flex items-center gap-1 text-amber-600 text-xs font-bold">
                <AlertCircle className="w-3 h-3" />
                <span>內建資料 (本地)</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-600 text-xs font-bold">
                <AlertCircle className="w-3 h-3" />
                <span>連線失敗</span>
              </div>
            )}
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100"
        >
          <h2 className="text-xl font-bold text-stone-800 mb-3">什麼是二十四節氣？</h2>
          <p className="text-stone-600 leading-relaxed text-sm">
            二十四節氣是中國古代訂立的一種用來指導農事的補充曆法，是中華民族勞動人民長期經驗的積累和智慧的結晶。2016年，它被正式列入聯合國教科文組織人類非物質文化遺產代表作名錄。
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-4">
          <motion.div whileHover={{ scale: 1.05 }} className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 text-center">
            <Leaf className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <h3 className="font-bold text-emerald-800">春季</h3>
            <p className="text-xs text-emerald-600 mt-1">立春、雨水、驚蟄<br/>春分、清明、穀雨</p>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} className="bg-red-50 p-5 rounded-2xl border border-red-100 text-center">
            <Sun className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <h3 className="font-bold text-red-800">夏季</h3>
            <p className="text-xs text-red-600 mt-1">立夏、小滿、芒種<br/>夏至、小暑、大暑</p>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} className="bg-amber-50 p-5 rounded-2xl border border-amber-100 text-center">
            <CloudRain className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <h3 className="font-bold text-amber-800">秋季</h3>
            <p className="text-xs text-amber-600 mt-1">立秋、處暑、白露<br/>秋分、寒露、霜降</p>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} className="bg-blue-50 p-5 rounded-2xl border border-blue-100 text-center">
            <Snowflake className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <h3 className="font-bold text-blue-800">冬季</h3>
            <p className="text-xs text-blue-600 mt-1">立冬、小雪、大雪<br/>冬至、小寒、大寒</p>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-stone-800 text-white p-6 rounded-2xl shadow-sm"
        >
          <h2 className="text-lg font-bold mb-2">節氣與瑜珈的結合</h2>
          <p className="text-stone-300 text-sm leading-relaxed">
            中醫認為「天人合一」，人體的氣血運行與自然界的節氣變化息息相關。在不同的節氣練習對應的瑜珈體式，能更好地疏通經絡、調和陰陽，達到養生保健的效果。
          </p>
        </motion.div>
      </div>
    </div>
  );
}
