export interface Point {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

/**
 * 計算三點之間的夾角 (例如：髖關節、膝蓋、腳踝)
 * 使用 atan2 計算向量角度，回傳 0 ~ 180 度的絕對角度
 */
export function calculateAngle(a: Point, b: Point, c: Point): number {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  
  if (angle > 180.0) {
    angle = 360.0 - angle;
  }
  return angle;
}

/**
 * 計算兩點之間的 2D 歐式距離 (用於判斷雙手是否合十)
 */
export function calculateDistance(a: Point, b: Point): number {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}
