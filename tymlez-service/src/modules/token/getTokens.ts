import axios from 'axios';
import type { IToken } from 'interfaces';
import type { ILoggedUser } from '../user';
import promiseRetry from 'promise-retry';

interface IGettoken {
  guardianApiGatewayUrl: string;
  user: ILoggedUser;
}
export async function getTokens({
  user,
  guardianApiGatewayUrl,
}: IGettoken): Promise<IToken[]> {
  const { data: allTokens } = await axios.get<IToken[]>(
    `${guardianApiGatewayUrl}/api/v1/tokens`,
    {
      headers: {
        authorization: `Bearer ${user.accessToken}`,
      },
    },
  );

  return allTokens;
}

export const getTokensWithRetry = async (params: IGettoken, retries = 3) =>
  promiseRetry(
    (retry) => {
      return getTokens(params).catch(retry);
    },
    { retries },
  );
