import { baseClient } from './baseClient';

export const getMySubscription = async () => {
    return baseClient('/subscriptions/my-subscription');
};

export const notifyPayment = async (data: { planName: string, price: number, transactionId: string, senderPhone: string }) => {
    return baseClient('/subscriptions/notify-payment', {
        method: 'POST',
        body: JSON.stringify(data)
    });
};

export const initializePaytechPayment = async (data: { planId: string, period: 'monthly' | 'annual' }) => {
    return baseClient('/payment/request', {
        method: 'POST',
        body: JSON.stringify(data)
    });
};
