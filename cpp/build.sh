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
echo "🔨 C++ WASM 빌드 시작..."
make build

echo ""
echo "✅ 빌드 완료!"
echo "📦 출력 파일:"
echo "   - build/age_estimator.js"
echo "   - build/age_estimator.wasm"

