# Emscripten을 사용한 WASM 빌드 Makefile

# Emscripten 컴파일러
CC = emcc
CXX = em++

# 빌드 디렉토리
BUILD_DIR = build
SRC_DIR = src

# 소스 파일
SOURCES = $(SRC_DIR)/main.cpp
OUTPUT = $(BUILD_DIR)/age_estimator

# 컴파일러 플래그
CXXFLAGS = -std=c++17 -O3 -Wall
LDFLAGS = -s WASM=1 \
          -s MODULARIZE=1 \
          -s EXPORT_NAME="createAgeEstimatorModule" \
          -s EXPORTED_FUNCTIONS="['_greet', '_estimate_age', '_malloc', '_free']" \
          -s EXPORTED_RUNTIME_METHODS="['ccall', 'cwrap', 'UTF8ToString', 'stringToUTF8']" \
          -s ALLOW_MEMORY_GROWTH=1 \
          -s INITIAL_MEMORY=16777216 \
          --bind \
          -s ASSERTIONS=0 \
          -s ERROR_ON_UNDEFINED_SYMBOLS=0

# 개발 모드 플래그 (디버깅용)
DEBUG_FLAGS = -g -s ASSERTIONS=1 -s SAFE_HEAP=1

.PHONY: all clean build debug

all: build

build: $(BUILD_DIR)
	$(CXX) $(CXXFLAGS) $(SOURCES) -o $(OUTPUT).js $(LDFLAGS)
	@echo "Build complete! Output: $(OUTPUT).js and $(OUTPUT).wasm"

debug: $(BUILD_DIR)
	$(CXX) $(CXXFLAGS) $(DEBUG_FLAGS) $(SOURCES) -o $(OUTPUT).js $(LDFLAGS)
	@echo "Debug build complete!"

$(BUILD_DIR):
	mkdir -p $(BUILD_DIR)

clean:
	rm -rf $(BUILD_DIR)
	@echo "Clean complete!"

