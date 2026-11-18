import Stripe from 'npm:stripe@18';
import { createClient } from 'npm:@supabase/supabase-js@2';

import { corsHeaders, json } from '../_shared/cors.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  httpClient: Stripe.createFetchHttpClient(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return json({ error: 'Missing authorization header' }, 401);
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const token = authHeader.replace(/^Bearer\s+/i, '');
  const {
    data: { user },
    error: authError,
  } = await admin.auth.getUser(token);

  if (authError || !user) {
    return json({ error: 'Not signed in' }, 401);
  }

  const priceId = Deno.env.get('STRIPE_PRICE_ID');
  if (!priceId) {
    return json({ error: 'STRIPE_PRICE_ID is not configured' }, 500);
  }

  const { data: existing } = await admin
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle();

  let customerId: string | null = existing?.stripe_customer_id ?? null;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;
    await admin
      .from('subscriptions')
      .upsert({ user_id: user.id, stripe_customer_id: customerId }, { onConflict: 'user_id' });
  }

  const appUrl = Deno.env.get('APP_URL') ?? 'http://localhost:8081';

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: { metadata: { user_id: user.id } },
      allow_promotion_codes: true,
      success_url: `${appUrl}/pricing?checkout=success`,
      cancel_url: `${appUrl}/pricing?checkout=cancelled`,
    });

    if (!session.url) {
      return json({ error: 'Stripe did not return a checkout URL' }, 502);
    }
    return json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Checkout could not be created';
    return json({ error: message }, 502);
  }
});
