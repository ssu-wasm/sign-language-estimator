#ifndef SIGN_RECOGNITION_H
#define SIGN_RECOGNITION_H

#include <emscripten/bind.h>
#include <vector>
#include <string>
#include <cmath>
#include <algorithm>
#include <iostream>

// 손 랜드마크 구조체
struct HandLandmark {
    float x;
    float y;
    float z;
};

// 인식 결과 구조체
struct RecognitionResult {
    std::string gesture;
    float confidence;
    int id;
};

// 제스처 인식기 클래스
class SignRecognizer {
public:
    SignRecognizer();
    ~SignRecognizer();
    
    // 초기화
    bool initialize();
    
    // 랜드마크로부터 제스처 인식
    RecognitionResult recognize(const std::vector<HandLandmark>& landmarks);
    
    // 랜드마크 배열 포인터로 인식 (WASM에서 사용)
    std::string recognizeFromPointer(float* landmarks, int count);
    
    // 대용량 배치 처리 (한 번에 여러 프레임)
    std::string recognizeBatch(float* landmarks, int frameCount, int landmarksPerFrame);
    
    // === WASM이 빛나는 영역들 ===
    // 1. 이미지 필터링 (가우시안 블러, 엣지 검출 등)
    void processImageData(uint8_t* imageData, int width, int height, int filterType);
    
    // 2. 대용량 행렬 연산 (1000x1000 이상)
    void matrixMultiplyLarge(float* matA, float* matB, float* result, int size);
    
    // 3. 복잡한 수학 연산 (FFT, 삼각함수 등)
    void computeFFT(float* realPart, float* imagPart, int size);
    
    // 4. 암호화/해시 연산
    void sha256Hash(uint8_t* input, int length, uint8_t* output);
    
    // 5. 게임 물리 시뮬레이션 (충돌 검사, 파티클 등)
    void simulateParticles(float* positions, float* velocities, int particleCount, float deltaTime);
    
    // 임계값 설정
    void setDetectionThreshold(float threshold);
    void setRecognitionThreshold(float threshold);
    
    // 버전 정보
    std::string getVersion() const;

private:
    // 손가락이 펴져있는지 확인
    bool isFingerExtended(const HandLandmark& tip, const HandLandmark& pip, const HandLandmark& mcp) const;
    
    // 엄지가 펴져있는지 확인
    bool isThumbExtended(const HandLandmark& thumbTip, const HandLandmark& thumbIp, const HandLandmark& wrist) const;
    
    // 규칙 기반 제스처 인식
    RecognitionResult recognizeByRules(const std::vector<HandLandmark>& landmarks);
    
    // 고급 ML 스타일 인식 (최적화된 C++ 버전)
    RecognitionResult recognizeWithAdvancedML(const std::vector<HandLandmark>& landmarks);
    
    
    // 특징 추출
    std::vector<float> extractComplexFeatures(const std::vector<HandLandmark>& landmarks);
    
    // 고급 행렬 특징 추출 (1260개 특징)
    std::vector<float> extractAdvancedMatrixFeatures(const std::vector<HandLandmark>& landmarks);
    
    // 가상 신경망 추론
    std::vector<float> neuralNetworkInference(const std::vector<float>& features);
    
    // 대용량 행렬 곱셈 신경망 추론 (1260→1024→512→256→128→5)
    std::vector<float> advancedMatrixNeuralNetwork(const std::vector<float>& features);
    
    // 행렬 연산
    void matrixMultiply(const std::vector<std::vector<float>>& A, 
                       const std::vector<float>& B, 
                       std::vector<float>& result);
    
    /**
     * 빠른 컨볼루션 연산
     * 
     * 컨볼루션 연산을 사용하는 이유:
     * 
     * 1. 이미지 필터링 (Image Filtering)
     *    - 가우시안 블러: 노이즈 제거, 부드러운 이미지 생성
     *    - 엣지 검출: Sobel, Canny 등으로 경계선 추출
     *    - 샤프닝: 이미지 선명도 향상
     *    - 예: processImageData()에서 사용 가능
     * 
     * 2. 시계열 데이터 처리 (Time Series Processing)
     *    - 손 움직임 시계열 데이터의 평활화(Smoothing)
     *    - 노이즈 제거로 인식 정확도 향상
     *    - 여러 프레임의 랜드마크를 평균화하여 안정적인 인식
     * 
     * 3. 특징 추출 (Feature Extraction)
     *    - 로컬 패턴 검출: 손가락 관절의 미세한 움직임 감지
     *    - 공간적 특징 추출: 랜드마크 간 관계 분석
     *    - 예: 손가락 끝의 움직임 패턴 분석
     * 
     * 4. 신호 처리 (Signal Processing)
     *    - 저역 통과 필터: 고주파 노이즈 제거
     *    - 고역 통과 필터: 빠른 움직임 강조
     *    - 밴드 패스 필터: 특정 주파수 대역 추출
     * 
     * 5. 미래 확장성 (Future Extensibility)
     *    - CNN(Convolutional Neural Network) 기반 인식 모델 지원
     *    - 비디오 기반 제스처 인식 (시공간 컨볼루션)
     *    - 다중 프레임 분석을 통한 동적 제스처 인식
     * 
     * 현재 상태: 정의되어 있으나 아직 직접 호출되지 않음
     * - 미래에 이미지 전처리나 시계열 분석에 활용 예정
     * - WASM 최적화된 구현으로 빠른 성능 제공
     */
    void fastConvolution(const std::vector<float>& input,  // 입력 신호/이미지 데이터
                        const std::vector<float>& kernel,  // 컨볼루션 커널 (필터 마스크)
                        std::vector<float>& output,  // 출력 결과
                        int inputSize, int kernelSize);  // 입력 크기, 커널 크기
    
    /**
     * SIMD 최적화된 벡터 연산
     * 
     * SIMD (Single Instruction Multiple Data)를 사용하는 이유:
     * 
     * 1. 병렬 처리로 성능 향상
     *    - 하나의 명령어로 여러 데이터를 동시에 처리
     *    - AVX2 명령어: 8개 float를 동시에 처리 (256비트 레지스터)
     *    - 일반 스칼라 연산 대비 약 4-8배 빠른 성능
     * 
     * 2. 신경망 추론 최적화
     *    - 행렬 곱셈, 벡터 내적 등에서 핵심 역할
     *    - 예: 210차원 특징 벡터와 가중치의 내적 계산
     *    - 각 레이어의 계산 속도 향상으로 전체 추론 시간 단축
     * 
     * 3. 메모리 대역폭 효율성
     *    - 벡터 로드/스토어로 메모리 접근 최적화
     *    - 캐시 효율성 향상 (연속된 메모리 접근)
     *    - CPU 파이프라인 활용 극대화
     * 
     * 4. WASM에서의 이점
     *    - WebAssembly는 네이티브 코드에 가까운 성능 제공
     *    - SIMD 명령어가 직접 컴파일되어 실행
     *    - JavaScript의 JIT 컴파일 오버헤드 없음
     * 
     * 5. 실제 성능 비교 예시
     *    - 벡터 내적 (210개 요소):
     *      * 스칼라: ~210 cycles (각 요소마다 곱셈+덧셈)
     *      * SIMD: ~30 cycles (8개씩 처리, 210/8 ≈ 27번 반복)
     *      * 약 7배 빠름
     * 
     * 6. 사용 예시
     *    - vectorDotProduct: 신경망 레이어의 행렬 곱셈
     *    - vectorAdd: 바이어스 추가, 활성화 함수 전처리
     *    - vectorMultiply: 정규화, 스케일링 연산
     * 
     * 기술적 세부사항:
     * - AVX2 (Advanced Vector Extensions 2): Intel/AMD x86-64 CPU 지원
     * - __m256: 256비트 벡터 레지스터 (8개 float)
     * - _mm256_mul_ps: 8개 float 곱셈을 한 번에 수행
     * - _mm256_add_ps: 8개 float 덧셈을 한 번에 수행
     */
    float vectorDotProduct(const float* a, const float* b, int size);  // 벡터 내적 (SIMD 최적화)
    void vectorAdd(const float* a, const float* b, float* result, int size);  // 벡터 덧셈 (SIMD 최적화)
    void vectorMultiply(const float* a, float scalar, float* result, int size);  // 벡터 스칼라 곱셈 (SIMD 최적화)
    
    // 랜드마크 정규화
    std::vector<float> normalizeLandmarks(const std::vector<HandLandmark>& landmarks);
    
    // 거리 계산
    float calculateDistance(const HandLandmark& a, const HandLandmark& b) const;
    
    // 각도 계산
    float calculateAngle(const HandLandmark& a, const HandLandmark& b, const HandLandmark& c) const;
    
    // 가중치 캐시 (사전 계산된 ML 가중치들)
    static std::vector<std::vector<float>> neuralWeights;
    static std::vector<float> neuralBiases;
    
    float detectionThreshold;
    float recognitionThreshold;
};

// Embind 바인딩은 main.cpp에서 처리

class SignRecognition {
public:
    SignRecognition();
    ~SignRecognition();

    // MLP 모델 예측 함수 (선언만)
    int predictMLP(const std::vector<float>& featureArr);

    // Scaler 설정 함수 (선언만)
    void setScaler(const std::vector<float>& meanArr, const std::vector<float>& scaleArr);

private:
    /**
     * constexpr를 사용한 이유:
     * 
     * 1. 컴파일 타임 상수 (Compile-time Constant)
     *    - 값이 컴파일 시점에 결정되어 런타임 오버헤드 없음
     *    - 배열 크기, 템플릿 인자 등에 사용 가능
     * 
     * 2. 성능 최적화
     *    - 컴파일러가 상수 전파(Constant Propagation) 최적화 가능
     *    - 루프 언롤링(Loop Unrolling) 등 최적화 기회 제공
     *    - 예: for (int i = 0; i < D_IN; ++i) → 컴파일러가 126으로 치환하여 최적화
     * 
     * 3. 타입 안정성
     *    - 컴파일 타임에 값 검증 가능
     *    - 잘못된 값 사용 시 컴파일 에러 발생
     * 
     * 4. 스택 배열 할당 가능
     *    - float x[D_IN] 같은 VLA(Variable Length Array) 대신 안전한 스택 배열 사용
     *    - C++ 표준 준수 (VLA는 C99 기능, C++에서는 constexpr 필요)
     * 
     * 5. static const와의 차이
     *    - static const: 런타임에 초기화될 수 있음 (ODR 사용 시)
     *    - static constexpr: 항상 컴파일 타임 상수, 링커 심볼 불필요
     * 
     * 6. 템플릿 메타프로그래밍 가능
     *    - 템플릿 인자로 사용 가능 (예: template<int N>)
     *    - 컴파일 타임 계산에 활용 가능
     */
    static constexpr int D_IN = 126;  // 입력 차원 (Input Dimension): 126차원 특징 벡터
    static constexpr int H1 = 128;  // 첫 번째 은닉층 크기 (Hidden Layer 1): 128 뉴런
    static constexpr int H2 = 64;  // 두 번째 은닉층 크기 (Hidden Layer 2): 64 뉴런
    static constexpr int NUM_CLASSES = 4;  // 출력 클래스 개수: 4개 제스처 클래스

    std::vector<float> mean;
    std::vector<float> scale;
};

#endif // SIGN_RECOGNITION_H
