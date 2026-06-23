// Lazy, opt-in REAL inference — runs only when the user clicks "Run real model".
// transformers.js is fetched from a CDN at runtime inside this worker, so it is
// kept entirely OUT of the app bundle (next build is unaffected) and nothing
// downloads until the worker first runs. Runs DistilGPT-2 fully client-side and
// returns the REAL next-token probability distribution (top-k). No server calls.

let _tok = null;
let _model = null;

async function ensure(post) {
  if (_model) return;
  post({ type: "status", stage: "loading" });
  const TJS = await import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2/+esm");
  TJS.env.allowLocalModels = false; // pull the model from the HF hub CDN
  _tok = await TJS.AutoTokenizer.from_pretrained("Xenova/distilgpt2");
  _model = await TJS.AutoModelForCausalLM.from_pretrained("Xenova/distilgpt2", { dtype: "q8" });
}

self.onmessage = async (e) => {
  const post = (m) => self.postMessage(m);
  const { prompt, temperature } = e.data || {};
  try {
    await ensure(post);
    post({ type: "status", stage: "running" });

    const text = (prompt && String(prompt).trim()) || "The capital of France is";
    const inputs = await _tok(text);
    const out = await _model(inputs);

    // out.logits: [1, seqLen, vocab] — take the last position's distribution.
    const logits = out.logits;
    const seq = logits.dims[1];
    const vocab = logits.dims[2];
    const data = logits.data;
    const start = (seq - 1) * vocab;

    const T = Math.max(0.05, Number(temperature) || 1);
    let max = -Infinity;
    for (let i = 0; i < vocab; i++) {
      const v = data[start + i] / T;
      if (v > max) max = v;
    }
    let sum = 0;
    const probs = new Float64Array(vocab);
    for (let i = 0; i < vocab; i++) {
      const p = Math.exp(data[start + i] / T - max);
      probs[i] = p;
      sum += p;
    }

    const k = 8;
    const idx = Array.from({ length: vocab }, (_, i) => i);
    idx.sort((a, b) => probs[b] - probs[a]);
    const top = idx.slice(0, k).map((i) => {
      let token = _tok.decode([i], { skip_special_tokens: false });
      token = token.replace(/\n/g, "\\n");
      if (token === "") token = "·";
      else if (token === " ") token = "␠";
      return { token, prob: probs[i] / sum, logit: Math.round(data[start + i] * 100) / 100 };
    });

    post({ type: "result", text, top });
  } catch (err) {
    post({ type: "error", message: String((err && err.message) || err) });
  }
};
