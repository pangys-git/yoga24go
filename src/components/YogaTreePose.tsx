import React, { useEffect, useRef, useState } from 'react';
import { Pose, Results, POSE_CONNECTIONS } from '@mediapipe/pose';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { calculateAngle, calculateDistance } from '../utils/geometry';
import { Settings, Timer, Award, AlertCircle, CheckCircle2, Activity, Target, Clock, Image as ImageIcon, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import confetti from 'canvas-confetti';

import { SolarTerm } from '../utils/solarTerms';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DifficultySettings {
  level: string;
  hands_dist: number; // 容許雙手距離 (數值越大代表容許距離越遠，類似 5cm/10cm 的概念)
  knee_angle: number;
  tolerance: number; // 角度容錯率
  grace_time_ms: number; // 容許離開正確位置的時間 (毫秒)
  threshold_pct: number; // 啟動計時的正確率門檻
}

const YOGA_SETTINGS: Record<string, DifficultySettings> = {
  Beginner: { level: '初階', hands_dist: 0.15, knee_angle: 90, tolerance: 40, grace_time_ms: 1500, threshold_pct: 60 }, // 容許離開 1.5 秒，距離較寬鬆
  Intermediate: { level: '中階', hands_dist: 0.10, knee_angle: 90, tolerance: 25, grace_time_ms: 500, threshold_pct: 70 }, // 容許離開 0.5 秒
  Advanced: { level: '高階', hands_dist: 0.05, knee_angle: 90, tolerance: 10, grace_time_ms: 0, threshold_pct: 80 }, // 不容許離開，要求精準
};

const PRAISES = [
  '太棒了！',
  '呼吸很穩，繼續保持！',
  '完美契合春分生機！',
  '肝氣正在舒展！',
  '感受雙腳扎根的力量！',
  '專注當下，你做得很好！'
];

export default function YogaTreePose({ 
  onComplete, 
  solarTerm,
  poseIndex = 0
}: { 
  onComplete?: (difficulty: string, duration: number) => void;
  solarTerm?: SolarTerm;
  poseIndex?: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const currentPose = solarTerm?.poses?.[poseIndex] || { name: '樹式', desc: '春屬木，對應肝臟。樹式能如樹木般扎根生長，有助於平心靜氣、疏肝理氣。' };
  const currentPoseNameRef = useRef(currentPose.name);
  currentPoseNameRef.current = currentPose.name;

  const [difficulty, setDifficulty] = useState<string>('Beginner');
  const [targetDuration, setTargetDuration] = useState<number>(60);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [timer, setTimer] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('請站定並做出樹式動作');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [hasRequestedCamera, setHasRequestedCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const isProcessingRef = useRef(false);
  const lastVideoTimeRef = useRef(-1);
  const poseRef = useRef<Pose | null>(null);

  // 新增：檢測點統計狀態
  const [detectedPoints, setDetectedPoints] = useState(0);
  const [correctPoints, setCorrectPoints] = useState(0);
  const [graceTimeLeft, setGraceTimeLeft] = useState(0);
  const [standingLeg, setStandingLeg] = useState<'left' | 'right' | 'none'>('none');
  const [showReference, setShowReference] = useState(true);

  // Refs for interval and state tracking inside callbacks to avoid excessive re-renders
  const isCorrectRef = useRef(isCorrect);
  const difficultyRef = useRef(difficulty);
  difficultyRef.current = difficulty;
  const targetDurationRef = useRef(targetDuration);
  targetDurationRef.current = targetDuration;
  const isCompletedRef = useRef(isCompleted);
  isCompletedRef.current = isCompleted;
  const outOfPositionStartRef = useRef<number | null>(null);
  const standingLegRef = useRef<'left' | 'right' | 'none'>('none');
  
  // Optimization refs to prevent React state thrashing
  const detectedPointsRef = useRef(0);
  const correctPointsRef = useRef(0);
  const graceTimeLeftRef = useRef(0);

  // Initialize MediaPipe Pose
  useEffect(() => {
    let isMounted = true;

    const pose = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    pose.setOptions({
      modelComplexity: 0, // 降低複雜度以提升手機與舊電腦的流暢度 (0最快, 1預設, 2最準)
      smoothLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    pose.onResults(onResults);
    poseRef.current = pose;

    return () => {
      isMounted = false;
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      pose.close();
    };
  }, []);

  const processVideo = async () => {
    if (!videoRef.current || !poseRef.current) return;
    
    if (videoRef.current.readyState >= 2 && !isProcessingRef.current) {
      if (videoRef.current.currentTime !== lastVideoTimeRef.current) {
        isProcessingRef.current = true;
        lastVideoTimeRef.current = videoRef.current.currentTime;
        try {
          await poseRef.current.send({ image: videoRef.current });
        } catch (e) {
          // 忽略處理過程中的微小錯誤
          console.error("Pose processing error:", e);
        } finally {
          isProcessingRef.current = false;
        }
      }
    }
    
    animationFrameIdRef.current = requestAnimationFrame(processVideo);
  };

  const handleStartCamera = async () => {
    if (!videoRef.current || !poseRef.current) return;
    
    setHasRequestedCamera(true);
    setIsStartingCamera(true);
    setCameraError(null);

    try {
      // 確保舊的串流與迴圈被關閉
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });
      
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      
      // 等待影片載入 metadata
      await new Promise<void>((resolve) => {
        if (!videoRef.current) return resolve();
        videoRef.current.onloadedmetadata = () => {
          resolve();
        };
      });

      await videoRef.current.play();

      if (videoRef.current && canvasRef.current) {
        // 確保 Canvas 解析度與影片實際解析度一致
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
      }

      setIsCameraReady(true);
      setIsStartingCamera(false);
      
      // 開始影像處理迴圈
      processVideo();
      
    } catch (err: any) {
      console.error("Error starting camera:", err);
      setIsStartingCamera(false);
      
      if (err.name === 'NotAllowedError' || err.message?.includes('Permission denied')) {
        setCameraError('相機權限被拒絕。請在瀏覽器設定中允許存取相機，然後重試。');
      } else if (err.name === 'NotFoundError') {
        setCameraError('找不到相機設備，請確認您的裝置有可用的鏡頭。');
      } else {
        setCameraError(`無法開啟相機: ${err.message || '未知錯誤'}`);
      }
      setFeedback('無法開啟相機，請點擊畫面重試。');
    }
  };

  // 移除自動嘗試啟動相機，改由使用者手動點擊觸發
  // useEffect(() => {
  //   handleStartCamera();
  // }, []);

  const onResults = (results: Results) => {
    if (!canvasRef.current || !videoRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // 確保 Canvas 解析度與影片實際解析度一致，避免標記點偏移或模糊
    if (videoRef.current.videoWidth > 0 && canvasRef.current.width !== videoRef.current.videoWidth) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
    }

    ctx.save();
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    // 由於 canvas 已經透過 CSS (-scale-x-100) 翻轉，這裡不需要再 ctx.scale(-1, 1)
    // 否則會變成雙重翻轉，導致座標錯亂
    
    if (results.poseLandmarks) {
      drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, { color: '#10b981', lineWidth: 4 });
      drawLandmarks(ctx, results.poseLandmarks, { color: '#f59e0b', lineWidth: 2, radius: 3 });

      const landmarks = results.poseLandmarks;
      
      // 樹式關鍵檢測點：鼻子(0), 雙眼(2,5), 雙耳(7,8), 雙肩(11,12), 雙肘(13,14), 雙腕(15,16), 雙髖(23,24), 雙膝(25,26), 雙踝(27,28) - 共 17 點
      const keyIndices = [0, 2, 5, 7, 8, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
      
      // 1. 計算成功捕捉的檢測點 (visibility > 0.6)
      let detectedCount = 0;
      keyIndices.forEach(idx => {
        if (landmarks[idx] && landmarks[idx].visibility && landmarks[idx].visibility > 0.6) {
          detectedCount++;
        }
      });
      if (detectedCount !== detectedPointsRef.current) {
        detectedPointsRef.current = detectedCount;
        setDetectedPoints(detectedCount);
      }

      const nose = landmarks[0];
      const leftShoulder = landmarks[11];
      const rightShoulder = landmarks[12];
      const leftElbow = landmarks[13];
      const rightElbow = landmarks[14];
      const leftWrist = landmarks[15];
      const rightWrist = landmarks[16];
      const leftHip = landmarks[23];
      const rightHip = landmarks[24];
      const leftKnee = landmarks[25];
      const rightKnee = landmarks[26];
      const leftAnkle = landmarks[27];
      const rightAnkle = landmarks[28];

      const settings = YOGA_SETTINGS[difficultyRef.current];

      // 2. 判斷各部位是否在正確位置 (總分 17 分)
      let currentCorrectCount = 0;
      const poseName = currentPoseNameRef.current;

      // 繪製文字提示的輔助函式 (因為 canvas 被 CSS 翻轉了，文字需要反向翻轉才能正常閱讀)
      const drawText = (text: string, x: number, y: number, color: string) => {
        ctx.save();
        ctx.translate(x * canvasRef.current!.width, y * canvasRef.current!.height);
        ctx.scale(-1, 1); // 翻轉回來讓文字可讀
        ctx.fillStyle = color;
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
        ctx.shadowBlur = 6;
        ctx.fillText(text, 0, 0);
        ctx.restore();
      };

      // 共用特徵計算
      const isHeadUpright = nose && leftShoulder && rightShoulder && Math.abs(nose.x - (leftShoulder.x + rightShoulder.x) / 2) < 0.15;
      const isShouldersLevel = leftShoulder && rightShoulder && Math.abs(leftShoulder.y - rightShoulder.y) < 0.1;
      const isHipsLevel = leftHip && rightHip && Math.abs(leftHip.y - rightHip.y) < 0.1;
      const handsDistance = (leftWrist && rightWrist) ? calculateDistance(leftWrist, rightWrist) : 999;
      const isHandsTogether = handsDistance < settings.hands_dist;
      
      const leftKneeAngle = (leftHip && leftKnee && leftAnkle) ? calculateAngle(leftHip, leftKnee, leftAnkle) : 0;
      const rightKneeAngle = (rightHip && rightKnee && rightAnkle) ? calculateAngle(rightHip, rightKnee, rightAnkle) : 0;
      const leftHipAngle = (leftShoulder && leftHip && leftKnee) ? calculateAngle(leftShoulder, leftHip, leftKnee) : 0;
      const rightHipAngle = (rightShoulder && rightHip && rightKnee) ? calculateAngle(rightShoulder, rightHip, rightKnee) : 0;
      const leftElbowAngle = (leftShoulder && leftElbow && leftWrist) ? calculateAngle(leftShoulder, leftElbow, leftWrist) : 0;
      const rightElbowAngle = (rightShoulder && rightElbow && rightWrist) ? calculateAngle(rightShoulder, rightElbow, rightWrist) : 0;

      if (poseName.includes('樹式')) {
        if (isHeadUpright) currentCorrectCount += 5;
        if (isShouldersLevel) currentCorrectCount += 2;
        if (isHandsTogether) currentCorrectCount += 4;
        if (isHipsLevel) currentCorrectCount += 2;

        const leftStandingCorrect = leftKneeAngle > 160;
        const rightBentCorrect = Math.abs(rightKneeAngle - settings.knee_angle) <= settings.tolerance;
        const scoreA = (leftStandingCorrect ? 1 : 0) + (rightBentCorrect ? 1 : 0);

        const rightStandingCorrect = rightKneeAngle > 160;
        const leftBentCorrect = Math.abs(leftKneeAngle - settings.knee_angle) <= settings.tolerance;
        const scoreB = (rightStandingCorrect ? 1 : 0) + (leftBentCorrect ? 1 : 0);

        let isLeftStanding = true;
        if (scoreB > scoreA) isLeftStanding = false;
        else if (scoreA === scoreB) isLeftStanding = leftKnee && rightKnee ? leftKnee.y > rightKnee.y : true;

        if (isLeftStanding) {
          if (leftStandingCorrect) currentCorrectCount += 2;
          else if (leftKnee) drawText('左腳(支撐腳)請打直', leftKnee.x, leftKnee.y, '#f59e0b');
          if (rightBentCorrect) currentCorrectCount += 2;
          else if (rightKnee) drawText(`右腳請彎曲至約${settings.knee_angle}度`, rightKnee.x, rightKnee.y, '#f59e0b');
        } else {
          if (rightStandingCorrect) currentCorrectCount += 2;
          else if (rightKnee) drawText('右腳(支撐腳)請打直', rightKnee.x, rightKnee.y, '#f59e0b');
          if (leftBentCorrect) currentCorrectCount += 2;
          else if (leftKnee) drawText(`左腳請彎曲至約${settings.knee_angle}度`, leftKnee.x, leftKnee.y, '#f59e0b');
        }

        if (!isHeadUpright && nose) drawText('頭部請保持端正', nose.x, nose.y - 0.1, '#f59e0b');
        if (!isShouldersLevel && leftShoulder) drawText('雙肩請保持水平', (leftShoulder.x + rightShoulder!.x)/2, (leftShoulder.y + rightShoulder!.y)/2, '#f59e0b');
        if (!isHipsLevel && leftHip) drawText('骨盆請保持水平', (leftHip.x + rightHip!.x)/2, (leftHip.y + rightHip!.y)/2, '#f59e0b');
        if (!isHandsTogether && leftShoulder) drawText('雙手請合十於胸前', (leftShoulder.x + rightShoulder!.x)/2, (leftShoulder.y + rightShoulder!.y)/2 + 0.1, '#f59e0b');

      } else if (poseName.includes('山式')) {
        if (isHeadUpright) currentCorrectCount += 5;
        if (isShouldersLevel) currentCorrectCount += 4;
        if (isHipsLevel) currentCorrectCount += 4;
        
        const isLegsStraight = leftKneeAngle > 165 && rightKneeAngle > 165;
        if (isLegsStraight) currentCorrectCount += 4;
        else if (leftKnee) drawText('雙腿請打直', leftKnee.x, leftKnee.y, '#f59e0b');

        if (!isHeadUpright && nose) drawText('頭部請保持端正', nose.x, nose.y - 0.1, '#f59e0b');
        if (!isShouldersLevel && leftShoulder) drawText('雙肩請放鬆下沉', leftShoulder.x, leftShoulder.y, '#f59e0b');

      } else if (poseName.includes('三角式')) {
        // 雙腿打直
        const isLegsStraight = leftKneeAngle > 160 && rightKneeAngle > 160;
        if (isLegsStraight) currentCorrectCount += 5;
        else if (leftKnee) drawText('雙腿請保持伸直', leftKnee.x, leftKnee.y, '#f59e0b');

        // 雙臂展開成一直線
        const armsStraight = leftElbowAngle > 150 && rightElbowAngle > 150;
        if (armsStraight) currentCorrectCount += 5;
        else if (leftElbow) drawText('雙臂請伸直', leftElbow.x, leftElbow.y, '#f59e0b');

        // 身體側彎 (肩膀不在同一水平線)
        const isTorsoBent = leftShoulder && rightShoulder && Math.abs(leftShoulder.y - rightShoulder.y) > 0.2;
        if (isTorsoBent) currentCorrectCount += 7;
        else if (nose) drawText('身體請向側邊彎曲', nose.x, nose.y, '#f59e0b');

      } else if (poseName.includes('門閂式')) {
        // 單膝跪地，另一腳伸直
        const isLeftKneeling = leftKneeAngle < 100 && rightKneeAngle > 150;
        const isRightKneeling = rightKneeAngle < 100 && leftKneeAngle > 150;
        if (isLeftKneeling || isRightKneeling) currentCorrectCount += 6;
        else if (leftKnee) drawText('一腳跪地，另一腳伸直', leftKnee.x, leftKnee.y, '#f59e0b');

        // 身體側彎
        const isTorsoBent = leftShoulder && rightShoulder && Math.abs(leftShoulder.y - rightShoulder.y) > 0.15;
        if (isTorsoBent) currentCorrectCount += 6;
        else if (nose) drawText('身體向伸直腿側彎', nose.x, nose.y, '#f59e0b');

        // 手臂伸展
        const armsStraight = leftElbowAngle > 140 || rightElbowAngle > 140;
        if (armsStraight) currentCorrectCount += 5;

      } else if (poseName.includes('椅子式') || poseName.includes('幻椅式')) {
        // 膝蓋彎曲如坐椅子
        const isKneesBent = leftKneeAngle > 90 && leftKneeAngle < 150 && rightKneeAngle > 90 && rightKneeAngle < 150;
        if (isKneesBent) currentCorrectCount += 7;
        else if (leftKnee) drawText('膝蓋請彎曲如坐椅子', leftKnee.x, leftKnee.y, '#f59e0b');

        // 雙手向上伸展
        const armsUp = leftWrist && leftShoulder && leftWrist.y < leftShoulder.y;
        if (armsUp) currentCorrectCount += 5;
        else if (leftWrist) drawText('雙手請向上伸展', leftWrist.x, leftWrist.y, '#f59e0b');

        // 身體前傾
        const isTorsoLeaning = leftHipAngle > 90 && leftHipAngle < 160;
        if (isTorsoLeaning) currentCorrectCount += 5;

      } else if (poseName.includes('高弓步式')) {
        // 前腳彎曲，後腳伸直
        const isLeftForward = leftKnee && rightKnee && leftKnee.y > rightKnee.y; // 假設Y較大(較低)的是前腳
        const frontKneeAngle = isLeftForward ? leftKneeAngle : rightKneeAngle;
        const backKneeAngle = isLeftForward ? rightKneeAngle : leftKneeAngle;

        const isFrontBent = frontKneeAngle > 70 && frontKneeAngle < 120;
        const isBackStraight = backKneeAngle > 150;

        if (isFrontBent) currentCorrectCount += 6;
        else if (leftKnee) drawText('前腳膝蓋請彎曲約90度', leftKnee.x, leftKnee.y, '#f59e0b');

        if (isBackStraight) currentCorrectCount += 6;
        else if (rightKnee) drawText('後腳請盡量伸直', rightKnee.x, rightKnee.y, '#f59e0b');

        // 雙手向上
        const armsUp = leftWrist && leftShoulder && leftWrist.y < leftShoulder.y;
        if (armsUp) currentCorrectCount += 5;

      } else if (poseName.includes('低弓步式')) {
        // 前腳彎曲，後腳膝蓋著地
        const isLeftForward = leftKnee && rightKnee && leftKnee.y > rightKnee.y;
        const frontKneeAngle = isLeftForward ? leftKneeAngle : rightKneeAngle;
        const backKneeAngle = isLeftForward ? rightKneeAngle : leftKneeAngle;

        const isFrontBent = frontKneeAngle > 70 && frontKneeAngle < 120;
        const isBackBent = backKneeAngle < 120; // 後腳膝蓋著地所以角度較小

        if (isFrontBent) currentCorrectCount += 6;
        else if (leftKnee) drawText('前腳膝蓋請彎曲約90度', leftKnee.x, leftKnee.y, '#f59e0b');

        if (isBackBent) currentCorrectCount += 6;
        else if (rightKnee) drawText('後腳膝蓋請著地', rightKnee.x, rightKnee.y, '#f59e0b');

        const armsUp = leftWrist && leftShoulder && leftWrist.y < leftShoulder.y;
        if (armsUp) currentCorrectCount += 5;

      } else if (poseName.includes('女神蹲')) {
        // 雙腿大開，膝蓋彎曲
        const isKneesBent = leftKneeAngle > 80 && leftKneeAngle < 130 && rightKneeAngle > 80 && rightKneeAngle < 130;
        if (isKneesBent) currentCorrectCount += 8;
        else if (leftKnee) drawText('雙膝向外打開並下蹲', leftKnee.x, leftKnee.y, '#f59e0b');

        // 身體直立
        if (isHeadUpright) currentCorrectCount += 5;
        if (isShouldersLevel) currentCorrectCount += 4;

      } else if (poseName.includes('四肢支撐式') || poseName.includes('鱷魚式')) {
        // 身體呈一直線 (肩膀、臀部、腳踝)
        const isBodyStraight = leftHipAngle > 150 && rightHipAngle > 150;
        if (isBodyStraight) currentCorrectCount += 7;
        else if (leftHip) drawText('身體請保持一直線，勿塌腰', leftHip.x, leftHip.y, '#f59e0b');

        // 手肘彎曲90度
        const isElbowsBent = leftElbowAngle > 70 && leftElbowAngle < 110;
        if (isElbowsBent) currentCorrectCount += 6;
        else if (leftElbow) drawText('手肘請彎曲約90度', leftElbow.x, leftElbow.y, '#f59e0b');

        // 頭部不掉落
        const isHeadAligned = nose && leftShoulder && nose.y <= leftShoulder.y + 0.1;
        if (isHeadAligned) currentCorrectCount += 4;

      } else if (poseName.includes('嬰兒式')) {
        // 臀部坐腳跟 (髖關節、膝關節極度彎曲)
        const isHipsBent = leftHipAngle < 60 && rightHipAngle < 60;
        const isKneesBent = leftKneeAngle < 60 && rightKneeAngle < 60;
        
        if (isHipsBent && isKneesBent) currentCorrectCount += 10;
        else if (leftHip) drawText('臀部請盡量靠近腳跟', leftHip.x, leftHip.y, '#f59e0b');

        // 頭部靠近地面 (Y值較大)
        const isHeadDown = nose && leftShoulder && nose.y > leftShoulder.y - 0.1;
        if (isHeadDown) currentCorrectCount += 7;

      } else if (poseName.includes('蝗蟲式')) {
        // 趴姿，胸部和腿部抬起
        const isChestUp = nose && leftShoulder && nose.y < leftShoulder.y; // 頭高於肩
        const isLegsUp = leftAnkle && leftHip && leftAnkle.y < leftHip.y + 0.1; // 腳踝不低於臀部太多

        if (isChestUp) currentCorrectCount += 8;
        else if (nose) drawText('請將胸部與頭部抬離地面', nose.x, nose.y, '#f59e0b');

        if (isLegsUp) currentCorrectCount += 9;
        else if (leftAnkle) drawText('請將雙腿抬離地面', leftAnkle.x, leftAnkle.y, '#f59e0b');

      } else if (poseName.includes('臥英雄式')) {
        // 仰臥，膝蓋極度彎曲
        const isKneesBent = leftKneeAngle < 60 && rightKneeAngle < 60;
        if (isKneesBent) currentCorrectCount += 8;
        else if (leftKnee) drawText('雙膝彎曲，腳跟靠近臀部外側', leftKnee.x, leftKnee.y, '#f59e0b');

        // 身體平躺 (肩膀和骨盆在同一水平面)
        const isLyingDown = leftShoulder && leftHip && Math.abs(leftShoulder.y - leftHip.y) < 0.2;
        if (isLyingDown) currentCorrectCount += 9;
        else if (nose) drawText('背部請盡量貼近地面', nose.x, nose.y, '#f59e0b');

      } else if (poseName.includes('雙手交扣向上伸展式')) {
        if (isHeadUpright) currentCorrectCount += 4;
        
        // 雙手向上伸直
        const armsUp = leftWrist && leftShoulder && leftWrist.y < leftShoulder.y - 0.2;
        const armsStraight = leftElbowAngle > 150 && rightElbowAngle > 150;
        
        if (armsUp && armsStraight) currentCorrectCount += 8;
        else if (leftWrist) drawText('雙手交扣並向上推直', leftWrist.x, leftWrist.y, '#f59e0b');

        // 雙手靠近 (交扣)
        if (isHandsTogether) currentCorrectCount += 5;

      } else if (poseName.includes('金剛坐')) {
        // 包含金剛坐頸部伸展、金剛坐手臂手腕旋轉
        // 膝蓋極度彎曲 (跪坐)
        const isKneesBent = leftKneeAngle < 60 && rightKneeAngle < 60;
        if (isKneesBent) currentCorrectCount += 8;
        else if (leftKnee) drawText('請呈跪坐姿 (金剛坐)', leftKnee.x, leftKnee.y, '#f59e0b');

        // 脊椎挺直
        const isTorsoStraight = leftShoulder && leftHip && Math.abs(leftShoulder.x - leftHip.x) < 0.15;
        if (isTorsoStraight) currentCorrectCount += 9;
        else if (leftShoulder) drawText('背部請保持挺直', leftShoulder.x, leftShoulder.y, '#f59e0b');

      } else {
        // 通用瑜珈動作判斷：只要身體主要關節都在畫面內，就給予分數
        if (nose) currentCorrectCount += 5;
        if (leftShoulder && rightShoulder) currentCorrectCount += 4;
        if (leftHip && rightHip) currentCorrectCount += 4;
        if (leftKnee || rightKnee) currentCorrectCount += 2;
        if (leftAnkle || rightAnkle) currentCorrectCount += 2;
        
        if (currentCorrectCount < 17 && nose) {
          drawText('請確保全身都在鏡頭範圍內', nose.x, nose.y - 0.1, '#f59e0b');
        }
      }

      if (currentCorrectCount !== correctPointsRef.current) {
        correctPointsRef.current = currentCorrectCount;
        setCorrectPoints(currentCorrectCount);
      }

      // 3. 容錯時間 (Grace Period) 邏輯
      const accuracyPct = (currentCorrectCount / 17) * 100;
      const isCurrentlyPerfect = accuracyPct >= settings.threshold_pct;

      if (isCurrentlyPerfect) {
        outOfPositionStartRef.current = null;
        updateCorrectState(true);
        updateGraceTime(0);
      } else {
        if (outOfPositionStartRef.current === null) {
          outOfPositionStartRef.current = Date.now();
        }
        const timeOut = Date.now() - outOfPositionStartRef.current;
        const graceAllowed = settings.grace_time_ms;
        
        if (timeOut > graceAllowed) {
          updateCorrectState(false);
          updateGraceTime(0);
        } else {
          updateCorrectState(true); // 還在容許時間內，保持正確狀態
          updateGraceTime(graceAllowed - timeOut);
        }
      }
    } else {
      updateCorrectState(false);
      updateGraceTime(0);
      if (detectedPointsRef.current !== 0) {
        detectedPointsRef.current = 0;
        setDetectedPoints(0);
      }
      if (correctPointsRef.current !== 0) {
        correctPointsRef.current = 0;
        setCorrectPoints(0);
      }
    }
    ctx.restore();
  };

  const updateCorrectState = (val: boolean) => {
    if (isCorrectRef.current !== val) {
      isCorrectRef.current = val;
      setIsCorrect(val);
    }
  };

  const updateGraceTime = (val: number) => {
    if (Math.abs(graceTimeLeftRef.current - val) > 100) { // 避免過度頻繁更新 UI
      graceTimeLeftRef.current = val;
      setGraceTimeLeft(val);
    }
  };

  const playSuccessSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      
      const playNote = (freq: number, startTime: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(startTime);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.3, startTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 1.5);
        osc.stop(startTime + 1.5);
      };

      const now = ctx.currentTime;
      playNote(523.25, now);       // C5
      playNote(659.25, now + 0.1); // E5
      playNote(783.99, now + 0.2); // G5
      playNote(1046.50, now + 0.3);// C6
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  const triggerSuccessReward = () => {
    playSuccessSound();
    
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#10b981', '#f59e0b', '#3b82f6']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#10b981', '#f59e0b', '#3b82f6']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (isCorrectRef.current) {
        if (!isCompletedRef.current) {
          setTimer((prev) => {
            const newTime = prev + 1;
            return newTime > targetDurationRef.current ? targetDurationRef.current : newTime;
          });
        }
      } else {
        setTimer(0);
        setIsCompleted(false);
        setFeedback('姿勢偏離囉，請重新調整雙手與腳部角度。');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (timer >= targetDurationRef.current && !isCompletedRef.current) {
      setIsCompleted(true);
      setFeedback('🎉 恭喜達成目標時間！太棒了！');
      triggerSuccessReward();
      if (onComplete) onComplete(difficultyRef.current, targetDurationRef.current);
    } else if (timer > 0 && timer % 5 === 0 && !isCompletedRef.current) {
      setFeedback(PRAISES[(timer / 5) % PRAISES.length]);
    }
  }, [timer, onComplete]);

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-stone-50 pb-10">
      {/* Header */}
      <div className="w-full bg-emerald-700 text-white p-6 rounded-b-3xl shadow-md mb-4">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Award className="w-8 h-8" />
          {solarTerm ? `${solarTerm.name} · ${currentPose.name}` : `春分 · ${currentPose.name}`}
        </h1>
        <p className="text-emerald-100 text-sm leading-relaxed mb-4">
          {currentPose.desc}
        </p>
        
        {solarTerm && (
          <div className="bg-emerald-800/50 rounded-xl p-3 text-sm flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-300" />
              <span className="text-emerald-200">對應經絡：</span>
              <span className="font-bold">{solarTerm.meridian}</span>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <span className="text-emerald-200">經脈：</span>
                <span className="font-bold">{solarTerm.meridianVessel}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-200">經筋：</span>
                <span className="font-bold">{solarTerm.meridianSinew}</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Controls */}
      <div className="w-full px-6 mb-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-stone-700 font-medium">
              <Settings className="w-5 h-5 text-emerald-600" />
              <label>難度選擇</label>
            </div>
            <select 
              className="bg-stone-50 border border-stone-200 text-stone-700 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-2 outline-none"
              value={difficulty} 
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="Beginner">初階 (容許離開 1.5 秒)</option>
              <option value="Intermediate">中階 (容許離開 0.5 秒)</option>
              <option value="Advanced">高階 (嚴格要求不偏離)</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-2 text-stone-700 font-medium">
              <Clock className="w-5 h-5 text-emerald-600" />
              <label>目標時間 ({targetDuration} 秒)</label>
            </div>
            <input
              type="range"
              min="1"
              max="120"
              value={targetDuration}
              onChange={(e) => setTargetDuration(Number(e.target.value))}
              className="w-1/2 accent-emerald-600"
            />
          </div>

          <div className="text-xs text-stone-500 bg-stone-50 p-2 rounded-lg">
            當前設定：要求 {YOGA_SETTINGS[difficulty].threshold_pct}% 關鍵點正確，
            容許雙手距離 {YOGA_SETTINGS[difficulty].hands_dist * 100}%，
            膝蓋角度容錯 ±{YOGA_SETTINGS[difficulty].tolerance}°
          </div>
        </div>
      </div>

      {/* Stats Panel */}
      <div className="w-full px-6 mb-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-stone-100">
            <div className="text-xs text-stone-500 mb-1 flex items-center justify-center gap-1">
              <Target className="w-3 h-3" /> 關鍵點
            </div>
            <div className="text-2xl font-bold text-stone-700">17</div>
          </div>
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-stone-100">
            <div className="text-xs text-stone-500 mb-1 flex items-center justify-center gap-1">
              <Activity className="w-3 h-3" /> 已捕捉
            </div>
            <div className="text-2xl font-bold text-blue-600">{detectedPoints}</div>
          </div>
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-stone-100">
            <div className="text-xs text-stone-500 mb-1 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> 正確位置
            </div>
            <div className="text-2xl font-bold text-emerald-600">{correctPoints}</div>
          </div>
        </div>
      </div>

      {/* Camera Viewport */}
      <div className="w-full px-6 mb-4 relative">
        <div className={cn(
          "relative w-full aspect-[3/4] rounded-3xl overflow-hidden shadow-lg border-4 transition-colors duration-300 bg-stone-200 flex items-center justify-center",
          isCorrect ? "border-emerald-500 shadow-emerald-500/20" : "border-stone-200"
        )}>
          {!isCameraReady && !cameraError && !hasRequestedCamera && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-500 z-30 bg-stone-100/80 backdrop-blur-sm">
              <button 
                onClick={handleStartCamera}
                className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium shadow-md hover:bg-emerald-700 active:scale-95 transition-all"
              >
                點擊開始使用相機
              </button>
              <p className="text-sm mt-4 text-stone-500">需要您的允許才能進行姿勢辨識</p>
            </div>
          )}

          {!isCameraReady && !cameraError && hasRequestedCamera && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-500 z-30 bg-stone-100/80 backdrop-blur-sm">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-sm font-medium">{isStartingCamera ? '正在請求相機權限...' : '啟動相機與 AI 模型中...'}</p>
            </div>
          )}

          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-600 z-30 bg-stone-100/90 backdrop-blur-md p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-base font-bold text-stone-800 mb-2">相機啟動失敗</p>
              <p className="text-sm mb-6">{cameraError}</p>
              <button 
                onClick={handleStartCamera}
                disabled={isStartingCamera}
                className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium shadow-md hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {isStartingCamera ? '重試中...' : '重新嘗試開啟相機'}
              </button>
            </div>
          )}
          
          <video 
            ref={videoRef} 
            className="absolute inset-0 w-full h-full object-cover -scale-x-100 z-0" 
            autoPlay 
            playsInline 
            muted 
          />
          <canvas 
            ref={canvasRef} 
            className="absolute inset-0 w-full h-full object-cover z-10 -scale-x-100 pointer-events-none"
          />
          
          {/* Timer Overlay */}
          <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm flex items-center gap-2">
            <Timer className={cn("w-5 h-5", isCorrect && !isCompleted ? "text-emerald-600 animate-pulse" : "text-stone-400")} />
            <span className={cn("font-bold text-lg font-mono", isCorrect ? "text-emerald-700" : "text-stone-500")}>
              {timer} <span className="text-sm text-stone-400">/ {targetDuration}s</span>
            </span>
          </div>

          {/* Standing Leg Indicator */}
          {standingLeg !== 'none' && (
            <div className="absolute top-16 left-4 z-20 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm flex items-center gap-2 text-sm font-medium text-stone-600">
              <span>支撐腳: {standingLeg === 'left' ? '左腳' : '右腳'}</span>
            </div>
          )}

          {/* Grace Period Warning */}
          {graceTimeLeft > 0 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-amber-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-full shadow-lg text-sm font-bold whitespace-nowrap animate-pulse">
              ⚠️ 姿勢偏離，請在 {(graceTimeLeft / 1000).toFixed(1)} 秒內恢復！
            </div>
          )}

          {/* Reference Image Overlay */}
          {showReference && (
            <div className="absolute bottom-4 right-4 z-20 w-28 h-40 md:w-36 md:h-48 bg-white/10 backdrop-blur-md rounded-2xl border-2 border-white/50 overflow-hidden shadow-xl transition-all duration-300">
              <button 
                onClick={() => setShowReference(false)}
                className="absolute top-1 right-1 z-30 p-1 bg-black/40 text-white rounded-full hover:bg-black/60 transition-colors"
                aria-label="關閉參考圖"
              >
                <X className="w-4 h-4" />
              </button>
              <img 
                src={currentPose.imageUrl || `https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400`} 
                alt={currentPose.name}
                className="w-full h-full object-cover opacity-90"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6">
                <p className="text-white text-xs font-bold text-center drop-shadow-md">{currentPose.name} 參考圖</p>
              </div>
            </div>
          )}

          {!showReference && (
            <button 
              onClick={() => setShowReference(true)}
              className="absolute bottom-4 right-4 z-20 p-3 bg-white/80 backdrop-blur-sm text-stone-700 rounded-full shadow-lg hover:bg-white transition-all"
              aria-label="顯示參考圖"
            >
              <ImageIcon className="w-6 h-6" />
            </button>
          )}

          {/* Status Indicator */}
          <div className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-sm">
            {isCorrect ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            ) : (
              <AlertCircle className="w-6 h-6 text-amber-500" />
            )}
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      <div className="w-full px-6">
        <div className={cn(
          "w-full px-6 py-4 rounded-2xl text-center font-medium transition-all duration-300 shadow-sm",
          isCorrect 
            ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
            : "bg-amber-50 text-amber-800 border border-amber-200"
        )}>
          {feedback}
        </div>
      </div>
    </div>
  );
}
