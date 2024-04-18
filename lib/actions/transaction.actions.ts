"use server";

import { redirect } from 'next/navigation';
import { handleError } from '../utils';
import { connectToDatabase } from '../database/mongoose';
import Transaction from '../database/models/transaction.model';
import { updateCredits } from './user.actions';

// Import PayPal SDK
import paypal from '@paypal/checkout-server-sdk';

// Initialize PayPal client
const paypalClient = new paypal.core.PayPalHttpClient({
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
    clientSecret: process.env.PAYPAL_SECRET!,
    webUrl: '',
    authorizationString: () => '',
    baseUrl: ''
});

export async function checkoutCredits(transaction: CheckoutTransactionParams) {
    try {
        // Set up PayPal request
        const request = new paypal.orders.OrdersCreateRequest();
                request.prefer('return=representation');
        request.requestBody({
            intent: 'CAPTURE',
            purchase_units: [{
                amount: {
                    currency_code: 'USD',
                    value: transaction.amount.toString() // Convert the number to a string
                }
            }]
        });

        // Execute PayPal request
        const response = await paypalClient.execute(request);

        // Redirect based on success or failure
        if (response.statusCode === 201) {
            redirect(`${process.env.NEXT_PUBLIC_SERVER_URL}/profile`);
        } else {
            redirect(`${process.env.NEXT_PUBLIC_SERVER_URL}/`);
        }

  } catch (error) {
    handleError(error);
  }
}

export async function createTransaction(transaction: CreateTransactionParams) {
  try {
    await connectToDatabase();

    // Create a new transaction with a buyerId
    const newTransaction = await Transaction.create({
      ...transaction,
      buyer: transaction.buyerId
    });

    await updateCredits(transaction.buyerId, transaction.credits);

    return JSON.parse(JSON.stringify(newTransaction));
  } catch (error) {
    handleError(error);
  }
}
