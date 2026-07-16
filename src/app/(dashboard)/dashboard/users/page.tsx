"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Plus, MoreVertical, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [currentUserAuthId, setCurrentUserAuthId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Role state
  const [editRoleUser, setEditRoleUser] = useState<any | null>(null);
  const [selectedRole, setSelectedRole] = useState<"ADMIN" | "KASIR">("KASIR");
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete state
  const [deleteUser, setDeleteUser] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
        setCurrentUserAuthId(data.currentUserAuthId);
      } else {
        setError(data.error || "Gagal memuat pengguna");
      }
    } catch (err) {
      setError("Terjadi kesalahan sistem");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!editRoleUser) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/users/${editRoleUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole })
      });
      const data = await res.json();
      if (data.success) {
        setUsers(users.map(u => u.id === editRoleUser.id ? { ...u, role: selectedRole } : u));
        setEditRoleUser(null);
      } else {
        alert(data.error || "Gagal mengubah role");
      }
    } catch (err) {
      alert("Terjadi kesalahan sistem");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUser) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/users/${deleteUser.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setUsers(users.filter(u => u.id !== deleteUser.id));
        setDeleteUser(null);
      } else {
        alert(data.error || "Gagal menghapus pengguna");
      }
    } catch (err) {
      alert("Terjadi kesalahan sistem");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#0D1F3D]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-6 rounded-xl flex flex-col items-center justify-center text-center">
        <ShieldAlert className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-lg font-bold text-red-700 mb-2">Akses Ditolak</h2>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Manajemen Pengguna</h2>
          <p className="text-sm text-slate-500">Kelola akses tim dan karyawan ke sistem kasir Anda.</p>
        </div>
        <Link href="/dashboard/users/invite">
          <Button className="bg-[#0D1F3D] hover:bg-[#0D1F3D]/90 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Undang Pengguna
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Bergabung Sejak</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                  Belum ada pengguna terdaftar.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const isMe = user.authId === currentUserAuthId;
                const isOtherOwner = user.role === "OWNER" && !isMe;
                const canEdit = !isMe && !isOtherOwner;

                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium text-slate-800">
                      {user.name} {isMe && <span className="text-xs text-slate-400 font-normal ml-1">(Anda)</span>}
                    </TableCell>
                    <TableCell className="text-slate-600">{user.email}</TableCell>
                    <TableCell>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        user.role === 'OWNER' ? 'bg-purple-100 text-purple-700' :
                        user.role === 'ADMIN' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`flex items-center gap-1.5 text-xs font-medium ${
                        user.isActive ? 'text-[#00A76F]' : 'text-slate-400'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-[#00A76F]' : 'bg-slate-300'}`} />
                        {user.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {new Date(user.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric", month: "short", year: "numeric"
                      })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" disabled={!canEdit} />}>
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setEditRoleUser(user);
                            setSelectedRole(user.role === "OWNER" ? "ADMIN" : user.role); // Safeguard UI
                          }}>
                            Edit Role
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600 focus:bg-red-50 focus:text-red-700"
                            onClick={() => setDeleteUser(user)}
                          >
                            Hapus Pengguna
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Role Modal */}
      <Dialog open={!!editRoleUser} onOpenChange={(open) => !isUpdating && !open && setEditRoleUser(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Ubah Akses Pengguna</DialogTitle>
            <DialogDescription>
              Tentukan hak akses untuk <span className="font-bold text-slate-800">{editRoleUser?.name}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div 
              onClick={() => setSelectedRole("ADMIN")}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedRole === "ADMIN" ? "border-[#00A76F] bg-[#00A76F]/5" : "border-slate-200 hover:border-slate-300"}`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-slate-800">Admin</span>
                {selectedRole === "ADMIN" && <span className="w-4 h-4 rounded-full bg-[#00A76F] border-4 border-white shadow-[0_0_0_1px_#00A76F]" />}
              </div>
              <p className="text-xs text-slate-500">Dapat mengelola produk, laporan, kasir, dan pengaturan toko.</p>
            </div>
            
            <div 
              onClick={() => setSelectedRole("KASIR")}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedRole === "KASIR" ? "border-[#00A76F] bg-[#00A76F]/5" : "border-slate-200 hover:border-slate-300"}`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-slate-800">Kasir</span>
                {selectedRole === "KASIR" && <span className="w-4 h-4 rounded-full bg-[#00A76F] border-4 border-white shadow-[0_0_0_1px_#00A76F]" />}
              </div>
              <p className="text-xs text-slate-500">Hanya dapat mengakses transaksi POS dan daftar produk.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRoleUser(null)} disabled={isUpdating}>Batal</Button>
            <Button onClick={handleUpdateRole} disabled={isUpdating} className="bg-[#0D1F3D] hover:bg-[#0D1F3D]/90">
              {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Modal */}
      <Dialog open={!!deleteUser} onOpenChange={(open) => !isDeleting && !open && setDeleteUser(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Hapus Pengguna</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus <span className="font-bold text-slate-800">{deleteUser?.name}</span>? 
              Aksi ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteUser(null)} disabled={isDeleting}>Batal</Button>
            <Button onClick={handleDeleteUser} disabled={isDeleting} className="bg-red-600 hover:bg-red-700 text-white">
              {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
