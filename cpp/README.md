# C++ WebAssembly 빌드 가이드

이 디렉토리는 C++로 작성된 얼굴 나이 추정 로직을 WebAssembly로 컴파일합니다.

## 사전 요구사항

### 1. Emscripten 설치

```bash
# Emscripten SDK 클론
git clone https://github.com/emscripten-core/emsdk.git ~/emsdk
cd ~/emsdk

# 최신 버전 설치 및 활성화
./emsdk install latest
./emsdk activate latest

# 환경 변수 로드 (현재 세션)
source ./emsdk_env.sh
```

**영구 설정 (선택사항):**
`~/.zshrc` 또는 `~/.bashrc`에 추가:

```bash
source ~/emsdk/emsdk_env.sh
```

### 2. Emscripten 설치 확인

```bash
emcc --version
em++ --version
```

## 빌드 방법

### 기본 빌드 (프로덕션)

```bash
cd cpp
make build
```

### 디버그 빌드

```bash
cd cpp
make debug
```

### 빌드 출력

빌드가 완료되면 `build/` 디렉토리에 다음 파일들이 생성됩니다:

- `age_estimator.js` - JavaScript 래퍼 코드
- `age_estimator.wasm` - WebAssembly 바이너리

## 사용 방법

### JavaScript/TypeScript에서 사용

```javascript
// Emscripten 모듈 로드
import createAgeEstimatorModule from "./build/age_estimator.js";

// 모듈 초기화
const Module = await createAgeEstimatorModule();

// C 함수 호출
Module._greet();

// 나이 추정 함수 호출
const features = new Float32Array([0.1, 0.2, 0.3, 0.4]);
const featuresPtr = Module._malloc(features.length * 4); // float = 4 bytes
Module.HEAPF32.set(features, featuresPtr / 4);
const age = Module._estimate_age(featuresPtr, features.length);
Module._free(featuresPtr);

// Embind 클래스 사용 (더 편리함)
const estimator = new Module.AgeEstimator();
const age2 = estimator.estimate([0.1, 0.2, 0.3, 0.4]);
```

## 빌드 옵션 설명

- `MODULARIZE=1`: 모듈화된 출력 생성
- `EXPORT_NAME`: 모듈 로더 함수 이름
- `EXPORTED_FUNCTIONS`: C 함수를 JavaScript에서 호출 가능하게
- `EXPORTED_RUNTIME_METHODS`: Emscripten 런타임 함수 노출
- `ALLOW_MEMORY_GROWTH=1`: 메모리 자동 증가 허용
- `--bind`: Embind 활성화 (C++ 클래스 바인딩)

## 정리

```bash
make clean
```
