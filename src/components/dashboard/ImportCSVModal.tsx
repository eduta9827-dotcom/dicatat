"use client";

import { useState, useRef } from "react";
import { Upload, FileText, AlertCircle, Loader2, Download, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Papa from "papaparse";

interface ImportCSVModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedRow {
  nama: string;
  kategori: string;
  harga_beli: string | number;
  harga_jual: string | number;
  stok: string | number;
  sku: string;
  barcode: string;
  _isValid?: boolean;
  _errors?: string[];
}

export function ImportCSVModal({ isOpen, onClose, onSuccess }: ImportCSVModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setFile(null);
    setParsedData([]);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    if (isImporting) return;
    resetState();
    onClose();
  };

  const downloadTemplate = () => {
    const template = "nama,kategori,harga_beli,harga_jual,stok,sku,barcode\nProduk Contoh,Minuman,3000,5000,10,SKU001,123456789";
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "template_import_produk.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsParsing(true);

    Papa.parse<ParsedRow>(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Validate rows
        const validatedData = results.data.map(row => {
          const errors: string[] = [];
          if (!row.nama || row.nama.trim() === "") errors.push("Nama kosong");
          if (!row.harga_jual || isNaN(Number(row.harga_jual))) errors.push("Harga jual tidak valid");
          if (row.stok && isNaN(Number(row.stok))) errors.push("Stok tidak valid");
          
          return {
            ...row,
            _isValid: errors.length === 0,
            _errors: errors
          };
        });
        
        setParsedData(validatedData);
        setIsParsing(false);
      },
      error: (error: any) => {
        alert("Gagal membaca file CSV: " + error.message);
        setIsParsing(false);
      }
    });
  };

  const handleImport = async () => {
    const validData = parsedData.filter(d => d._isValid);
    if (validData.length === 0) {
      alert("Tidak ada data valid untuk di-import.");
      return;
    }

    setIsImporting(true);
    try {
      // Map to API payload
      const payload = validData.map(d => ({
        name: d.nama,
        categoryName: d.kategori,
        buyPrice: Number(d.harga_beli) || 0,
        sellPrice: Number(d.harga_jual),
        stock: Number(d.stok) || 0,
        sku: d.sku,
        barcode: d.barcode
      }));

      const res = await fetch("/api/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: payload }),
      });
      
      const data = await res.json();
      if (data.success) {
        setImportResult({ success: data.success, failed: data.failed });
        onSuccess(); // refresh table in parent
      } else {
        alert(data.error || "Gagal import produk");
      }
    } catch (err) {
      alert("Terjadi kesalahan sistem saat import.");
    } finally {
      setIsImporting(false);
    }
  };

  const validCount = parsedData.filter(d => d._isValid).length;
  const invalidCount = parsedData.length - validCount;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Produk via CSV</DialogTitle>
          <DialogDescription>
            Unggah file CSV dengan format yang ditentukan untuk menambahkan banyak produk sekaligus.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {!file && !importResult && (
            <div className="space-y-4">
              <div 
                className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-10 h-10 text-slate-400 mb-3" />
                <p className="text-sm font-medium text-slate-700">Klik untuk unggah file CSV</p>
                <p className="text-xs text-slate-500 mt-1">Maks. 5MB</p>
                <input 
                  type="file" 
                  accept=".csv" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Butuh template?</p>
                    <p className="text-xs text-blue-700 mt-1">Gunakan template CSV kami agar format data sesuai.</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="bg-white" onClick={downloadTemplate}>
                  <Download className="w-4 h-4 mr-2" />
                  Template
                </Button>
              </div>
            </div>
          )}

          {isParsing && (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p>Membaca file CSV...</p>
            </div>
          )}

          {file && !isParsing && !importResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-900">Preview Data</h4>
                  <p className="text-sm text-slate-500">Ditemukan {parsedData.length} baris. ({validCount} valid, {invalidCount} tidak valid)</p>
                </div>
                <Button variant="ghost" size="sm" onClick={resetState}>Ganti File</Button>
              </div>

              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Harga Jual</TableHead>
                      <TableHead>Stok</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.slice(0, 5).map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium truncate max-w-[150px]">{row.nama || "-"}</TableCell>
                        <TableCell>{row.kategori || "-"}</TableCell>
                        <TableCell>{row.harga_jual || "-"}</TableCell>
                        <TableCell>{row.stok || "-"}</TableCell>
                        <TableCell>
                          {row._isValid ? (
                            <span className="inline-flex items-center text-xs font-medium text-green-600">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-xs font-medium text-red-600" title={row._errors?.join(", ")}>
                              <AlertCircle className="w-3 h-3 mr-1" /> Invalid
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {parsedData.length > 5 && (
                <p className="text-xs text-center text-slate-500">Dan {parsedData.length - 5} baris lainnya...</p>
              )}
            </div>
          )}

          {importResult && (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Import Selesai!</h3>
              <p className="text-slate-600">
                Berhasil mengimpor <strong>{importResult.success}</strong> produk.
                {importResult.failed > 0 && ` Gagal mengimpor ${importResult.failed} produk.`}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-end border-t pt-4">
          {!importResult ? (
            <>
              <Button type="button" variant="outline" onClick={handleClose} disabled={isImporting}>
                Batal
              </Button>
              <Button 
                type="button" 
                onClick={handleImport} 
                disabled={!file || validCount === 0 || isImporting}
                className="bg-[#00A76F] hover:bg-[#00A76F]/90 text-white"
              >
                {isImporting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Import {validCount} Produk
              </Button>
            </>
          ) : (
            <Button type="button" onClick={handleClose} className="bg-[#00A76F] hover:bg-[#00A76F]/90 text-white">
              Tutup
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
