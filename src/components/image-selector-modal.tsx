import { useState } from 'react'
import { X, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface ImageSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectImage: (file: File) => void
  currentImage?: string
}

// Pre-defined gallery images (medical/hospital themed)
const GALLERY_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?q=80&w=400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?q=80&w=200&auto=format&fit=crop',
    name: 'Hospital Building',
    category: 'buildings'
  },
  {
    url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=200&auto=format&fit=crop',
    name: 'Medical Center',
    category: 'buildings'
  },
  {
    url: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?q=80&w=400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?q=80&w=200&auto=format&fit=crop',
    name: 'Healthcare',
    category: 'healthcare'
  },
  {
    url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=200&auto=format&fit=crop',
    name: 'Medical Facility',
    category: 'facilities'
  },
  {
    url: 'https://images.unsplash.com/photo-1551076805-e1869033e561?q=80&w=400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1551076805-e1869033e561?q=80&w=200&auto=format&fit=crop',
    name: 'Clinic',
    category: 'facilities'
  },
  {
    url: 'https://images.unsplash.com/photo-1581595220892-b0739db3ba8c?q=80&w=400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1581595220892-b0739db3ba8c?q=80&w=200&auto=format&fit=crop',
    name: 'Healthcare Center',
    category: 'healthcare'
  },
  {
    url: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?q=80&w=400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?q=80&w=200&auto=format&fit=crop',
    name: 'Medical Team',
    category: 'people'
  },
  {
    url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=200&auto=format&fit=crop',
    name: 'Laboratory',
    category: 'facilities'
  },
  {
    url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=200&auto=format&fit=crop',
    name: 'Hospital Care',
    category: 'healthcare'
  },
  {
    url: 'https://images.unsplash.com/photo-1551190822-a9333d879b1f?q=80&w=400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1551190822-a9333d879b1f?q=80&w=200&auto=format&fit=crop',
    name: 'Medical Equipment',
    category: 'equipment'
  },
  {
    url: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?q=80&w=400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?q=80&w=200&auto=format&fit=crop',
    name: 'Patient Care',
    category: 'healthcare'
  },
  {
    url: 'https://images.unsplash.com/photo-1512678080530-7760d81faba6?q=80&w=400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1512678080530-7760d81faba6?q=80&w=200&auto=format&fit=crop',
    name: 'Surgery',
    category: 'facilities'
  },
  {
    url: 'https://images.unsplash.com/photo-1666214280557-f1b5022eb634?q=80&w=400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1666214280557-f1b5022eb634?q=80&w=200&auto=format&fit=crop',
    name: 'Doctor with Patient',
    category: 'people'
  },
  {
    url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=200&auto=format&fit=crop',
    name: 'Hospital Room',
    category: 'facilities'
  },
  {
    url: 'https://images.unsplash.com/photo-1504813184591-01572f98c85f?q=80&w=400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1504813184591-01572f98c85f?q=80&w=200&auto=format&fit=crop',
    name: 'Modern Hospital',
    category: 'buildings'
  },
  {
    url: 'https://images.unsplash.com/photo-1519874165241-c7051b818d0e?q=80&w=400&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1519874165241-c7051b818d0e?q=80&w=200&auto=format&fit=crop',
    name: 'Emergency Room',
    category: 'facilities'
  },
]

const CATEGORIES = [
  { value: 'all', label: 'All Images' },
  { value: 'buildings', label: 'Buildings' },
  { value: 'facilities', label: 'Facilities' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'people', label: 'People' },
]

export function ImageSelectorModal({
  isOpen,
  onClose,
  onSelectImage,
  currentImage
}: ImageSelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const filteredImages = GALLERY_IMAGES.filter(image => {
    const matchesSearch = image.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || image.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleImageClick = async (imageUrl: string, imageName: string) => {
    try {
      // Fetch the high-resolution image
      const response = await fetch(imageUrl)
      const blob = await response.blob()

      // Create a File object from the blob
      const file = new File([blob], `${imageName.toLowerCase().replace(/\s+/g, '-')}.jpg`, { type: 'image/jpeg' })

      onSelectImage(file)
      onClose()
    } catch (error) {
      console.error('Failed to load image:', error)
      alert('Failed to load image from gallery')
    }
  }

  const handlePreview = (imageUrl: string) => {
    setPreviewImage(imageUrl)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">Select from Image Gallery</DialogTitle>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search images..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(category => (
                <Button
                  key={category.value}
                  variant={selectedCategory === category.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.value)}
                >
                  {category.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Image Grid */}
          {filteredImages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No images found matching your search.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredImages.map((image) => (
                <button
                  key={image.url}
                  type="button"
                  onClick={() => handleImageClick(image.url, image.name)}
                  onMouseEnter={() => handlePreview(image.thumb)}
                  className={cn(
                    'relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring',
                    currentImage === image.url
                      ? 'border-blue-500 ring-2 ring-blue-500/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                  )}
                  title={image.name}
                >
                  <img
                    src={image.thumb}
                    alt={image.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <p className="text-white text-xs font-medium truncate">{image.name}</p>
                    </div>
                  </div>
                  {currentImage === image.url && (
                    <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Preview Panel */}
        {previewImage && (
          <div className="border-t pt-4 mt-4">
            <p className="text-sm text-muted-foreground mb-2">Preview:</p>
            <div className="flex justify-center">
              <img
                src={previewImage}
                alt="Preview"
                className="max-h-40 object-contain rounded-lg border"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
