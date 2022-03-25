import axios from 'axios';
import promiseRetry from 'promise-retry';
import type { ILoggedUser } from '../user';

interface IUpdateBlock {
  guardianApiGatewayUrl: string;
  user: ILoggedUser;
  policyId: string;
  blockTag: string;
  data: any;
}

export async function sendBlockData({
  guardianApiGatewayUrl,
  user,
  policyId,
  blockTag,
  data,
}: IUpdateBlock) {
  console.log('Update policy block', policyId, blockTag);
  const { data: blockId } = await axios.get(
    `${guardianApiGatewayUrl}/api/v1/policies/${policyId}/tag/${blockTag}`,
    {
      headers: {
        Authorization: `Api-Key ${user.accessToken}`,
      },
    },
  );
  console.log('set block data ', blockTag, blockId, data);
  await axios.post(
    `${guardianApiGatewayUrl}/api/v1/policies/${policyId}/blocks/${blockId.id}`,
    {
      ...data,
    },
    {
      headers: {
        Authorization: `Api-Key ${user.accessToken}`,
      },
    },
  );
}

export async function sendBlockDataWithRetry(
  params: IUpdateBlock,
  retries = 3,
) {
  return promiseRetry(async (retry) => sendBlockData(params).catch(retry), {
    retries,
  });
}
