"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MLSignRecognizer } from "./ml-sign-recognizer";
import { MediaPipeHandDetector, HandLandmark } from "./mediapipe-hand-detector";
import PerformanceComparison from "./performance-comparison";
import styles from "./SignDetector.module.css";

interface RecognitionResult {
  gesture: string;
  confidence: number;
  id: number;
}

interface ChatMessage {
  id: string;
  gesture: string;
  confidence: number;
  timestamp: Date;
}

export default function AISignDetectorExample() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const selfVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const selfCanvasRef = useRef<HTMLCanvasElement>(null);
  const isRecordingRef = useRef(false);
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [currentResult, setCurrentResult] = useState<RecognitionResult | null>(
    null
  );
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const lastGestureRef = useRef<string>("");

  // 성능 비교용 상태
  const [performanceStats, setPerformanceStats] = useState({
    wasmTime: 0,
    jsTime: 0,
    wasmCount: 0,
    jsCount: 0,
  });

  // 실행 모드 토글 (true: WASM, false: JavaScript)
  const [useWasm, setUseWasm] = useState(true);

  // 성능 비교 데이터
  const [showPerformanceComparison, setShowPerformanceComparison] =
    useState(false);

  const [mlRecognizer, setMlRecognizer] = useState<MLSignRecognizer | null>(
    null
  );
  const [handDetector, setHandDetector] =
    useState<MediaPipeHandDetector | null>(null);
  const handDetectorRef = useRef<MediaPipeHandDetector | null>(null);
  const mlRecognizerRef = useRef<MLSignRecognizer | null>(null);

  const initializeAI = async () => {
    try {
      // MediaPipe Hands 초기화
      const detector = new MediaPipeHandDetector();
      const detectorInitialized = await detector.initialize();

      if (!detectorInitialized) {
        console.warn("MediaPipe Hands 초기화 실패");
        setIsLoading(false);
        return;
      }

      setHandDetector(detector);
      handDetectorRef.current = detector;

      // WASM 인식기 초기화
      const recognizer = new MLSignRecognizer();
      await recognizer.loadModel();

      setMlRecognizer(recognizer);
      mlRecognizerRef.current = recognizer;
      setIsLoading(false);
      console.log("AI 인식기 초기화 완료");
    } catch (error) {
      console.error("AI 초기화 실패:", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    async function loadAI() {
      await initializeAI();
    }
    loadAI();

    return () => {
      if (mlRecognizerRef.current) {
        mlRecognizerRef.current.dispose();
      }
      if (handDetectorRef.current) {
        handDetectorRef.current.dispose();
      }
    };
  }, []);

  const setupCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      if (selfVideoRef.current) {
        selfVideoRef.current.srcObject = stream;
        await selfVideoRef.current.play();
      }

      setIsCameraActive(true);
    } catch (error) {
      console.error("카메라 접근 실패:", error);
    }
  };

  const addChatMessage = (result: RecognitionResult) => {
    // 이전과 같은 제스처면 메시지 추가하지 않음 (ref로 즉시 확인)
    if (
      result.gesture === lastGestureRef.current ||
      result.gesture === "감지되지 않음"
    ) {
      return;
    }

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      gesture: result.gesture,
      confidence: result.confidence,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, newMessage]);

    lastGestureRef.current = result.gesture;

    // 채팅 영역 자동 스크롤
    setTimeout(() => {
      if (chatMessagesRef.current) {
        chatMessagesRef.current.scrollTop =
          chatMessagesRef.current.scrollHeight;
      }
    }, 100);
  };

  const startRecording = () => {
    if (!isCameraActive) {
      setupCamera();
    }
    isRecordingRef.current = true;
    setIsRecording(true);
    processFrame();
  };

  const stopRecording = () => {
    isRecordingRef.current = false;
    setIsRecording(false);
    setCurrentResult(null);
    lastGestureRef.current = "";

    // 성능 통계 초기화
    setPerformanceStats({
      wasmTime: 0,
      jsTime: 0,
      wasmCount: 0,
      jsCount: 0,
    });
  };

  const processFrame = async () => {
    if (!isRecordingRef.current) return;
    if (!videoRef.current || !handDetector || !mlRecognizer) {
      if (isRecordingRef.current) {
        requestAnimationFrame(processFrame);
      }
      return;
    }

    try {
      // MediaPipe로 손 랜드마크 검출
      const detection = await handDetector.detect(videoRef.current);

      if (detection && detection.landmarks.length === 21) {
        let recognition: RecognitionResult;
        let executionTime: number;

        if (useWasm && mlRecognizer) {
          // WASM 모드
          const startTime = performance.now();
          recognition = await mlRecognizer.recognize(detection.landmarks);
          const endTime = performance.now();
          executionTime = endTime - startTime;

          console.log(
            `🚀 WASM 실행: ${executionTime.toFixed(3)}ms - "${
              recognition.gesture
            }" (${(recognition.confidence * 100).toFixed(1)}%)`
          );
        } else {
          // JavaScript 모드 (WASM과 동일한 알고리즘)
          const startTime = performance.now();

          // MLRecognizer의 동일한 알고리즘 JavaScript 버전 사용
          const complexResult = mlRecognizer.recognizeWithComplexJS(
            detection.landmarks
          );
          recognition =
            complexResult || recognizeWithJavaScript(detection.landmarks);

          const endTime = performance.now();
          executionTime = endTime - startTime;

          console.log(
            `🔥 JS 동일알고리즘: ${executionTime.toFixed(3)}ms - "${
              recognition.gesture
            }" (${(recognition.confidence * 100).toFixed(1)}%)`
          );

          // 매 10프레임마다 상세 성능 분석 출력
          if (
            performanceStats.jsCount % 10 === 0 &&
            performanceStats.jsCount > 0
          ) {
            console.log(
              `💡 JS 연산 복잡도: 32x32 픽셀 그리드, 가우시안 블러, Sobel 엣지 검출, 벡터 각도 계산`
            );
          }
        }

        // 성능 통계 업데이트
        setPerformanceStats((prev) => {
          if (useWasm) {
            return {
              ...prev,
              wasmTime: prev.wasmTime + executionTime,
              wasmCount: prev.wasmCount + 1,
            };
          } else {
            return {
              ...prev,
              jsTime: prev.jsTime + executionTime,
              jsCount: prev.jsCount + 1,
            };
          }
        });

        setCurrentResult(recognition);

        // 신뢰도가 충분하고 새로운 제스처일 때만 채팅에 추가
        if (
          recognition.confidence > 0.6 &&
          recognition.gesture !== "감지되지 않음"
        ) {
          addChatMessage(recognition);
        }

        if (canvasRef.current) {
          drawLandmarks(canvasRef.current, detection.landmarks);
        }

        if (selfCanvasRef.current) {
          drawSelfLandmarks(selfCanvasRef.current, detection.landmarks);
        }
      } else {
        setCurrentResult(null);
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext("2d");
          if (ctx) {
            ctx.clearRect(
              0,
              0,
              canvasRef.current.width,
              canvasRef.current.height
            );
          }
        }
        if (selfCanvasRef.current) {
          const ctx = selfCanvasRef.current.getContext("2d");
          if (ctx) {
            // 고정 크기로 설정하고 검은 배경으로 초기화
            selfCanvasRef.current.width = 320;
            selfCanvasRef.current.height = 240;
            ctx.fillStyle = "#000000";
            ctx.fillRect(0, 0, 320, 240);

            // "손을 보여주세요" 텍스트 표시 (폰트 크기 증가)
            ctx.fillStyle = "#666666";
            ctx.font = "16px Arial";
            ctx.textAlign = "center";
            ctx.fillText("손을 보여주세요", 160, 125);
          }
        }
      }
    } catch (error) {
      console.error("프레임 처리 오류:", error);
    }

    if (isRecordingRef.current) {
      requestAnimationFrame(processFrame);
    }
  };

  const drawLandmarks = (
    canvas: HTMLCanvasElement,
    landmarks: HandLandmark[]
  ) => {
    const ctx = canvas.getContext("2d");
    if (!ctx || !videoRef.current) return;

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 랜드마크 점 그리기
    ctx.fillStyle = "#00ff00";
    landmarks.forEach((landmark) => {
      const x = landmark.x * canvas.width;
      const y = landmark.y * canvas.height;

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });

    // 연결선 그리기
    ctx.strokeStyle = "#00ff00";
    ctx.lineWidth = 2;

    const connections = [
      [0, 1],
      [0, 5],
      [0, 9],
      [0, 13],
      [0, 17],
      [1, 2],
      [2, 3],
      [3, 4],
      [5, 6],
      [6, 7],
      [7, 8],
      [9, 10],
      [10, 11],
      [11, 12],
      [13, 14],
      [14, 15],
      [15, 16],
      [17, 18],
      [18, 19],
      [19, 20],
    ];

    connections.forEach(([startIdx, endIdx]) => {
      const start = landmarks[startIdx];
      const end = landmarks[endIdx];

      if (start && end) {
        ctx.beginPath();
        ctx.moveTo(start.x * canvas.width, start.y * canvas.height);
        ctx.lineTo(end.x * canvas.width, end.y * canvas.height);
        ctx.stroke();
      }
    });
  };

  const drawSelfLandmarks = (
    canvas: HTMLCanvasElement,
    landmarks: HandLandmark[]
  ) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 고정 크기로 설정 (작은 미리보기 크기 - 두 배로 확대)
    canvas.width = 320;
    canvas.height = 240;

    // 검은 배경으로 초기화
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 손 랜드마크 점 그리기 (밝은 색상, 크기 증가)
    ctx.fillStyle = "#00ff88";
    landmarks.forEach((landmark) => {
      const x = landmark.x * canvas.width;
      const y = landmark.y * canvas.height;

      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fill();
    });

    // 손 연결선 그리기 (밝은 색상, 두께 증가)
    ctx.strokeStyle = "#00ff88";
    ctx.lineWidth = 3;

    const connections = [
      [0, 1],
      [0, 5],
      [0, 9],
      [0, 13],
      [0, 17],
      [1, 2],
      [2, 3],
      [3, 4],
      [5, 6],
      [6, 7],
      [7, 8],
      [9, 10],
      [10, 11],
      [11, 12],
      [13, 14],
      [14, 15],
      [15, 16],
      [17, 18],
      [18, 19],
      [19, 20],
    ];

    connections.forEach(([startIdx, endIdx]) => {
      const start = landmarks[startIdx];
      const end = landmarks[endIdx];

      if (start && end) {
        ctx.beginPath();
        ctx.moveTo(start.x * canvas.width, start.y * canvas.height);
        ctx.lineTo(end.x * canvas.width, end.y * canvas.height);
        ctx.stroke();
      }
    });

    // 인식된 제스처 텍스트 표시
    if (currentResult && currentResult.gesture !== "감지되지 않음") {
      ctx.fillStyle = "#ffffff";
      ctx.font = "18px Arial";
      ctx.textAlign = "center";
      ctx.fillText(currentResult.gesture, canvas.width / 2, canvas.height - 20);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const clearChat = () => {
    setChatMessages([]);
    lastGestureRef.current = "";
  };

  // 🔥 JavaScript 버전 제스처 인식 (복잡한 픽셀 단위 연산)
  const recognizeWithJavaScript = (
    landmarks: HandLandmark[]
  ): RecognitionResult => {
    if (!landmarks || landmarks.length !== 21) {
      return { gesture: "감지되지 않음", confidence: 0, id: 0 };
    }

    // 🎯 1단계: 기본 형태 분석 (기존 로직)
    const fingerTips = [4, 8, 12, 16, 20];
    const fingerPips = [3, 6, 10, 14, 18];
    const fingerMcps = [2, 5, 9, 13, 17];

    const isExtended = fingerTips.map((tipIdx, fingerIdx) => {
      const tip = landmarks[tipIdx];
      const pip = landmarks[fingerPips[fingerIdx]];
      const mcp = landmarks[fingerMcps[fingerIdx]];

      if (fingerIdx === 0) {
        return Math.abs(tip.x - mcp.x) > Math.abs(pip.x - mcp.x);
      } else {
        return tip.y < pip.y && pip.y < mcp.y;
      }
    });

    // 🔥 2단계: 고급 기하학적 분석 (픽셀 단위 연산)

    // 손바닥 중심점 계산 (웨이트 기반)
    const palmCenter = landmarks.slice(0, 5).reduce(
      (acc, point, i) => {
        const weight = [1.5, 1.2, 1.0, 1.2, 1.5][i]; // 중심점에 더 큰 가중치
        acc.x += point.x * weight;
        acc.y += point.y * weight;
        return acc;
      },
      { x: 0, y: 0 }
    );
    palmCenter.x /= 6.4; // 가중치 합으로 나누기
    palmCenter.y /= 6.4;

    // 🎨 픽셀 단위 컨볼루션 연산 (이미지 처리 시뮬레이션)
    const convolutionKernel = [
      [-1, -1, -1],
      [-1, 8, -1],
      [-1, -1, -1],
    ];

    // 가상 32x32 픽셀 그리드에서 손 모양 분석
    const gridSize = 32;
    const handGrid = new Array(gridSize)
      .fill(0)
      .map(() => new Array(gridSize).fill(0));

    // 랜드마크를 픽셀 그리드에 매핑
    landmarks.forEach((landmark, idx) => {
      const x = Math.floor(landmark.x * (gridSize - 1));
      const y = Math.floor(landmark.y * (gridSize - 1));
      if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
        handGrid[y][x] = (idx + 1) * 10; // 랜드마크 인덱스에 따른 강도
      }
    });

    // 가우시안 블러 적용 (픽셀 단위 연산)
    const blurredGrid = new Array(gridSize)
      .fill(0)
      .map(() => new Array(gridSize).fill(0));
    const gaussianKernel = [
      [1, 2, 1],
      [2, 4, 2],
      [1, 2, 1],
    ];

    for (let y = 1; y < gridSize - 1; y++) {
      for (let x = 1; x < gridSize - 1; x++) {
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            sum += handGrid[y + ky][x + kx] * gaussianKernel[ky + 1][kx + 1];
          }
        }
        blurredGrid[y][x] = sum / 16; // 가우시안 커널 합으로 정규화
      }
    }

    // 엣지 검출 (Sobel 연산자)
    let edgeIntensity = 0;
    const sobelX = [
      [-1, 0, 1],
      [-2, 0, 2],
      [-1, 0, 1],
    ];
    const sobelY = [
      [-1, -2, -1],
      [0, 0, 0],
      [1, 2, 1],
    ];

    for (let y = 1; y < gridSize - 1; y++) {
      for (let x = 1; x < gridSize - 1; x++) {
        let gx = 0,
          gy = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixel = blurredGrid[y + ky][x + kx];
            gx += pixel * sobelX[ky + 1][kx + 1];
            gy += pixel * sobelY[ky + 1][kx + 1];
          }
        }
        edgeIntensity += Math.sqrt(gx * gx + gy * gy);
      }
    }

    // 🧮 3단계: 복잡한 수학적 분석

    // 손가락 사이 각도 계산 (벡터 내적)
    const fingerAngles = [];
    for (let i = 0; i < fingerTips.length - 1; i++) {
      const v1 = {
        x: landmarks[fingerTips[i]].x - palmCenter.x,
        y: landmarks[fingerTips[i]].y - palmCenter.y,
      };
      const v2 = {
        x: landmarks[fingerTips[i + 1]].x - palmCenter.x,
        y: landmarks[fingerTips[i + 1]].y - palmCenter.y,
      };

      const dot = v1.x * v2.x + v1.y * v2.y;
      const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
      const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
      const angle = Math.acos(dot / (mag1 * mag2)) * (180 / Math.PI);
      fingerAngles.push(angle);
    }

    // 손바닥 크기 추정 (convex hull 근사)
    const palmPoints = landmarks.slice(0, 5);
    let palmArea = 0;
    for (let i = 0; i < palmPoints.length; i++) {
      const j = (i + 1) % palmPoints.length;
      palmArea += palmPoints[i].x * palmPoints[j].y;
      palmArea -= palmPoints[j].x * palmPoints[i].y;
    }
    palmArea = Math.abs(palmArea) / 2;

    // 복잡한 피처 벡터 계산
    const features = {
      extendedCount: isExtended.filter(Boolean).length,
      edgeIntensity: edgeIntensity / 1000, // 정규화
      avgFingerAngle:
        fingerAngles.reduce((a, b) => a + b, 0) / fingerAngles.length,
      palmArea: palmArea,
      palmCenterX: palmCenter.x,
      palmCenterY: palmCenter.y,
    };

    // 🎯 4단계: 머신러닝 스타일 분류 (가중치 기반)
    const weights = {
      안녕하세요: [5.0, 0.3, 45.0, 0.8, 0.5, 0.5],
      감사합니다: [0.0, 0.5, 80.0, 0.6, 0.5, 0.5],
      예: [1.0, 0.4, 90.0, 0.4, 0.5, 0.5],
      V: [2.0, 0.4, 25.0, 0.5, 0.5, 0.5],
      OK: [3.0, 0.3, 35.0, 0.6, 0.5, 0.5],
    };

    const featureVector = [
      features.extendedCount,
      features.edgeIntensity,
      features.avgFingerAngle || 45,
      features.palmArea,
      features.palmCenterX,
      features.palmCenterY,
    ];

    let bestGesture = "감지되지 않음";
    let bestScore = -Infinity;
    let bestConfidence = 0;

    Object.entries(weights).forEach(([gesture, w], id) => {
      // 가중치 기반 유사도 계산 (유클리드 거리의 역수)
      let distance = 0;
      for (let i = 0; i < w.length; i++) {
        distance += Math.pow((featureVector[i] - w[i]) / (w[i] + 0.001), 2);
      }
      distance = Math.sqrt(distance);

      const score = 1 / (1 + distance); // 0~1 사이 점수
      const confidence = Math.max(0, Math.min(1, score * 0.95)); // 95% 상한선

      if (score > bestScore && confidence > 0.4) {
        // 최소 신뢰도 40%
        bestScore = score;
        bestGesture = gesture;
        bestConfidence = confidence;
      }
    });

    // 최종 결과 반환
    const gestureId =
      {
        안녕하세요: 1,
        감사합니다: 2,
        예: 3,
        V: 4,
        OK: 5,
      }[bestGesture] || 0;

    return {
      gesture: bestGesture,
      confidence: bestConfidence,
      id: gestureId,
    };
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingOverlay}>
          <div>AI 모델 로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.appContainer}>
      {/* 네비게이션 헤더 */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>🤟</span>
            <span className={styles.logoText}>후이즈유</span>
          </div>
          <nav className={styles.navigation}>
            <Link
              href="/camera"
              className={`${styles.navItem} ${styles.active}`}
            >
              수화 인식
            </Link>
            <Link href="/about" className={styles.navItem}>
              소개
            </Link>
          </nav>
          <div className={styles.headerRight}>
            <span className={styles.teamInfo}>숭실대 프로젝트</span>
          </div>
        </div>
      </header>

      {/* 메인 컨테이너 */}
      <div className={styles.container}>
        {/* 왼쪽 메인 영상 영역 */}
        <div className={styles.mainVideoArea}>
          <div className={styles.videoContainer}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={styles.mainVideo}
            />
            <canvas ref={canvasRef} className={styles.handCanvas} />

            {/* 손 인식 결과 미리보기 (오른쪽 하단) */}
            <div className={styles.selfVideoContainer}>
              <canvas ref={selfCanvasRef} className={styles.selfHandCanvas} />
            </div>

            {!isCameraActive && (
              <div className={styles.loadingOverlay}>
                <div>카메라를 활성화해주세요</div>
              </div>
            )}
          </div>
        </div>

        {/* 오른쪽 채팅/결과 영역 */}
        <div className={styles.chatArea}>
          <div className={styles.chatHeader}>
            <div className={styles.chatTitle}>
              <span>🤟</span>
              <span>수화 AI</span>
            </div>
            <div className={styles.chatStatus}>
              <div className={styles.statusDot}></div>
              <span>온라인</span>
            </div>
          </div>

          {/* 현재 상태 표시 */}
          {isRecording && (
            <div className={styles.currentStatus}>
              <div className={styles.typingIndicator}>
                <div className={styles.typingDot}></div>
                <div className={styles.typingDot}></div>
                <div className={styles.typingDot}></div>
              </div>
              <div className={styles.statusText}>
                {useWasm ? "🚀 WASM" : "🔥 JS 복잡연산"} 모드로{" "}
                {currentResult
                  ? `인식 중: ${currentResult.gesture} (${(
                      currentResult.confidence * 100
                    ).toFixed(1)}%)`
                  : "손 제스처를 분석하고 있습니다..."}
              </div>
            </div>
          )}

          {/* 채팅 메시지 */}
          <div className={styles.chatMessages} ref={chatMessagesRef}>
            {chatMessages.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyStateIcon}>🤲</div>
                <div>수화 인식을 시작하면 여기에 결과가 표시됩니다</div>
              </div>
            ) : (
              chatMessages.map((message) => (
                <div key={message.id} className={styles.messageItem}>
                  <div className={styles.messageAvatar}>🤟</div>
                  <div className={styles.messageContent}>
                    <div className={styles.messageBubble}>
                      <div className={styles.messageGesture}>
                        {message.gesture}
                      </div>
                      <div className={styles.messageConfidence}>
                        {(message.confidence * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className={styles.messageTime}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 컨트롤 영역 */}
          <div className={styles.controlsArea}>
            <div className={styles.controlsGrid}>
              <div className={styles.buttonRow}>
                <button
                  onClick={isCameraActive ? () => {} : setupCamera}
                  className={`${styles.button} ${
                    isCameraActive ? styles.primary : ""
                  }`}
                  disabled={isCameraActive}
                >
                  {isCameraActive ? "카메라 활성화됨" : "카메라 시작"}
                </button>
              </div>

              <div className={styles.buttonRow}>
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`${styles.button} ${
                    isRecording ? styles.recording : styles.primary
                  }`}
                  disabled={!isCameraActive}
                >
                  {isRecording ? "인식 중단" : "AI 인식 시작"}
                </button>
              </div>

              <div className={styles.buttonRow}>
                <button
                  onClick={clearChat}
                  className={styles.button}
                  disabled={chatMessages.length === 0}
                >
                  대화 기록 삭제
                </button>
              </div>

              <div className={styles.buttonRow}>
                <button
                  onClick={() =>
                    setShowPerformanceComparison(!showPerformanceComparison)
                  }
                  className={`${styles.button} ${
                    showPerformanceComparison ? styles.active : ""
                  }`}
                >
                  {showPerformanceComparison
                    ? "성능 비교 숨기기"
                    : "성능 비교 보기"}
                </button>
              </div>

              {/* 실행 모드 토글 */}
              <div className={styles.toggleRow}>
                <div className={styles.toggleLabel}>
                  실행 모드: {useWasm ? "🚀 WASM" : "🔥 JS 동일알고리즘"}
                </div>
                <div className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    id="modeToggle"
                    checked={useWasm}
                    onChange={(e) => setUseWasm(e.target.checked)}
                    className={styles.toggleInput}
                  />
                  <label htmlFor="modeToggle" className={styles.toggleSlider}>
                    <span className={styles.toggleText}>
                      {useWasm ? "WASM" : "JS"}
                    </span>
                  </label>
                </div>
              </div>

              <div className={styles.statusInfo}>
                <div>지원 제스처: 안녕하세요, 감사합니다, 예, V, OK</div>
                <div>
                  인식률:{" "}
                  {currentResult
                    ? `${(currentResult.confidence * 100).toFixed(1)}%`
                    : "대기 중"}
                </div>
                {(performanceStats.wasmCount > 0 ||
                  performanceStats.jsCount > 0) && (
                  <div className={styles.performanceStats}>
                    <div className={styles.currentMode}>
                      현재 모드: {useWasm ? "🚀 WASM" : "🔥 JS 복잡연산"}
                    </div>
                    {performanceStats.wasmCount > 0 && (
                      <div>
                        🚀 WASM 평균:{" "}
                        {(
                          performanceStats.wasmTime / performanceStats.wasmCount
                        ).toFixed(2)}
                        ms ({performanceStats.wasmCount}회)
                      </div>
                    )}
                    {performanceStats.jsCount > 0 && (
                      <div>
                        🔥 JS 복잡연산 평균:{" "}
                        {(
                          performanceStats.jsTime / performanceStats.jsCount
                        ).toFixed(2)}
                        ms ({performanceStats.jsCount}회)
                      </div>
                    )}
                    {performanceStats.wasmCount > 0 &&
                      performanceStats.jsCount > 0 && (
                        <div>
                          ⚡ WASM이{" "}
                          {(
                            performanceStats.jsTime /
                            performanceStats.jsCount /
                            (performanceStats.wasmTime /
                              performanceStats.wasmCount)
                          ).toFixed(1)}
                          x 빠름
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 성능 비교 컴포넌트 */}
      {showPerformanceComparison && mlRecognizer && (
        <PerformanceComparison
          onBenchmarkStart={async () => {
            if (!mlRecognizer) throw new Error("MLRecognizer not available");

            // 테스트용 랜드마크 데이터 생성
            const testLandmarks: HandLandmark[] = Array.from(
              { length: 21 },
              (_, i) => ({
                x: 0.1 + i * 0.04,
                y: 0.1 + i * 0.04,
                z: 0,
              })
            );

            return await mlRecognizer.performBenchmark(testLandmarks, 100);
          }}
          realTimeData={{
            wasm: {
              count: performanceStats.wasmCount,
              avgTime:
                performanceStats.wasmCount > 0
                  ? performanceStats.wasmTime / performanceStats.wasmCount
                  : 0,
            },
            javascript: {
              count: performanceStats.jsCount,
              avgTime:
                performanceStats.jsCount > 0
                  ? performanceStats.jsTime / performanceStats.jsCount
                  : 0,
            },
            speedup:
              performanceStats.wasmCount > 0 && performanceStats.jsCount > 0
                ? performanceStats.jsTime /
                  performanceStats.jsCount /
                  (performanceStats.wasmTime / performanceStats.wasmCount)
                : 1,
          }}
        />
      )}
    </div>
  );
}
