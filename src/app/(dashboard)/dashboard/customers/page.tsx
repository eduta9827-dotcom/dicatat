"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2,
  Loader2,
  AlertTriangle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatCurrency } from "@/lib/utils";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCustomers = async (searchQuery = "", pageNum = 1) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/customers?search=${searchQuery}&page=${pageNum}&limit=10`);
      const data = await res.json();
      if (data.success) {
        setCustomers(data.data);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchCustomers(search, 1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Handle pagination change
  useEffect(() => {
    if (page > 1) {
      fetchCustomers(search, page);
    }
  }, [page]);

  const handleDelete = async () => {
    if (!deleteId) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/customers/${deleteId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      
      if (data.success) {
        fetchCustomers(search, page);
      } else {
        alert(data.error || "Gagal menghapus pelanggan");
      }
    } catch (error) {
      console.error("Failed to delete customer:", error);
      alert("Terjadi kesalahan sistem");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pelanggan</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola data pelanggan dan riwayat belanjanya.</p>
        </div>
        <Link href="/dashboard/customers/create">
          <Button className="bg-[#0D1F3D] hover:bg-[#0D1F3D]/90 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Pelanggan
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Cari nama atau no. telepon..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>No. Telepon</TableHead>
                <TableHead>Alamat</TableHead>
                <TableHead className="text-center">Total Transaksi</TableHead>
                <TableHead className="text-right">Total Belanja</TableHead>
                <TableHead>Kunjungan Terakhir</TableHead>
                <TableHead className="w-[80px] text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                    <p className="text-sm text-slate-500 mt-2">Memuat data pelanggan...</p>
                  </TableCell>
                </TableRow>
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <p className="text-base font-medium text-slate-900 mb-1">Belum ada pelanggan</p>
                      <p className="text-sm mb-4">Tambahkan pelanggan pertama Anda untuk mulai melacak.</p>
                      <Link href="/dashboard/customers/create">
                        <Button variant="outline">Tambah Pelanggan</Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.phone || "-"}</TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate" title={customer.address || ""}>
                        {customer.address || "-"}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{customer.totalTransactions}</TableCell>
                    <TableCell className="text-right">{formatCurrency(customer.totalSpent)}</TableCell>
                    <TableCell>
                      {customer.lastVisit 
                        ? format(new Date(customer.lastVisit), "dd MMM yyyy, HH:mm", { locale: localeId })
                        : "-"
                      }
                    </TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem render={<Link href={`/dashboard/customers/${customer.id}`} className="cursor-pointer flex items-center" />}>
                            <Eye className="mr-2 h-4 w-4 text-slate-500" />
                            <span>Detail</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem render={<Link href={`/dashboard/customers/${customer.id}/edit`} className="cursor-pointer flex items-center" />}>
                            <Edit className="mr-2 h-4 w-4 text-slate-500" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setDeleteId(customer.id)}
                            className="cursor-pointer text-red-600 focus:text-red-600 flex items-center"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Hapus</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex justify-between items-center">
            <p className="text-sm text-slate-500">
              Halaman {page} dari {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Hapus Pelanggan
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus pelanggan ini? Data yang sudah dihapus tidak dapat dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
