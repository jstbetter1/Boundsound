import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

async function accessToken(): Promise<string> {
  if (!supabase) throw new Error('Billing is not configured yet.');
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  const token = data.session?.access_token;
  if (!token) throw new Error('Sign in to manage your subscription.');
  return token;
}

async function invokeBilling<T>(name: string): Promise<T> {
  if (!supabase) throw new Error('Billing is not configured yet.');
  const token = await accessToken();
  const { data, error } = await supabase.functions.invoke(name, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(String(data.error));
  return data as T;
}

async function open(url: string): Promise<void> {
  if (Platform.OS === 'web') {
    window.location.assign(url);
    return;
  }
  await Linking.openURL(url);
}

export async function startCheckout(): Promise<void> {
  const { url } = await invokeBilling<{ url: string }>('create-checkout-session');
  if (!url) throw new Error('Stripe did not return a checkout link.');
  await open(url);
}

export async function openBillingPortal(): Promise<void> {
  const { url } = await invokeBilling<{ url: string }>('create-portal-session');
  if (!url) throw new Error('Stripe did not return a billing link.');
  await open(url);
}
