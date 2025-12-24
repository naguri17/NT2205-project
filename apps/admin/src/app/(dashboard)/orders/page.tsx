import { OrderType } from "@repo/types";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const getData = async (token: string | undefined): Promise<OrderType[]> => {
  if (!token) {
    console.log("Token is missing. Cannot fetch orders.");
    return [];
  }

  try {
    const res = await fetch(process.env.NEXT_PUBLIC_ORDER_SERVICE_URL!, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Error fetching orders:", err);
    return [];
  }
};

const OrdersPage = async () => {
  const session = await getServerSession(authOptions);
  const accessToken = session?.accessToken as string | undefined;
  const data = await getData(accessToken);

  return (
    <div className="">
      <div className="mb-8 px-4 py-2 bg-secondary rounded-md">
        <h1 className="font-semibold">All Payments</h1>
      </div>
      <DataTable columns={columns} data={data} />
    </div>
  );
};

export default OrdersPage;
