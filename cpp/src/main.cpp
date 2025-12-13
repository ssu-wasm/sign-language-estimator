#include "sign_recognition.h"  // 수화 인식기 헤더 파일 (HandLandmark, RecognitionResult, SignRecognizer 등 정의)
#include <emscripten/bind.h>    // Emscripten 바인딩 라이브러리 (JavaScript와 C++ 연결)

// C 스타일 함수들 (기존 코드와의 호환성을 위해)
extern "C" {  // C 링킹 규칙 적용 (C++ 네임 맹글링 방지)
    // 간단한 테스트 함수
    const char* test_function() {  // 모듈 버전 정보를 반환하는 테스트 함수
        return "Sign Recognition WASM Module v1.0.0";  // 버전 문자열 반환
    }
}

// WASM 바인딩을 위한 래퍼 함수
/**
 * SignRecognizerWrapper 클래스
 * - 목적: JavaScript에서 SignRecognizer를 쉽게 사용하기 위한 래퍼 클래스
 * - 역할: Emscripten 바인딩을 위해 간단한 인터페이스 제공
 * - 사용: JavaScript에서 new SignRecognizer()로 인스턴스 생성 가능
 */
class SignRecognizerWrapper {  // JavaScript에서 사용하기 쉬운 래퍼 클래스
public:
    /**
     * SignRecognizer 인스턴스
     * - 정의: sign_recognition.h의 SignRecognizer 클래스
     * - 역할: 실제 수화 인식 로직을 담당하는 핵심 클래스
     * - 기능: 규칙 기반 제스처 인식, 고급 ML 인식, 특징 추출 등
     */
    SignRecognizer recognizer;  // 실제 인식기 인스턴스 (sign_recognition.h에서 정의)
    
    SignRecognizerWrapper() {}  // 기본 생성자 (빈 구현)
    
    bool initialize() {  // 인식기 초기화 함수
        return recognizer.initialize();  // 내부 인식기의 initialize 호출
    }
    
    /**
     * RecognitionResult 반환형
     * - 구조: { gesture: string, confidence: float, id: int }
     * - gesture: 인식된 제스처 이름 (예: "안녕하세요", "감사합니다", "예", "V")
     * - confidence: 신뢰도 (0.0 ~ 1.0)
     * - id: 제스처 ID (0: 감지되지 않음, 1: 안녕하세요, 2: 감사합니다, 3: 예, 4: V)
     */
    /**
     * std::vector<HandLandmark> 파라미터
     * - HandLandmark: 손 랜드마크 구조체 { x: float, y: float, z: float }
     * - MediaPipe Hands에서 추출한 21개 손 랜드마크 (손목, 손가락 관절 등)
     * - x, y: 정규화된 화면 좌표 (0.0 ~ 1.0)
     * - z: 깊이 정보 (상대적 거리)
     */
    RecognitionResult recognize(const std::vector<HandLandmark>& landmarks) {  // 랜드마크 벡터로 제스처 인식
        return recognizer.recognize(landmarks);  // 내부 인식기의 recognize 호출
    }
    
    /**
     * recognizeFromPointer 함수
     * - 목적: WASM 직접 메모리 접근으로 성능 최적화
     * - landmarksPtr: JavaScript에서 _malloc()으로 할당한 메모리 포인터 (uintptr_t)
     * - count: 랜드마크 개수 (보통 42 = 21개 랜드마크 * 2좌표(x,y))
     * - 반환: JSON 문자열 (RecognitionResult를 직렬화)
     * - 장점: 데이터 복사 없이 직접 메모리 접근으로 빠른 처리
     */
    std::string recognizeFromPointer(uintptr_t landmarksPtr, int count) {  // 메모리 포인터로 인식 (WASM 직접 메모리 접근용)
        float* landmarks = reinterpret_cast<float*>(landmarksPtr);  // 포인터를 float 배열로 변환
        return recognizer.recognizeFromPointer(landmarks, count);  // 내부 인식기의 recognizeFromPointer 호출
    }
    
    void setDetectionThreshold(float threshold) {  // 감지 임계값 설정 (손이 감지되었는지 판단하는 기준값)
        recognizer.setDetectionThreshold(threshold);  // 내부 인식기에 임계값 전달
    }
    
    void setRecognitionThreshold(float threshold) {  // 인식 임계값 설정 (제스처 인식 신뢰도 기준값)
        recognizer.setRecognitionThreshold(threshold);  // 내부 인식기에 임계값 전달
    }
    
    std::string getVersion() {  // 버전 정보 반환 (예: "Sign Recognition WASM Module v1.0.0")
        return recognizer.getVersion();  // 내부 인식기의 버전 정보 반환
    }
};

// Embind 바인딩
EMSCRIPTEN_BINDINGS(sign_wasm_module) {  // Emscripten 바인딩 블록 시작 (모듈명: sign_wasm_module)
    using namespace emscripten;  // emscripten 네임스페이스 사용 (class_, function 등 사용)
    
    // C 스타일 함수 바인딩
    function("test_function", &test_function, allow_raw_pointers());  // test_function을 JavaScript에서 호출 가능하게 등록
    
    // HandLandmark 구조체 바인딩
    /**
     * HandLandmark 구조체
     * - 정의: sign_recognition.h의 struct HandLandmark
     * - 용도: MediaPipe Hands에서 추출한 손 랜드마크 좌표 저장
     * - 구조: { x: float, y: float, z: float }
     *   - x: 정규화된 X 좌표 (0.0 ~ 1.0, 왼쪽에서 오른쪽)
     *   - y: 정규화된 Y 좌표 (0.0 ~ 1.0, 위에서 아래)
     *   - z: 깊이 정보 (상대적 거리, 음수 가능)
     * - 예시: 손목(0), 엄지(1-4), 검지(5-8), 중지(9-12), 약지(13-16), 소지(17-20)
     */
    class_<HandLandmark>("HandLandmark")  // HandLandmark 구조체를 JavaScript 클래스로 등록
        .constructor<>()  // 기본 생성자 등록 (new HandLandmark() 가능)
        .property("x", &HandLandmark::x)  // x 속성을 JavaScript에서 접근 가능하게 등록
        .property("y", &HandLandmark::y)  // y 속성을 JavaScript에서 접근 가능하게 등록
        .property("z", &HandLandmark::z);  // z 속성을 JavaScript에서 접근 가능하게 등록
    
    // RecognitionResult 구조체 바인딩
    /**
     * RecognitionResult 구조체
     * - 정의: sign_recognition.h의 struct RecognitionResult
     * - 용도: 제스처 인식 결과를 담는 구조체
     * - 구조: { gesture: string, confidence: float, id: int }
     *   - gesture: 인식된 제스처 이름 문자열 (예: "안녕하세요", "감사합니다", "예", "V", "감지되지 않음")
     *   - confidence: 신뢰도 값 (0.0 ~ 1.0, 1.0에 가까울수록 확실함)
     *   - id: 제스처 ID (0: 감지되지 않음, 1: 안녕하세요, 2: 감사합니다, 3: 예, 4: V)
     */
    class_<RecognitionResult>("RecognitionResult")  // RecognitionResult 구조체를 JavaScript 클래스로 등록
        .constructor<>()  // 기본 생성자 등록 (new RecognitionResult() 가능)
        .property("gesture", &RecognitionResult::gesture)  // gesture 속성 등록 (제스처 이름)
        .property("confidence", &RecognitionResult::confidence)  // confidence 속성 등록 (신뢰도)
        .property("id", &RecognitionResult::id);  // id 속성 등록 (제스처 ID)
    
    // SignRecognizer 래퍼 클래스 바인딩
    /**
     * SignRecognizerWrapper 바인딩
     * - JavaScript 이름: "SignRecognizer" (래퍼 클래스를 SignRecognizer로 노출)
     * - 용도: JavaScript에서 new SignRecognizer()로 인스턴스 생성 후 제스처 인식 수행
     * - 주요 메서드:
     *   - initialize(): 인식기 초기화 (가중치 로드, 임계값 설정 등)
     *   - recognize(): HandLandmark 배열로 제스처 인식
     *   - recognizeFromPointer(): 메모리 포인터로 직접 인식 (성능 최적화)
     *   - setDetectionThreshold(): 손 감지 임계값 설정
     *   - setRecognitionThreshold(): 제스처 인식 임계값 설정
     *   - getVersion(): 모듈 버전 정보 반환
     */
    class_<SignRecognizerWrapper>("SignRecognizer")  // SignRecognizerWrapper를 JavaScript에서 SignRecognizer로 사용
        .constructor<>()  // 기본 생성자 등록 (new SignRecognizer() 가능)
        .function("initialize", &SignRecognizerWrapper::initialize)  // initialize 메서드 등록
        .function("recognize", &SignRecognizerWrapper::recognize)  // recognize 메서드 등록
        .function("recognizeFromPointer", &SignRecognizerWrapper::recognizeFromPointer)  // recognizeFromPointer 메서드 등록 (직접 메모리 접근)
        .function("setDetectionThreshold", &SignRecognizerWrapper::setDetectionThreshold)  // setDetectionThreshold 메서드 등록
        .function("setRecognitionThreshold", &SignRecognizerWrapper::setRecognitionThreshold)  // setRecognitionThreshold 메서드 등록
        .function("getVersion", &SignRecognizerWrapper::getVersion);  // getVersion 메서드 등록
    
    // std::vector<HandLandmark> 바인딩
    /**
     * VectorHandLandmark 타입 등록
     * - 용도: std::vector<HandLandmark>를 JavaScript 배열로 자동 변환
     * - 예시: C++의 vector<HandLandmark> → JavaScript의 HandLandmark[] 배열
     * - 사용: recognize() 메서드에서 HandLandmark 배열을 받을 때 사용
     */
    register_vector<HandLandmark>("VectorHandLandmark");  // std::vector<HandLandmark>를 JavaScript 배열로 변환 가능하게 등록

    // std::vector<float>를 JS 배열과 호환되게 등록
    /**
     * VectorFloat 타입 등록
     * - 용도: std::vector<float>를 JavaScript 배열로 자동 변환
     * - 예시: C++의 vector<float> → JavaScript의 number[] 배열
     * - 사용: MLP 인식기(SignRecognition)의 setScaler(), predictMLP()에서 사용
     *   - setScaler(): 정규화를 위한 평균(mean)과 스케일(scale) 벡터 전달
     *   - predictMLP(): 126차원 특징 벡터 전달 (왼손 63 + 오른손 63)
     */
    register_vector<float>("VectorFloat");  // std::vector<float>를 JavaScript 배열로 변환 가능하게 등록 (MLP 입력용)

    /**
     * SignRecognition 클래스 바인딩
     * - 정의: sign_recognition.h의 class SignRecognition
     * - 용도: MLP(Multi-Layer Perceptron) 기반 딥러닝 수화 인식기
     * - 구조: 126차원 입력 → 128 → 64 → 4 클래스 출력
     * - 입력: 정규화된 손 랜드마크 특징 벡터 (왼손 63차원 + 오른손 63차원)
     * - 출력: 제스처 클래스 ID (0~3)
     * - 주요 메서드:
     *   - setScaler(): 정규화 스케일러 설정 (mean, scale 벡터)
     *   - predictMLP(): MLP 모델로 제스처 예측
     */
    class_<SignRecognition>("SignRecognition")  // SignRecognition 클래스를 JavaScript에서 사용 가능하게 등록 (MLP 인식기)
        .constructor<>()  // 기본 생성자 등록 (new SignRecognition() 가능)

        // MLP 함수 바인딩
        .function("setScaler", &SignRecognition::setScaler)  // setScaler 메서드 등록 (정규화 스케일러 설정)
        .function("predictMLP", &SignRecognition::predictMLP)  // predictMLP 메서드 등록 (MLP 모델 예측)
        ;  // 바인딩 블록 종료
}

