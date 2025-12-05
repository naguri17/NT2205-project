import moongoose from "mongoose";

let isConnected = false;

export const connectOrderDB = async () => {
  if (isConnected) return;

  try {
    console.log("Connecting to:", process.env.MONGO_URL);
    await moongoose.connect(process.env.MONGO_URL!);
    isConnected = true;
    console.log("Connected to MongoDB");
  } catch (error) {
    console.log("Failed to connect to Order DB");
    console.error(error);
  }
};
