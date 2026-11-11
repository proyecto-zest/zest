import { IsInt, Max, Min } from 'class-validator';

import { MAX_PLANNER_QUANTITY } from '../planner-entries.constants';

export class UpdatePlannerEntryDto {
  @IsInt()
  @Min(1)
  @Max(MAX_PLANNER_QUANTITY)
  quantity!: number;
}
