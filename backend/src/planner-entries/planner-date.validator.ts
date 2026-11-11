import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

export function isPlannerDate(value: unknown): value is string {
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

@ValidatorConstraint({ name: 'isPlannerDate', async: false })
export class PlannerDateConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return isPlannerDate(value);
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be a valid calendar date in YYYY-MM-DD format, without time or timezone`;
  }
}
