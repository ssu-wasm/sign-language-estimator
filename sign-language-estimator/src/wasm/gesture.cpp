#include <vector>
#include <cmath>
#include <algorithm>
#include <emscripten/bind.h>

#include "gesture_weights.h"

extern "C" {
    constexpr int D_IN = 126;
    constexpr int H1 = 128;
    constexpr int H2 = 64;
    constexpr int NUM_CLASSES = 4;

    std::vector<float> mean(D_IN, 0.f);
    std::vector<float> scale(D_IN, 1.f);

    void setScaler(const emscripten::val& meanArr, const emscripten::val& scaleArr) {
        for (int i = 0; i < D_IN; ++i) {
            mean[i] = meanArr[i].as<float>();
            scale[i] = scaleArr[i].as<float>();
        }
    }

    emscripten::val infer(const emscripten::val& featureArr) {
        float x[D_IN];
        for (int i = 0; i < D_IN; ++i) {
            x[i] = (featureArr[i].as<float>() - mean[i]) / scale[i];
        }

        float h1[H1];
        for (int i = 0; i < H1; ++i) {
            float sum = B1[i];
            for (int j = 0; j < D_IN; ++j) sum += W1[i * D_IN + j] * x[j];
            h1[i] = std::max(sum, 0.f);
        }

        float h2[H2];
        for (int i = 0; i < H2; ++i) {
            float sum = B2[i];
            for (int j = 0; j < H1; ++j) sum += W2[i * H1 + j] * h1[j];
            h2[i] = std::max(sum, 0.f);
        }

        float logits[NUM_CLASSES];
        for (int i = 0; i < NUM_CLASSES; ++i) {
            float sum = B3[i];
            for (int j = 0; j < H2; ++j) sum += W3[i * H2 + j] * h2[j];
            logits[i] = sum;
        }

        float maxLogit = logits[0];
        for (int i = 1; i < NUM_CLASSES; ++i) maxLogit = std::max(maxLogit, logits[i]);

        float sumExp = 0.f;
        for (int i = 0; i < NUM_CLASSES; ++i) {
            logits[i] = std::exp(logits[i] - maxLogit);
            sumExp += logits[i];
        }
        for (int i = 0; i < NUM_CLASSES; ++i) logits[i] /= sumExp;

        emscripten::val probs = emscripten::val::array();
        int argmax = 0;
        float best = logits[0];
        for (int i = 0; i < NUM_CLASSES; ++i) {
            probs.set(i, logits[i]);
            if (logits[i] > best) { best = logits[i]; argmax = i; }
        }

        emscripten::val result = emscripten::val::object();
        result.set("index", argmax);
        result.set("score", best);
        result.set("probs", probs);
        return result;
    }
}

EMSCRIPTEN_BINDINGS(gesture_module) {
    emscripten::function("setScaler", &setScaler);
    emscripten::function("infer", &infer);
}