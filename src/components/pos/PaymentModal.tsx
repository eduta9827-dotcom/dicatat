"use client";

import { useState, useEffect } from "react";
import { Loader2, DollarSign, CreditCard, QrCode, CalendarClock, X, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtotal: number;
  cart: any[];
  onSuccess: (transactionData: any) => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  subtotal,
  cart,
  onSuccess,
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "TRANSFER" | "QRIS" | "PAY_LATER">("CASH");
  const [discount, setDiscount] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Customer state
  const [selectedCustomer, setSelectedCustomer] = useState<{id: string, name: string, phone: string} | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<any[]>([]);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  
  // New customer form state
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerAddress, setNewCustomerAddress] = useState("");
  const [isSubmittingCustomer, setIsSubmittingCustomer] = useState(false);

  const discountVal = parseInt(discount) || 0;
  const grandTotal = Math.max(0, subtotal - discountVal);
  const paidVal = parseInt(paidAmount) || 0;
  const changeAmount = paidVal - grandTotal;

  // Suggested amounts for CASH
  const suggestedAmounts = [
    grandTotal,
    Math.ceil(grandTotal / 50000) * 50000,
    Math.ceil(grandTotal / 100000) * 100000,
  ].filter((v, i, a) => a.indexOf(v) === i && v >= grandTotal);

  useEffect(() => {
    if (isOpen) {
      setPaymentMethod("CASH");
      setDiscount("");
      setPaidAmount("");
      setDueDate("");
      setError(null);
      setSelectedCustomer(null);
      setCustomerSearch("");
      setCustomerResults([]);
      setShowAddCustomer(false);
    }
  }, [isOpen]);

  // Debounce customer search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (customerSearch.length < 2) {
        setCustomerResults([]);
        return;
      }
      try {
        const res = await fetch(`/api/customers?search=${customerSearch}&limit=5`);
        const data = await res.json();
        if (data.success) {
          setCustomerResults(data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch customers", err);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingCustomer(true);
    setError(null);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCustomerName,
          phone: newCustomerPhone,
          address: newCustomerAddress
        })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedCustomer(data.data);
        setShowAddCustomer(false);
        setNewCustomerName("");
        setNewCustomerPhone("");
        setNewCustomerAddress("");
      } else {
        setError(data.error || "Gagal menambah pelanggan");
      }
    } catch (err) {
      setError("Terjadi kesalahan sistem saat menambah pelanggan");
    } finally {
      setIsSubmittingCustomer(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (paymentMethod === "PAY_LATER" && !selectedCustomer) {
      setError("Pilih pelanggan untuk transaksi kasbon");
      return;
    }

    if (paymentMethod === "CASH" && paidVal < grandTotal) {
      setError("Uang pembayaran kurang dari total tagihan.");
      return;
    }

    if (paymentMethod === "PAY_LATER" && !dueDate) {
      setError("Tanggal jatuh tempo wajib diisi untuk metode Kasbon.");
      return;
    }

    setIsProcessing(true);

    try {
      const payload = {
        items: cart.map((c) => ({ productId: c.product.id, qty: c.qty })),
        paymentMethod,
        discountAmount: discountVal,
        paidAmount: paymentMethod === "PAY_LATER" ? 0 : paidVal,
        dueDate: paymentMethod === "PAY_LATER" ? dueDate : null,
        customerId: selectedCustomer?.id || null,
      };

      const res = await fetch("/api/pos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess(data.data);
      } else {
        setError(data.error || "Gagal memproses transaksi");
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan sistem");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isProcessing && !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Pembayaran</DialogTitle>
        </DialogHeader>

        {showAddCustomer ? (
          <form onSubmit={handleAddCustomer} className="space-y-4 py-4">
            <h3 className="font-semibold text-slate-800 border-b pb-2">Tambah Pelanggan Baru</h3>
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label>Nama Pelanggan *</Label>
              <Input 
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                placeholder="Nama lengkap"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>No. Telepon *</Label>
              <Input 
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
                placeholder="0812..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Alamat (Opsional)</Label>
              <Textarea 
                value={newCustomerAddress}
                onChange={(e) => setNewCustomerAddress(e.target.value)}
                placeholder="Alamat pelanggan"
                className="resize-none h-20"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowAddCustomer(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmittingCustomer} className="bg-[#00A76F] hover:bg-[#00A76F]/90">
                {isSubmittingCustomer ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Simpan
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Payment Methods */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { id: "CASH", label: "Tunai", icon: DollarSign },
                { id: "TRANSFER", label: "Transfer", icon: CreditCard },
                { id: "QRIS", label: "QRIS", icon: QrCode },
                { id: "PAY_LATER", label: "Kasbon", icon: CalendarClock },
              ].map((method) => {
                const Icon = method.icon;
                const isActive = paymentMethod === method.id;
                return (
                  <div
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id as any)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      isActive 
                        ? "border-[#00A76F] bg-[#00A76F]/10 text-[#00A76F]" 
                        : "border-slate-100 bg-white text-slate-500 hover:border-slate-200"
                    }`}
                  >
                    <Icon className="w-6 h-6 mb-2" />
                    <span className="text-xs font-bold">{method.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Customer Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Pelanggan 
                {paymentMethod === 'PAY_LATER' ? (
                  <span className="text-red-500 ml-1">*wajib</span>
                ) : (
                  <span className="text-slate-400 ml-1">(opsional)</span>
                )}
              </label>
              
              {selectedCustomer ? (
                <div className="flex items-center justify-between p-3 bg-[#00A76F]/10 border border-[#00A76F]/20 rounded-md">
                  <div>
                    <p className="font-medium text-sm text-slate-900">{selectedCustomer.name}</p>
                    <p className="text-xs text-slate-500">{selectedCustomer.phone}</p>
                  </div>
                  <button type="button" onClick={() => setSelectedCustomer(null)} className="hover:bg-black/5 p-1 rounded-full transition-colors">
                    <X size={16} className="text-slate-500" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    placeholder="Cari nama atau telepon pelanggan..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                  />
                  {/* Dropdown hasil search */}
                  {customerResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 bg-white border rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
                      {customerResults.map((customer) => (
                        <button
                          key={customer.id}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm border-b last:border-0"
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setCustomerSearch('');
                            setCustomerResults([]);
                          }}
                        >
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-xs text-slate-500">{customer.phone}</p>
                        </button>
                      ))}
                    </div>
                  )}
                  {/* Tombol tambah pelanggan baru */}
                  <button
                    type="button"
                    className="mt-2 text-xs text-[#00A76F] hover:underline flex items-center gap-1 font-medium"
                    onClick={() => setShowAddCustomer(true)}
                  >
                    <Plus size={12} /> Tambah pelanggan baru
                  </button>
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-semibold">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-slate-500">Diskon (Rp)</span>
                <Input 
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-32 h-8 text-right bg-white"
                  placeholder="0"
                />
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-between items-end">
                <span className="text-base font-bold text-slate-800">Total Tagihan</span>
                <span className="text-2xl font-black text-[#0D1F3D]">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>

            {paymentMethod === "CASH" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <Label>Nominal Uang Diterima</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">Rp</span>
                    <Input 
                      type="number"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      className="pl-10 text-lg font-semibold h-12"
                      placeholder="0"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {suggestedAmounts.map((amt) => (
                    <Button 
                      key={amt} 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => setPaidAmount(amt.toString())}
                    >
                      {formatCurrency(amt)}
                    </Button>
                  ))}
                </div>
                
                {paidVal >= grandTotal && (
                  <div className="bg-[#00A76F]/10 text-[#00A76F] p-4 rounded-xl flex justify-between items-center">
                    <span className="font-semibold">Kembalian</span>
                    <span className="text-xl font-bold">{formatCurrency(changeAmount)}</span>
                  </div>
                )}
              </div>
            )}

            {paymentMethod === "PAY_LATER" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <Label>Tanggal Jatuh Tempo <span className="text-red-500">*</span></Label>
                  <Input 
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="h-12"
                    required
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isProcessing}>
                Batal
              </Button>
              <Button 
                type="submit" 
                className="bg-[#00A76F] hover:bg-[#00A76F]/90 text-white min-w-[140px]"
                disabled={isProcessing || (paymentMethod === "CASH" && paidVal < grandTotal)}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Proses Pembayaran"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
