import axios from 'axios';
import type { ISchema } from 'interfaces';
import type { ILoggedUser } from '../user';

export async function getAllSchemasFromUiService({
  rootAuthority,
  guardianApiGatewayUrl,
}: {
  guardianApiGatewayUrl: string;
  rootAuthority: ILoggedUser;
}) {
  const { data: schemas } = (await axios.get(
    `${guardianApiGatewayUrl}/api/v1/schemas`,
    {
      headers: {
        authorization: `Bearer ${rootAuthority.accessToken}`,
      },
    },
  )) as { data: ISchema[] };

  return schemas;
}
