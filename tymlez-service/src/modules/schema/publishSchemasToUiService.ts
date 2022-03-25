import axios from 'axios';
import type { ILoggedUser } from '../user';
import plimit from 'p-limit';
import promiseRetry from 'promise-retry';

interface IPublicSchemaRequest {
  guardianApiGatewayUrl: string;
  schemaId: string;
  rootAuthority: ILoggedUser;
  version: string;
}
export async function publishSchemaToUiService({
  schemaId,
  rootAuthority,
  guardianApiGatewayUrl,
  version = '1.0.0',
}: IPublicSchemaRequest) {
  await axios.put(
    `${guardianApiGatewayUrl}/api/v1/schemas/${schemaId}/publish`,
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
    (retry) => {
      return publishSchemaToUiService(input).catch(retry);
    },
    { retries },
  );
}

export async function publishSchemasToUiService({
  schemaIds,
  rootAuthority,
  guardianApiGatewayUrl,
  version = '1.0.0',
}: {
  guardianApiGatewayUrl: string;
  schemaIds: string[];
  rootAuthority: ILoggedUser;
  version: string;
}) {
  const limit = plimit(1);
  await Promise.all(
    schemaIds.map((schemaId) =>
      limit(() =>
        publishSchemaToUiServiceWithRetry({
          schemaId,
          rootAuthority,
          guardianApiGatewayUrl,
          version,
        }),
      ),
    ),
  );
}
