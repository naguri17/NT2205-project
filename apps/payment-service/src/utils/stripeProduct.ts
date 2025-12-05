import stripe from "./stripe.js";
import { StripeProductType } from "@repo/types";

export const createStripeProduct = async (item: StripeProductType) => {
  try {
    const res = await stripe.products.create({
      id: item.id,
      name: item.name,
      default_price_data: {
        currency: "usd",
        unit_amount: item.price * 100,
      },
    });

    return res;
  } catch (error) {
    console.log(error);
    return error;
  }
};

export const getStripeProductPrice = async (productId: string) => {
  try {
    const res = await stripe.prices.list({
      product: productId,
    });

    return res.data[0]?.unit_amount;
    return res;
  } catch (error) {
    console.log(error);
    return error;
  }
};
