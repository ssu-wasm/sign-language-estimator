// src/components/DataCollector.js

// 데이터 추출용

// import React, { useEffect, useRef, useState } from "react";
// import { Hands } from "@mediapipe/hands";
// import { Camera } from "@mediapipe/camera_utils";
// import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
// import { HAND_CONNECTIONS } from "@mediapipe/hands";

// import {
//   landmarksToFeature,
//   passesGestureGate,
// } from "../lib/sign-language-estimator";

// const LABELS = [
//   { key: "hello", text: "안녕(두 손 주먹)" },
//   { key: "love", text: "사랑해" },
//   { key: "nice", text: "반가워" },
//   { key: "thanks", text: "고마워" },
// ];

// const TARGET_PER_LABEL = 100;
// const SAVE_INTERVAL_MS = 200;

// const DataCollector = () => {
//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);
//   const cameraRef = useRef(null);
//   const handsRef = useRef(null);

//   const [isReady, setIsReady] = useState(false);
//   const [currentLabel, setCurrentLabel] = useState("hello");
//   const [isCollecting, setIsCollecting] = useState(false);

//   const isCollectingRef = useRef(false);
//   const currentLabelRef = useRef("hello");
//   const [dataset, setDataset] = useState([]);

//   const lastSavedAtRef = useRef(0);

//   const counts = LABELS.reduce((acc, l) => {
//     acc[l.key] = dataset.filter(d => d.label === l.key).length;
//     return acc;
//   }, {});

//   useEffect(() => {
//     isCollectingRef.current = isCollecting;
//   }, [isCollecting]);

//   useEffect(() => {
//     currentLabelRef.current = currentLabel;
//   }, [currentLabel]);

//   useEffect(() => {
//     if (!videoRef.current) return;

//     const hands = new Hands({
//       locateFile: (file) =>
//         `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`,
//     });

//     hands.setOptions({
//       maxNumHands: 2,
//       modelComplexity: 1,
//       minDetectionConfidence: 0.6,
//       minTrackingConfidence: 0.6,
//     });

//     hands.onResults((results) => {
//       const canvas = canvasRef.current;
//       const video = videoRef.current;
//       if (!canvas || !video) return;

//       const ctx = canvas.getContext("2d");
//       canvas.width = video.videoWidth;
//       canvas.height = video.videoHeight;

//       ctx.save();
//       ctx.clearRect(0, 0, canvas.width, canvas.height);
//       ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

//       if (results.multiHandLandmarks?.length) {
//         for (const lm of results.multiHandLandmarks) {
//           drawConnectors(ctx, lm, HAND_CONNECTIONS);
//           drawLandmarks(ctx, lm);
//         }
//       }
//       ctx.restore();

//       const handsResult = {
//         landmarks: results.multiHandLandmarks || [],
//         handedness:
//           results.multiHandedness?.map(h => ({ label: h.label })) || [],
//       };

//       const feature = landmarksToFeature(handsResult);
//       if (!feature) return;

//       const labelToSave = currentLabelRef.current;
//       const shouldSave = passesGestureGate(labelToSave, feature);

//       if (isCollectingRef.current && shouldSave) {
//         const now = Date.now();
//         if (now - lastSavedAtRef.current >= SAVE_INTERVAL_MS) {
//           lastSavedAtRef.current = now;

//           setDataset(prev => {
//             const count = prev.filter(d => d.label === labelToSave).length;
//             if (count >= TARGET_PER_LABEL) return prev;

//             return [
//               ...prev,
//               {
//                 label: labelToSave,
//                 vector: feature.vector,
//                 ts: now,
//               },
//             ];
//           });
//         }
//       }
//     });

//     handsRef.current = hands;

//     const camera = new Camera(videoRef.current, {
//       onFrame: async () => {
//         if (!handsRef.current) return;
//         await handsRef.current.send({ image: videoRef.current });
//       },
//       width: 640,
//       height: 480,
//     });

//     camera.start();
//     cameraRef.current = camera;

//     const handleLoaded = () => setIsReady(true);
//     videoRef.current.addEventListener("loadeddata", handleLoaded);

//     return () => {
//       if (videoRef.current)
//         videoRef.current.removeEventListener("loadeddata", handleLoaded);

//       cameraRef.current?.stop();
//       handsRef.current?.close();
//     };
//   }, []);

//   const resetDataset = () => setDataset([]);

//   const downloadJSON = () => {
//     const blob = new Blob([JSON.stringify(dataset, null, 2)], {
//       type: "application/json",
//     });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = "sign_dataset.json";
//     a.click();
//     URL.revokeObjectURL(url);
//   };

//   const downloadCSV = () => {
//     if (!dataset.length) return;

//     const dim = dataset[0].vector.length;
//     const header = ["label", ...Array.from({ length: dim }, (_, i) => `f${i}`)];

//     const rows = dataset.map(d => [
//       d.label,
//       ...d.vector.map(v => Number.isFinite(v) ? v : 0),
//     ]);

//     const csv = [header, ...rows].map(r => r.join(",")).join("\n");

//     const blob = new Blob([csv], { type: "text/csv" });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = "sign_dataset.csv";
//     a.click();
//     URL.revokeObjectURL(url);
//   };

//   const allDone = LABELS.every(l => counts[l.key] >= TARGET_PER_LABEL);

//   return (
//     <div style={{ display: "grid", gap: 12, padding: 12 }}>
//       <h2>Data Collector (Hello Gesture Strict Mode)</h2>

//       <div style={{ position: "relative", width: 640, height: 480 }}>
//         <video
//           ref={videoRef}
//           style={{ position: "absolute", width: 640, height: 480, transform: "scaleX(-1)" }}
//           autoPlay
//           playsInline
//           muted
//         />
//         <canvas
//           ref={canvasRef}
//           style={{ position: "absolute", width: 640, height: 480, transform: "scaleX(-1)" }}
//         />
//       </div>

//       {!isReady && <p>Loading camera...</p>}

//       <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
//         {LABELS.map(l => {
//           const c = counts[l.key] ?? 0;
//           const done = c >= TARGET_PER_LABEL;
//           return (
//             <button
//               key={l.key}
//               onClick={() => setCurrentLabel(l.key)}
//               disabled={isCollecting}
//               style={{
//                 padding: "8px 10px",
//                 borderRadius: 8,
//                 border: currentLabel === l.key ? "2px solid #00c" : "1px solid #999",
//                 background: done ? "#d4ffd4" : "#fff",
//               }}
//             >
//               {l.text} ({c}/{TARGET_PER_LABEL})
//             </button>
//           );
//         })}
//       </div>

//       <div style={{ display: "flex", gap: 8 }}>
//         <button
//           onClick={() => setIsCollecting(true)}
//           disabled={isCollecting || allDone}
//           style={{ padding: "8px 12px" }}
//         >
//           Start Collecting
//         </button>

//         <button
//           onClick={() => setIsCollecting(false)}
//           disabled={!isCollecting}
//           style={{ padding: "8px 12px" }}
//         >
//           Stop
//         </button>

//         <button onClick={resetDataset} style={{ padding: "8px 12px" }}>
//           Reset Dataset
//         </button>
//       </div>

//       <div style={{ fontSize: 16 }}>
//         <b>Current Label:</b> {currentLabel} <br />
//         <b>Collecting:</b> {isCollecting ? "YES" : "NO"} <br />
//         <b>Total Samples:</b> {dataset.length}
//         {allDone && <div style={{ color: "green" }}>✅ All collected!</div>}
//       </div>

//       <div style={{ display: "flex", gap: 8 }}>
//         <button onClick={downloadCSV} disabled={!dataset.length}>
//           Download CSV
//         </button>
//         <button onClick={downloadJSON} disabled={!dataset.length}>
//           Download JSON
//         </button>
//       </div>
//     </div>
//   );
// };

// export default DataCollector;

// src/components/DataCollector.js

import React, { useEffect, useRef, useState } from "react";
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { HAND_CONNECTIONS } from "@mediapipe/hands";

import { landmarksToFeature } from "../lib/sign-language-estimator";
import { loadGestureClassifier } from "../lib/gestureClassifier";

const LABELS = [
  { key: "hello", text: "안녕(두 손 주먹)" },
  { key: "love", text: "사랑해" },
  { key: "nice", text: "반가워" },
  { key: "thanks", text: "고마워" },
];

const LABEL_DISPLAY = {
  hello: "안녕",
  love: "사랑해",
  nice: "반가워",
  thanks: "고마워",
};

const TARGET_PER_LABEL = 100;
const SAVE_INTERVAL_MS = 200;

const DataCollector = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraRef = useRef(null);
  const handsRef = useRef(null);

  const [isReady, setIsReady] = useState(false);
  const [currentLabel, setCurrentLabel] = useState("hello");
  const [isCollecting, setIsCollecting] = useState(false);

  const isCollectingRef = useRef(false);
  const currentLabelRef = useRef("hello");
  const classifierRef = useRef(null);
  const lastInferenceAtRef = useRef(0);
  const [dataset, setDataset] = useState([]);
  const [prediction, setPrediction] = useState({ label: "-", score: 0 });
  const [inferenceTimeMs, setInferenceTimeMs] = useState(0);
  const [caption, setCaption] = useState({ label: "-", visible: false });
  const [classifierStatus, setClassifierStatus] = useState("loading");

  const lastSavedAtRef = useRef(0);
  const captionTimeoutRef = useRef(null);

  const counts = LABELS.reduce((acc, l) => {
    acc[l.key] = dataset.filter((d) => d.label === l.key).length;
    return acc;
  }, {});

  useEffect(() => {
    isCollectingRef.current = isCollecting;
  }, [isCollecting]);

  useEffect(() => {
    currentLabelRef.current = currentLabel;
  }, [currentLabel]);

  useEffect(() => {
    let mounted = true;
    loadGestureClassifier()
      .then((module) => {
        if (!mounted) return;
        classifierRef.current = module.classify;
        setClassifierStatus("ready");
      })
      .catch((err) => {
        console.error("[gesture] wasm load failed", err);
        if (mounted) {
          setClassifierStatus("error");
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const maybeStoreSample = (vector, label, score) => {
    if (!isCollectingRef.current) return;
    if (label !== currentLabelRef.current) return;

    const now = Date.now();
    if (now - lastSavedAtRef.current < SAVE_INTERVAL_MS) return;
    lastSavedAtRef.current = now;

    setDataset((prev) => {
      const count = prev.filter((d) => d.label === label).length;
      if (count >= TARGET_PER_LABEL) return prev;

      return [
        ...prev,
        {
          label,
          vector,
          score,
          ts: now,
        },
      ];
    });
  };

  const runInference = (vector) => {
    const classify = classifierRef.current;
    if (!classify) return;

    const now = Date.now();
    if (now - lastInferenceAtRef.current < 80) return;
    lastInferenceAtRef.current = now;

    try {
      const t0 = performance.now();
      const result = classify(vector);
      const duration = performance.now() - t0;
      setPrediction({ label: result.label, score: result.score ?? 0 });
      setInferenceTimeMs(duration);
      if (result.label && result.label !== "-") {
        setCaption({ label: result.label, visible: true });
        if (captionTimeoutRef.current) {
          clearTimeout(captionTimeoutRef.current);
        }
        captionTimeoutRef.current = setTimeout(() => {
          setCaption((prev) => ({ ...prev, visible: false }));
        }, 1500);
      }
      maybeStoreSample(vector, result.label, result.score ?? 0);
    } catch (err) {
      console.error("[gesture] inference failed", err);
    }
  };

  useEffect(() => {
    if (!videoRef.current) return;

    const hands = new Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`,
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6,
    });

    hands.onResults((results) => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;

      const ctx = canvas.getContext("2d");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

      if (results.multiHandLandmarks?.length) {
        for (const lm of results.multiHandLandmarks) {
          drawConnectors(ctx, lm, HAND_CONNECTIONS);
          drawLandmarks(ctx, lm);
        }
      }
      ctx.restore();

      const handsResult = {
        landmarks: results.multiHandLandmarks || [],
        handedness:
          results.multiHandedness?.map((h) => ({ label: h.label })) || [],
      };

      const feature = landmarksToFeature(handsResult);
      if (!feature) return;

      runInference(feature.vector);
    });

    handsRef.current = hands;

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        if (!handsRef.current) return;
        await handsRef.current.send({ image: videoRef.current });
      },
      width: 640,
      height: 480,
    });

    camera.start();
    cameraRef.current = camera;

    const handleLoaded = () => setIsReady(true);
    videoRef.current.addEventListener("loadeddata", handleLoaded);

    return () => {
      if (videoRef.current)
        videoRef.current.removeEventListener("loadeddata", handleLoaded);

      cameraRef.current?.stop();
      handsRef.current?.close();
      if (captionTimeoutRef.current) {
        clearTimeout(captionTimeoutRef.current);
      }
    };
  }, []);

  const resetDataset = () => setDataset([]);

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(dataset, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sign_dataset.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCSV = () => {
    if (!dataset.length) return;

    const dim = dataset[0].vector.length;
    const header = ["label", ...Array.from({ length: dim }, (_, i) => `f${i}`)];

    const rows = dataset.map((d) => [
      d.label,
      ...d.vector.map((v) => (Number.isFinite(v) ? v : 0)),
    ]);

    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sign_dataset.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const allDone = LABELS.every((l) => counts[l.key] >= TARGET_PER_LABEL);

  return (
    <div style={{ display: "grid", gap: 12, padding: 12 }}>
      <h2>Sorison</h2>

      <div style={{ position: "relative", width: 640, height: 480 }}>
        <video
          ref={videoRef}
          style={{
            position: "absolute",
            width: 640,
            height: 480,
            transform: "scaleX(-1)",
          }}
          autoPlay
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            width: 640,
            height: 480,
            transform: "scaleX(-1)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            padding: "6px 10px",
            borderRadius: 8,
            background: "rgba(0, 0, 0, 0.55)",
            color: "#fff",
            minWidth: 120,
            pointerEvents: "none",
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 600 }}>
            {LABEL_DISPLAY[prediction.label] ?? prediction.label}
          </div>
          <div style={{ fontSize: 12, opacity: 0.9 }}>
            {(prediction.score * 100).toFixed(1)}%
          </div>
          <div style={{ fontSize: 11, opacity: 0.8 }}>
            {inferenceTimeMs.toFixed(1)} ms
          </div>
        </div>
        {caption.visible && (
          <div
            style={{
              position: "absolute",
              bottom: 16,
              right: 24,
              padding: "4px 10px",
              color: "#fff",
              fontSize: 24,
              fontWeight: 700,
              pointerEvents: "none",
              textShadow: "0 0 8px rgba(0,0,0,0.8)",
              letterSpacing: 2,
            }}
          >
            {LABEL_DISPLAY[caption.label] ?? caption.label}
          </div>
        )}
      </div>

      {!isReady && <p>Loading camera...</p>}
      {classifierStatus !== "ready" && (
        <p style={{ color: classifierStatus === "error" ? "#c00" : "#555" }}>
          WASM {classifierStatus === "loading" ? "모델 로딩 중" : "초기화 실패"}
        </p>
      )}

      <div style={{ fontSize: 18 }}>
        <b>WASM 수어 번역 :</b>{" "}
        {LABEL_DISPLAY[prediction.label] ?? prediction.label}
        <span style={{ marginLeft: 8, opacity: 0.7 }}>
          ({prediction.score.toFixed(3)})
        </span>
        <span style={{ marginLeft: 12, opacity: 0.7 }}>
          {inferenceTimeMs.toFixed(1)} ms
        </span>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {LABELS.map((l) => {
          const c = counts[l.key] ?? 0;
          const done = c >= TARGET_PER_LABEL;
          return (
            <button
              key={l.key}
              onClick={() => setCurrentLabel(l.key)}
              disabled={isCollecting}
              style={{
                padding: "8px 10px",
                borderRadius: 8,
                border:
                  currentLabel === l.key ? "2px solid #00c" : "1px solid #999",
                background: done ? "#d4ffd4" : "#fff",
              }}
            >
              {l.text} ({c}/{TARGET_PER_LABEL})
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => setIsCollecting(true)}
          disabled={isCollecting || allDone}
          style={{ padding: "8px 12px" }}
        >
          Start Collecting
        </button>

        <button
          onClick={() => setIsCollecting(false)}
          disabled={!isCollecting}
          style={{ padding: "8px 12px" }}
        >
          Stop
        </button>

        <button onClick={resetDataset} style={{ padding: "8px 12px" }}>
          Reset Dataset
        </button>
      </div>

      <div style={{ fontSize: 16 }}>
        <b>Current Label:</b> {currentLabel} <br />
        <b>Collecting:</b> {isCollecting ? "YES" : "NO"} <br />
        <b>Total Samples:</b> {dataset.length}
        {allDone && <div style={{ color: "green" }}>✅ All collected!</div>}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={downloadCSV} disabled={!dataset.length}>
          Download CSV
        </button>
        <button onClick={downloadJSON} disabled={!dataset.length}>
          Download JSON
        </button>
      </div>
    </div>
  );
};

export default DataCollector;
