import { IsInt, IsUUID, Max, Min, Validate } from 'class-validator';

import { MAX_PLANNER_QUANTITY } from '../planner-entries.constants';
import { PlannerDateConstraint } from '../planner-date.validator';

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
