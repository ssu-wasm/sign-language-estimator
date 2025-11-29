# Emscripten을 사용한 WASM 빌드 Makefile

# Emscripten 컴파일러
CC = emcc
CXX = em++

# 빌드 디렉토리
BUILD_DIR = build
SRC_DIR = src

# 소스 파일
SOURCES = $(SRC_DIR)/main.cpp $(SRC_DIR)/sign_recognition.cpp
OUTPUT = $(BUILD_DIR)/sign_wasm

# 컴파일러 플래그 (최적화 강화)
CXXFLAGS = -std=c++17 -O3 -flto -Wall \
           -msse4.1 -mavx -mavx2 \
           -ffast-math -funroll-loops \
           -fno-exceptions -fno-rtti \
           -DNDEBUG

# WASM 링커 플래그 (성능 최적화)
LDFLAGS = -s WASM=1 \
          -s MODULARIZE=1 \
          -s EXPORT_NAME="CreateSignWasmModule" \
          -s ALLOW_MEMORY_GROWTH=1 \
          -s INITIAL_MEMORY=33554432 \
          -s MAXIMUM_MEMORY=67108864 \
          -s EXPORTED_FUNCTIONS="['_malloc', '_free', '_test_function']" \
          -s EXPORTED_RUNTIME_METHODS="['ccall', 'cwrap', 'HEAPU8', 'HEAP8', 'HEAPF32', 'HEAPF64', 'HEAP32', 'HEAP16']" \
          --bind \
          -s ASSERTIONS=0 \
          -s ERROR_ON_UNDEFINED_SYMBOLS=0 \
          -s DISABLE_EXCEPTION_CATCHING=1 \
          -s AGGRESSIVE_VARIABLE_ELIMINATION=1 \
          -s ELIMINATE_DUPLICATE_FUNCTIONS=1 \
          -s SINGLE_FILE=0 \
          --closure=1 \
          -s WASM_BIGINT=1

# 개발 모드 플래그 (디버깅용)
DEBUG_FLAGS = -g -s ASSERTIONS=1 -s SAFE_HEAP=1

.PHONY: all clean build debug

all: build

build: $(BUILD_DIR)/sign_wasm.js

$(BUILD_DIR)/sign_wasm.js: $(SOURCES) | $(BUILD_DIR)
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

