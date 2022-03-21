import axios from 'axios';
import type { ILoggedUser } from '../user';

export async function publishSchemasToUiService({
  schemaIds,
  rootAuthority,
  uiServiceBaseUrl,
  version = '1.0.0',
}: {
  uiServiceBaseUrl: string;
  schemaIds: string[];
  rootAuthority: ILoggedUser;
  version: string;
}) {
  for await (let schemaId of schemaIds) {
    await axios.put(
      `${uiServiceBaseUrl}/api/v1/schemas/${schemaId}/publish`,
      { version },
      {
        headers: {
          authorization: `Bearer ${rootAuthority.accessToken}`,
        },
      },
    );
  }
}
