import type { Kafka, Consumer } from "kafkajs";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const createConsumer = (kafka: Kafka, groupId: string) => {
  const consumer: Consumer = kafka.consumer({
    groupId,
    retry: {
      initialRetryTime: 300,
      retries: 10,
    },
    sessionTimeout: 30000,
    heartbeatInterval: 3000,
  });

  const connect = async () => {
    let retries = 5;
    while (retries > 0) {
      try {
        await consumer.connect();
        console.log("Kafka consumer connected:" + groupId);
        return;
      } catch (error) {
        retries--;
        console.log(
          `[Kafka] Consumer connection failed, retrying... (${5 - retries}/5)`,
          error instanceof Error ? error.message : error,
        );
        if (retries === 0) throw error;
        await sleep(2000);
      }
    }
  };

  const subscribe = async (
    topics: {
      topicName: string;
      topicHandler: (message: any) => Promise<void>;
    }[],
  ) => {
    const topicNames = topics.map((topic) => topic.topicName);

    // Retry subscribe with exponential backoff
    let retries = 5;
    let delay = 1000;

    while (retries > 0) {
      try {
        await consumer.subscribe({
          topics: topicNames,
          fromBeginning: true,
        });
        console.log(`[Kafka] Subscribed to topics: ${topicNames.join(", ")}`);
        break;
      } catch (error: any) {
        retries--;
        if (
          error?.type === "UNKNOWN_TOPIC_OR_PARTITION" ||
          error?.code === 3
        ) {
          console.log(
            `[Kafka] Topics not ready, retrying in ${delay}ms... (${5 - retries}/5)`,
          );
          await sleep(delay);
          delay *= 2; // Exponential backoff
        } else {
          throw error;
        }
        if (retries === 0) {
          console.error("[Kafka] Failed to subscribe after 5 retries");
          throw error;
        }
      }
    }

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const topicConfig = topics.find((t) => t.topicName === topic);
          if (topicConfig) {
            const value = message.value?.toString();

            if (value) {
              await topicConfig.topicHandler(JSON.parse(value));
            }
          }
        } catch (error) {
          console.log("Error processing message", error);
        }
      },
    });
  };

  const disconnect = async () => {
    await consumer.disconnect();
  };

  return { connect, subscribe, disconnect };
};
