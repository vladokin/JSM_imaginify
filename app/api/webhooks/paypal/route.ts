/* eslint-disable camelcase */
import { NextResponse } from "next/server";
import axios from 'axios';
import { createTransaction } from "@/lib/actions/transaction.actions";

export async function POST(request: Request) {
  const body = await request.text();
  

  // Verify the webhook
  const webhookId = process.env.PAYPAL_WEBHOOK_ID!;
  const response = await axios.post(`https://api.paypal.com/v1/notifications/verify-webhook-signature`, {
    auth_token: process.env.PAYPAL_SECRET!,
    transmission_id: request.headers.get('PAYPAL_TRANSMISSION_ID'),
    transmission_time: request.headers.get('PAYPAL_TRANSMISSION_TIME'),
    cert_url: request.headers.get('PAYPAL_CERT_URL'),
    transmission_sig: request.headers.get('PAYPAL_TRANSMISSION_SIG'),
    webhook_id: webhookId,
    webhook_event: body
  });

  if (response.data.verification_status !== 'SUCCESS') {
    return NextResponse.json({ message: "Webhook error", error: 'Verification failed' });
  }

  const event = JSON.parse(body);

  // Get the ID and type
  const eventType = event.event_type;

  // CREATE
  if (eventType === "CHECKOUT.ORDER.APPROVED") {
    const { id, purchase_units } = event.resource;
    const amount_total = purchase_units[0].amount.value;
    const metadata = purchase_units[0].description;

    const transaction = {
      paypalId: id,
      amount: amount_total ? Number(amount_total) : 0,
      plan: metadata?.plan || "",
      credits: Number(metadata?.credits) || 0,
      buyerId: metadata?.buyerId || "",
      createdAt: new Date(),
    };

    const newTransaction = await createTransaction(transaction);
    
    return NextResponse.json({ message: "OK", transaction: newTransaction });
  }

  return new Response("", { status: 200 });
}