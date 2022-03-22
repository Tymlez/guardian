import axios from 'axios';
import type { IToken } from 'interfaces';
import type { ILoggedUser } from '../user';
import promiseRetry from 'promise-retry';

interface IGettoken {
  uiServiceBaseUrl: string;
  user: ILoggedUser;
}
export async function getTokens({
  user,
  uiServiceBaseUrl,
}: IGettoken): Promise<IToken[]> {
  const { data: allTokens } = await axios.get<IToken[]>(
    `${uiServiceBaseUrl}/api/v1/tokens`,
    {
      headers: {
        authorization: `Bearer ${user.accessToken}`,
      },
    },
  );

  return allTokens;
}

export const getTokesnWithRetry = async (params: IGettoken, retries = 3) =>
  promiseRetry(
    () => {
      return getTokens(params);
    },
    { retries },
  );
