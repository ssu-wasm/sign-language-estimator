"use client";
/**
 * WASM 기반 수화 인식기
 * MediaPipe Hands + WASM을 사용한 제스처 인식
 */

import { WASMSignRecognizer } from "./wasm-sign-recognizer";

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface MLRecognitionResult {
  gesture: string;
  confidence: number;
  id: number;
}

export interface PerformanceMetrics {
  totalTime: number;
  wasmTime?: number;
  jsTime?: number;
  method: "wasm" | "javascript" | "mixed";
  iterations: number;
}

export class MLSignRecognizer {
  private isModelLoaded: boolean = false;
  private wasmRecognizer: WASMSignRecognizer | null = null;
  private performanceData: PerformanceMetrics[] = [];

  /**
   * WASM 모델 로드
   */
  async loadModel(): Promise<boolean> {
    try {
      this.wasmRecognizer = new WASMSignRecognizer();
      const wasmInitialized = await this.wasmRecognizer.initialize();
      if (wasmInitialized) {
        this.isModelLoaded = true;
        console.log("WASM 인식기 로드 완료");
        return true;
      }
      return false;
    } catch (error) {
      console.error("WASM 로드 실패:", error);
      return false;
    }
  }

  /**
   * 간단한 규칙 기반 제스처 인식 (테스트용)
   */
  private recognizeByRules(
    landmarks: HandLandmark[]
  ): MLRecognitionResult | null {
    // 손가락 끝 랜드마크 인덱스
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];
    const wrist = landmarks[0];

    // 검지가 펴져있는지 확인
    const indexExtended =
      indexTip.y < landmarks[6].y && landmarks[6].y < landmarks[5].y;
    // 중지가 펴져있는지 확인
    const middleExtended =
      middleTip.y < landmarks[10].y && landmarks[10].y < landmarks[9].y;
    // 약지가 펴져있는지 확인
    const ringExtended =
      ringTip.y < landmarks[14].y && landmarks[14].y < landmarks[13].y;
    // 새끼손가락이 펴져있는지 확인
    const pinkyExtended =
      pinkyTip.y < landmarks[18].y && landmarks[18].y < landmarks[17].y;
    // 엄지가 펴져있는지 확인 (x 좌표로 판단)
    const thumbExtended =
      Math.abs(thumbTip.x - wrist.x) > Math.abs(landmarks[3].x - wrist.x);

    const extendedFingers = [
      thumbExtended,
      indexExtended,
      middleExtended,
      ringExtended,
      pinkyExtended,
    ].filter(Boolean).length;

    // 규칙 기반 인식
    if (extendedFingers === 1 && indexExtended) {
      // 검지만 펴져있음 -> "예"
      return {
        gesture: "예",
        confidence: 0.8,
        id: 3,
      };
    } else if (extendedFingers === 5) {
      // 모든 손가락이 펴져있음 -> "안녕하세요"
      return {
        gesture: "안녕하세요",
        confidence: 0.75,
        id: 1,
      };
    } else if (extendedFingers === 0) {
      // 주먹 -> "감사합니다"
      return {
        gesture: "감사합니다",
        confidence: 0.7,
        id: 2,
      };
    }

    return null;
  }

  /**
   * 고급 JavaScript 기반 제스처 인식 (WASM과 동일한 연산)
   * C++ WASM 버전과 정확히 같은 알고리즘 구현
   */
  public recognizeWithComplexJS(
    landmarks: HandLandmark[]
  ): MLRecognitionResult | null {
    // 1. WASM과 동일한 복잡한 특징 추출 (256개)
    const features = this.extractComplexFeaturesLikeWASM(landmarks);

    // 2. WASM과 동일한 신경망 추론
    const outputs = this.neuralNetworkInferenceLikeWASM(features);

    // 3. WASM과 동일한 결과 해석
    if (outputs.length < 5) {
      return { gesture: "감지되지 않음", confidence: 0.0, id: 0 };
    }

    // 최대값과 인덱스 찾기
    let maxIdx = 0;
    let maxVal = outputs[0];
    for (let i = 1; i < 5; i++) {
      if (outputs[i] > maxVal) {
        maxVal = outputs[i];
        maxIdx = i;
      }
    }

    // 소프트맥스 정규화 (WASM과 동일)
    let sum = 0.0;
    for (const val of outputs) {
      sum += Math.exp(val);
    }
    const confidence = Math.exp(maxVal) / sum;

    // 제스처 매핑 (WASM과 동일)
    const gestures = ["감지되지 않음", "안녕하세요", "감사합니다", "예", "V"];

    if (maxIdx < gestures.length) {
      return { gesture: gestures[maxIdx], confidence, id: maxIdx };
    }

    return { gesture: "감지되지 않음", confidence: 0.0, id: 0 };
  }

  /**
   * WASM과 동일한 복잡한 특징 추출 (210개 특징)
   */
  public extractComplexFeaturesLikeWASM(landmarks: HandLandmark[]): number[] {
    const features: number[] = [];

    // 1. 모든 쌍의 거리 계산 (21 * 20 / 2 = 210개) - WASM과 동일
    for (let i = 0; i < 21; i++) {
      for (let j = i + 1; j < 21; j++) {
        const dx = landmarks[i].x - landmarks[j].x;
        const dy = landmarks[i].y - landmarks[j].y;
        const dz = (landmarks[i].z || 0) - (landmarks[j].z || 0);
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        features.push(dist);
      }
    }

    // 2. 각 포인트에서 손목까지의 거리 (20개)
    const wrist = landmarks[0];
    for (let i = 1; i < 21; i++) {
      const dx = landmarks[i].x - wrist.x;
      const dy = landmarks[i].y - wrist.y;
      const dz = (landmarks[i].z || 0) - (wrist.z || 0);
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      features.push(dist);
    }

    // 3. 각 손가락의 각도 계산 (5개)
    const fingerTips = [4, 8, 12, 16, 20];
    const fingerPips = [3, 6, 10, 14, 18];
    const fingerMcps = [2, 5, 9, 13, 17];

    for (let i = 0; i < 5; i++) {
      const angle = this.calculateAngleLikeWASM(
        landmarks[fingerTips[i]],
        landmarks[fingerPips[i]],
        landmarks[fingerMcps[i]]
      );
      features.push(angle);
    }

    // 4. 손바닥 방향 벡터 (2개)
    let palmX = 0,
      palmY = 0;
    for (let i = 0; i < 5; i++) {
      palmX += landmarks[i].x;
      palmY += landmarks[i].y;
    }
    palmX /= 5;
    palmY /= 5;
    features.push(palmX);
    features.push(palmY);

    // 5. 곡률 계산 (19개)
    for (let i = 1; i < 20; i++) {
      const curvature = this.calculateAngleLikeWASM(
        landmarks[i - 1],
        landmarks[i],
        landmarks[i + 1]
      );
      features.push(curvature);
    }

    // 특징 정규화 (WASM과 동일한 방식)
    if (features.length > 0) {
      const mean = features.reduce((sum, f) => sum + f, 0) / features.length;
      let variance = 0;
      for (const f of features) {
        variance += (f - mean) * (f - mean);
      }
      variance /= features.length;
      const stddev = Math.sqrt(variance);

      if (stddev > 1e-6) {
        for (let i = 0; i < features.length; i++) {
          features[i] = (features[i] - mean) / stddev;
        }
      }
    }

    return features;
  }

  /**
   * WASM과 동일한 각도 계산 (도 단위)
   */
  private calculateAngleLikeWASM(
    a: HandLandmark,
    b: HandLandmark,
    c: HandLandmark
  ): number {
    // 벡터 BA와 BC 사이의 각도 계산 (WASM과 동일)
    const baX = a.x - b.x;
    const baY = a.y - b.y;
    const bcX = c.x - b.x;
    const bcY = c.y - b.y;

    const dot = baX * bcX + baY * bcY;
    const magBA = Math.sqrt(baX * baX + baY * baY);
    const magBC = Math.sqrt(bcX * bcX + bcY * bcY);

    if (magBA === 0.0 || magBC === 0.0) return 0.0;

    let cosAngle = dot / (magBA * magBC);
    cosAngle = Math.max(-1.0, Math.min(1.0, cosAngle)); // Clamp to [-1, 1]

    return (Math.acos(cosAngle) * 180.0) / Math.PI; // Convert to degrees
  }

  /**
   * WASM과 동일한 신경망 추론 (256 → 128 → 64 → 32 → 5)
   */
  private neuralNetworkInferenceLikeWASM(features: number[]): number[] {
    // 특징을 256개로 패딩 또는 잘라내기 (WASM과 동일한 입력 크기)
    const paddedFeatures = new Array(256).fill(0);
    const copyLength = Math.min(features.length, 256);
    for (let i = 0; i < copyLength; i++) {
      paddedFeatures[i] = features[i];
    }

    // 가상의 사전 훈련된 가중치 (WASM과 유사한 패턴)
    const weights = {
      layer1: this.generateWeights(256, 128), // 256 -> 128
      layer2: this.generateWeights(128, 64), // 128 -> 64
      layer3: this.generateWeights(64, 32), // 64 -> 32
      layer4: this.generateWeights(32, 5), // 32 -> 5
    };

    // Layer 1: 256 -> 128
    const layer1 = new Array(128);
    for (let i = 0; i < 128; i++) {
      let sum = weights.layer1.biases[i];
      for (let j = 0; j < 256; j++) {
        sum += paddedFeatures[j] * weights.layer1.weights[j * 128 + i];
      }
      layer1[i] = Math.max(0.0, sum); // ReLU
    }

    // Layer 2: 128 -> 64
    const layer2 = new Array(64);
    for (let i = 0; i < 64; i++) {
      let sum = 0.0;
      for (let j = 0; j < 128; j++) {
        sum += layer1[j] * weights.layer2.weights[j * 64 + i];
      }
      layer2[i] = Math.max(0.0, sum); // ReLU
    }

    // Layer 3: 64 -> 32
    const layer3 = new Array(32);
    for (let i = 0; i < 32; i++) {
      let sum = 0.0;
      for (let j = 0; j < 64; j++) {
        sum += layer2[j] * weights.layer3.weights[j * 32 + i];
      }
      layer3[i] = Math.max(0.0, sum); // ReLU
    }

    // Layer 4: 32 -> 5 (output)
    const output = new Array(5);
    for (let i = 0; i < 5; i++) {
      let sum = 0.0;
      for (let j = 0; j < 32; j++) {
        sum += layer3[j] * weights.layer4.weights[j * 5 + i];
      }
      output[i] = sum; // Linear output
    }

    return output;
  }

  /**
   * 가상의 가중치 생성 (일관된 결과를 위해 시드 기반)
   */
  private generateWeights(
    inputSize: number,
    outputSize: number
  ): { weights: number[]; biases: number[] } {
    const weights = new Array(inputSize * outputSize);
    const biases = new Array(outputSize);

    // 시드 기반 가중치 생성 (일관된 결과)
    let seed = 12345;
    const random = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return (seed / 233280.0) * 2 - 1; // -1 to 1
    };

    // Xavier 초기화 스타일
    const scale = Math.sqrt(2.0 / inputSize);
    for (let i = 0; i < weights.length; i++) {
      weights[i] = random() * scale;
    }

    for (let i = 0; i < biases.length; i++) {
      biases[i] = random() * 0.1;
    }

    return { weights, biases };
  }

  /**
   * 곡률 계산 (기존 버전, 사용 안함)
   */
  private calculateCurvature(
    p1: HandLandmark,
    p2: HandLandmark,
    p3: HandLandmark
  ): number {
    const a = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    const b = Math.sqrt(Math.pow(p2.x - p3.x, 2) + Math.pow(p2.y - p3.y, 2));
    const c = Math.sqrt(Math.pow(p1.x - p3.x, 2) + Math.pow(p1.y - p3.y, 2));

    const s = (a + b + c) / 2;
    const area = Math.sqrt(s * (s - a) * (s - b) * (s - c));

    return (4 * area) / (a * b * c);
  }

  /**
   * 특징 정규화
   */
  private normalizeFeatures(features: number[]): number[] {
    const mean = features.reduce((sum, val) => sum + val, 0) / features.length;
    const variance =
      features.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      features.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return features;

    return features.map((val) => (val - mean) / stdDev);
  }

  /**
   * 제스처 점수 계산 (유사도 기반)
   */
  private calculateGestureScores(
    features: number[]
  ): { gesture: string; confidence: number; id: number }[] {
    const gestures = [
      { name: "안녕하세요", id: 1, template: this.getHelloTemplate() },
      { name: "감사합니다", id: 2, template: this.getThanksTemplate() },
      { name: "예", id: 3, template: this.getYesTemplate() },
    ];

    return gestures.map((gesture) => {
      let similarity = 0;
      const minLength = Math.min(features.length, gesture.template.length);

      for (let i = 0; i < minLength; i++) {
        similarity += Math.exp(-Math.pow(features[i] - gesture.template[i], 2));
      }

      similarity /= minLength;

      return {
        gesture: gesture.name,
        confidence: similarity,
        id: gesture.id,
      };
    });
  }

  /**
   * 최적 제스처 선택
   */
  private selectBestGesture(
    scores: { gesture: string; confidence: number; id: number }[]
  ): MLRecognitionResult {
    let best = scores[0];

    for (const score of scores) {
      if (score.confidence > best.confidence) {
        best = score;
      }
    }

    return {
      gesture: best.gesture,
      confidence: best.confidence,
      id: best.id,
    };
  }

  /**
   * 제스처 템플릿들 (실제로는 학습된 데이터)
   */
  private getHelloTemplate(): number[] {
    return Array(210)
      .fill(0)
      .map((_, i) => Math.sin(i * 0.1) + Math.cos(i * 0.05));
  }

  private getThanksTemplate(): number[] {
    return Array(210)
      .fill(0)
      .map((_, i) => Math.cos(i * 0.15) - Math.sin(i * 0.08));
  }

  private getYesTemplate(): number[] {
    return Array(210)
      .fill(0)
      .map((_, i) => Math.tan(i * 0.02) + Math.sin(i * 0.12));
  }

  /**
   * 랜드마크로부터 제스처 인식 (WASM 사용)
   */
  async recognize(landmarks: HandLandmark[]): Promise<MLRecognitionResult> {
    const startTime = performance.now();

    // WASM 사용
    if (this.isModelLoaded && this.wasmRecognizer) {
      try {
        console.log("🔄 WASM 인식 시도 중...");
        const wasmStartTime = performance.now();
        const result = await this.wasmRecognizer.recognizeFast(landmarks);
        const wasmEndTime = performance.now();
        const totalTime = wasmEndTime - startTime;

        console.log("✅ WASM 인식 결과:", result);
        console.log(
          `⏱️ WASM 성능: ${(wasmEndTime - wasmStartTime).toFixed(2)}ms`
        );

        this.performanceData.push({
          totalTime,
          wasmTime: wasmEndTime - wasmStartTime,
          method: "wasm",
          iterations: 1,
        });

        // WASM이 "감지되지 않음"을 반환한 경우에도 WASM 결과를 사용
        // (규칙 기반으로 폴백하지 않음)
        return {
          gesture: result.gesture,
          confidence: result.confidence,
          id: result.id,
        };
      } catch (error) {
        console.error("❌ WASM 인식 오류:", error);
        // WASM 실패 시에만 규칙 기반으로 폴백
        const jsStartTime = performance.now();
        const ruleBasedResult = this.recognizeByRules(landmarks);
        const jsEndTime = performance.now();
        const totalTime = jsEndTime - startTime;

        if (ruleBasedResult) {
          console.log("⚠️ 규칙 기반 인식으로 폴백:", ruleBasedResult);
          console.log(
            `⏱️ JavaScript 성능: ${(jsEndTime - jsStartTime).toFixed(2)}ms`
          );

          this.performanceData.push({
            totalTime,
            jsTime: jsEndTime - jsStartTime,
            method: "javascript",
            iterations: 1,
          });

          return ruleBasedResult;
        }
      }
    } else {
      console.warn(
        "⚠️ WASM이 로드되지 않았습니다. isModelLoaded:",
        this.isModelLoaded,
        "wasmRecognizer:",
        !!this.wasmRecognizer
      );
    }

    // WASM이 로드되지 않았거나 실패한 경우 규칙 기반 인식
    console.log("⚠️ 규칙 기반 인식 사용");
    const jsStartTime = performance.now();
    const ruleBasedResult = this.recognizeByRules(landmarks);
    const jsEndTime = performance.now();
    const totalTime = jsEndTime - startTime;

    if (ruleBasedResult) {
      console.log(
        `⏱️ JavaScript 성능: ${(jsEndTime - jsStartTime).toFixed(2)}ms`
      );

      this.performanceData.push({
        totalTime,
        jsTime: jsEndTime - jsStartTime,
        method: "javascript",
        iterations: 1,
      });

      return ruleBasedResult;
    }

    return {
      gesture: "감지되지 않음",
      confidence: 0.0,
      id: 0,
    };
  }

  /**
   * 성능 벤치마킹 (WASM vs JavaScript 비교)
   */
  async performBenchmark(
    landmarks: HandLandmark[],
    iterations: number = 100
  ): Promise<{
    wasm: {
      avgTime: number;
      minTime: number;
      maxTime: number;
      totalIterations: number;
    };
    javascript: {
      avgTime: number;
      minTime: number;
      maxTime: number;
      totalIterations: number;
    };
    speedup: number;
  }> {
    console.log(`🏁 성능 벤치마킹 시작 (${iterations}회 반복)`);

    const wasmTimes: number[] = [];
    const jsTimes: number[] = [];

    // WASM 성능 측정
    if (this.isModelLoaded && this.wasmRecognizer) {
      console.log("🔄 WASM 성능 측정 중...");
      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        await this.wasmRecognizer.recognizeFast(landmarks);
        const endTime = performance.now();
        wasmTimes.push(endTime - startTime);
      }
    }

    // JavaScript 성능 측정 (WASM과 동일한 알고리즘 사용)
    console.log("🔄 JavaScript 성능 측정 중...");
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      this.recognizeWithComplexJS(landmarks);
      const endTime = performance.now();
      jsTimes.push(endTime - startTime);
    }

    const wasmStats = {
      avgTime:
        wasmTimes.length > 0
          ? wasmTimes.reduce((a, b) => a + b, 0) / wasmTimes.length
          : 0,
      minTime: wasmTimes.length > 0 ? Math.min(...wasmTimes) : 0,
      maxTime: wasmTimes.length > 0 ? Math.max(...wasmTimes) : 0,
      totalIterations: wasmTimes.length,
    };

    const jsStats = {
      avgTime: jsTimes.reduce((a, b) => a + b, 0) / jsTimes.length,
      minTime: Math.min(...jsTimes),
      maxTime: Math.max(...jsTimes),
      totalIterations: jsTimes.length,
    };

    const speedup =
      wasmStats.avgTime > 0 ? jsStats.avgTime / wasmStats.avgTime : 0;

    console.log("📊 벤치마킹 결과:");
    console.log(
      `WASM: 평균 ${wasmStats.avgTime.toFixed(
        2
      )}ms (최소: ${wasmStats.minTime.toFixed(
        2
      )}ms, 최대: ${wasmStats.maxTime.toFixed(2)}ms)`
    );
    console.log(
      `JavaScript: 평균 ${jsStats.avgTime.toFixed(
        2
      )}ms (최소: ${jsStats.minTime.toFixed(
        2
      )}ms, 최대: ${jsStats.maxTime.toFixed(2)}ms)`
    );
    console.log(
      `🚀 성능 향상: ${speedup.toFixed(2)}x ${speedup > 1 ? "빠름" : "느림"}`
    );

    return { wasm: wasmStats, javascript: jsStats, speedup };
  }

  /**
   * 성능 데이터 가져오기
   */
  getPerformanceData(): PerformanceMetrics[] {
    return [...this.performanceData];
  }

  /**
   * 성능 데이터 초기화
   */
  clearPerformanceData(): void {
    this.performanceData = [];
  }

  /**
   * 평균 성능 통계
   */
  getPerformanceStats(): {
    wasm: { count: number; avgTime: number };
    javascript: { count: number; avgTime: number };
    speedup: number;
  } {
    const wasmData = this.performanceData.filter((d) => d.method === "wasm");
    const jsData = this.performanceData.filter(
      (d) => d.method === "javascript"
    );

    const wasmAvg =
      wasmData.length > 0
        ? wasmData.reduce((sum, d) => sum + (d.wasmTime || 0), 0) /
          wasmData.length
        : 0;

    const jsAvg =
      jsData.length > 0
        ? jsData.reduce((sum, d) => sum + (d.jsTime || 0), 0) / jsData.length
        : 0;

    const speedup = wasmAvg > 0 ? jsAvg / wasmAvg : 0;

    return {
      wasm: { count: wasmData.length, avgTime: wasmAvg },
      javascript: { count: jsData.length, avgTime: jsAvg },
      speedup,
    };
  }

  dispose(): void {
    if (this.wasmRecognizer) {
      this.wasmRecognizer.dispose();
      this.wasmRecognizer = null;
    }
    this.isModelLoaded = false;
  }
}
