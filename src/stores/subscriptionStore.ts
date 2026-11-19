import { create } from 'zustand';

import { supabase } from '@/lib/supabase';

export type SubscriptionStatus =
  | 'inactive'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired'
  | 'paused';

const ACTIVE: SubscriptionStatus[] = ['active', 'trialing'];

type SubscriptionState = {
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  reset: () => void;
  isActive: () => boolean;
};

const initial = {
  status: 'inactive' as SubscriptionStatus,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  loading: false,
  error: null,
};

export const useSubscriptionStore = create<SubscriptionState>()((set, get) => ({
  ...initial,

  refresh: async () => {
    if (!supabase) {
      set({ ...initial });
      return;
    }

    set({ loading: true, error: null });
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        set({ ...initial });
        return;
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .select('status, current_period_end, cancel_at_period_end')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw new Error(error.message);

      set({
        status: (data?.status as SubscriptionStatus | undefined) ?? 'inactive',
        currentPeriodEnd: data?.current_period_end ?? null,
        cancelAtPeriodEnd: Boolean(data?.cancel_at_period_end),
        loading: false,
        error: null,
      });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Could not load subscription.',
      });
    }
  },

  reset: () => set({ ...initial }),

  isActive: () => ACTIVE.includes(get().status),
}));
