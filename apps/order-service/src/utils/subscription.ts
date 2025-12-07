import { consumer } from "./kafka.js";
import { createOrder } from "./order.js";

export const runKafkaSubscriptions = async () => {
  consumer.subscribe([
    {
      topicName: "payment.successful",
      topicHandler: async (message) => {
        const product = message;
        console.log("Received payment.successful event:", product);

        const order = message.value;

        await createOrder(order);
      },
    },
  ]);
};
