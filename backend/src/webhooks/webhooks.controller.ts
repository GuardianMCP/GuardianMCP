import {
  Controller,
  Post,
  Headers,
  Req,
  HttpCode,
  HttpStatus,
  RawBodyRequest,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import Stripe from 'stripe';
import { Public } from '@/common/decorators/public.decorator';
import { BillingService } from '@/billing/billing.service';

@Controller('webhooks')
export class WebhooksController {
  private stripe: Stripe | null = null;
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly billingService: BillingService,
  ) {
    const key = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (key) {
      this.stripe = new Stripe(key, { apiVersion: '2024-06-20' });
    }
  }

  @Public()
  @Post('stripe')
  @HttpCode(HttpStatus.OK)
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') sig: string,
  ) {
    if (!this.stripe) return { received: true };

    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret || !req.rawBody) return { received: true };

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
    } catch (err) {
      this.logger.warn(`Webhook signature verification failed: ${err}`);
      return { received: false };
    }

    switch (event.type) {
      case 'customer.subscription.updated':
        await this.billingService.handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;
      case 'customer.subscription.deleted':
        await this.billingService.handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;
      default:
        this.logger.debug(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }
}
