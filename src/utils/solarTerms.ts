import solarTermsData from '../data/solarTerms.json';

export interface YogaPose {
  name: string;
  desc: string;
  imageUrl?: string;
}

export interface SolarTerm {
  name: string;
  month: number;
  day: number;
  poses: YogaPose[];
  meridian: string;
  meridianVessel: string;
  meridianSinew: string;
}

export const SOLAR_TERMS: SolarTerm[] = solarTermsData;

export function getSolarTerm(date: Date): SolarTerm {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  let currentTerm = SOLAR_TERMS[SOLAR_TERMS.length - 1];
  
  for (let i = 0; i < SOLAR_TERMS.length; i++) {
    const term = SOLAR_TERMS[i];
    if (month < term.month || (month === term.month && day < term.day)) {
      currentTerm = i === 0 ? SOLAR_TERMS[SOLAR_TERMS.length - 1] : SOLAR_TERMS[i - 1];
      break;
    }
    if (i === SOLAR_TERMS.length - 1) {
      currentTerm = term;
    }
  }
  
  return currentTerm;
}
