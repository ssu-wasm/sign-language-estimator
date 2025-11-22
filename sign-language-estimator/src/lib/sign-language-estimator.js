// src/lib/sign-language-estimator.js

// 데이터 추출용

// // -----------------------------
// // 1) 유틸: points 정규화
// // -----------------------------
// function normalizeLandmarks(pts) {
//   const base = pts[0];
//   const centered = pts.map(p => ({
//     x: p.x - base.x,
//     y: p.y - base.y,
//     z: (p.z ?? 0) - (base.z ?? 0),
//   }));

//   const ref = centered[9];
//   const scale =
//     Math.sqrt(ref.x * ref.x + ref.y * ref.y + ref.z * ref.z) || 1;

//   return centered.map(p => ({
//     x: p.x / scale,
//     y: p.y / scale,
//     z: p.z / scale,
//   }));
// }

// // -----------------------------
// // 2) feature 추출 함수
// // -----------------------------
// export function landmarksToFeature(handsResult) {
//   if (!handsResult || !handsResult.landmarks || !handsResult.handedness)
//     return null;

//   const { landmarks, handedness } = handsResult;

//   let leftPts = null;
//   let rightPts = null;

//   for (let i = 0; i < landmarks.length; i++) {
//     const label = handedness[i]?.label;
//     if (label === "Left") leftPts = landmarks[i];
//     if (label === "Right") rightPts = landmarks[i];
//   }

//   if (!leftPts && !rightPts) return null;

//   const leftNorm = leftPts ? normalizeLandmarks(leftPts) : null;
//   const rightNorm = rightPts ? normalizeLandmarks(rightPts) : null;

//   const vec = [];

//   if (leftNorm) {
//     for (const p of leftNorm) vec.push(p.x, p.y, p.z);
//   } else {
//     for (let i = 0; i < 63; i++) vec.push(0);
//   }

//   if (rightNorm) {
//     for (const p of rightNorm) vec.push(p.x, p.y, p.z);
//   } else {
//     for (let i = 0; i < 63; i++) vec.push(0);
//   }

//   return {
//     left: leftNorm,
//     right: rightNorm,
//     vector: vec,
//   };
// }

// // -----------------------------
// // 3) 주먹 판정
// // -----------------------------
// function isFist(normPts) {
//   if (!normPts) return false;

//   const wrist = normPts[0];

//   function dist(a, b) {
//     const dx = a.x - b.x,
//       dy = a.y - b.y,
//       dz = a.z - b.z;
//     return Math.sqrt(dx * dx + dy * dy + dz * dz);
//   }

//   const fingers = [
//     [4, 2],
//     [8, 5],
//     [12, 9],
//     [16, 13],
//     [20, 17],
//   ];

//   let foldedCount = 0;
//   for (const [tip, mcp] of fingers) {
//     const dTip = dist(normPts[tip], wrist);
//     const dMcp = dist(normPts[mcp], wrist);
//     if (dTip < dMcp) foldedCount++;
//   }
//   return foldedCount >= 4;
// }

// // -----------------------------
// // 3-1) 손가락 펼침 상태 계산
// // -----------------------------
// function getFingerStates(normPts) {
//   if (!normPts) return null;

//   const wrist = normPts[0];

//   function dist(a, b) {
//     const dx = a.x - b.x,
//       dy = a.y - b.y,
//       dz = a.z - b.z;
//     return Math.sqrt(dx * dx + dy * dy + dz * dz);
//   }

//   const map = {
//     thumb: [4, 2],
//     index: [8, 5],
//     middle: [12, 9],
//     ring: [16, 13],
//     pinky: [20, 17],
//   };

//   const states = {};
//   for (const key of Object.keys(map)) {
//     const [tip, mcp] = map[key];
//     const tipDist = dist(normPts[tip], wrist);
//     const baseDist = dist(normPts[mcp], wrist);
//     states[key] = tipDist > baseDist * 1.1; // 10% 더 멀면 펼쳤다고 판단
//   }

//   return states;
// }

// function isOpenPalm(normPts) {
//   const states = getFingerStates(normPts);
//   if (!states) return false;
//   const extendedCount = Object.values(states).filter(Boolean).length;
//   return extendedCount >= 4; // 대부분의 손가락이 펴져 있으면 펴진 손바닥으로 간주
// }

// function isILoveYou(normPts) {
//   const states = getFingerStates(normPts);
//   if (!states) return false;
//   return (
//     states.thumb &&
//     states.index &&
//     states.pinky &&
//     !states.middle &&
//     !states.ring
//   );
// }

// // -----------------------------
// // 4) "안녕" 포즈 = 두 손 모두 주먹
// // -----------------------------
// export function predictHelloPose(feature) {
//   if (!feature) return { label: "none", score: 0 };

//   const left = feature.left ? isFist(feature.left) : false;
//   const right = feature.right ? isFist(feature.right) : false;

//   if (left && right) {
//     return { label: "hello", score: 1 };
//   }
//   return { label: "none", score: 0 };
// }

// // -----------------------------
// // 5) 라벨별 게이트 함수
// // -----------------------------
// export function passesGestureGate(label, feature) {
//   if (!feature) return false;

//   switch (label) {
//     case "hello":
//       return isFist(feature.left) && isFist(feature.right);
//     case "love":
//       return isILoveYou(feature.left) || isILoveYou(feature.right);
//     case "nice":
//       return isOpenPalm(feature.left) && isOpenPalm(feature.right);
//     case "thanks":
//       return (
//         (isOpenPalm(feature.left) && isFist(feature.right)) ||
//         (isOpenPalm(feature.right) && isFist(feature.left))
//       );
//     default:
//       return true;
//   }
// }




// src/lib/sign-language-estimator.js

// -----------------------------
// 1) 유틸: points 정규화
// -----------------------------
function normalizeLandmarks(pts) {
  const base = pts[0];
  const centered = pts.map(p => ({
    x: p.x - base.x,
    y: p.y - base.y,
    z: (p.z ?? 0) - (base.z ?? 0),
  }));

  const ref = centered[9];
  const scale =
    Math.sqrt(ref.x * ref.x + ref.y * ref.y + ref.z * ref.z) || 1;

  return centered.map(p => ({
    x: p.x / scale,
    y: p.y / scale,
    z: p.z / scale,
  }));
}

// -----------------------------
// 2) feature 추출 함수
// -----------------------------
export function landmarksToFeature(handsResult) {
  if (!handsResult || !handsResult.landmarks || !handsResult.handedness)
    return null;

  const { landmarks, handedness } = handsResult;

  let leftPts = null;
  let rightPts = null;

  for (let i = 0; i < landmarks.length; i++) {
    const label = handedness[i]?.label;
    if (label === "Left") leftPts = landmarks[i];
    if (label === "Right") rightPts = landmarks[i];
  }

  if (!leftPts && !rightPts) return null;

  const leftNorm = leftPts ? normalizeLandmarks(leftPts) : null;
  const rightNorm = rightPts ? normalizeLandmarks(rightPts) : null;

  const vec = [];

  if (leftNorm) {
    for (const p of leftNorm) vec.push(p.x, p.y, p.z);
  } else {
    for (let i = 0; i < 63; i++) vec.push(0);
  }

  if (rightNorm) {
    for (const p of rightNorm) vec.push(p.x, p.y, p.z);
  } else {
    for (let i = 0; i < 63; i++) vec.push(0);
  }

  return {
    left: leftNorm,
    right: rightNorm,
    vector: vec,
  };
}

// -----------------------------
// 3) 주먹 판정
// -----------------------------
function isFist(normPts) {
  if (!normPts) return false;

  const wrist = normPts[0];

  function dist(a, b) {
    const dx = a.x - b.x,
      dy = a.y - b.y,
      dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  const fingers = [
    [4, 2],
    [8, 5],
    [12, 9],
    [16, 13],
    [20, 17],
  ];

  let foldedCount = 0;
  for (const [tip, mcp] of fingers) {
    const dTip = dist(normPts[tip], wrist);
    const dMcp = dist(normPts[mcp], wrist);
    if (dTip < dMcp) foldedCount++;
  }
  return foldedCount >= 4;
}

// -----------------------------
// 3-1) 손가락 펼침 상태 계산
// -----------------------------
function getFingerStates(normPts) {
  if (!normPts) return null;

  const wrist = normPts[0];

  function dist(a, b) {
    const dx = a.x - b.x,
      dy = a.y - b.y,
      dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  const map = {
    thumb: [4, 2],
    index: [8, 5],
    middle: [12, 9],
    ring: [16, 13],
    pinky: [20, 17],
  };

  const states = {};
  for (const key of Object.keys(map)) {
    const [tip, mcp] = map[key];
    const tipDist = dist(normPts[tip], wrist);
    const baseDist = dist(normPts[mcp], wrist);
    states[key] = tipDist > baseDist * 1.1; // 10% 더 멀면 펼쳤다고 판단
  }

  return states;
}

function isOpenPalm(normPts) {
  const states = getFingerStates(normPts);
  if (!states) return false;
  const extendedCount = Object.values(states).filter(Boolean).length;
  return extendedCount >= 4; // 대부분의 손가락이 펴져 있으면 펴진 손바닥으로 간주
}

function isILoveYou(normPts) {
  const states = getFingerStates(normPts);
  if (!states) return false;
  return (
    states.thumb &&
    states.index &&
    states.pinky &&
    !states.middle &&
    !states.ring
  );
}

// -----------------------------
// 4) "안녕" 포즈 = 두 손 모두 주먹
// -----------------------------
export function predictHelloPose(feature) {
  if (!feature) return { label: "none", score: 0 };

  const left = feature.left ? isFist(feature.left) : false;
  const right = feature.right ? isFist(feature.right) : false;

  if (left && right) {
    return { label: "hello", score: 1 };
  }
  return { label: "none", score: 0 };
}

// -----------------------------
// 5) 라벨별 게이트 함수
// -----------------------------
export function passesGestureGate(label, feature) {
  if (!feature) return false;

  switch (label) {
    case "hello":
      return isFist(feature.left) && isFist(feature.right);
    case "love":
      return isILoveYou(feature.left) || isILoveYou(feature.right);
    case "nice":
      return isOpenPalm(feature.left) && isOpenPalm(feature.right);
    case "thanks":
      return (
        (isOpenPalm(feature.left) && isFist(feature.right)) ||
        (isOpenPalm(feature.right) && isFist(feature.left))
      );
    default:
      return true;
  }
}
