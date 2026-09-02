import { useState } from 'react'
import type { IngredientRowValue, RecipeFormValues, StepRowValue } from './types'
import { useRowList } from './useRowList'

const emptyIngredient = (): IngredientRowValue => ({
  id: crypto.randomUUID(),
  ingredientId: '',
  amount: '',
  unit: '',
})

const emptyStep = (): StepRowValue => ({ id: crypto.randomUUID(), text: '' })

const emptyFields = { title: '', description: '', category: '', time: '', timeUnit: '', difficulty: '', servings: '' }

/** Owns the recipe form's state: field values plus the dynamic ingredient and step lists. */
export function useRecipeForm() {
  const [fields, setFields] = useState(emptyFields)
  const ingredients = useRowList<IngredientRowValue>([emptyIngredient()], emptyIngredient)
  const steps = useRowList<StepRowValue>([emptyStep()], emptyStep)

  const setField = <K extends keyof typeof emptyFields>(field: K, value: string) =>
    setFields((prev) => ({ ...prev, [field]: value }))

  const values: RecipeFormValues = { ...fields, ingredients: ingredients.rows, steps: steps.rows }

  const reset = () => {
    setFields(emptyFields)
    ingredients.reset()
    steps.reset()
  }

  return { values, setField, ingredients, steps, reset }
}
