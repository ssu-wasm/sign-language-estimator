#!/bin/bash

# C++ WASM 빌드 스크립트

set -e

# Emscripten 환경 변수 확인
if ! command -v emcc &> /dev/null; then
    echo "❌ Emscripten이 설치되지 않았거나 PATH에 없습니다."
    echo ""
    echo "설치 방법:"
    echo "  git clone https://github.com/emscripten-core/emsdk.git ~/emsdk"
    echo "  cd ~/emsdk"
    echo "  ./emsdk install latest"
    echo "  ./emsdk activate latest"
    echo "  source ./emsdk_env.sh"
    echo ""
    echo "또는 ~/.zshrc에 다음을 추가하세요:"
    echo "  source ~/emsdk/emsdk_env.sh"
    exit 1
fi

echo "✅ Emscripten 발견: $(emcc --version | head -n 1)"
echo ""

# 빌드 실행
echo "🔨 C++ WASM 최적화 빌드 시작..."
echo "📊 컴파일 최적화 옵션:"
echo "   - Link Time Optimization (LTO)"
echo "   - SIMD 최적화 (SSE4.1, AVX, AVX2)"  
echo "   - Fast Math 최적화"
echo "   - 메모리 최적화"
echo "   - 코드 크기 최적화"
echo ""

make build

echo ""
echo "✅ 최적화 빌드 완료!"
echo "📦 출력 파일:"
echo "   - build/sign_wasm.js"
echo "   - build/sign_wasm.wasm"

# 빌드 결과 파일 크기 표시
if [ -f "build/sign_wasm.wasm" ]; then
    WASM_SIZE=$(du -h build/sign_wasm.wasm | cut -f1)
    JS_SIZE=$(du -h build/sign_wasm.js | cut -f1)
    echo "📊 파일 크기:"
    echo "   - WASM: $WASM_SIZE"
    echo "   - JS: $JS_SIZE"
fi

echo ""
echo "🚀 성능 최적화 특징:"
echo "   ✓ 4층 신경망 시뮬레이션 (210→128→64→32→5)"
echo "   ✓ SIMD 벡터 연산 최적화"
echo "   ✓ 캐시 친화적 행렬 곱셈"
echo "   ✓ 메모리 풀링 최적화"
echo "   ✓ 210개 복잡 특징 추출"
echo "   ✓ 고급 수학 연산 (거리, 각도, 곡률)"
echo ""

