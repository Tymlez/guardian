import axios from 'axios';
import type { ILoggedUser } from '../user';
import plimit from 'p-limit';
import promiseRetry from 'promise-retry';

interface IPublicSchemaRequest {
  uiServiceBaseUrl: string;
  schemaId: string;
  rootAuthority: ILoggedUser;
  version: string;
}
export async function publishSchemaToUiService({
  schemaId,
  rootAuthority,
  uiServiceBaseUrl,
  version = '1.0.0',
}: IPublicSchemaRequest) {
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

export async function publishSchemaToUiServiceWithRetry(
  input: IPublicSchemaRequest,
  retries = 3,
) {
  return promiseRetry(
    () => {
      return publishSchemaToUiService(input);
    },
    { retries },
  );
}
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
  const limit = plimit(1);
  await Promise.all(
    schemaIds.map((schemaId) =>
      limit(async () =>
        publishSchemaToUiService({
          schemaId,
          rootAuthority,
          uiServiceBaseUrl,
          version,
        }),
      ),
    ),
  );
}
