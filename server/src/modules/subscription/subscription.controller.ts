import { prisma } from '../../shared/db';
import { auth } from '../../shared/middleware/auth';
import { Errors } from '../../shared/errors';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function getSubscription(req: any, res: any, next: any) {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { businessId: req.business.id },
      include: { plan: true },
    });

    if (!subscription) {
      return res.json({
        success: true,
        data: null,
        message: 'No subscription found - business on FREE plan',
      });
    }

    res.json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPlans(req: any, res: any, next: any) {
  try {
    const plans = await prisma.plan.findMany({
      where: { code: { not: 'FREE' } },
      orderBy: { price: 'asc' },
    });

    res.json({
      success: true,
      data: plans,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateSubscription(req: any, res: any, next: any) {
  try {
    const { planCode } = req.body;

    // Check if plan exists
    const plan = await prisma.plan.findUnique({
      where: { code: planCode },
    });

    if (!plan) {
      throw new Errors.notFound('Plan not found');
    }

    // If upgrading from FREE, create Stripe customer and subscription
    // If changing plans, update existing subscription
    const subscription = await prisma.subscription.findUnique({
      where: { businessId: req.business.id },
    });

    let result;

    if (!subscription) {
      // Create new subscription
      const customer = await stripe.customers.create({
        email: req.business.email,
        name: req.business.name,
      });

      const stripeSubscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: plan.stripePriceId }],
        expand: ['latest_invoice.payment_status'],
      });

      result = await prisma.subscription.create({
        data: {
          businessId: req.business.id,
          planCode,
          status: 'ACTIVE',
          stripeCustomerId: customer.id,
          stripeSubscriptionId: stripeSubscription.id,
        },
      });
    } else {
      // Update existing subscription
      result = await prisma.subscription.update({
        where: { businessId: req.business.id },
        data: { planCode },
      });
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function cancelSubscription(req: any, res: any, next: any) {
  try {
    const { confirm } = req.body;

    if (!confirm) {
      throw new Errors.badRequest('Cancellation confirmation required');
    }

    const subscription = await prisma.subscription.findUnique({
      where: { businessId: req.business.id },
    });

    if (!subscription) {
      throw new Errors.notFound('No subscription found');
    }

    // Cancel at period end in Stripe
    if (subscription.stripeSubscriptionId) {
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    }

    // Update status in database
    const updated = await prisma.subscription.update({
      where: { businessId: req.business.id },
      data: { status: 'CANCELLED' },
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}