import axios from 'axios';
import type { ILoggedUser } from './ILoggedUser';

export async function registeredUsers({
  guardianApiGatewayUrl,
}: {
  guardianApiGatewayUrl: string;
}) {
  const { data: user } = (await axios.get(
    `${guardianApiGatewayUrl}/api/v1/demo/registeredUsers`,
  )) as { data: ILoggedUser[] };

  return user;
}
