'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronUp, ChevronDown, X, ImagePlus } from 'lucide-react'

export interface UploadedImage {
  id: string
  preview: string
  file?: File
  storagePath?: string
  url?: string
}

interface Props {
  images: UploadedImage[]
  onChange: (images: UploadedImage[]) => void
  maxImages?: number
}

export function ImageUploader({ images, onChange, maxImages = 6 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleFiles(files: FileList | null) {
    if (!files) return
    const remaining = maxImages - images.length
    const toAdd = Array.from(files).slice(0, remaining)
    const newImages: UploadedImage[] = toAdd.map((file) => ({
      id: crypto.randomUUID(),
      preview: URL.createObjectURL(file),
      file,
    }))
    onChange([...images, ...newImages])
  }

  function remove(id: string) {
    onChange(images.filter((img) => img.id !== id))
  }

  function moveUp(index: number) {
    if (index === 0) return
    const next = [...images]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    onChange(next)
  }

  function moveDown(index: number) {
    if (index === images.length - 1) return
    const next = [...images]
    ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
    onChange(next)
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      {images.length < maxImages && (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            dragging
              ? 'border-[#C4956A] bg-[#C4956A]/5'
              : 'border-muted-foreground/30 hover:border-muted-foreground/60'
          }`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            handleFiles(e.dataTransfer.files)
          }}
        >
          <ImagePlus size={32} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Drag & drop or click to upload
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {images.length} / {maxImages} images · First image is the hero
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      )}

      {/* Thumbnails */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {images.map((img, index) => (
            <div key={img.id} className="relative group">
              <div className="relative w-24 h-24 rounded-md overflow-hidden border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.preview}
                  alt={`Product image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {index === 0 && (
                  <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-0.5">
                    Hero
                  </span>
                )}
              </div>
              {/* Controls */}
              <div className="absolute top-0 right-0 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-5 w-5 p-0"
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                >
                  <ChevronUp size={10} />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-5 w-5 p-0"
                  onClick={() => moveDown(index)}
                  disabled={index === images.length - 1}
                >
                  <ChevronDown size={10} />
                </Button>
              </div>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="absolute -top-2 -left-2 h-5 w-5 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => remove(img.id)}
              >
                <X size={10} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
