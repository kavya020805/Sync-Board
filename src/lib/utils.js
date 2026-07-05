import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind classes with clsx and tailwind-merge.
 * Handles conditional classes and deduplication.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Generate initials from a name string.
 * "John Doe" → "JD", "john" → "J"
 */
export function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
}

/**
 * Generate a URL-friendly slug from a string.
 * "My Workspace" → "my-workspace"
 */
export function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Format a relative time string.
 * Returns "Just now", "2m ago", "3h ago", "5d ago", etc.
 */
export function formatRelativeTime(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return date.toLocaleDateString()
}
