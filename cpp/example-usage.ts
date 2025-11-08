/**
 * C++ WASM 모듈 사용 예제
 *
 * 이 파일은 Next.js에서 C++ WASM 모듈을 사용하는 방법을 보여줍니다.
 * 실제 프로젝트에서는 app/ 디렉토리의 컴포넌트에서 사용하세요.
 */

// 방법 1: 직접 import (동적 import 권장)
export async function loadAgeEstimator() {
  // 동적 import로 모듈 로드
  const createAgeEstimatorModule = (await import("./build/age_estimator.js"))
    .default;

  // 모듈 초기화
  const Module = await createAgeEstimatorModule();

  return Module;
}

// 방법 2: 간단한 래퍼 함수
export async function estimateAge(features: number[]): Promise<number> {
  const Module = await loadAgeEstimator();

  // Embind 클래스 사용 (더 편리함)
  const estimator = new Module.AgeEstimator();
  return estimator.estimate(features);
}

// 방법 3: C 함수 직접 사용 (더 세밀한 제어)
export async function estimateAgeWithCFunction(
  features: Float32Array
): Promise<number> {
  const Module = await loadAgeEstimator();

  // 메모리 할당
  const featuresPtr = Module._malloc(features.length * 4); // float = 4 bytes

  try {
    // 메모리에 데이터 복사
    Module.HEAPF32.set(features, featuresPtr / 4);

    // C 함수 호출
    const age = Module._estimate_age(featuresPtr, features.length);

    return age;
  } finally {
    // 메모리 해제
    Module._free(featuresPtr);
  }
}

// React 컴포넌트에서 사용 예제
/*
'use client';

import { useEffect, useState } from 'react';
import { estimateAge } from '../cpp/example-usage';

export default function AgeEstimationComponent() {
  const [age, setAge] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        // 예시: 얼굴 특징값 (실제로는 MediaPipe나 OpenCV에서 추출)
        const features = [0.1, 0.2, 0.3, 0.4, 0.5];
        const estimatedAge = await estimateAge(features);
        setAge(estimatedAge);
      } catch (error) {
        console.error('WASM 모듈 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    }
    
    init();
  }, []);

  if (loading) return <div>WASM 모듈 로딩 중...</div>;
  if (age === null) return <div>나이 추정 실패</div>;
  
  return <div>추정 나이: {age}세</div>;
}
*/
