"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Camera, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export function BarcodeScannerModal({ isOpen, onClose, onScan }: BarcodeScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    let active = true;

    if (isOpen) {
      setIsLoading(true);
      setError(null);
      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;

      codeReader
        .listVideoInputDevices()
        .then((videoInputDevices) => {
          if (!active) return;
          if (videoInputDevices.length === 0) {
            setError("Kamera tidak ditemukan pada perangkat Anda.");
            setIsLoading(false);
            return;
          }

          // Use the last camera (usually back camera on mobile)
          const selectedDeviceId = videoInputDevices[videoInputDevices.length - 1].deviceId;

          if (videoRef.current) {
            codeReader.decodeFromVideoDevice(selectedDeviceId, videoRef.current, (result, err) => {
              if (!active) return;
              if (result) {
                // Success
                onScan(result.getText());
                onClose(); // Close automatically on successful scan
              }
              if (err && !(err instanceof NotFoundException)) {
                console.error(err);
              }
            });
            
            // Wait for video to be ready before removing loader
            if (videoRef.current) {
              videoRef.current.onloadedmetadata = () => {
                if (active) setIsLoading(false);
              };
            }
          }
        })
        .catch((err) => {
          if (!active) return;
          console.error(err);
          setError("Gagal mengakses kamera. Pastikan Anda telah memberikan izin.");
          setIsLoading(false);
        });
    }

    return () => {
      active = false;
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    };
  }, [isOpen, onScan, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-black/95 text-white border-slate-800">
        <DialogHeader className="p-4 border-b border-slate-800 bg-black">
          <DialogTitle className="text-white flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Scan Barcode
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Arahkan kamera ke barcode produk
          </DialogDescription>
        </DialogHeader>

        <div className="relative aspect-square w-full bg-black flex items-center justify-center overflow-hidden">
          {error ? (
            <div className="flex flex-col items-center justify-center text-center p-6 text-red-400">
              <AlertCircle className="w-12 h-12 mb-4" />
              <p>{error}</p>
            </div>
          ) : (
            <>
              <video 
                ref={videoRef} 
                className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`} 
              />
              {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/50 backdrop-blur-sm z-10">
                  <Loader2 className="w-10 h-10 animate-spin mb-4" />
                  <p className="font-medium">Memulai kamera...</p>
                </div>
              )}
              {/* Scan Guide Overlay */}
              {!isLoading && !error && (
                <div className="absolute inset-0 pointer-events-none border-[60px] border-black/50 z-10 flex items-center justify-center">
                  <div className="w-full h-48 border-2 border-[#00A76F] rounded-lg shadow-[0_0_0_4000px_rgba(0,0,0,0.5)]">
                    <div className="w-full h-0.5 bg-red-500/80 absolute top-1/2 -translate-y-1/2 animate-[scan_2s_ease-in-out_infinite]" />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="p-4 bg-black border-t border-slate-800">
          <Button variant="outline" className="w-full bg-slate-800 border-slate-700 text-white hover:bg-slate-700" onClick={onClose}>
            Batal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
