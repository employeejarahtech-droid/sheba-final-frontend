import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  Upload,
  Trash2,
  Image as ImageIcon,
  Search,
  Copy,
  Eye,
  X,
  HardDrive,
  Calendar,
  Folder,
  FolderPlus,
  Pencil,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { getCookie } from '@/lib/cookies'
import { useCan } from '@/hooks/use-can'

interface GalleryImage {
  id: string
  url: string
  original_name: string
  size: number
  mimetype: string
  created_at: string
  filename?: string
  folder: string
}

const API_URL = import.meta.env.VITE_API_URL
const ALL_FOLDERS = null // sentinel for "show every folder" in the sidebar

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

// Resolve a stored relative URL (/uploads/...) to a full, fetchable URL.
const resolveUrl = (url: string) =>
  url.startsWith('http') || url.startsWith('data:') ? url : `${API_URL}${url}`

export function Gallery() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [folders, setFolders] = useState<string[]>(['General'])
  const [selectedFolder, setSelectedFolder] = useState<string | null>(ALL_FOLDERS)
  const [addingFolder, setAddingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [renamingFolder, setRenamingFolder] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const imagesPerPage = 12
  const [previewImage, setPreviewImage] = useState<GalleryImage | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const token = getCookie('accessToken')
  const can = useCan()
  const canUpload = can('gallery.upload')
  const canDelete = can('gallery.delete')

  const loadImages = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/gallery`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const json = await res.json()
        setImages(json.data || [])
      }
    } catch (error) {
      console.error('Error loading images:', error)
    } finally {
      setLoading(false)
      setLoaded(true)
    }
  }

  const loadFolders = async () => {
    try {
      const res = await fetch(`${API_URL}/api/gallery/folders`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const json = await res.json()
        setFolders(json.data && json.data.length > 0 ? json.data : ['General'])
      }
    } catch (error) {
      console.error('Error loading folders:', error)
    }
  }

  // Load images + folders on mount
  useEffect(() => {
    loadImages()
    loadFolders()
  }, [])

  // Reset to first page whenever the search or folder filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedFolder])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setLoading(true)
    try {
      // Uploads land in whichever folder is currently selected in the
      // sidebar — "All Images" defaults new uploads to "General".
      const targetFolder = selectedFolder ?? 'General'
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('image', file)
        formData.append('folder', targetFolder)
        await fetch(`${API_URL}/api/gallery`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        })
      }
      toast.success(`${files.length} image${files.length > 1 ? 's' : ''} uploaded`)
      loadImages()
      loadFolders()
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Upload failed')
    } finally {
      setLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this image?')) return
    try {
      await fetch(`${API_URL}/api/gallery/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      setImages((prev) => prev.filter((img) => img.id !== id))
      toast.success('Image deleted')
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete image')
    }
  }

  const handleMoveToFolder = async (image: GalleryImage, folder: string) => {
    if (!folder || folder === image.folder) return
    try {
      const res = await fetch(`${API_URL}/api/gallery/${image.id}/folder`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folder }),
      })
      if (!res.ok) throw new Error('Move failed')
      setImages((prev) => prev.map((img) => (img.id === image.id ? { ...img, folder } : img)))
      setPreviewImage((prev) => (prev && prev.id === image.id ? { ...prev, folder } : prev))
      loadFolders()
      toast.success(`Moved to "${folder}"`)
    } catch (error) {
      console.error('Move error:', error)
      toast.error('Failed to move image')
    }
  }

  const handleRenameFolder = async (oldName: string) => {
    const newName = renameValue.trim()
    if (!newName || newName === oldName) {
      setRenamingFolder(null)
      return
    }
    try {
      const res = await fetch(`${API_URL}/api/gallery/folders/${encodeURIComponent(oldName)}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newName }),
      })
      if (!res.ok) throw new Error('Rename failed')
      setFolders((prev) => prev.map((f) => (f === oldName ? newName : f)))
      setImages((prev) => prev.map((img) => (img.folder === oldName ? { ...img, folder: newName } : img)))
      if (selectedFolder === oldName) setSelectedFolder(newName)
      toast.success(`Renamed "${oldName}" to "${newName}"`)
    } catch (error) {
      console.error('Rename error:', error)
      toast.error('Failed to rename folder')
    } finally {
      setRenamingFolder(null)
      setRenameValue('')
    }
  }

  const handleCreateFolder = () => {
    const name = newFolderName.trim()
    if (!name) return
    // Folders are DB-only metadata derived from images that use them — there's
    // nothing to "create" server-side yet. Selecting it here just sets the
    // upload target; it becomes a real entry in the sidebar once the first
    // image is uploaded into it.
    if (!folders.includes(name)) setFolders((prev) => [...prev, name])
    setSelectedFolder(name)
    setNewFolderName('')
    setAddingFolder(false)
  }

  const handleCopyUrl = async (url: string) => {
    const fullUrl = url.startsWith('http')
      ? url
      : `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`

    // Preferred: async Clipboard API (only available in secure contexts — HTTPS / localhost)
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(fullUrl)
        toast.success('URL copied to clipboard')
        return
      }
      // Fallback for plain-HTTP / non-localhost hosts (e.g. http://rahim.lvh.me)
      const textarea = document.createElement('textarea')
      textarea.value = fullUrl
      textarea.style.position = 'fixed'
      textarea.style.top = '0'
      textarea.style.left = '0'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(textarea)
      if (ok) toast.success('URL copied to clipboard')
      else toast.error('Failed to copy URL')
    } catch (error) {
      console.error('Failed to copy URL:', error)
      toast.error('Failed to copy URL')
    }
  }

  const folderImages = images.filter((img) => (selectedFolder ? img.folder === selectedFolder : true))
  const filteredImages = folderImages.filter(
    (img) =>
      (img.original_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (img.filename?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  )

  // Pagination
  const totalPages = Math.ceil(filteredImages.length / imagesPerPage)
  const startIndex = (currentPage - 1) * imagesPerPage
  const currentImages = filteredImages.slice(startIndex, startIndex + imagesPerPage)

  // Stats (backend returns images sorted by created_at DESC) — scoped to the
  // currently selected folder, matching what the grid below actually shows.
  const totalStorage = folderImages.reduce((sum, img) => sum + (img.size || 0), 0)
  const storageMB = (totalStorage / (1024 * 1024)).toFixed(2)
  const lastUpload =
    folderImages.length > 0
      ? new Date(folderImages[0].created_at).toLocaleDateString()
      : 'N/A'

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Gallery
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your image gallery</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleUpload}
        />
        {canUpload && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload to {selectedFolder ?? 'General'}
              </>
            )}
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Folder tree sidebar */}
        <aside className="md:w-56 shrink-0 space-y-1">
          <button
            onClick={() => setSelectedFolder(ALL_FOLDERS)}
            className={`w-full flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm text-left transition-colors ${
              selectedFolder === ALL_FOLDERS ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            <span className="flex items-center gap-2 truncate">
              <ImageIcon className="w-4 h-4 shrink-0" />
              All Images
            </span>
            <span className="text-xs opacity-70">{images.length}</span>
          </button>

          {folders.map((folder) => {
            const count = images.filter((img) => img.folder === folder).length

            if (renamingFolder === folder) {
              return (
                <div key={folder} className="flex items-center gap-1">
                  <input
                    autoFocus
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameFolder(folder)
                      if (e.key === 'Escape') {
                        setRenamingFolder(null)
                        setRenameValue('')
                      }
                    }}
                    className="w-full px-2 py-1.5 text-sm border rounded-md bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => handleRenameFolder(folder)}
                    className="p-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                    title="Save"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            }

            return (
              <div key={folder} className="group/folder relative">
                <button
                  onClick={() => setSelectedFolder(folder)}
                  className={`w-full flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm text-left transition-colors ${
                    selectedFolder === folder ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <Folder className="w-4 h-4 shrink-0" />
                    {folder}
                  </span>
                  <span className="text-xs opacity-70 group-hover/folder:hidden">{count}</span>
                </button>
                {canUpload && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setRenamingFolder(folder)
                      setRenameValue(folder)
                    }}
                    className={`hidden group-hover/folder:flex absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded transition-colors ${
                      selectedFolder === folder ? 'hover:bg-white/20' : 'hover:bg-background'
                    }`}
                    title={`Rename "${folder}"`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )
          })}

          {canUpload && (
            <div className="pt-1">
              {addingFolder ? (
                <div className="flex items-center gap-1">
                  <input
                    autoFocus
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateFolder()
                      if (e.key === 'Escape') {
                        setAddingFolder(false)
                        setNewFolderName('')
                      }
                    }}
                    placeholder="Folder name"
                    className="w-full px-2 py-1.5 text-sm border rounded-md bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleCreateFolder}
                    className="px-2 py-1.5 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Add
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAddingFolder(true)}
                  className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
                >
                  <FolderPlus className="w-4 h-4" />
                  New Folder
                </button>
              )}
            </div>
          )}
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total Images */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 p-6 shadow-lg shadow-blue-500/30">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-white/90">
                    {selectedFolder ? `Images in "${selectedFolder}"` : 'Total Images'}
                  </p>
                  <h3 className="mt-2 text-3xl font-bold text-white">{folderImages.length}</h3>
                </div>
                <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                  <ImageIcon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            {/* Storage Used */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-400 p-6 shadow-lg shadow-emerald-500/30">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-white/90">Storage Used</p>
                  <h3 className="mt-2 text-3xl font-bold text-white">
                    {storageMB} <span className="text-lg font-normal text-white/70">MB</span>
                  </h3>
                </div>
                <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                  <HardDrive className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            {/* Last Upload */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-violet-400 p-6 shadow-lg shadow-violet-500/30">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-white/90">Last Upload</p>
                  <h3 className="mt-2 text-xl font-bold text-white">{lastUpload}</h3>
                </div>
                <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input
              type="text"
              placeholder="Search images..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
              <p className="text-muted-foreground mt-4">Loading images...</p>
            </div>
          )}

          {/* Grid */}
          {!loading && filteredImages.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {currentImages.map((image) => (
                <div
                  key={image.id}
                  className="bg-card rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow group"
                >
                  <div className="aspect-square bg-muted relative">
                    <img
                      src={resolveUrl(image.url)}
                      alt={image.original_name || image.filename || 'Gallery image'}
                      className="w-full h-full object-cover cursor-pointer"
                      loading="lazy"
                      onClick={() => setPreviewImage(image)}
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).style.opacity = '0.3'
                      }}
                    />
                    {/* Hover actions */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => setPreviewImage(image)}
                        className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                        title="View"
                      >
                        <Eye className="w-4 h-4 text-gray-700" />
                      </button>
                      <button
                        onClick={() => handleCopyUrl(image.url)}
                        className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                        title="Copy URL"
                      >
                        <Copy className="w-4 h-4 text-gray-700" />
                      </button>
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(image.id)}
                          className="p-2 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-white" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium truncate" title={image.original_name || image.filename || 'Untitled'}>
                      {image.original_name || image.filename || 'Untitled'}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-muted-foreground">
                        {formatSize(image.size)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(image.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {!selectedFolder && (
                      <span className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Folder className="w-3 h-3" />
                        {image.folder}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination footer — always visible once there's at least one image */}
          {!loading && filteredImages.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 mt-1 border-t">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages || 1} · {imagesPerPage} per page
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="h-9 inline-flex items-center gap-1 px-3 rounded-md border text-sm hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </button>
                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        aria-current={currentPage === page ? 'page' : undefined}
                        className={`h-9 w-9 inline-flex items-center justify-center rounded-md text-sm border transition-colors ${
                          currentPage === page ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="h-9 inline-flex items-center gap-1 px-3 rounded-md border text-sm hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Empty */}
          {!loading && loaded && filteredImages.length === 0 && (
            <div className="text-center py-12">
              <ImageIcon className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No images in gallery</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? 'Try a different search term'
                  : selectedFolder
                    ? `No images in "${selectedFolder}" yet`
                    : 'Upload your first image to get started'}
              </p>
              {!searchQuery && canUpload && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Image
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage &&
        createPortal(
          <div
            className="fixed inset-0 z-50 bg-black/90 flex flex-col"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-background border-b shrink-0">
              <h3 className="text-lg font-semibold truncate">{previewImage.original_name || previewImage.filename || 'Untitled'}</h3>
              <button
                onClick={() => setPreviewImage(null)}
                className="rounded-md p-1.5 hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto bg-background">
              <div className="max-w-6xl mx-auto p-6 flex flex-col lg:flex-row gap-6">
                {/* Image */}
                <div className="flex-1 flex items-center justify-center bg-muted rounded-lg p-4">
                  <img
                    src={resolveUrl(previewImage.url)}
                    alt={previewImage.original_name || previewImage.filename || 'Gallery image'}
                    className="max-w-full max-h-[calc(100vh-280px)] object-contain rounded-lg"
                  />
                </div>

                {/* Details sidebar */}
                <div className="lg:w-72 space-y-4">
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        File Name
                      </span>
                      <p className="text-sm mt-0.5 break-all">{previewImage.original_name || previewImage.filename || 'Untitled'}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        File Size
                      </span>
                      <p className="text-sm mt-0.5">{formatSize(previewImage.size)}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Type
                      </span>
                      <p className="text-sm mt-0.5">{previewImage.mimetype || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Uploaded
                      </span>
                      <p className="text-sm mt-0.5">
                        {new Date(previewImage.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {canUpload && (
                      <div>
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Folder
                        </span>
                        <select
                          value={previewImage.folder}
                          onChange={(e) => handleMoveToFolder(previewImage, e.target.value)}
                          className="mt-0.5 w-full px-2 py-1.5 text-sm border rounded-md bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {[...new Set([previewImage.folder, ...folders])].map((f) => (
                            <option key={f} value={f}>
                              {f}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 space-y-2">
                    <button
                      onClick={() => handleCopyUrl(previewImage.url)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 border rounded-md text-sm font-medium hover:bg-muted"
                    >
                      <Copy className="w-4 h-4" />
                      Copy URL
                    </button>
                    {canDelete && (
                      <button
                        onClick={() => {
                          handleDelete(previewImage.id)
                          setPreviewImage(null)
                        }}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    )}
                    <button
                      onClick={() => setPreviewImage(null)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
