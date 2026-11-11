import {
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

import { MAX_PLANNER_RANGE_DAYS } from '../planner-entries.constants';
import {
  isPlannerDate,
  PlannerDateConstraint,
} from '../planner-date.validator';

@ValidatorConstraint({ name: 'isPlannerDateRange', async: false })
export class PlannerDateRangeConstraint implements ValidatorConstraintInterface {
  validate(to: unknown, args: ValidationArguments): boolean {
    const { from } = args.object as { from?: unknown };
    // Individual field validators report malformed dates. UTC midnight keeps
    // the inclusive day count independent of timezones and daylight saving.
    if (!isPlannerDate(from) || !isPlannerDate(to)) {
      return true;
    }
    const days =
      (Date.parse(`${to}T00:00:00.000Z`) -
        Date.parse(`${from}T00:00:00.000Z`)) /
        86_400_000 +
      1;
    return days >= 1 && days <= MAX_PLANNER_RANGE_DAYS;
  }

  defaultMessage(args: ValidationArguments): string {
    const { from, to } = args.object as ListPlannerEntriesQueryDto;
    return from > to
      ? 'from must be on or before to'
      : `planner range must not exceed ${MAX_PLANNER_RANGE_DAYS} days, including from and to`;
  }
}

export class ListPlannerEntriesQueryDto {
  @Validate(PlannerDateConstraint)
  from!: string;

  @Validate(PlannerDateConstraint)
  @Validate(PlannerDateRangeConstraint)
  to!: string;
}
