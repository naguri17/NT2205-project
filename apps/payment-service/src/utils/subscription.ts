import { consumer } from "./kafka.js";
import { createStripeProduct, deleteStripeProduct } from "./stripeProduct.js";

export const runKafkaSubscriptions = async () => {
  consumer.subscribe([
    {
      topicName: "product.created",
      topicHandler: async (message) => {
        const product = message;
        console.log("Received product.created event:", product);

        await createStripeProduct(product);
      },
    },
    {
      topicName: "product.deleted",
      topicHandler: async (message) => {
        const product = message;
        console.log("Received product.deleted event:", product);

        await deleteStripeProduct(product);
      },
    },
  ]);
};
