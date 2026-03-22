import { HttpException, HttpStatus } from '@nestjs/common';

export class PaymentRequiredException extends HttpException {
  constructor(message = 'Upgrade your plan to access this feature') {
    super(
      {
        statusCode: HttpStatus.PAYMENT_REQUIRED,
        error: 'Payment Required',
        message,
      },
      HttpStatus.PAYMENT_REQUIRED,
    );
  }
}
