'use client'

import { useEffect, useState, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Dialog } from '@/components/ui/dialog'
import { toast } from '@/lib/toast'
import { Plus, Pencil, Trash2, RefreshCw, Search } from 'lucide-react'

interface Canteen {
    id: string
    name: string
}

interface Window {
    id: string
    name: string
    canteen: { id: string; name: string }
}

interface Dish {
    id: string
    name: string
    windowId: string
    price: number
    description: string | null
    category: string
    tags: string[]
    calories: number | null
    protein: number | null
    fat: number | null
    carbs: number | null
    avgRating: number
    reviewCount: number
    isAvailable: boolean
    window: {
        id: string
        name: string
        canteen: {
            id: string
            name: string
            campus: { name: string } | null
        }
    }
    _count: { reviews: number; favorites: number }
}

const EMPTY_FORM = {
    name: '',
    windowId: '',
    price: '',
    description: '',
    category: '其他',
    tags: '',
    calories: '',
    protein: '',
    fat: '',
    carbs: '',
    isAvailable: true,
}

const CATEGORY_OPTIONS = [
    '主食', '小吃', '饮品', '汤品', '凉菜', '热菜', '快餐', '面食', '烧烤', '甜品', '其他',
]

export default function AdminDishesPage() {
    const [dishes, setDishes] = useState<Dish[]>([])
    const [canteens, setCanteens] = useState<Canteen[]>([])
    const [windows, setWindows] = useState<Window[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form, setForm] = useState(EMPTY_FORM)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [selectedCanteenId, setSelectedCanteenId] = useState('')

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({ page: String(page), pageSize: '20' })
            if (search) params.set('search', search)
            const res = await fetch(`/api/admin/dishes?${params}`)
            const json = await res.json()
            if (json.success) {
                setDishes(json.data)
                setTotalPages(json.pagination?.totalPages || 1)
            }
        } catch {
            toast({ type: 'error', title: '加载失败' })
        } finally {
            setLoading(false)
        }
    }, [page, search])

    const fetchCanteens = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/canteens')
            const json = await res.json()
            if (json.success) setCanteens(json.data)
        } catch {}
    }, [])

    const fetchWindows = useCallback(async (canteenId: string) => {
        if (!canteenId) { setWindows([]); return }
        try {
            const res = await fetch(`/api/admin/windows?canteenId=${canteenId}`)
            const json = await res.json()
            if (json.success) setWindows(json.data)
        } catch {}
    }, [])

    useEffect(() => { fetchData() }, [fetchData])
    useEffect(() => { fetchCanteens() }, [fetchCanteens])

    const openCreate = () => {
        setEditingId(null)
        setForm(EMPTY_FORM)
        setSelectedCanteenId('')
        setWindows([])
        setDialogOpen(true)
    }

    const openEdit = (d: Dish) => {
        setEditingId(d.id)
        setForm({
            name: d.name,
            windowId: d.windowId,
            price: String(d.price),
            description: d.description || '',
            category: d.category,
            tags: d.tags.join(','),
            calories: d.calories != null ? String(d.calories) : '',
            protein: d.protein != null ? String(d.protein) : '',
            fat: d.fat != null ? String(d.fat) : '',
            carbs: d.carbs != null ? String(d.carbs) : '',
            isAvailable: d.isAvailable,
        })
        setSelectedCanteenId(d.window.canteen.id)
        fetchWindows(d.window.canteen.id)
        setDialogOpen(true)
    }

    const handleSave = async () => {
        if (!form.name || !form.windowId || !form.price) {
            toast({ type: 'error', title: '请填写必填字段' })
            return
        }
        setSaving(true)
        try {
            const url = editingId ? `/api/admin/dishes/${editingId}` : '/api/admin/dishes'
            const method = editingId ? 'PUT' : 'POST'
            const body = {
                ...form,
                price: parseFloat(form.price),
                tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
                calories: form.calories ? parseInt(form.calories) : null,
                protein: form.protein ? parseFloat(form.protein) : null,
                fat: form.fat ? parseFloat(form.fat) : null,
                carbs: form.carbs ? parseFloat(form.carbs) : null,
            }
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
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
        if (!confirm('确定删除该菜品？此操作不可恢复。')) return
        setDeleting(id)
        try {
            const res = await fetch(`/api/admin/dishes/${id}`, { method: 'DELETE' })
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
                <h1 className="text-2xl font-bold">菜品管理</h1>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={fetchData}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button size="sm" onClick={openCreate}>
                        <Plus className="h-4 w-4 mr-1" />
                        新增菜品
                    </Button>
                </div>
            </div>

            {/* 搜索 */}
            <div className="mb-4">
                <div className="relative max-w-sm">
                    <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1) }}
                        placeholder="搜索菜品名称..."
                        className="pl-9"
                    />
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12 text-muted-foreground">加载中...</div>
            ) : dishes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">暂无菜品数据</div>
            ) : (
                <>
                    <div className="rounded-xl border overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="text-left p-3 font-medium">菜品</th>
                                        <th className="text-left p-3 font-medium">食堂</th>
                                        <th className="text-left p-3 font-medium">窗口</th>
                                        <th className="text-left p-3 font-medium">分类</th>
                                        <th className="text-left p-3 font-medium">价格</th>
                                        <th className="text-left p-3 font-medium">评分</th>
                                        <th className="text-left p-3 font-medium">收藏</th>
                                        <th className="text-left p-3 font-medium">状态</th>
                                        <th className="text-left p-3 font-medium">操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dishes.map(dish => (
                                        <tr key={dish.id} className="border-t hover:bg-muted/30">
                                            <td className="p-3">
                                                <div className="font-medium">{dish.name}</div>
                                                {dish.tags.length > 0 && (
                                                    <div className="flex gap-1 mt-1">
                                                        {dish.tags.slice(0, 3).map(tag => (
                                                            <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-3 text-muted-foreground">
                                                {dish.window.canteen.name}
                                            </td>
                                            <td className="p-3 text-muted-foreground">
                                                {dish.window.name}
                                            </td>
                                            <td className="p-3">
                                                <Badge variant="secondary">{dish.category}</Badge>
                                            </td>
                                            <td className="p-3 font-medium">¥{dish.price.toFixed(0)}</td>
                                            <td className="p-3">
                                                {dish.avgRating > 0 ? (
                                                    <span className="font-medium">{dish.avgRating.toFixed(1)}</span>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </td>
                                            <td className="p-3">{dish._count.favorites}</td>
                                            <td className="p-3">
                                                {dish.isAvailable ? (
                                                    <Badge variant="default" className="bg-green-500">在售</Badge>
                                                ) : (
                                                    <Badge variant="secondary">下架</Badge>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                <div className="flex gap-1">
                                                    <Button variant="ghost" size="sm" onClick={() => openEdit(dish)}>
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(dish.id)}
                                                        disabled={deleting === dish.id}
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

                    {/* 分页 */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                            <span className="text-sm text-muted-foreground">
                                第 {page} / {totalPages} 页
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page <= 1}
                                    onClick={() => setPage(p => p - 1)}
                                >
                                    上一页
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page >= totalPages}
                                    onClick={() => setPage(p => p + 1)}
                                >
                                    下一页
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}

            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                title={editingId ? '编辑菜品' : '新增菜品'}
                className="max-w-xl"
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-1 block">菜品名称 *</label>
                            <Input
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="菜品名称"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">价格 *</label>
                            <Input
                                value={form.price}
                                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                                placeholder="15"
                                type="number"
                                step="0.1"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-1 block">所属食堂</label>
                            <Select
                                value={selectedCanteenId}
                                onChange={e => {
                                    setSelectedCanteenId(e.target.value)
                                    setForm(f => ({ ...f, windowId: '' }))
                                    fetchWindows(e.target.value)
                                }}
                            >
                                <option value="">选择食堂</option>
                                {canteens.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">窗口 *</label>
                            <Select
                                value={form.windowId}
                                onChange={e => setForm(f => ({ ...f, windowId: e.target.value }))}
                                disabled={!selectedCanteenId}
                            >
                                <option value="">选择窗口</option>
                                {windows.map(w => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-1 block">分类</label>
                            <Select
                                value={form.category}
                                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                            >
                                {CATEGORY_OPTIONS.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">标签（逗号分隔）</label>
                            <Input
                                value={form.tags}
                                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                                placeholder="减脂,高蛋白,推荐"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-1 block">描述</label>
                        <Textarea
                            value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            placeholder="菜品描述（选填）"
                            rows={2}
                        />
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                        <div>
                            <label className="text-xs font-medium mb-1 block text-muted-foreground">卡路里</label>
                            <Input
                                value={form.calories}
                                onChange={e => setForm(f => ({ ...f, calories: e.target.value }))}
                                placeholder="kcal"
                                type="number"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium mb-1 block text-muted-foreground">蛋白质(g)</label>
                            <Input
                                value={form.protein}
                                onChange={e => setForm(f => ({ ...f, protein: e.target.value }))}
                                placeholder="g"
                                type="number"
                                step="0.1"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium mb-1 block text-muted-foreground">脂肪(g)</label>
                            <Input
                                value={form.fat}
                                onChange={e => setForm(f => ({ ...f, fat: e.target.value }))}
                                placeholder="g"
                                type="number"
                                step="0.1"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium mb-1 block text-muted-foreground">碳水(g)</label>
                            <Input
                                value={form.carbs}
                                onChange={e => setForm(f => ({ ...f, carbs: e.target.value }))}
                                placeholder="g"
                                type="number"
                                step="0.1"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isAvailable"
                            checked={form.isAvailable}
                            onChange={e => setForm(f => ({ ...f, isAvailable: e.target.checked }))}
                            className="rounded"
                        />
                        <label htmlFor="isAvailable" className="text-sm">在售</label>
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
