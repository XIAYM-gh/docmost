import api from "@/lib/api-client";
import { ICurrentUser, IUser } from "@/features/user/types/user.types";
import APP_ROUTE from "@/lib/app-route";

export async function getMyInfo(): Promise<ICurrentUser> {
  try {
    const req = await api.post<ICurrentUser>("/users/me");
    return req.data as ICurrentUser;
  } catch (error) {
    if (window.location.pathname != APP_ROUTE.AUTH.LOGIN) {
      window.location.replace(APP_ROUTE.AUTH.LOGIN);
    }

    throw error;
  }
}

export async function updateUser(data: Partial<IUser>): Promise<IUser> {
  const req = await api.post<IUser>("/users/update", data);
  return req.data as IUser;
}
