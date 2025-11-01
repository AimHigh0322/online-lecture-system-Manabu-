// Stripe publishable key from environment variables
export const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

// Validate that the key is present
if (!stripePublicKey) {
  console.error("VITE_STRIPE_PUBLIC_KEY is not defined in .env file");
}

export default stripePublicKey;
