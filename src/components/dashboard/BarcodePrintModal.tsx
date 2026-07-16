"use client";

import { useState, useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { Printer, Minus, Plus, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface ProductForPrint {
  id: string;
  name: string;
  barcode: string;
  sellPrice: number;
}

interface BarcodePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductForPrint[];
}

const PAPER_SIZES = [
  { id: "40x25", name: "40x25 mm", width: "40mm", height: "25mm", fontSize: 10, barcodeHeight: 30 },
  { id: "50x30", name: "50x30 mm", width: "50mm", height: "30mm", fontSize: 12, barcodeHeight: 40 },
  { id: "58x40", name: "58x40 mm", width: "58mm", height: "40mm", fontSize: 14, barcodeHeight: 50 },
];

export function BarcodePrintModal({ isOpen, onClose, products }: BarcodePrintModalProps) {
  const [selectedSize, setSelectedSize] = useState(PAPER_SIZES[0]);
  const [copies, setCopies] = useState<Record<string, number>>({});
  
  // Set default 1 copy for all selected products
  useEffect(() => {
    if (isOpen) {
      const initialCopies: Record<string, number> = {};
      products.forEach(p => {
        initialCopies[p.id] = 1;
      });
      setCopies(initialCopies);
    }
  }, [isOpen, products]);

  const updateCopy = (id: string, delta: number) => {
    setCopies(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [id]: next };
    });
  };

  const handlePrint = () => {
    // Generate HTML for printing
    let printContent = `
      <html>
        <head>
          <title>Print Barcode</title>
          <style>
            @page {
              margin: 0;
              size: ${selectedSize.width} ${selectedSize.height};
            }
            body {
              margin: 0;
              padding: 0;
              background: white;
            }
            .label-container {
              width: ${selectedSize.width};
              height: ${selectedSize.height};
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              box-sizing: border-box;
              padding: 2mm;
              page-break-after: always;
              overflow: hidden;
            }
            .store-name {
              font-family: Arial, sans-serif;
              font-size: ${selectedSize.fontSize - 2}px;
              font-weight: bold;
              text-align: center;
              margin-bottom: 2px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              width: 100%;
            }
            .product-name {
              font-family: Arial, sans-serif;
              font-size: ${selectedSize.fontSize - 1}px;
              text-align: center;
              margin-bottom: 2px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              width: 100%;
            }
            .price {
              font-family: Arial, sans-serif;
              font-size: ${selectedSize.fontSize}px;
              font-weight: bold;
              text-align: center;
              margin-top: 2px;
            }
            svg {
              max-width: 100%;
            }
          </style>
        </head>
        <body>
    `;

    products.forEach(product => {
      if (!product.barcode) return;
      const count = copies[product.id] || 0;
      
      if (count > 0) {
        // Create a temporary canvas/svg to generate barcode
        const svgNode = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        JsBarcode(svgNode, product.barcode, {
          format: "CODE128",
          displayValue: true,
          fontSize: 12,
          height: selectedSize.barcodeHeight,
          margin: 0,
        });
        
        const svgString = new XMLSerializer().serializeToString(svgNode);

        for (let i = 0; i < count; i++) {
          printContent += `
            <div class="label-container">
              <div class="product-name">${product.name}</div>
              ${svgString}
              <div class="price">${formatCurrency(product.sellPrice)}</div>
            </div>
          `;
        }
      }
    });

    printContent += `
        <script>
          window.onload = () => {
            window.print();
            setTimeout(() => window.close(), 500);
          }
        </script>
        </body>
      </html>
    `;

    // Open print window
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(printContent);
      printWindow.document.close();
    }
  };

  const totalCopies = Object.values(copies).reduce((sum, val) => sum + val, 0);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Print Label Barcode</DialogTitle>
          <DialogDescription>
            Pilih ukuran kertas dan jumlah copy untuk setiap produk. Produk tanpa barcode akan diabaikan.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-slate-900">1. Pilih Ukuran Kertas (Thermal Label)</h4>
            <div className="grid grid-cols-3 gap-3">
              {PAPER_SIZES.map(size => (
                <div 
                  key={size.id}
                  onClick={() => setSelectedSize(size)}
                  className={`border rounded-lg p-3 cursor-pointer text-center transition-all ${
                    selectedSize.id === size.id 
                      ? "border-[#00A76F] bg-[#00A76F]/5 ring-1 ring-[#00A76F]" 
                      : "border-slate-200 hover:border-[#00A76F]/50 bg-white"
                  }`}
                >
                  <p className="font-medium text-slate-900">{size.name}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm text-slate-900">2. Atur Jumlah Print</h4>
              <p className="text-xs font-medium text-slate-500">Total: {totalCopies} label</p>
            </div>
            
            <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden divide-y divide-slate-100">
              {products.map(product => {
                const hasBarcode = !!product.barcode;
                return (
                  <div key={product.id} className={`flex items-center justify-between p-3 ${!hasBarcode ? 'opacity-50' : ''}`}>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm text-slate-900">{product.name}</span>
                      {hasBarcode ? (
                        <span className="text-xs text-slate-500 font-mono">{product.barcode}</span>
                      ) : (
                        <span className="text-xs text-red-500">Tidak ada barcode</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={() => updateCopy(product.id, -1)}
                        disabled={!hasBarcode || (copies[product.id] || 0) <= 0}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-medium text-sm">
                        {copies[product.id] || 0}
                      </span>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => updateCopy(product.id, 1)}
                        disabled={!hasBarcode}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-end border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button 
            onClick={handlePrint}
            disabled={totalCopies === 0}
            className="bg-[#00A76F] hover:bg-[#00A76F]/90 text-white"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print {totalCopies} Label
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
