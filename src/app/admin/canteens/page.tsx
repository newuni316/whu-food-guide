'use client'

import { useEffect, useState, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Dialog } from '@/components/ui/dialog'
import { toast } from '@/lib/toast'
import { Plus, Pencil, Trash2, RefreshCw } from 'lucide-react'

interface Campus {
    id: string
    name: string
    code: string
}

interface Canteen {
    id: string
    name: string
    slug: string
    campusId: string
    campus: Campus
    address: string
    latitude: number
    longitude: number
    phone: string | null
    description: string | null
    isOpen: boolean
    avgRating: number
    _count: { windows: number; reviews: number }
}

const EMPTY_FORM = {
    name: '',
    slug: '',
    campusId: '',
    address: '',
    latitude: '',
    longitude: '',
    phone: '',
    description: '',
    isOpen: true,
}

export default function AdminCanteensPage() {
    const [canteens, setCanteens] = useState<Canteen[]>([])
    const [campuses, setCampuses] = useState<Campus[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form, setForm] = useState(EMPTY_FORM)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState<string | null>(null)

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/canteens')
            const json = await res.json()
            if (json.success) setCanteens(json.data)
        } catch {
            toast({ type: 'error', title: '加载失败' })
        } finally {
            setLoading(false)
        }
    }, [])

    const fetchCampuses = useCallback(async () => {
        try {
            const res = await fetch('/api/campuses')
            const json = await res.json()
            if (json.success) setCampuses(json.data)
        } catch {
            // campuses API may not exist, fallback
        }
    }, [])

    useEffect(() => { fetchData(); fetchCampuses() }, [fetchData, fetchCampuses])

    const openCreate = () => {
        setEditingId(null)
        setForm(EMPTY_FORM)
        setDialogOpen(true)
    }

    const openEdit = (c: Canteen) => {
        setEditingId(c.id)
        setForm({
            name: c.name,
            slug: c.slug,
            campusId: c.campusId,
            address: c.address,
            latitude: String(c.latitude),
            longitude: String(c.longitude),
            phone: c.phone || '',
            description: c.description || '',
            isOpen: c.isOpen,
        })
        setDialogOpen(true)
    }

    const handleSave = async () => {
        if (!form.name || !form.slug || !form.campusId || !form.address) {
            toast({ type: 'error', title: '请填写必填字段' })
            return
        }
        setSaving(true)
        try {
            const url = editingId ? `/api/admin/canteens/${editingId}` : '/api/admin/canteens'
            const method = editingId ? 'PUT' : 'POST'
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            const json = await res.json()
            if (json.success) {
                toast({ type: 'success', title: editingId ? '修改成功' : '创建成功' })
                setDialogOpen(false)
                fetchData()
            } else {
                toast({ type: 'error', title: json.error?.message || '操作失败' })
            }
        } catch {
            toast({ type: 'error', title: '网络错误' })
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('确定删除该食堂？此操作不可恢复。')) return
        setDeleting(id)
        try {
            const res = await fetch(`/api/admin/canteens/${id}`, { method: 'DELETE' })
            const json = await res.json()
            if (json.success) {
                toast({ type: 'success', title: '删除成功' })
                fetchData()
            } else {
                toast({ type: 'error', title: json.error?.message || '删除失败' })
            }
        } catch {
            toast({ type: 'error', title: '网络错误' })
        } finally {
            setDeleting(null)
        }
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">食堂管理</h1>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={fetchData}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button size="sm" onClick={openCreate}>
                        <Plus className="h-4 w-4 mr-1" />
                        新增食堂
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12 text-muted-foreground">加载中...</div>
            ) : canteens.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">暂无食堂数据</div>
            ) : (
                <div className="rounded-xl border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="text-left p-3 font-medium">食堂</th>
                                    <th className="text-left p-3 font-medium">校区</th>
                                    <th className="text-left p-3 font-medium">评分</th>
                                    <th className="text-left p-3 font-medium">窗口</th>
                                    <th className="text-left p-3 font-medium">评价</th>
                                    <th className="text-left p-3 font-medium">状态</th>
                                    <th className="text-left p-3 font-medium">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {canteens.map(canteen => (
                                    <tr key={canteen.id} className="border-t hover:bg-muted/30">
                                        <td className="p-3">
                                            <div className="font-medium">{canteen.name}</div>
                                            <div className="text-xs text-muted-foreground">{canteen.address}</div>
                                        </td>
                                        <td className="p-3">
                                            <Badge variant="outline">{canteen.campus?.name || '-'}</Badge>
                                        </td>
                                        <td className="p-3">
                                            <span className="font-medium">{canteen.avgRating.toFixed(1)}</span>
                                        </td>
                                        <td className="p-3">{canteen._count.windows}</td>
                                        <td className="p-3">{canteen._count.reviews}</td>
                                        <td className="p-3">
                                            {canteen.isOpen ? (
                                                <Badge variant="default" className="bg-green-500">营业中</Badge>
                                            ) : (
                                                <Badge variant="secondary">已关闭</Badge>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="sm" onClick={() => openEdit(canteen)}>
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(canteen.id)}
                                                    disabled={deleting === canteen.id}
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
            )}

            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                title={editingId ? '编辑食堂' : '新增食堂'}
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-1 block">名称 *</label>
                            <Input
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="食堂名称"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">Slug *</label>
                            <Input
                                value={form.slug}
                                onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                                placeholder="url-slug"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-1 block">校区 *</label>
                            <Select
                                value={form.campusId}
                                onChange={e => setForm(f => ({ ...f, campusId: e.target.value }))}
                            >
                                <option value="">选择校区</option>
                                {campuses.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">地址 *</label>
                            <Input
                                value={form.address}
                                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                                placeholder="详细地址"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-1 block">纬度 *</label>
                            <Input
                                value={form.latitude}
                                onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))}
                                placeholder="30.538"
                                type="number"
                                step="0.001"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">经度 *</label>
                            <Input
                                value={form.longitude}
                                onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))}
                                placeholder="114.361"
                                type="number"
                                step="0.001"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1 block">电话</label>
                        <Input
                            value={form.phone}
                            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                            placeholder="联系电话（选填）"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1 block">描述</label>
                        <Textarea
                            value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            placeholder="食堂简介（选填）"
                            rows={3}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isOpen"
                            checked={form.isOpen}
                            onChange={e => setForm(f => ({ ...f, isOpen: e.target.checked }))}
                            className="rounded"
                        />
                        <label htmlFor="isOpen" className="text-sm">营业中</label>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? '保存中...' : '保存'}
                        </Button>
                    </div>
                </div>
            </Dialog>
        </div>
    )
}
