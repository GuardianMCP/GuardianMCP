import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { Organization } from '@/organizations/entities/organization.entity';
import { Plan } from '@/common/enums';

@Injectable()
export class BillingService {
  private stripe: Stripe | null = null;
  private readonly logger = new Logger(BillingService.name);

  constructor(
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    private readonly configService: ConfigService,
  ) {
    const key = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (key) {
      this.stripe = new Stripe(key, { apiVersion: '2024-06-20' });
    }
  }

  async createCheckoutSession(orgId: string, plan: Plan) {
    if (!this.stripe) throw new Error('Stripe not configured');

    const org = await this.orgRepo.findOneOrFail({ where: { id: orgId } });

    const priceId = plan === Plan.PRO
      ? this.configService.get<string>('STRIPE_PRO_PRICE_ID')
      : this.configService.get<string>('STRIPE_ENTERPRISE_PRICE_ID');

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: org.stripeCustomerId || undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${this.configService.get('FRONTEND_URL')}/settings/billing?success=true`,
      cancel_url: `${this.configService.get('FRONTEND_URL')}/settings/billing?canceled=true`,
      metadata: { orgId },
    });

    return { url: session.url };
  }

  async createPortalSession(orgId: string) {
    if (!this.stripe) throw new Error('Stripe not configured');

    const org = await this.orgRepo.findOneOrFail({ where: { id: orgId } });
    if (!org.stripeCustomerId) throw new Error('No Stripe customer');

    const session = await this.stripe.billingPortal.sessions.create({
      customer: org.stripeCustomerId,
      return_url: `${this.configService.get('FRONTEND_URL')}/settings/billing`,
    });

    return { url: session.url };
  }

  async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const orgId = subscription.metadata?.orgId;
    if (!orgId) return;

    const plan = this.mapStripePlan(subscription);
    await this.orgRepo.update(orgId, {
      plan,
      stripeSubscriptionId: subscription.id,
    });
    this.logger.log(`Org ${orgId} plan updated to ${plan}`);
  }

  async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const orgId = subscription.metadata?.orgId;
    if (!orgId) return;

    await this.orgRepo.update(orgId, {
      plan: Plan.FREE,
      stripeSubscriptionId: null as unknown as string,
    });
    this.logger.log(`Org ${orgId} downgraded to FREE`);
  }

  private mapStripePlan(subscription: Stripe.Subscription): Plan {
    const priceId = subscription.items.data[0]?.price?.id;
    if (priceId === this.configService.get('STRIPE_ENTERPRISE_PRICE_ID')) {
      return Plan.ENTERPRISE;
    }
    return Plan.PRO;
  }
}
