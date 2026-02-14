import api, { redirectToLogin } from "@/lib/api-client";
import { ICurrentUser, IUser } from "@/features/user/types/user.types";

export async function getMyInfo(): Promise<ICurrentUser> {
  try {
    const req = await api.post<ICurrentUser>("/users/me");
    return req.data as ICurrentUser;
  } catch (error) {
    redirectToLogin();
    throw error;
  }
}

export async function updateUser(data: Partial<IUser>): Promise<IUser> {
  const req = await api.post<IUser>("/users/update", data);
  return req.data as IUser;
}
