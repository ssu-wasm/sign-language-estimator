// src/components/CameraToWasm.tsx
import { useEffect, useRef, useState } from "react";
import { initWasm, processFrame } from "./sign-wasm";

export function CameraToWasm() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const [lastResult, setLastResult] = useState<string>("");

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function setup() {
      await initWasm(); // WASM 모듈 초기화

      // 1) 카메라 스트림 가져오기
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user", // 전면 카메라 (모바일 기준)
        },
        audio: false,
      });

      const video = videoRef.current;
      if (video == null) return;

      video.srcObject = stream;
      await video.play();

      // 2) 루프 시작 (매 프레임 캡쳐)
      startLoop();
    }

    function startLoop() {
      const loop = () => {
        captureAndSend();
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    }

    function captureAndSend() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video == null || canvas == null) {
        return;
      }

      const width = video.videoWidth;
      const height = video.videoHeight;
      if (width == null || height == null) {
        return;
      }

      // 캔버스 크기를 비디오 크기에 맞추기
      if (canvas.width !== width) {
        canvas.width = width;
      }
      if (canvas.height !== height) {
        canvas.height = height;
      }

      const ctx = canvas.getContext("2d");
      if (ctx == null) {
        return;
      }

      // 3) 현재 프레임을 캔버스에 그림
      ctx.drawImage(video, 0, 0, width, height);

      // 4) 픽셀 데이터 꺼내기 (RGBA)
      const imageData = ctx.getImageData(0, 0, width, height);
      const clamped = imageData.data; // Uint8ClampedArray (length = w*h*4)

      // WebAssembly Memory에 복사하기 편하게 Uint8Array 뷰로 전환
      const pixels = new Uint8Array(clamped.buffer);

      // 5) WASM 함수 호출
      const result = processFrame(pixels, width, height);
      setLastResult(String(result));
    }

    setup().catch((err) => {
      console.error(err);
      alert("카메라 / WASM 초기화 중 오류가 발생했어 ㅠㅠ 콘솔을 확인해줘!");
    });

    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
      }
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{ width: 400, borderRadius: 8, border: "1px solid #ccc" }}
      />

      <canvas ref={canvasRef} style={{ display: "none" }} />

      <div>
        <strong>WASM 인식 결과:</strong> {lastResult || "(아직 없음)"}
      </div>
    </div>
  );
}
