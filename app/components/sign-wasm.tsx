let isReady = false;

// import init, { process_frame } from "sign-wasm";

export async function initWasm() {
  if (isReady) return;
  // TODO: 실제 WASM 초기화 코드
  // await init();
  isReady = true;
}

export function processFrame(
  pixels: Uint8Array,
  width: number,
  height: number
) {
  if (!isReady) {
    throw new Error("WASM not initialized");
  }

  // TODO: 실제로는 여기서 wasm 메모리에 복사하고,
  //       export된 함수 호출해서 결과를 받아오면 됨.
  console.log("processFrame called", {
    width,
    height,
    byteLength: pixels.byteLength,
  });

  // 예: 인식 결과를 문자열로 리턴하는 경우라고 가정
  const dummyResult = "NONE";
  return dummyResult;
}
