import {
  IsInt,
  IsUUID,
  Max,
  Min,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

import { MAX_PLANNER_QUANTITY } from '../planner-entries.constants';

@ValidatorConstraint({ name: 'isPlannerDate', async: false })
export class PlannerDateConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (
      typeof value !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      value.startsWith('0000-')
    ) {
      return false;
    }

    const date = new Date(`${value}T00:00:00.000Z`);
    return (
      !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    );
  }

  defaultMessage(): string {
    return 'date must be a valid calendar date in YYYY-MM-DD format, without time or timezone';
  }
}

export class CreatePlannerEntryDto {
  @IsUUID()
  recipeId!: string;

  @Validate(PlannerDateConstraint)
  date!: string;

  @IsInt()
  @Min(1)
  @Max(MAX_PLANNER_QUANTITY)
  quantity!: number;
}
