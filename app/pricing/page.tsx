'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, CreditCard } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: '₹0',
    features: [
      'Basic AI chat',
      'Limited history',
      'Standard support',
      'Community access',
    ],
    cta: 'Current Plan',
    highlight: false,
  },
  {
    name: 'Premium',
    price: '₹99/month',
    features: [
      'Unlimited AI chat',
      'Full chat history',
      'Priority support',
      'Early access to new features',
      'Advanced AI models',
    ],
    cta: 'Upgrade',
    highlight: true,
  },
  {
    name: 'Pro',
    price: '₹799/year',
    features: [
      'Everything in Premium',
      'Team collaboration',
      'Custom integrations',
      'Dedicated onboarding',
      '24/7 support',
    ],
    cta: 'Contact Sales',
    highlight: false,
  },
];

export default function PricingPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | null>(null);

  // Check for payment status in URL params
  useEffect(() => {
    if (!searchParams) return;
    
    const status = searchParams.get('status');
    const transactionId = searchParams.get('transactionId');
    const message = searchParams.get('message');

    if (status === 'success') {
      setPaymentStatus('success');
      toast.success(`Payment successful! Transaction ID: ${transactionId}`);
    } else if (status === 'failed') {
      setPaymentStatus('failed');
      toast.error(`Payment failed: ${message || 'Unknown error'}`);
    }
  }, [searchParams]);

  const handlePhonePePayment = async (planName: string, amount: number) => {
    if (!user) {
      toast.error('Please login to upgrade your plan');
      return;
    }

    setLoading(planName);

    try {
      const response = await fetch('/api/phonepe-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          userId: user.uid,
          planName: planName,
        }),
      });

      const result = await response.json();

      if (result.success && result.data?.redirectUrl) {
        // Store transaction ID in localStorage for potential status checking
        if (result.data.merchantTransactionId) {
          localStorage.setItem('pendingPayment', JSON.stringify({
            transactionId: result.data.merchantTransactionId,
            planName: planName,
            amount: amount,
            timestamp: Date.now()
          }));
        }
        
        // Redirect to PhonePe payment page
        window.location.href = result.data.redirectUrl;
      } else {
        console.error('Payment initiation failed:', result);
        toast.error(result.message || 'Failed to initiate payment. Please try again.');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error('Failed to process payment. Please check your connection and try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 py-12 px-4">
      {/* Payment Status Banner */}
      {paymentStatus === 'success' && (
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-green-800 dark:text-green-200 font-medium">Payment Successful!</p>
              <p className="text-green-600 dark:text-green-400 text-sm">Your Premium plan has been activated.</p>
            </div>
          </div>
        </div>
      )}
      
      {paymentStatus === 'failed' && (
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 flex items-center gap-3">
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <div>
              <p className="text-red-800 dark:text-red-200 font-medium">Payment Failed</p>
              <p className="text-red-600 dark:text-red-400 text-sm">Please try again or contact support if the issue persists.</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 text-blue-700 dark:text-blue-300">Upgrade to Premium</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">Unlock advanced features and get the most out of MigrantBot. Choose the plan that fits you best.</p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-8 justify-center items-stretch">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={cn(
              'flex-1 bg-white dark:bg-gray-950 rounded-2xl shadow-lg p-8 flex flex-col items-center border-2 transition-all duration-300',
              plan.highlight ? 'border-blue-500 scale-105 z-10 shadow-blue-200 dark:shadow-blue-900/20' : 'border-gray-200 dark:border-gray-800'
            )}
          >
            <h2 className="text-2xl font-semibold mb-2 text-blue-700 dark:text-blue-300">{plan.name}</h2>
            <div className="text-3xl font-bold mb-4 text-blue-600 dark:text-blue-200">{plan.price}</div>
            <ul className="mb-6 space-y-3 text-gray-700 dark:text-gray-300 text-left w-full max-w-xs mx-auto">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                  {feature}
                </li>
              ))}
            </ul>
            
            {plan.cta === 'Current Plan' ? (
              <button className="bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg cursor-default flex items-center gap-2" disabled>
                <CheckCircle className="h-4 w-4" />
                {plan.cta}
              </button>
            ) : plan.cta === 'Upgrade' ? (
              <button 
                onClick={() => handlePhonePePayment('Premium', 99)}
                disabled={loading === 'Premium'}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[140px] justify-center"
              >
                {loading === 'Premium' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    Pay with PhonePe
                  </>
                )}
              </button>
            ) : plan.cta === 'Contact Sales' ? (
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => handlePhonePePayment('Pro', 799)}
                  disabled={loading === 'Pro'}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[140px] justify-center"
                >
                  {loading === 'Pro' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      Pay with PhonePe
                    </>
                  )}
                </button>
                <Link href="/contact">
                  <button className="bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-lg font-medium text-sm hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
                    Or Contact Sales
                  </button>
                </Link>
              </div>
            ) : null}
          </div>
        ))}
      </div>
      
      <div className="max-w-2xl mx-auto mt-12 text-center text-gray-500 dark:text-gray-400 text-sm">
        <p>* All prices are inclusive of taxes. Cancel anytime. For teams and custom solutions, contact sales.</p>
        <div className="mt-4 flex items-center justify-center gap-2 text-xs">
          <CreditCard className="h-4 w-4" />
          <span>Secure payments powered by PhonePe</span>
        </div>
      </div>
    </div>
  );
}
