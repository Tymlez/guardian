import axios from 'axios';
import type { ISchema } from 'interfaces';
import type { ILoggedUser } from '../user';

export async function getAllSchemasFromUiService({
  rootAuthority,
  uiServiceBaseUrl,
}: {
  uiServiceBaseUrl: string;
  rootAuthority: ILoggedUser;
}) {
  const { data: schemas } = (await axios.get(
    `${uiServiceBaseUrl}/api/v1/schemas`,
    {
      headers: {
        authorization: `Bearer ${rootAuthority.accessToken}`,
      },
    },
  )) as { data: ISchema[] };

  return schemas;
}
