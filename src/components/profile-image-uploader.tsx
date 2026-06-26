import { useState, useRef, useEffect } from 'react'
import { Camera, Upload, X, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ImageSelectorModal } from './image-selector-modal'

interface ProfileImageUploaderProps {
  currentImage?: string
  onImageChange: (file: File | null) => void
  onImageRemove?: () => void
  className?: string
}

export function ProfileImageUploader({
  currentImage,
  onImageChange,
  onImageRemove,
  className
}: ProfileImageUploaderProps) {
  const [preview, setPreview] = useState<string | undefined>(currentImage)
  const [isDragging, setIsDragging] = useState(false)
  const [removed, setRemoved] = useState(false)
  const [showGallery, setShowGallery] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Only sync from prop when it actually changes (new saved image from server)
  useEffect(() => {
    setRemoved(false)
    setPreview(currentImage)
  }, [currentImage])

  const handleFileSelect = (file: File | null) => {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
      setRemoved(false)
      onImageChange(file)
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    handleFileSelect(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    if (file) handleFileSelect(file)
  }

  const handleRemove = () => {
    setPreview(undefined)
    setRemoved(true)
    onImageChange(null)
    if (onImageRemove) onImageRemove()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleGalleryImageSelect = (file: File) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
      setRemoved(false)
      onImageChange(file)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <div
        className={cn(
          'relative group cursor-pointer transition-all duration-200',
          isDragging && 'scale-105'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={(e) => {
          e.preventDefault()
          fileInputRef.current?.click()
        }}
        onKeyDown={(e) => e.preventDefault()}
        role="button"
        tabIndex={0}
      >
        {/* Image Container */}
        <div
          className={cn(
            'relative w-32 h-32 rounded-full overflow-hidden border-4 transition-all duration-200',
            preview
              ? 'border-blue-500 shadow-lg shadow-blue-500/30'
              : 'border-dashed border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800',
            isDragging && 'border-blue-400 bg-blue-50 dark:bg-blue-950'
          )}
        >
          {preview ? (
            <img
              src={preview}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
              <Upload className="w-8 h-8 mb-1" />
              <span className="text-xs">Upload</span>
            </div>
          )}
        </div>

        {/* Overlay on hover */}
        <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Camera className="w-8 h-8 text-white" />
        </div>

        {/* Remove Button */}
        {preview && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              handleRemove()
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap justify-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.preventDefault()
            setShowGallery(true)
          }}
        >
          <ImageIcon className="w-4 h-4 mr-2" />
          Choose from Gallery
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.preventDefault()
            fileInputRef.current?.click()
          }}
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload File
        </Button>
        {preview && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              handleRemove()
            }}
          >
            <X className="w-4 h-4 mr-2" />
            Remove
          </Button>
        )}
      </div>

      {/* Instructions */}
      <p className="text-xs text-muted-foreground text-center max-w-[200px]">
        Choose from gallery or upload your own image. Max size: 5MB
      </p>

      {/* Gallery Modal */}
      <ImageSelectorModal
        isOpen={showGallery}
        onClose={() => setShowGallery(false)}
        onSelectImage={handleGalleryImageSelect}
        currentImage={preview}
      />
    </div>
  )
}
