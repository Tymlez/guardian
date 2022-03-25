import assert from 'assert';
import axios from 'axios';
import type { IToken } from 'interfaces';
import type { ILoggedUser } from '../user';
import promiseRetry from 'promise-retry';

interface ICreateToken {
  guardianApiGatewayUrl: string;
  inputToken: IToken;
  rootAuthority: ILoggedUser;
}
export async function createToken({
  inputToken,
  rootAuthority,
  guardianApiGatewayUrl,
}: ICreateToken): Promise<IToken> {
  const { data: allTokens } = await axios.post<IToken[]>(
    `${guardianApiGatewayUrl}/api/v1/tokens`,
    inputToken,
    {
      headers: {
        authorization: `Bearer ${rootAuthority.accessToken}`,
      },
    },
  );

  const createdToken = allTokens.find(
    (token) => token.tokenSymbol === inputToken.tokenSymbol,
  );

  assert(createdToken, `Failed to create token ${inputToken.tokenSymbol}`);
  return createdToken;
}

export const createTokenWithRetry = async (params: ICreateToken, retries = 3) =>
  promiseRetry(
    async (retry) => {
      return createToken(params).catch(retry);
    },
    { retries },
  );
