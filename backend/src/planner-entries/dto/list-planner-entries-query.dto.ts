import {
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

import {
  isPlannerDate,
  PlannerDateConstraint,
} from '../planner-date.validator';

@ValidatorConstraint({ name: 'isPlannerDateRange', async: false })
export class PlannerDateRangeConstraint implements ValidatorConstraintInterface {
  validate(to: unknown, args: ValidationArguments): boolean {
    const { from } = args.object as { from?: unknown };
    // Individual field validators report malformed dates. Compare valid
    // calendar strings directly so range validation has no timezone effects.
    return !isPlannerDate(from) || !isPlannerDate(to) || from <= to;
  }

  defaultMessage(): string {
    return 'from must be on or before to';
  }
}

export class ListPlannerEntriesQueryDto {
  @Validate(PlannerDateConstraint)
  from!: string;

  @Validate(PlannerDateConstraint)
  @Validate(PlannerDateRangeConstraint)
  to!: string;
}
