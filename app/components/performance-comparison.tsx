"use client";

import { useState } from "react";
import styles from "./performance-comparison.module.css";

interface PerformanceData {
  wasm: { count: number; avgTime: number };
  javascript: { count: number; avgTime: number };
  speedup: number;
}

interface BenchmarkResult {
  wasm: { avgTime: number; minTime: number; maxTime: number; totalIterations: number };
  javascript: { avgTime: number; minTime: number; maxTime: number; totalIterations: number };
  speedup: number;
}

interface Props {
  onBenchmarkStart: () => Promise<BenchmarkResult>;
  realTimeData: PerformanceData;
}

export default function PerformanceComparison({ onBenchmarkStart, realTimeData }: Props) {
  const [benchmarkResult, setBenchmarkResult] = useState<BenchmarkResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runBenchmark = async () => {
    setIsRunning(true);
    try {
      const result = await onBenchmarkStart();
      setBenchmarkResult(result);
    } catch (error) {
      console.error("벤치마킹 오류:", error);
    } finally {
      setIsRunning(false);
    }
  };

  const getSpeedupColor = (speedup: number) => {
    if (speedup > 2) return "#4CAF50"; // 녹색 - 매우 빠름
    if (speedup > 1.5) return "#8BC34A"; // 연녹색 - 빠름
    if (speedup > 1) return "#FFC107"; // 노란색 - 약간 빠름
    if (speedup > 0.8) return "#FF9800"; // 주황색 - 약간 느림
    return "#F44336"; // 빨간색 - 느림
  };

  const getPerformanceDescription = (speedup: number) => {
    if (speedup > 2) return "WASM이 매우 빠름";
    if (speedup > 1.5) return "WASM이 빠름";
    if (speedup > 1) return "WASM이 약간 빠름";
    if (speedup > 0.8) return "거의 동일한 성능";
    return "JavaScript가 더 빠름";
  };

  return (
    <div className={styles.container}>
      <h2>성능 비교 대시보드</h2>
      
      {/* 실시간 성능 데이터 */}
      <div className={styles.realTimeSection}>
        <h3>실시간 성능 데이터</h3>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <h4>WASM</h4>
            <p className={styles.statValue}>
              {realTimeData.wasm.avgTime.toFixed(2)}ms
            </p>
            <p className={styles.statLabel}>평균 시간 ({realTimeData.wasm.count}회)</p>
          </div>
          
          <div className={styles.statCard}>
            <h4>JavaScript</h4>
            <p className={styles.statValue}>
              {realTimeData.javascript.avgTime.toFixed(2)}ms
            </p>
            <p className={styles.statLabel}>평균 시간 ({realTimeData.javascript.count}회)</p>
          </div>
          
          <div className={styles.statCard}>
            <h4>성능 향상</h4>
            <p 
              className={styles.statValue}
              style={{ color: getSpeedupColor(realTimeData.speedup) }}
            >
              {realTimeData.speedup.toFixed(2)}x
            </p>
            <p className={styles.statLabel}>
              {getPerformanceDescription(realTimeData.speedup)}
            </p>
          </div>
        </div>
      </div>

      {/* 벤치마크 섹션 */}
      <div className={styles.benchmarkSection}>
        <h3>상세 벤치마크</h3>
        <button 
          onClick={runBenchmark} 
          disabled={isRunning}
          className={styles.benchmarkButton}
        >
          {isRunning ? "벤치마킹 실행 중..." : "100회 벤치마크 실행"}
        </button>
        
        {benchmarkResult && (
          <div className={styles.benchmarkResults}>
            <h4>벤치마크 결과</h4>
            <div className={styles.resultsGrid}>
              <div className={styles.resultSection}>
                <h5>WASM 성능</h5>
                <p>평균: {benchmarkResult.wasm.avgTime.toFixed(2)}ms</p>
                <p>최소: {benchmarkResult.wasm.minTime.toFixed(2)}ms</p>
                <p>최대: {benchmarkResult.wasm.maxTime.toFixed(2)}ms</p>
                <p>반복횟수: {benchmarkResult.wasm.totalIterations}</p>
              </div>
              
              <div className={styles.resultSection}>
                <h5>JavaScript 성능</h5>
                <p>평균: {benchmarkResult.javascript.avgTime.toFixed(2)}ms</p>
                <p>최소: {benchmarkResult.javascript.minTime.toFixed(2)}ms</p>
                <p>최대: {benchmarkResult.javascript.maxTime.toFixed(2)}ms</p>
                <p>반복횟수: {benchmarkResult.javascript.totalIterations}</p>
              </div>
              
              <div className={styles.resultSection}>
                <h5>비교 결과</h5>
                <p style={{ color: getSpeedupColor(benchmarkResult.speedup), fontSize: '1.2em', fontWeight: 'bold' }}>
                  {benchmarkResult.speedup.toFixed(2)}x {benchmarkResult.speedup > 1 ? '빠름' : '느림'}
                </p>
                <p>{getPerformanceDescription(benchmarkResult.speedup)}</p>
                
                {benchmarkResult.speedup > 1 && (
                  <div className={styles.advantage}>
                    <p>✅ WASM의 장점이 확인됨!</p>
                    <p>CPU 집약적 작업에서 {((benchmarkResult.speedup - 1) * 100).toFixed(0)}% 성능 향상</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 성능 최적화 팁 */}
      <div className={styles.tipsSection}>
        <h3>WASM vs JavaScript 성능 차이 요인</h3>
        <ul className={styles.tipsList}>
          <li><strong>컴파일된 코드:</strong> WASM은 미리 컴파일되어 네이티브에 가까운 성능</li>
          <li><strong>메모리 관리:</strong> 직접적인 메모리 접근으로 가비지 컬렉션 오버헤드 없음</li>
          <li><strong>수치 연산:</strong> 부동소수점과 정수 연산에서 특히 우수</li>
          <li><strong>벡터 연산:</strong> SIMD 명령어 활용 가능</li>
          <li><strong>예측 가능한 성능:</strong> JIT 컴파일러의 변동성 없음</li>
        </ul>
      </div>
    </div>
  );
}