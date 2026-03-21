import { useState, useEffect } from 'react';
import { SolarTerm, SOLAR_TERMS as defaultData } from '../utils/solarTerms';

// 如果您部署了 Google Apps Script，可以將網址填入環境變數 VITE_SHEET_API_URL
const SHEET_API_URL = (import.meta as any).env?.VITE_SHEET_API_URL || '';

export function useSolarTerms() {
  const [solarTerms, setSolarTerms] = useState<SolarTerm[]>(defaultData);
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<'local' | 'sheet' | 'error'>('local');

  useEffect(() => {
    if (!SHEET_API_URL) {
      setDataSource('local');
      return;
    }
    
    setLoading(true);
    fetch(SHEET_API_URL)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          // 確保資料格式正確，將平坦的 sheet 資料轉換為 nested poses array
          const formattedData = data.map(item => {
            // 如果已經是 nested 格式 (例如從預設 JSON 來的)，就直接回傳
            if (item.poses) return item;
            
            // 否則進行轉換
            return {
              name: item.name,
              month: Number(item.month),
              day: Number(item.day),
              meridian: item.meridian || '',
              meridianVessel: item.meridianVessel || '',
              meridianSinew: item.meridianSinew || '',
              poses: [
                { name: item.yoga1 || '', desc: item.desc1 || '' },
                { name: item.yoga2 || '', desc: item.desc2 || '' },
                { name: item.yoga3 || '', desc: item.desc3 || '' }
              ].filter(p => p.name !== '') // 過濾掉空的動作
            };
          });
          setSolarTerms(formattedData);
          setDataSource('sheet');
        } else {
          setDataSource('error');
        }
      })
      .catch(err => {
        console.error('Failed to fetch solar terms from Google Sheet:', err);
        setDataSource('error');
        // 發生錯誤時依然使用預設的本地資料
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const getTodaySolarTerm = (date: Date = new Date()): SolarTerm => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    let currentTerm = solarTerms[solarTerms.length - 1];
    
    for (let i = 0; i < solarTerms.length; i++) {
      const term = solarTerms[i];
      if (month < term.month || (month === term.month && day < term.day)) {
        currentTerm = i === 0 ? solarTerms[solarTerms.length - 1] : solarTerms[i - 1];
        break;
      }
      if (i === solarTerms.length - 1) {
        currentTerm = term;
      }
    }
    
    return currentTerm;
  };

  return { solarTerms, getTodaySolarTerm, loading, dataSource };
}
