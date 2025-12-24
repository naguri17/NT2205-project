"use client";

import { OrderType } from "@repo/types";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

const OrdersPage = () => {
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { data: session, status } = useSession();

  useEffect(() => {
    const fetchOrders = async () => {
      if (status === "loading") return;

      const token = session?.accessToken;

      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_ORDER_SERVICE_URL}/user-orders`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (res.ok) {
          const data: OrderType[] = await res.json();
          setOrders(data);
        }
      } catch (error) {
        console.error("Failed to fetch orders", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [session, status]);

  if (isLoading) return <div>Loading...</div>;
  if (!orders || orders.length === 0) {
    return <div className="">No orders found!</div>;
  }

  return (
    <div className="">
      <h1 className="text-2xl my-4 font-medium">Your Orders</h1>
      <ul>
        {orders.map((order) => (
          <li key={order._id} className="flex items-center mb-4">
            <div className="w-1/4">
              <span className="font-medium text-sm text-gray-500">
                Order ID
              </span>
              <p>{order._id}</p>
            </div>
            <div className="w-1/12">
              <span className="font-medium text-sm text-gray-500">Total</span>
              <p>{order.amount / 100}</p>
            </div>
            <div className="w-1/12">
              <span className="font-medium text-sm text-gray-500">Status</span>
              <p>{order.status}</p>
            </div>
            <div className="w-1/8">
              <span className="font-medium text-sm text-gray-500">Date</span>
              <p>
                {order.createdAt
                  ? new Date(order.createdAt).toLocaleDateString("en-US")
                  : "-"}
              </p>
            </div>
            <div className="">
              <span className="font-medium text-sm text-gray-500">
                Products
              </span>
              <p>
                {order.products
                  ?.map((product: any) => product.name)
                  .join(", ") || "-"}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default OrdersPage;
