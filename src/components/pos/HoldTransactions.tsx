"use client";

import { useEffect, useState } from "react";
import { Clock, Play, Trash2, ShoppingBag } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { CartItem } from "@/types/pos";

export interface HoldTx {
  id: string; // timestamp
  name: string;
  cart: CartItem[];
  createdAt: number;
}

interface HoldTransactionsProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  onResume: (cart: CartItem[]) => void;
}

export function HoldTransactions({
  isOpen,
  onClose,
  tenantId,
  onResume,
}: HoldTransactionsProps) {
  const [holds, setHolds] = useState<HoldTx[]>([]);

  const storageKey = `dicatat_hold_txs_${tenantId}`;

  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          setHolds(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse hold txs", e);
        }
      }
    }
  }, [isOpen, storageKey]);

  const handleDelete = (id: string) => {
    const updated = holds.filter((h) => h.id !== id);
    setHolds(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const handleResume = (hold: HoldTx) => {
    // Resume transaction and remove it from hold list
    onResume(hold.cart);
    handleDelete(hold.id);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col bg-slate-50">
        <SheetHeader className="p-4 border-b bg-white shrink-0 text-left">
          <SheetTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" />
            Transaksi Ditahan (Hold)
          </SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto p-4">
          {holds.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <ShoppingBag className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm font-medium">Tidak ada transaksi yang ditahan.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {holds.map((hold) => {
                const totalItems = hold.cart.reduce((sum, item) => sum + item.qty, 0);
                const grandTotal = hold.cart.reduce((sum, item) => sum + item.subtotal, 0);
                const timeStr = new Date(hold.createdAt).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' });
                
                return (
                  <div key={hold.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-slate-800">{hold.name}</h4>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" /> {timeStr} WIB
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#0D1F3D]">{formatCurrency(grandTotal)}</p>
                        <p className="text-xs text-slate-500">{totalItems} item</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 border-t border-slate-100 pt-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 text-[#00A76F] border-[#00A76F] hover:bg-[#00A76F]/10"
                        onClick={() => handleResume(hold)}
                      >
                        <Play className="w-4 h-4 mr-1.5" /> Resume
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 px-3"
                        onClick={() => handleDelete(hold.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
