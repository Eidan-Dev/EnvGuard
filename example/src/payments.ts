import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Added three months ago, never documented in .env.example
export const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const db = process.env.DATABASE_URL;
