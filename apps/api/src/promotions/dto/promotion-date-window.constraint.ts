import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'promotionDateWindow', async: false })
export class PromotionDateWindowConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const obj = args.object as { startsAt?: string; endsAt?: string };
    if (!obj.startsAt || !obj.endsAt) {
      return true;
    }
    return new Date(obj.endsAt).getTime() > new Date(obj.startsAt).getTime();
  }

  defaultMessage(): string {
    return 'endsAt must be after startsAt';
  }
}
