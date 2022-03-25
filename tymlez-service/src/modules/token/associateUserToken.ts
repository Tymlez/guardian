import axios from 'axios';
import type { ILoggedUser } from '../user';
import type { ITokenInfo } from 'interfaces';
import promiseRetry from 'promise-retry';
interface IAssociateUserToken {
  guardianApiGatewayUrl: string;
  user: ILoggedUser;
  token: ITokenInfo;
}
export async function associateUserToken({
  guardianApiGatewayUrl,
  user,
  token,
}: IAssociateUserToken) {
  await axios.put(
    `${guardianApiGatewayUrl}/api/v1/tokens/${token.tokenId}/associate`,
    {
      tokenId: token.tokenId,
      associated: true,
    },
    {
      headers: {
        authorization: `Bearer ${user.accessToken}`,
      },
    },
  );
}

export async function associateUserTokenWithRetry(
  params: IAssociateUserToken,
  retries = 3,
) {
  return promiseRetry(
    (retry) => {
      return associateUserToken(params).catch(retry);
    },
    { retries },
  );
}
