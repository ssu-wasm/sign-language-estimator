#ifndef SIGN_RECOGNITION_H
#define SIGN_RECOGNITION_H

#include <emscripten/bind.h>
#include <vector>
#include <string>

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
    
    // 랜드마크 정규화
    std::vector<float> normalizeLandmarks(const std::vector<HandLandmark>& landmarks);
    
    // 거리 계산
    float calculateDistance(const HandLandmark& a, const HandLandmark& b) const;
    
    // 각도 계산
    float calculateAngle(const HandLandmark& a, const HandLandmark& b, const HandLandmark& c) const;
    
    float detectionThreshold;
    float recognitionThreshold;
};

// Embind 바인딩은 main.cpp에서 처리

#endif // SIGN_RECOGNITION_H
