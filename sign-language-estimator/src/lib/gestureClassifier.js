const FEATURE_DIM = 126;
const DEFAULT_LABELS = ["hello", "love", "nice", "thanks"];
const DEFAULT_MEAN = Array(FEATURE_DIM).fill(0);
const DEFAULT_SCALE = Array(FEATURE_DIM).fill(1);

let classifierPromise;

async function fetchJsonSafe(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(res.statusText);
    return await res.json();
  } catch (err) {
    console.warn(`[gestureClassifier] Could not load ${path}:`, err.message);
    return null;
  }
}

let scriptLoadPromise;

function ensureGestureScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("window is undefined"));
  }

  if (window.GestureModule) {
    return Promise.resolve();
  }

  if (!scriptLoadPromise) {
    scriptLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "/wasm/gesture.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = (err) => reject(new Error(`failed to load gesture wasm script: ${err?.message || "unknown"}`));
      document.head.appendChild(script);
    });
  }

  return scriptLoadPromise;
}

async function loadModule() {
  await ensureGestureScript();
  if (typeof window.GestureModule !== "function") {
    throw new Error("GestureModule global not found after script load");
  }
  return window.GestureModule({ locateFile: (file) => `/wasm/${file}` });
}

export function loadGestureClassifier() {
  if (!classifierPromise) {
    classifierPromise = (async () => {
      const [module, scalerData, labelData] = await Promise.all([
        loadModule(),
        fetchJsonSafe("/models/scaler.json"),
        fetchJsonSafe("/models/labels.json"),
      ]);

      const mean = Array.isArray(scalerData?.mean) && scalerData.mean.length === FEATURE_DIM
        ? scalerData.mean
        : DEFAULT_MEAN;
      const scale = Array.isArray(scalerData?.scale) && scalerData.scale.length === FEATURE_DIM
        ? scalerData.scale
        : DEFAULT_SCALE;

      try {
        module.setScaler(mean, scale);
      } catch (err) {
        console.warn("[gestureClassifier] setScaler failed, using defaults", err);
        module.setScaler(DEFAULT_MEAN, DEFAULT_SCALE);
      }

      const labels = Array.isArray(labelData?.labels) && labelData.labels.length
        ? labelData.labels
        : DEFAULT_LABELS;

      return {
        classify(vector) {
          console.log("[gestureClassifier] calling WASM", { 
            length: vector.length,
            first3: vector.slice(0, 3),
          });
          const result = module.infer(vector);
          console.log("[gestureClassifier] WASM result", result);
          const index = typeof result.index === "number" ? result.index : 0;
          const label = labels[index] ?? `class_${index}`;
          return {
            label,
            index,
            score: typeof result.score === "number" ? result.score : 0,
            probs: Array.isArray(result.probs) ? result.probs : [],
          };
        },
      };
    })();
  }

  return classifierPromise;
}
