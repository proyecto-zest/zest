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

type ScalarFields = Omit<RecipeFormValues, 'ingredients' | 'steps'>

const emptyFields: ScalarFields = {
  title: '',
  description: '',
  category: '',
  time: '',
  timeUnit: '',
  difficulty: '',
  servings: '',
}

/** The scalar half of `initialValues` — the row lists are owned by `useRowList`, not by `fields`. */
const scalarFieldsOf = ({ title, description, category, time, timeUnit, difficulty, servings }: RecipeFormValues): ScalarFields => ({
  title,
  description,
  category,
  time,
  timeUnit,
  difficulty,
  servings,
})

/** Owns the recipe form's state: field values plus the dynamic ingredient and step lists. Pass `initialValues` to prefill it for editing — omit it to start blank, as creation does. */
export function useRecipeForm(initialValues?: RecipeFormValues) {
  const [fields, setFields] = useState<ScalarFields>(initialValues ? scalarFieldsOf(initialValues) : emptyFields)
  const ingredients = useRowList<IngredientRowValue>(initialValues?.ingredients ?? [emptyIngredient()], emptyIngredient)
  const steps = useRowList<StepRowValue>(initialValues?.steps ?? [emptyStep()], emptyStep)

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
