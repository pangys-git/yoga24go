/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import SolarTermCalculator from './pages/SolarTermCalculator';
import YogaPractice from './pages/YogaPractice';
import KnowledgeBase from './pages/KnowledgeBase';
import MiniGame from './pages/MiniGame';
import StickerCollection from './pages/StickerCollection';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-stone-100 flex justify-center">
        <div className="w-full max-w-md bg-stone-50 shadow-2xl overflow-hidden relative">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/solar-term" element={<SolarTermCalculator />} />
            <Route path="/practice" element={<YogaPractice />} />
            <Route path="/knowledge" element={<KnowledgeBase />} />
            <Route path="/game" element={<MiniGame />} />
            <Route path="/collection" element={<StickerCollection />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
