import axios from 'axios';
import type { ILoggedUser } from './ILoggedUser';

export async function registeredUsers({
  uiServiceBaseUrl,
}: {
  uiServiceBaseUrl: string;
}) {
  const { data: user } = (await axios.get(
    `${uiServiceBaseUrl}/api/v1/demo/registeredUsers`,
  )) as { data: ILoggedUser[] };

  return user;
}
