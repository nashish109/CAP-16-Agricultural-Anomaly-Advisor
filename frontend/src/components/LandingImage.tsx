import { useState, type ImgHTMLAttributes } from 'react'

const PLACEHOLDER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250"><rect fill="#ecfdf5" width="400" height="250"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#15803d" font-family="sans-serif" font-size="20">AgriSense</text></svg>',
  )

export default function LandingImage({
  src,
  alt,
  className = '',
  priority = false,
  ...props
}: ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) {
  const [currentSrc, setCurrentSrc] = useState(src || PLACEHOLDER)

  return (
    <img
      {...props}
      src={currentSrc}
      alt={alt}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : undefined}
      onError={() => setCurrentSrc(PLACEHOLDER)}
    />
  )
}
