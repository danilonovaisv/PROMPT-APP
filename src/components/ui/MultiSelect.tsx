import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { cn } from '../../lib/utils'
import { ChevronDownIcon, ChevronUpIcon } from '@radix-ui/react-icons'

export interface MultiSelectProps extends Omit<React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root>, 'value' | 'onValueChange'> {
  value: string[]
  onValueChange: (value: string[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  separator?: string
  renderSelectedValues?: (selectedValues: string[]) => React.ReactNode
}

interface MultiSelectContextValue {
  selectedValues: string[]
  onValueChange: (value: string[]) => void
  onSelect: (value: string) => void
  onRemove: (value: string) => void
  renderSelectedValues?: (selectedValues: string[]) => React.ReactNode
  searchTerm: string
  setSearchTerm: (term: string) => void
}

const MultiSelectContext = React.createContext<MultiSelectContextValue | undefined>(undefined)

function useMultiSelect() {
  const context = React.useContext(MultiSelectContext)
  if (!context) {
    throw new Error('useMultiSelect must be used within a MultiSelectProvider')
  }
  return context
}

const MultiSelect = ({ value, onValueChange, children, separator = ',', renderSelectedValues, onOpenChange, ...props }: MultiSelectProps) => {
  const [searchTerm, setSearchTerm] = React.useState('')
  const stringValue = value.join(separator)
  
  const handleValueChange = React.useCallback(
    (val: string) => {
      if (!val) return
      
      if (value.includes(val)) {
        onValueChange(value.filter((v) => v !== val))
      } else {
        onValueChange([...value, val])
      }
    },
    [value, onValueChange]
  )

  const handleOpenChange = React.useCallback((open: boolean) => {
    if (!open) {
      setSearchTerm('')
    }
    onOpenChange?.(open)
  }, [onOpenChange])

  const contextValue = React.useMemo(
    () => ({
      selectedValues: value,
      onValueChange,
      onSelect: (val: string) => {
        if (!value.includes(val)) {
          onValueChange([...value, val])
        }
      },
      onRemove: (val: string) => {
        onValueChange(value.filter((v) => v !== val))
      },
      renderSelectedValues,
      searchTerm,
      setSearchTerm,
    }),
    [value, onValueChange, renderSelectedValues, searchTerm, setSearchTerm]
  )

  return (
    <MultiSelectContext.Provider value={contextValue}>
      <div className="multi-select">
        <SelectPrimitive.Root
          {...props}
          value={stringValue}
          onValueChange={handleValueChange}
          onOpenChange={handleOpenChange}
        >
          {children}
        </SelectPrimitive.Root>
      </div>
    </MultiSelectContext.Provider>
  )
}
MultiSelect.displayName = 'MultiSelect'

const MultiSelectGroup = SelectPrimitive.Group

const MultiSelectValue = SelectPrimitive.Value

const MultiSelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn('multi-select__trigger', className)}
    {...props}>
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDownIcon className="multi-select__chevron" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
MultiSelectTrigger.displayName = 'MultiSelectTrigger'

const MultiSelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> & {
    showSearch?: boolean
    searchPlaceholder?: string
  }
>(({ className, children, position = 'popper', showSearch = true, searchPlaceholder = 'Pesquisar menus...', ...props }, ref) => {
  const { searchTerm, setSearchTerm } = useMultiSelect()
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (showSearch && searchInputRef.current) {
      const t = setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
      return () => clearTimeout(t)
    }
  }, [showSearch])

  const childrenArray = React.Children.toArray(children)
  const items = childrenArray.filter(child => {
    if (React.isValidElement(child)) {
      const childProps = child.props as any
      if (childProps && childProps.value !== undefined) {
        const label = String(childProps.children || '').toLowerCase()
        return label.includes(searchTerm.toLowerCase())
      }
    }
    return true
  })

  const visibleCount = items.filter(child => {
    if (React.isValidElement(child)) {
      const childProps = child.props as any
      return childProps && childProps.value !== undefined
    }
    return false
  }).length

  const totalCount = childrenArray.filter(child => {
    if (React.isValidElement(child)) {
      const childProps = child.props as any
      return childProps && childProps.value !== undefined
    }
    return false
  }).length

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={cn(
          'multi-select__dropdown',
          className
        )}
        position={position}
        {...props}>
        <SelectPrimitive.ScrollUpButton className="flex cursor-default items-center justify-center py-1">
          <ChevronUpIcon className="h-4 w-4" />
        </SelectPrimitive.ScrollUpButton>
        
        {showSearch && (
          <div 
            className="multi-select__search-wrapper"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              e.stopPropagation()
              if (e.key === 'ArrowDown') {
                const container = e.currentTarget.closest('.multi-select__dropdown')
                const firstOption = container?.querySelector('.multi-select__option') as HTMLElement | null
                firstOption?.focus()
                e.preventDefault()
              }
            }}
          >
            <span className="multi-select__search-icon" aria-hidden="true">🔍</span>
            <input
              ref={searchInputRef}
              type="search"
              className="multi-select__search"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label={searchPlaceholder}
            />
            {searchTerm && (
              <span className="multi-select__search-count" aria-live="polite">
                {visibleCount} de {totalCount}
              </span>
            )}
          </div>
        )}

        <SelectPrimitive.Viewport
          className={cn(
            'multi-select__options',
            position === 'popper' &&
              'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]'
          )}>
          {visibleCount === 0 && searchTerm ? (
            <div className="multi-select__empty" role="status" aria-live="polite">
              Nenhum menu encontrado para "{searchTerm}"
            </div>
          ) : (
            items
          )}
        </SelectPrimitive.Viewport>
        <SelectPrimitive.ScrollDownButton className="flex cursor-default items-center justify-center py-1">
          <ChevronDownIcon className="h-4 w-4" />
        </SelectPrimitive.ScrollDownButton>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
})
MultiSelectContent.displayName = 'MultiSelectContent'

const MultiSelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label ref={ref} className={cn('px-2 py-1.5 text-sm font-semibold', className)} {...props} />
))
MultiSelectLabel.displayName = 'MultiSelectLabel'

const MultiSelectItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string, icons?: React.ReactNode }
>(({ className, children, value, icons, onClick, ...props }, ref) => {
  const { selectedValues } = useMultiSelect()
  const isSelected = selectedValues.includes(value)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick?.(e as any)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const nextSibling = e.currentTarget.nextElementSibling as HTMLElement | null
      if (nextSibling && nextSibling.classList.contains('multi-select__option')) {
        nextSibling.focus()
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prevSibling = e.currentTarget.previousElementSibling as HTMLElement | null
      if (prevSibling && prevSibling.classList.contains('multi-select__option')) {
        prevSibling.focus()
      } else {
        const container = e.currentTarget.closest('.multi-select__dropdown')
        const searchInput = container?.querySelector('.multi-select__search') as HTMLElement | null
        searchInput?.focus()
      }
    }
  }

  return (
    <div
      ref={ref}
      className={cn(
        'multi-select__option',
        isSelected && 'multi-select__option--selected',
        className
      )}
      tabIndex={0}
      role="option"
      aria-selected={isSelected}
      onKeyDown={handleKeyDown}
      onClick={onClick}
      style={{ minHeight: '44px' }}
      {...props}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        {icons}
        <span className="multi-select__option-label">{children}</span>
      </div>
    </div>
  )
})
MultiSelectItem.displayName = 'MultiSelectItem'

const MultiSelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator ref={ref} className={cn('-mx-1 my-1 h-px bg-muted', className)} {...props} />
))
MultiSelectSeparator.displayName = 'MultiSelectSeparator'

export {
  MultiSelect,
  MultiSelectGroup,
  MultiSelectValue,
  MultiSelectTrigger,
  MultiSelectContent,
  MultiSelectLabel,
  MultiSelectItem,
  MultiSelectSeparator,
}
