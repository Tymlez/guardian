import axios from 'axios';
import type { ILoggedUser } from '../user';
import promiseRetry from 'promise-retry';

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

export async function getRandomKeyFromUiServiceWithRetry(
  {
    uiServiceBaseUrl,
    user,
  }: {
    uiServiceBaseUrl: string;
    user: ILoggedUser;
  },
  retries = 3,
) {
  return promiseRetry(
    () => {
      return getRandomKeyFromUiService({ uiServiceBaseUrl, user });
    },
    { retries },
  );
}
