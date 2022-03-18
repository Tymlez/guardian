import axios from 'axios';
import type { ITokenInfo } from 'interfaces';
import type { ILoggedUser } from '../user';

export async function getUserKycFromUiService({
  tokenId,
  username,
  rootAuthority,
  uiServiceBaseUrl,
}: {
  uiServiceBaseUrl: string;
  tokenId: string;
  username: string;
  rootAuthority: ILoggedUser;
}): Promise<ITokenInfo> {
  return (
    await axios.get(
      `${uiServiceBaseUrl}/api/v1/tokens/${tokenId}/${username}/info`,
      {
        headers: {
          authorization: `Bearer ${rootAuthority.accessToken}`,
        },
      },
    )
  ).data;
}
