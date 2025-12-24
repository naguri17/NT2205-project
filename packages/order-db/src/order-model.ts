import mongoose, { InferSchemaType } from "mongoose";

const { Schema, model } = mongoose;
export const OrderStatus = ["success", "failed"] as const;

const OrderSchema = new Schema(
  {
    userId: { type: String, required: true },
    email: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: OrderStatus, required: true },
    products: {
      type: [
        {
          name: { type: String, required: true },
          quantity: { type: Number, required: true },
          price: { type: Number, required: true },
        },
      ],
      required: true,
    },
  },
  { timestamps: true },
);

export type OrderSchemaType = InferSchemaType<typeof OrderSchema>;

export const Order = model<OrderSchemaType>("Order", OrderSchema);
