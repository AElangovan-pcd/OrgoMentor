import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, X, RefreshCw } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (base64: string, mimeType: string) => void;
  onClose: () => void;
}

export const CameraCapture = ({ onCapture, onClose }: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Could not access camera. Please check permissions.");
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg').split(',')[1];
        onCapture(base64, 'image/jpeg');
        onClose();
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center"
    >
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 text-white/70 hover:text-white z-10"
      >
        <X className="w-8 h-8" />
      </button>

      {error ? (
        <div className="text-white text-center p-6">
          <p className="text-xl mb-4">{error}</p>
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
          >
            Go Back
          </button>
        </div>
      ) : (
        <div className="relative w-full max-w-2xl aspect-video bg-slate-900 overflow-hidden rounded-2xl shadow-2xl">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
          
          <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-6">
            <button 
              onClick={captureFrame}
              className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              <div className="w-16 h-16 rounded-full border-4 border-black/10 flex items-center justify-center">
                <Camera className="w-8 h-8 text-black" />
              </div>
            </button>
          </div>
        </div>
      )}
      
      <div className="mt-8 text-white/50 text-sm font-mono uppercase tracking-widest">
        Align your mechanism or spectrum in the frame
      </div>
    </motion.div>
  );
};
