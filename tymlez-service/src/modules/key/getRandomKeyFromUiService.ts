import axios from 'axios';
import type { ILoggedUser } from '../user';

export async function getRandomKeyFromUiService({
  uiServiceBaseUrl,
  user,
}: {
  uiServiceBaseUrl: string;
  user: ILoggedUser;
}) {
  return (
    await axios.get(`${uiServiceBaseUrl}/api/v1/demo/randomKey`, {
      headers: {
        authorization: `Bearer ${user.accessToken}`,
      },
    })
  ).data;
}
