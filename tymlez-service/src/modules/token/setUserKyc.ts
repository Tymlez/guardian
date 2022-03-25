import axios from 'axios';
import type { ITokenInfo } from 'interfaces';
import type { ILoggedUser } from '../user';
import promiseRetry from 'promise-retry';

interface ISetUserTokenKyc {
  guardianApiGatewayUrl: string;
  tokenId: string;
  username: string;
  rootAuthority: ILoggedUser;
}
export async function setUserKyc({
  tokenId,
  rootAuthority,
  guardianApiGatewayUrl,
  username,
}: ISetUserTokenKyc): Promise<ITokenInfo> {
  const { data } = await axios.put<ITokenInfo>(
    `${guardianApiGatewayUrl}/api/v1/tokens/${tokenId}/${username}/grantKyc`,
    {},
    {
      headers: {
        authorization: `Bearer ${rootAuthority.accessToken}`,
      },
    },
  );

  return data;
}

export const setUserKycWithRetry = async (
  params: ISetUserTokenKyc,
  retries = 3,
) =>
  promiseRetry(
    async (retry) => {
      return setUserKyc(params).catch(retry);
    },
    { retries },
  );
