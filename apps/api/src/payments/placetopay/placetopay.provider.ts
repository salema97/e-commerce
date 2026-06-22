import { Injectable } from '@nestjs/common';
import { NotImplementedPaymentProvider } from '../not-implemented.provider.js';

@Injectable()
export class PlaceToPayProvider extends NotImplementedPaymentProvider {}
