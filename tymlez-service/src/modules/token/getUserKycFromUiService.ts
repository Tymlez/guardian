import axios from 'axios';
import type { ITokenInfo } from 'interfaces';
import promiseRetry from 'promise-retry';
import type { ILoggedUser } from '../user';
interface IGetUserKyc {
  guardianApiGatewayUrl: string;
  tokenId: string;
  username: string;
  rootAuthority: ILoggedUser;
}
export async function getUserKycFromUiService({
  tokenId,
  username,
  rootAuthority,
  guardianApiGatewayUrl,
}: IGetUserKyc): Promise<ITokenInfo> {
  return (
    await axios.get(
      `${guardianApiGatewayUrl}/api/v1/tokens/${tokenId}/${username}/info`,
      {
        headers: {
          authorization: `Bearer ${rootAuthority.accessToken}`,
        },
      },
    )
  ).data;
}
export async function getUserKycFromUiServiceWithRetry(
  params: IGetUserKyc,
  retries = 3,
) {
  return promiseRetry(
    (retry) => {
      return getUserKycFromUiService(params).catch(retry);
    },
    { retries },
  );
}
