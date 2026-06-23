import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { isValidEcuadorCustomerIdentification } from '@repo/shared-utils';

export function IsEcuadorCustomerIdentification(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return function (object: object, propertyName: string | symbol) {
    registerDecorator({
      name: 'isEcuadorCustomerIdentification',
      target: object.constructor,
      propertyName: propertyName as string,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string' || value.length === 0) {
            return true;
          }
          return isValidEcuadorCustomerIdentification(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid Ecuadorian identification (10-digit cédula, 13-digit RUC, or 13-digit consumidor final)`;
        },
      },
    });
  };
}
