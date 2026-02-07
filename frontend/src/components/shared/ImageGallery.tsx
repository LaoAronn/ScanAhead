interface ImageGalleryProps {
  images: string[]
}

const ImageGallery = ({ images }: ImageGalleryProps) => {
  if (images.length === 0) {
    return <p className="text-sm text-slate-500">No images submitted.</p>
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {images.map((src, index) => (
        <div
          key={`${src}-${index}`}
          className="overflow-hidden rounded-xl border border-slate-200 bg-white"
        >
          <img src={src} alt={`Submitted ${index + 1}`} className="h-32 w-full object-cover" />
        </div>
      ))}
    </div>
  )
}

export default ImageGallery
