import * as React from 'react'
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from '@/components/ui/MultiSelect'
import { Checkbox } from "@/components/ui/checkbox"

const options = [
  { value: 'apple', label: 'apple' },
  { value: 'banana', label: 'banana' },
  { value: 'orange', label: 'orange' },
  { value: 'grape', label: 'grape' },
  { value: 'watermelon', label: 'watermelon' },
  { value: 'strawberry', label: 'strawberry' },
]

const getLabel = (value: string) => {
  const option = options.find(opt => opt.value === value)
  return option ? option.label : value
}

export default function DemoOne() {
  const [selectedValues, setSelectedValues] = React.useState<string[]>([])

  const renderSelectedValues = (values: string[]) => {
    const labels = values.map(getLabel)
    
    if (values.length === 0) {
      return 'please choose fruits...'
    } else if (values.length === 1) {
      return labels[0]
    } else if (values.length === 2) {
      return `${labels[0]} and ${labels[1]} selected`
    } else {
      return `${labels.length} fruits selected`
    }
  }

  const handleMultiCheckboxClick = (value: string) => {
    setSelectedValues(prev => {
      if (prev.includes(value)) {
        return prev.filter(item => item !== value)
      }
      return [...prev, value]
    })
  }

  const handleMultiSelectItemClick = (value: string) => {
    setSelectedValues(prev => {
      if (prev.includes(value)) {
        return prev.filter(item => item !== value)
      }
      return [...prev, value]
    })
  }

  return (
    <div className="space-y-8" style={{ padding: '20px' }}>
      <div className="w-[350px]">
        <h3 className="mb-2 font-medium">default:</h3>
        <MultiSelect value={selectedValues} onValueChange={setSelectedValues}>
          <MultiSelectTrigger className="w-full">
            <MultiSelectValue placeholder="please choose fruits...">
              {renderSelectedValues(selectedValues)}
            </MultiSelectValue>
          </MultiSelectTrigger>
          <MultiSelectContent>
            {options.map((option) => (
              <MultiSelectItem 
                key={option.value} 
                value={option.value}
                onClick={() => handleMultiSelectItemClick(option.value)}
                icons={
                  <div onClick={(e) => { e.stopPropagation() }}>
                    <Checkbox 
                      className="w-5 h-5" 
                      checked={selectedValues.includes(option.value)} 
                      onChange={() => handleMultiCheckboxClick(option.value)} 
                    />
                  </div>
                }
              >
                {option.label}
              </MultiSelectItem>
            ))}
          </MultiSelectContent>
        </MultiSelect>
      </div>
      
      <div className="w-[350px]" style={{ marginTop: '24px' }}>
        <h3 className="mb-2 font-medium">custom split and show content:</h3>
        <MultiSelect 
          value={selectedValues} 
          onValueChange={setSelectedValues}
          separator="|"
        >
          <MultiSelectTrigger className="w-full">
            <MultiSelectValue placeholder="please choose fruits...">    
              {renderSelectedValues(selectedValues)}
            </MultiSelectValue>
          </MultiSelectTrigger>
          <MultiSelectContent>
            {options.map((option) => (
              <MultiSelectItem key={option.value} value={option.value}>
                {option.label}
              </MultiSelectItem>
            ))}
          </MultiSelectContent>
        </MultiSelect>
      </div>
    </div>
  )
}
