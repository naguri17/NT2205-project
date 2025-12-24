import { Kafka, logLevel } from "kafkajs";

// Kafka brokers configuration
// - Trong Docker network: kafka-broker-X:9092 (PLAINTEXT)
// - Từ bên ngoài (local dev): localhost:909X (EXTERNAL)
const getKafkaBrokers = (): string[] => {
  // Nếu có env variable KAFKA_BROKERS, dùng nó
  if (process.env.KAFKA_BROKERS) {
    return process.env.KAFKA_BROKERS.split(",");
  }

  // Mặc định cho local development (chạy ngoài Docker)
  return ["localhost:9094", "localhost:9095", "localhost:9096"];
};

export const createKafkaClient = (service: string) => {
  const brokers = getKafkaBrokers();

  console.log(`[Kafka] ${service} connecting to brokers:`, brokers);

  return new Kafka({
    clientId: service,
    brokers,
    logLevel: logLevel.WARN,
    connectionTimeout: 10000,
    requestTimeout: 30000,
    retry: {
      initialRetryTime: 300,
      retries: 10,
      maxRetryTime: 30000,
      factor: 2,
    },
  });
};
