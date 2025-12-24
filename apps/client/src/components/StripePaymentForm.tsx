"use client";

import { loadStripe } from "@stripe/stripe-js";
import { CartItemsType, ShippingFormInputs } from "@repo/types";
import useCartStore from "@/stores/cartStore";
import { useSession } from "next-auth/react";
import { CheckoutProvider } from "@stripe/react-stripe-js/checkout";
import CheckoutForm from "./CheckoutForm";

const stripe = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_...",
);

const fetchClientSecret = async (token: string, cart: CartItemsType) => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL}/sessions/create-checkout-session`,
    {
      method: "POST",
      body: JSON.stringify({ products: cart }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  )
    .then((response) => {
      console.log(response);

      return response.json();
    })
    .then((json) => json.checkoutSessionClientSecret);

  return res;
};

const StripePaymentForm = ({
  shippingForm,
}: {
  shippingForm: ShippingFormInputs;
}) => {
  const { cart } = useCartStore();

  const { data: session } = useSession();

  const token = session?.accessToken;

  if (!token) {
    return <div>Loading...</div>;
  }

  return (
    <CheckoutProvider
      stripe={stripe}
      options={{
        clientSecret: fetchClientSecret(token || "", cart),
      }}
    >
      <CheckoutForm shippingForm={shippingForm} />
    </CheckoutProvider>
  );
};

export default StripePaymentForm;
