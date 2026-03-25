"use client";

import { useState, useCallback } from "react";
import Image from "next/image";

type ProcessingState = "idle" | "uploading" | "processing" | "done" | "error";

export default function Home() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [state, setState] = useState<ProcessingState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const processImage = async (file: File) => {
    setState("uploading");
    setError(null);

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setOriginalImage(previewUrl);

    const formData = new FormData();
    formData.append("image", file);

    try {
      setState("processing");
      const response = await fetch("/api/remove-bg", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to process image");
      }

      const blob = await response.blob();
      const resultUrl = URL.createObjectURL(blob);
      setResultImage(resultUrl);
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setState("error");
    }
  };

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    processImage(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const reset = () => {
    setOriginalImage(null);
    setResultImage(null);
    setState("idle");
    setError(null);
  };

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="py-6 px-4 border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-slate-900">🖼️ BG Remover</h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {state === "idle" && (
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Remove Image Background
            </h2>
            <p className="text-lg text-slate-600 mb-8">
              Upload an image and get a transparent background in seconds
            </p>

            {/* Upload Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`
                border-2 border-dashed rounded-2xl p-12 transition-all cursor-pointer
                ${dragOver 
                  ? "border-blue-500 bg-blue-50" 
                  : "border-slate-300 hover:border-slate-400 bg-white"
                }
              `}
              onClick={() => document.getElementById("fileInput")?.click()}
            >
              <input
                type="file"
                id="fileInput"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
              />
              <div className="text-6xl mb-4">📤</div>
              <p className="text-xl font-medium text-slate-700 mb-2">
                Drop your image here or click to upload
              </p>
              <p className="text-sm text-slate-500">
                Supports JPG, PNG, WebP • Max 10MB
              </p>
            </div>
          </div>
        )}

        {(state === "uploading" || state === "processing") && (
          <div className="text-center py-16">
            <div className="text-6xl mb-6 animate-pulse">⚙️</div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">
              {state === "uploading" ? "Uploading..." : "Removing background..."}
            </h2>
            <p className="text-slate-600">This usually takes 5-10 seconds</p>
          </div>
        )}

        {state === "error" && (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">❌</div>
            <h2 className="text-2xl font-semibold text-red-600 mb-2">
              Something went wrong
            </h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <button
              onClick={reset}
              className="px-6 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {state === "done" && resultImage && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Background Removed!
              </h2>
            </div>

            {/* Comparison View */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-4 shadow-lg">
                <p className="text-sm font-medium text-slate-500 mb-3 text-center">
                  Original
                </p>
                <div className="relative aspect-square bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMCIgaGVpZ2h0PSIzMCI+PHBhdGggZD0iTTAgMGgzMHYzMEwwIDN6IiBmaWxsPSIjZjBmMGYwIi8+PC9zdmc+')] bg-[length:30px_30px] rounded-lg overflow-hidden">
                  <Image
                    src={originalImage!}
                    alt="Original"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-lg">
                <p className="text-sm font-medium text-slate-500 mb-3 text-center">
                  Result (Transparent)
                </p>
                <div className="relative aspect-square bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMCIgaGVpZ2h0PSIzMCI+PHBhdGggZD0iTTAgMGgzMHYzMEwwIDN6IiBmaWxsPSIjZjBmMGYwIi8+PC9zdmc+')] bg-[length:30px_30px] rounded-lg overflow-hidden">
                  <Image
                    src={resultImage}
                    alt="Result"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            </div>

            {/* Download Button */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={resultImage}
                download="removed-background.png"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors shadow-lg"
              >
                📥 Download PNG
              </a>
              <button
                onClick={reset}
                className="px-8 py-4 bg-slate-200 text-slate-700 rounded-xl font-semibold text-lg hover:bg-slate-300 transition-colors"
              >
                Process Another Image
              </button>
            </div>
          </div>
        )}

        {/* Features */}
        {state === "idle" && (
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="text-3xl mb-3">🚀</div>
              <h3 className="font-semibold text-slate-900 mb-2">Fast Processing</h3>
              <p className="text-slate-600 text-sm">
                Remove backgrounds in just 5-10 seconds using advanced AI
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="text-3xl mb-3">🔒</div>
              <h3 className="font-semibold text-slate-900 mb-2">Privacy First</h3>
              <p className="text-slate-600 text-sm">
                Images are processed in memory and never stored on any server
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="text-3xl mb-3">💎</div>
              <h3 className="font-semibold text-slate-900 mb-2">High Quality</h3>
              <p className="text-slate-600 text-sm">
                Get crisp, clean cutouts with precise edge detection
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-slate-500">
        Powered by Remove.bg API • Built with Next.js on Cloudflare
      </footer>
    </main>
  );
}
