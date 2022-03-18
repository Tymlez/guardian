import axios from 'axios';
import type { ILoggedUser } from '../user';

export async function publishSchemasToUiService({
  schemaIds,
  rootAuthority,
  uiServiceBaseUrl,
}: {
  uiServiceBaseUrl: string;
  schemaIds: string[];
  rootAuthority: ILoggedUser;
}) {
  for (let schemaId of schemaIds) {
    await axios.put(
      `${uiServiceBaseUrl}/api/v1/schemas/${schemaId}/publish`,
      {},
      {
        headers: {
          authorization: `Bearer ${rootAuthority.accessToken}`,
        },
      },
    );
  }
}
