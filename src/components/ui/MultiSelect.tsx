import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { cn } from '@/lib/utils'
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
}

const MultiSelectContext = React.createContext<MultiSelectContextValue | undefined>(undefined)

function useMultiSelect() {
  const context = React.useContext(MultiSelectContext)
  if (!context) {
    throw new Error('useMultiSelect must be used within a MultiSelectProvider')
  }
  return context
}

const MultiSelect = ({ value, onValueChange, children, separator = ',', renderSelectedValues, ...props }: MultiSelectProps) => {
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
    }),
    [value, onValueChange, renderSelectedValues]
  )

  return (
    <MultiSelectContext.Provider value={contextValue}>
      <div className="multi-select">
        <SelectPrimitive.Root
          {...props}
          value={stringValue}
          onValueChange={handleValueChange}
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
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
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
      <SelectPrimitive.Viewport
        className={cn(
          'multi-select__options',
          position === 'popper' &&
            'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]'
        )}>
        {children}
      </SelectPrimitive.Viewport>
      <SelectPrimitive.ScrollDownButton className="flex cursor-default items-center justify-center py-1">
        <ChevronDownIcon className="h-4 w-4" />
      </SelectPrimitive.ScrollDownButton>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
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
>(({ className, children, value, icons, ...props }, ref) => {
  const { selectedValues } = useMultiSelect()
  const isSelected = selectedValues.includes(value)

  return (
    <div
      ref={ref}
      className={cn(
        'multi-select__option',
        isSelected && 'multi-select__option--selected',
        className
      )}
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
