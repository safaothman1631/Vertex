'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { Upload, X, ImagePlus, Loader2 } from 'lucide-react'

interface ImageUploaderProps {
  value: string[]
  onChange: (urls: string[]) => void
  folder: string
  multiple?: boolean
  maxFiles?: number
  label?: string
}

export default function ImageUploader({
  value = [],
  onChange,
  folder,
  multiple = true,
  maxFiles = 10,
  label,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    if (!fileArray.length) return

    const remaining = maxFiles - value.length
    const toUpload = multiple ? fileArray.slice(0, remaining) : [fileArray[0]]

    if (!toUpload.length) return

    setUploading(true)
    const formData = new FormData()
    formData.append('folder', folder)
    toUpload.forEach(f => formData.append('files', f))

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.urls?.length) {
        if (multiple) {
          onChange([...value, ...data.urls])
        } else {
          onChange(data.urls.slice(0, 1))
        }
      }
      if (data.errors?.length) {
        alert(data.errors.join('\n'))
      }
    } catch {
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }, [value, onChange, folder, multiple, maxFiles])

  const removeImage = useCallback((index: number) => {
    const removed = value[index]
    onChange(value.filter((_, i) => i !== index))
    // Delete from storage in background
    if (removed.includes('/storage/v1/object/public/images/')) {
      fetch('/api/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: [removed] }),
      }).catch(() => {})
    }
  }, [value, onChange])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length) {
      uploadFiles(e.dataTransfer.files)
    }
  }, [uploadFiles])

  const canAdd = multiple ? value.length < maxFiles : value.length === 0

  return (
    <div>
      {label && (
        <label style={{
          display: 'block', fontSize: '.78rem', fontWeight: 700,
          color: 'var(--text2)', textTransform: 'uppercase',
          letterSpacing: '.06em', marginBottom: 5,
        }}>
          {label}
        </label>
      )}

      {/* Preview grid */}
      {value.length > 0 && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10,
        }}>
          {value.map((url, i) => (
            <div key={url + i} style={{
              position: 'relative', width: multiple ? 80 : 100,
              height: multiple ? 80 : 100, borderRadius: 10,
              overflow: 'hidden', border: '1.5px solid var(--border)',
              background: '#fff', flexShrink: 0,
            }}>
              <Image
                src={url}
                alt=""
                fill
                style={{ objectFit: 'contain', padding: 4 }}
                sizes={multiple ? '80px' : '100px'}
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                style={{
                  position: 'absolute', top: 3, right: 3,
                  width: 20, height: 20, borderRadius: '50%',
                  background: 'rgba(239,68,68,.9)', border: 'none',
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', padding: 0,
                }}
              >
                <X size={12} color="#fff" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {canAdd && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? 'var(--primary)' : 'var(--border)'}`,
            borderRadius: 12,
            padding: '20px 16px',
            textAlign: 'center',
            cursor: uploading ? 'default' : 'pointer',
            background: dragOver ? 'rgba(99,102,241,.06)' : 'var(--bg3)',
            transition: 'all .2s',
          }}
        >
          {uploading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--primary)' }}>
              <Loader2 size={18} className="spin" />
              <span style={{ fontSize: '.85rem', fontWeight: 600 }}>Uploading…</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              {value.length === 0 ? (
                <ImagePlus size={28} style={{ color: 'var(--text2)', opacity: .5 }} />
              ) : (
                <Upload size={20} style={{ color: 'var(--text2)', opacity: .5 }} />
              )}
              <span style={{ fontSize: '.82rem', color: 'var(--text2)' }}>
                {multiple
                  ? `Drop images here or click to browse`
                  : `Drop image here or click to browse`
                }
              </span>
              <span style={{ fontSize: '.72rem', color: 'var(--text2)', opacity: .6 }}>
                JPG, PNG, WebP, SVG, GIF — max 5MB
              </span>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif"
            multiple={multiple}
            onChange={e => e.target.files?.length && uploadFiles(e.target.files)}
            style={{ display: 'none' }}
          />
        </div>
      )}
    </div>
  )
}
