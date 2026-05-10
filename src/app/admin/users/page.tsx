'use client'

import { useEffect, useState, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { toast } from '@/lib/toast'
import { RefreshCw, Shield, Trash2 } from 'lucide-react'

interface User {
    id: string
    name: string | null
    email: string | null
    role: string
    createdAt: string
    deletedAt: string | null
    profile: { major: string | null; grade: string | null } | null
    _count: { reviews: number; favorites: number }
}

const ROLE_OPTIONS = [
    { value: 'user', label: '普通用户' },
    { value: 'admin', label: '管理员' },
    { value: 'superadmin', label: '超级管理员' },
]

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [roleDialogOpen, setRoleDialogOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [selectedRole, setSelectedRole] = useState('')
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState<string | null>(null)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({ page: String(page), pageSize: '20' })
            const res = await fetch(`/api/admin/users?${params}`)
            const json = await res.json()
            if (json.success) {
                setUsers(json.data)
                setTotalPages(json.pagination?.totalPages || 1)
            }
        } catch {
            toast({ type: 'error', title: '加载失败' })
        } finally {
            setLoading(false)
        }
    }, [page])

    useEffect(() => { fetchData() }, [fetchData])

    const openRoleDialog = (user: User) => {
        setEditingUser(user)
        setSelectedRole(user.role)
        setRoleDialogOpen(true)
    }

    const handleRoleChange = async () => {
        if (!editingUser || !selectedRole) return
        setSaving(true)
        try {
            const res = await fetch(`/api/admin/users/${editingUser.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: selectedRole }),
            })
            const json = await res.json()
            if (json.success) {
                toast({ type: 'success', title: '角色修改成功' })
                setRoleDialogOpen(false)
                fetchData()
            } else {
                toast({ type: 'error', title: json.error?.message || '修改失败' })
            }
        } catch {
            toast({ type: 'error', title: '网络错误' })
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('确定禁用该用户？')) return
        setDeleting(id)
        try {
            const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
            const json = await res.json()
            if (json.success) {
                toast({ type: 'success', title: '用户已禁用' })
                fetchData()
            } else {
                toast({ type: 'error', title: json.error?.message || '操作失败' })
            }
        } catch {
            toast({ type: 'error', title: '网络错误' })
        } finally {
            setDeleting(null)
        }
    }

    const getRoleBadge = (role: string) => {
        const variant = role === 'superadmin' ? 'destructive' : role === 'admin' ? 'default' : 'secondary'
        const label = ROLE_OPTIONS.find(o => o.value === role)?.label || role
        return <Badge variant={variant}>{label}</Badge>
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">用户管理</h1>
                <Button variant="ghost" size="sm" onClick={fetchData}>
                    <RefreshCw className="h-4 w-4" />
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-muted-foreground">加载中...</div>
            ) : users.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">暂无用户</div>
            ) : (
                <>
                    <div className="rounded-xl border overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="text-left p-3 font-medium">用户</th>
                                        <th className="text-left p-3 font-medium">邮箱</th>
                                        <th className="text-left p-3 font-medium">角色</th>
                                        <th className="text-left p-3 font-medium">评价</th>
                                        <th className="text-left p-3 font-medium">收藏</th>
                                        <th className="text-left p-3 font-medium">注册时间</th>
                                        <th className="text-left p-3 font-medium">操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(user => (
                                        <tr key={user.id} className="border-t hover:bg-muted/30">
                                            <td className="p-3">
                                                <div className="font-medium">{user.name || '未设置'}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {user.profile?.major || ''} {user.profile?.grade || ''}
                                                </div>
                                            </td>
                                            <td className="p-3 text-muted-foreground">{user.email}</td>
                                            <td className="p-3">{getRoleBadge(user.role)}</td>
                                            <td className="p-3">{user._count.reviews}</td>
                                            <td className="p-3">{user._count.favorites}</td>
                                            <td className="p-3 text-muted-foreground">
                                                {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                                            </td>
                                            <td className="p-3">
                                                <div className="flex gap-1">
                                                    <Button variant="ghost" size="sm" onClick={() => openRoleDialog(user)}>
                                                        <Shield className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(user.id)}
                                                        disabled={deleting === user.id || user.role === 'superadmin'}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-6">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page <= 1}
                                onClick={() => setPage(p => p - 1)}
                            >
                                上一页
                            </Button>
                            <span className="flex items-center text-sm text-muted-foreground px-2">
                                {page} / {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => p + 1)}
                            >
                                下一页
                            </Button>
                        </div>
                    )}
                </>
            )}

            <Dialog
                open={roleDialogOpen}
                onClose={() => setRoleDialogOpen(false)}
                title="修改用户角色"
                description={`用户：${editingUser?.name || editingUser?.email}`}
            >
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-1 block">选择角色</label>
                        <select
                            value={selectedRole}
                            onChange={e => setSelectedRole(e.target.value)}
                            className="w-full h-10 rounded-lg border bg-background text-foreground px-4 text-sm"
                        >
                            {ROLE_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>取消</Button>
                        <Button onClick={handleRoleChange} disabled={saving}>
                            {saving ? '保存中...' : '确认修改'}
                        </Button>
                    </div>
                </div>
            </Dialog>
        </div>
    )
}
