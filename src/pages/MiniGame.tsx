import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Gamepad2, RefreshCw, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';

const QUESTIONS = [
  {
    q: '「春分」對應的瑜珈動作是？',
    options: ['樹式', '下犬式', '橋式', '魚式'],
    answer: '樹式',
    explain: '春分時節陰陽平衡，樹式能幫助平心靜氣，如樹木般扎根。'
  },
  {
    q: '哪個節氣代表夏天正式開始？',
    options: ['夏至', '立夏', '小滿', '芒種'],
    answer: '立夏',
    explain: '立夏是夏季的第一個節氣，代表萬物生長進入旺盛期。'
  },
  {
    q: '秋分時節適合練習哪個瑜珈動作？',
    options: ['駱駝式', '眼鏡蛇式', '三角式', '鴿子式'],
    answer: '三角式',
    explain: '秋分陰陽各半，三角式能幫助穩定情緒，達到身心平衡。'
  }
];

export default function MiniGame() {
  const [activeTab, setActiveTab] = useState<'game1' | 'game2' | 'qa'>('game1');
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState(0);

  const reloadIframe = () => {
    setIframeKey(prev => prev + 1);
  };

  const getGameUrl = (path: string) => {
    // 使用相對路徑或加上 origin 確保在不同環境下都能正確載入
    const origin = window.location.origin;
    return `${origin}${path}?v=${iframeKey}`;
  };

  const handleSelect = (option: string) => {
    if (selected) return; // 已選擇過
    setSelected(option);
    
    if (option === QUESTIONS[currentQ].answer) {
      setScore(s => s + 1);
    }

    setTimeout(() => {
      if (currentQ < QUESTIONS.length - 1) {
        setCurrentQ(q => q + 1);
        setSelected(null);
      } else {
        setShowResult(true);
      }
    }, 2000);
  };

  const resetGame = () => {
    setCurrentQ(0);
    setScore(0);
    setShowResult(false);
    setSelected(null);
  };

  return (
    <div className="flex flex-col items-center w-full h-screen bg-stone-50 overflow-hidden">
      {/* Header */}
      <div className="w-full bg-purple-700 text-white p-6 rounded-b-3xl shadow-md relative shrink-0">
        <Link to="/" className="absolute top-6 left-6 text-white/80 hover:text-white">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl font-bold mt-8 mb-2 flex items-center gap-2">
          <Gamepad2 className="w-6 h-6" />
          YOGA24 小遊戲
        </h1>
        <p className="text-purple-100 text-sm">體驗互動式遊戲與知識問答！</p>
      </div>

      <div className="w-full px-6 py-4 flex flex-col gap-4 flex-1 overflow-hidden">
        {/* Tabs */}
        <div className="flex w-full max-w-md mx-auto bg-stone-200 rounded-xl p-1 shrink-0">
          <button
            onClick={() => { setActiveTab('game1'); reloadIframe(); }}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-colors ${activeTab === 'game1' ? 'bg-white text-purple-700 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
          >
            互動遊戲 1
          </button>
          <button
            onClick={() => { setActiveTab('game2'); reloadIframe(); }}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-colors ${activeTab === 'game2' ? 'bg-white text-purple-700 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
          >
            互動遊戲 2
          </button>
          <button
            onClick={() => setActiveTab('qa')}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-colors ${activeTab === 'qa' ? 'bg-white text-purple-700 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
          >
            知識問答
          </button>
        </div>

        <div className="flex-1 w-full overflow-y-auto">
          {activeTab === 'game1' ? (
            <div className="w-full h-full min-h-[400px] relative bg-black rounded-2xl overflow-hidden shadow-inner flex flex-col">
              <div className="flex-1 relative">
                <iframe 
                  key={`game1-${iframeKey}`}
                  src={getGameUrl('/game1/index.html')} 
                  className="w-full h-full absolute inset-0 border-0"
                  title="YOGA24 HTML Game 1"
                  allow="fullscreen; autoplay; camera; microphone"
                />
              </div>
              <div className="bg-stone-800 p-3 flex justify-between items-center shrink-0 border-t border-stone-700">
                <div className="flex flex-col">
                  <span className="text-white text-xs font-bold">互動遊戲 1：瑜伽大師</span>
                  <span className="text-stone-400 text-[10px]">如無法運作，請嘗試重新整理或全螢幕開啟</span>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={reloadIframe}
                    className="bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg text-white text-xs flex items-center gap-1 shadow-lg transition-all active:scale-95"
                    title="重新整理遊戲"
                  >
                    <RefreshCw className="w-3 h-3" />
                    重新整理
                  </button>
                  <a 
                    href={getGameUrl('/game1/index.html')} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-white/80 hover:text-white text-xs flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-lg border border-white/20 transition-all"
                  >
                    <ExternalLink className="w-3 h-3" />
                    全螢幕
                  </a>
                </div>
              </div>
            </div>
          ) : activeTab === 'game2' ? (
            <div className="w-full h-full min-h-[400px] relative bg-black rounded-2xl overflow-hidden shadow-inner flex flex-col">
              <div className="flex-1 relative">
                <iframe 
                  key={`game2-${iframeKey}`}
                  src={getGameUrl('/game2/index.html')} 
                  className="w-full h-full absolute inset-0 border-0"
                  title="YOGA24 HTML Game 2"
                  allow="fullscreen; autoplay; camera; microphone"
                />
              </div>
              <div className="bg-stone-800 p-3 flex justify-between items-center shrink-0 border-t border-stone-700">
                <div className="flex flex-col">
                  <span className="text-white text-xs font-bold">互動遊戲 2：節氣記憶</span>
                  <span className="text-stone-400 text-[10px]">如無法運作，請嘗試重新整理或全螢幕開啟</span>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={reloadIframe}
                    className="bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg text-white text-xs flex items-center gap-1 shadow-lg transition-all active:scale-95"
                    title="重新整理遊戲"
                  >
                    <RefreshCw className="w-3 h-3" />
                    重新整理
                  </button>
                  <a 
                    href={getGameUrl('/game2/index.html')} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-white/80 hover:text-white text-xs flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-lg border border-white/20 transition-all"
                  >
                    <ExternalLink className="w-3 h-3" />
                    全螢幕
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="pb-10">
              {!showResult ? (
          <motion.div 
            key={currentQ}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100"
          >
            <div className="text-sm font-bold text-purple-600 mb-4">
              問題 {currentQ + 1} / {QUESTIONS.length}
            </div>
            <h2 className="text-xl font-bold text-stone-800 mb-6 leading-relaxed">
              {QUESTIONS[currentQ].q}
            </h2>

            <div className="flex flex-col gap-3">
              {QUESTIONS[currentQ].options.map((opt) => {
                const isCorrect = opt === QUESTIONS[currentQ].answer;
                const isSelected = selected === opt;
                
                let btnClass = "p-4 rounded-xl border-2 text-left font-bold transition-all ";
                if (!selected) {
                  btnClass += "border-stone-200 text-stone-700 hover:border-purple-300 hover:bg-purple-50";
                } else if (isCorrect) {
                  btnClass += "border-emerald-500 bg-emerald-50 text-emerald-700";
                } else if (isSelected && !isCorrect) {
                  btnClass += "border-red-500 bg-red-50 text-red-700";
                } else {
                  btnClass += "border-stone-200 text-stone-400 opacity-50";
                }

                return (
                  <button 
                    key={opt}
                    onClick={() => handleSelect(opt)}
                    className={btnClass}
                    disabled={!!selected}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {selected && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-purple-50 rounded-xl border border-purple-100"
              >
                <div className="font-bold text-purple-800 mb-1">解析：</div>
                <div className="text-sm text-purple-700">{QUESTIONS[currentQ].explain}</div>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100 text-center"
          >
            <div className="w-20 h-20 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Gamepad2 className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-black text-stone-800 mb-2">遊戲完成！</h2>
            <p className="text-stone-500 mb-6">你的得分是</p>
            <div className="text-6xl font-black text-purple-600 mb-8">
              {score} <span className="text-2xl text-stone-400">/ {QUESTIONS.length}</span>
            </div>

            <button 
              onClick={resetGame}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" /> 再玩一次
            </button>
          </motion.div>
        )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
