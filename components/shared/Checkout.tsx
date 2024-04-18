'use client';

import React, { useEffect } from "react";
import { loadScript } from "@paypal/paypal-js";
import { useToast } from "@/components/ui/use-toast";
import { checkoutCredits } from "@/lib/actions/transaction.actions";
import { Button } from "../ui/button";

const Checkout = ({
  plan,
  amount,
  credits,
  buyerId,
}: {
  plan: string;
  amount: number;
  credits: number;
  buyerId: string;
}) => {
  const { toast } = useToast();

  useEffect(() => {
    const initializePayPal = async () => {
      const paypalScript = await loadScript({
        "clientId": process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
        components: "buttons",
      });

      if (paypalScript) {
        // PayPal script loaded successfully
        if (window.paypal?.Buttons) {
          window.paypal
            .Buttons({
              createOrder: function () {
                return fetch("/api/createOrder", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    plan,
                    amount,
                    credits,
                    buyerId,
                  }),
                })
                  .then((res) => res.json())
                  .then((data) => data.orderID);
              },
              onApprove: async function (data, actions) {
                if (actions.order) {
                  const order = await actions.order.capture();
                  if (order.status === "COMPLETED") {
                    toast({
                      title: "Order placed!",
                      description: "You will receive an email confirmation",
                      duration: 5000,
                      className: "success-toast",
                    });
                  }
                }
              },
              onCancel: function (data) {
                toast({
                  title: "Order canceled!",
                  description: "Continue to shop around and checkout when you're ready",
                  duration: 5000,
                  className: "error-toast",
                });
              },
              onError: function (err) {
                console.error("PayPal error:", err);
                toast({
                  title: "Error",
                  description: "An error occurred during checkout",
                  duration: 5000,
                  className: "error-toast",
                });
              },
            })
            ?.render("#paypal-button-container");
        }
      }
    };

    initializePayPal();
  }, [plan, amount, credits, buyerId, toast]);

  return (
    <section>
      <div id="paypal-button-container">
        <Button
          disabled
          className="w-full rounded-full bg-gray-400"
        >
          Loading PayPal...
        </Button>
      </div>
    </section>
  );
};

export default Checkout;
