import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { BillingService } from './billing.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Plan } from '@/common/enums';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('checkout')
  @HttpCode(HttpStatus.OK)
  createCheckout(
    @CurrentUser('orgId') orgId: string,
    @Body('plan') plan: Plan,
  ) {
    return this.billingService.createCheckoutSession(orgId, plan);
  }

  @Post('portal')
  @HttpCode(HttpStatus.OK)
  createPortal(@CurrentUser('orgId') orgId: string) {
    return this.billingService.createPortalSession(orgId);
  }
}
