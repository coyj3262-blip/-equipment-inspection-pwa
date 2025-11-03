import { useRef, useState, useEffect } from "react";

type SignaturePadProps = {
  onSignature: (dataUrl: string) => void;
  label?: string;
};

export default function SignaturePad({ onSignature, label = "Signature" }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Configure drawing style
    ctx.strokeStyle = '#1E3A8A'; // Navy blue
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  function startDrawing(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setIsEmpty(false);
  }

  function stopDrawing() {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) return;

    // Export signature as data URL
    const dataUrl = canvas.toDataURL('image/png');
    onSignature(dataUrl);
  }

  function clear() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    onSignature('');
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <button
          type="button"
          onClick={clear}
          className="text-xs text-orange-600 hover:text-orange-700 font-medium"
        >
          Clear
        </button>
      </div>
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={(e) => { e.preventDefault(); startDrawing(e); }}
        onTouchMove={(e) => { e.preventDefault(); draw(e); }}
        onTouchEnd={(e) => { e.preventDefault(); stopDrawing(); }}
        className="w-full h-32 border-2 border-slate-300 rounded-lg bg-white cursor-crosshair touch-none"
        style={{ touchAction: 'none' }}
      />
      {isEmpty && (
        <p className="text-xs text-slate-400 text-center -mt-20 pointer-events-none">
          Sign here
        </p>
      )}
    </div>
  );
}
