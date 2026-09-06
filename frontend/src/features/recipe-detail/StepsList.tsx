import type { RecipeStepData } from '../../types/recipe'

interface StepsListProps {
  steps: RecipeStepData[]
}

/** Numbered steps, in order — `stepNumber` comes from the backend already sorted. */
export function StepsList({ steps }: StepsListProps) {
  return (
    <section>
      <h2 className="mb-5 font-serif text-2xl font-bold text-foreground">Instructions</h2>
      <ol className="flex flex-col gap-4">
        {steps.map((step) => (
          <li key={step.id} className="flex gap-4 rounded-2xl border border-border bg-card p-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent font-serif text-lg font-bold text-accent-foreground">
              {step.stepNumber}
            </span>
            <p className="pt-1 leading-relaxed text-foreground">{step.text}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
