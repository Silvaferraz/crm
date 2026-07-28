interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="border-2 border-dashed border-borda rounded-2xl p-12 text-center">
      <p className="text-suave text-sm">{title}</p>
      {description && <p className="text-tenue text-xs mt-1">{description}</p>}
    </div>
  )
}
