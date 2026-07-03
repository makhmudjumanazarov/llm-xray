// GPU presets for the VRAM calculator. Names and sizes are language-neutral.
// usableFraction models how much of the card's memory a runtime can actually
// address: ~1.0 on dedicated NVIDIA VRAM (headroom lives in the verdict
// thresholds instead), ~0.75 on Apple unified memory (macOS caps the
// GPU-addressable share of RAM).

export type GpuVendor = "consumer" | "datacenter" | "apple";

export type GpuPreset = {
  id: string;
  name: string;
  vramGB: number;
  vendor: GpuVendor;
  usableFraction: number;
};

export const GPU_PRESETS: readonly GpuPreset[] = [
  // Consumer NVIDIA
  { id: "rtx-3060", name: "RTX 3060 12GB", vramGB: 12, vendor: "consumer", usableFraction: 1 },
  { id: "rtx-4060-ti", name: "RTX 4060 Ti 16GB", vramGB: 16, vendor: "consumer", usableFraction: 1 },
  { id: "rtx-5080", name: "RTX 5080 16GB", vramGB: 16, vendor: "consumer", usableFraction: 1 },
  { id: "rtx-3090", name: "RTX 3090 24GB", vramGB: 24, vendor: "consumer", usableFraction: 1 },
  { id: "rtx-4090", name: "RTX 4090 24GB", vramGB: 24, vendor: "consumer", usableFraction: 1 },
  { id: "rtx-5090", name: "RTX 5090 32GB", vramGB: 32, vendor: "consumer", usableFraction: 1 },
  // Datacenter NVIDIA
  { id: "l4", name: "L4 24GB", vramGB: 24, vendor: "datacenter", usableFraction: 1 },
  { id: "a100-40", name: "A100 40GB", vramGB: 40, vendor: "datacenter", usableFraction: 1 },
  { id: "l40s", name: "L40S 48GB", vramGB: 48, vendor: "datacenter", usableFraction: 1 },
  { id: "a100-80", name: "A100 80GB", vramGB: 80, vendor: "datacenter", usableFraction: 1 },
  { id: "h100", name: "H100 80GB", vramGB: 80, vendor: "datacenter", usableFraction: 1 },
  { id: "h200", name: "H200 141GB", vramGB: 141, vendor: "datacenter", usableFraction: 1 },
  // Apple unified memory
  { id: "m4", name: "Apple M4 16GB", vramGB: 16, vendor: "apple", usableFraction: 0.75 },
  { id: "m4-pro", name: "Apple M4 Pro 48GB", vramGB: 48, vendor: "apple", usableFraction: 0.75 },
  { id: "m4-max", name: "Apple M4 Max 128GB", vramGB: 128, vendor: "apple", usableFraction: 0.75 },
];

export const DEFAULT_GPU_ID = "rtx-4090";

/** Sentinel id for a user-entered VRAM size (not in GPU_PRESETS). */
export const CUSTOM_GPU_ID = "custom";

export function gpuById(id: string): GpuPreset | undefined {
  return GPU_PRESETS.find((g) => g.id === id);
}

const GIB = 1024 ** 3;

/** Memory a runtime can actually allocate on this device, in bytes. */
export function usableBytes(vramGB: number, usableFraction = 1): number {
  return Math.max(0, vramGB) * GIB * usableFraction;
}
