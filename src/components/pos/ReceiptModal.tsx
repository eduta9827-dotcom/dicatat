"use client";

import { Printer, RefreshCcw } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any; // Ideally typed with the Transaction Prisma model incl details
  storeName?: string;
  onNewTransaction: () => void;
}

export function ReceiptModal({
  isOpen,
  onClose,
  transaction,
  storeName = "Dicatat POS",
  onNewTransaction,
}: ReceiptModalProps) {
  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDone = () => {
    onClose();
    onNewTransaction();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDone()}>
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden bg-slate-100 print:bg-white print:shadow-none print:w-full print:max-w-full">
        {/* Printable Area */}
        <div className="p-6 bg-white min-h-[400px] mx-auto w-full max-w-[350px] shadow-sm print:shadow-none font-mono text-sm">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold uppercase tracking-wider mb-1">{storeName}</h2>
            <p className="text-xs text-slate-500">Struk Pembelian</p>
          </div>

          <div className="flex justify-between text-xs mb-4 pb-4 border-b border-dashed border-slate-300">
            <div>
              <p>No: {transaction.invoice}</p>
              <p>Kasir: {transaction.cashier?.name || "-"}</p>
            </div>
            <div className="text-right">
              <p>{new Date(transaction.createdAt).toLocaleDateString("id-ID")}</p>
              <p>{new Date(transaction.createdAt).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })} WIB</p>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            {transaction.details?.map((item: any) => (
              <div key={item.id}>
                <p className="font-semibold truncate">{item.productName}</p>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>{item.qty} x {formatCurrency(item.sellPrice)}</span>
                  <span>{formatCurrency(item.subtotal)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-slate-300 pt-3 space-y-1 mb-4">
            <div className="flex justify-between text-xs">
              <span>Subtotal</span>
              <span>{formatCurrency(transaction.subtotal)}</span>
            </div>
            {transaction.discountAmount > 0 && (
              <div className="flex justify-between text-xs">
                <span>Diskon</span>
                <span>-{formatCurrency(transaction.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base mt-2">
              <span>TOTAL</span>
              <span>{formatCurrency(transaction.grandTotal)}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-slate-300 pt-3 space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Metode Bayar</span>
              <span className="uppercase">{transaction.paymentMethod}</span>
            </div>
            {transaction.paymentMethod !== "PAY_LATER" && (
              <>
                <div className="flex justify-between">
                  <span>Tunai</span>
                  <span>{formatCurrency(transaction.paidAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kembali</span>
                  <span>{formatCurrency(transaction.changeAmount)}</span>
                </div>
              </>
            )}
          </div>

          <div className="text-center mt-8 text-xs text-slate-500">
            <p>Terima kasih atas kunjungan Anda!</p>
            <p className="mt-1 opacity-50">Powered by Dicatat</p>
          </div>
        </div>

        {/* Action Buttons (Not Printable) */}
        <div className="p-4 bg-slate-50 border-t flex gap-2 print:hidden">
          <Button 
            variant="outline" 
            className="flex-1 border-[#0D1F3D] text-[#0D1F3D]"
            onClick={handlePrint}
          >
            <Printer className="w-4 h-4 mr-2" />
            Cetak
          </Button>
          <Button 
            className="flex-1 bg-[#00A76F] hover:bg-[#00A76F]/90 text-white"
            onClick={handleDone}
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Transaksi Baru
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
