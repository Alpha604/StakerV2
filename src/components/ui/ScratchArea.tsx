import React, { useRef, useState, useEffect } from "react";
import { cn } from "../../lib/utils";

export function ScratchArea({
  onReveal,
  revealed,
  children,
  coverColors = ["#a0aec0", "#cbd5e1", "#94a3b8"],
  coverText = "STAKE",
  className
}: { 
  onReveal: () => void, 
  revealed: boolean, 
  children: React.ReactNode, 
  coverColors?: string[],
  coverText?: string,
  className?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const lastPosRef = useRef<{x: number, y: number} | null>(null);
  const lastCheckTimeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    if (!revealed) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, coverColors[0]);
      gradient.addColorStop(0.5, coverColors[1]);
      gradient.addColorStop(1, coverColors[2] || coverColors[1]);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Noise texture
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
         const noiseX = Math.random() * 30 - 15;
         data[i] = Math.min(255, Math.max(0, data[i] + noiseX));
         data[i+1] = Math.min(255, Math.max(0, data[i+1] + noiseX));
         data[i+2] = Math.min(255, Math.max(0, data[i+2] + noiseX));
      }
      ctx.putImageData(imgData, 0, 0);
      
      // Repeating STRIPES or text
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.font = "italic 900 24px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 6);
      ctx.fillText(coverText, 0, -45);
      ctx.fillText(coverText, 0, 0);
      ctx.fillText(coverText, 0, 45);
      ctx.restore();
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [revealed, coverColors, coverText]);

  const scratch = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent, isStart: boolean = false) => {
    if (revealed) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 45; 
    
    if (isStart || !lastPosRef.current) {
        ctx.beginPath();
        ctx.arc(x, y, ctx.lineWidth / 2, 0, Math.PI * 2); 
        ctx.fill();
    } else {
        ctx.beginPath();
        ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
        ctx.lineTo(x, y);
        ctx.stroke();
    }
    
    lastPosRef.current = { x, y };
    
    checkReveal();
  };

  const checkReveal = () => {
    const now = Date.now();
    if (now - lastCheckTimeRef.current < 100) return;
    lastCheckTimeRef.current = now;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    let transparentPixels = 0;
    // stepping by a larger amount for faster checking
    for (let i = 3; i < data.length; i += 16) {
      if (data[i] === 0) transparentPixels++;
    }
    
    const totalPixelsChecked = data.length / 16;
    if (transparentPixels / totalPixelsChecked > 0.4) {
      onReveal();
    }
  };

  const handleDown = (e: any) => {
      if(revealed) return;
      setIsDrawing(true);
      scratch(e, true);
  };
  
  const handleMove = (e: any) => {
      if (!isDrawing) return;
      scratch(e, false);
  };
  
  const handleUp = () => {
      setIsDrawing(false);
      lastPosRef.current = null;
  };

  return (
    <div className={cn("relative overflow-hidden select-none touch-none", className)}>
        {children}
        <canvas
            ref={canvasRef}
            className={cn("absolute inset-0 w-full h-full cursor-crosshair transition-opacity duration-500", revealed ? "opacity-0 pointer-events-none" : "opacity-100 z-10")}
            onMouseDown={handleDown}
            onMouseMove={handleMove}
            onMouseUp={handleUp}
            onMouseLeave={handleUp}
            onTouchStart={handleDown}
            onTouchMove={handleMove}
            onTouchEnd={handleUp}
        />
    </div>
  );
}
