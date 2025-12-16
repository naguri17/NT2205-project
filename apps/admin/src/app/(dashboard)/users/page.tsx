import { getServerSession } from "next-auth";
import { User, columns } from "./columns";
import { DataTable } from "./data-table";
import { authOptions } from "@/lib/auth";

const getData = async (token: string | undefined): Promise<any> => {
  if (!token) {
    return { data: [], totalCount: 0 };
  }

  const keycloakAdminBase =
    process.env.KEYCLOAK_ADMIN_URL ||
    "http://127.0.0.1:8080/admin/realms/NT2205";

  try {
    const res = await fetch(`${keycloakAdminBase}/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      return { data: [], totalCount: 0 };
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Error fetching users:", err);
    return { data: [], totalCount: 0 };
  }
};

const UsersPage = async () => {
  const session = await getServerSession(authOptions);
  const accessToken = session?.accessToken as string | undefined;
  const data = await getData(accessToken);

  return (
    <div className="">
      <div className="mb-8 px-4 py-2 bg-secondary rounded-md">
        <h1 className="font-semibold">All Users</h1>
      </div>
      <DataTable columns={columns} data={data} />
    </div>
  );
};

export default UsersPage;
