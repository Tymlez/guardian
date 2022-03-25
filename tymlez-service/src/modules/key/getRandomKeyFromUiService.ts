import axios from 'axios';
import type { ILoggedUser } from '../user';
import promiseRetry from 'promise-retry';

export async function getRandomKeyFromUiService({
  guardianApiGatewayUrl,
  user,
}: {
  guardianApiGatewayUrl: string;
  user: ILoggedUser;
}) {
  return (
    await axios.get(`${guardianApiGatewayUrl}/api/v1/demo/randomKey`, {
      headers: {
        authorization: `Bearer ${user.accessToken}`,
      },
    })
  ).data;
}

export async function getRandomKeyFromUiServiceWithRetry(
  {
    guardianApiGatewayUrl,
    user,
  }: {
    guardianApiGatewayUrl: string;
    user: ILoggedUser;
  },
  retries = 3,
) {
  return promiseRetry(
    (retry) => {
      return getRandomKeyFromUiService({ guardianApiGatewayUrl, user }).catch(
        retry,
      );
    },
    { retries },
  );
}
