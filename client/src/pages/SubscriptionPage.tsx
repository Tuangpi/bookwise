import { useState, useEffect, useCallback } from 'react';
import { Box, Button, Input, Select, Option, Label } from 'components/ui';
import { useAuth } from '../context/AuthContext';
import { getPlans } from '../lib/api';

const planOptions = [
  { value: 'FREE', label: 'Free' },
  { value: 'STARTER', label: 'Starter - $19/mo' },
  { value: 'PRO', label: 'Pro - $49/mo' },
];

export default function SubscriptionPage() {
  const { user, business } = useAuth();
  const [plan, setPlan] = useState<'FREE' | 'STARTER' | 'PRO'>('FREE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchPlan = useCallback(async () => {
    try {
      const res = await getPlans({ planCode: 'STARTER' });
      setPlan(res.data.data?.planCode ?? 'FREE');
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load plan');
    }
  }, []);

  const updatePlan = useCallback(async (newPlan: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/v1/subscription', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ planCode: newPlan }),
      });
      const data = await res.json();
      if (res.ok) {
        setPlan(newPlan);
        setSuccess(data.success ? `Switched to ${newPlan} plan` : 'Failed to update plan');
      } else {
        setError(data.error ?? 'Failed to update plan');
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to update plan');
    } finally {
      setLoading(false);
    }
  }, [fetchPlan]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  return null;
}