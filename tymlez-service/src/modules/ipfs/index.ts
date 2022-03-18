import axios from 'axios';
import type { ILoggedUser } from 'modules/user';

export async function uploadToIpfs<T>(
  uiServiceBaseUrl: string,
  user: ILoggedUser,
  data: T,
): Promise<string> {
  const { data: ipfsId } = await axios.request<string>({
    method: 'post',
    url: `${uiServiceBaseUrl}/api/v1/ipfs/file`,
    headers: {
      'Content-Type': 'binary/octet-stream',
      Accept: 'application/json',
      Authorization: `Bearer ${user.accessToken}`,
    },
    data: Buffer.from(JSON.stringify(data)),
  });
  return `https://ipfs.io/ipfs/${ipfsId}`;
}
