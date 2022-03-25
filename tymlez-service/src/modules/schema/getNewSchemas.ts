import { getAllSchemasFromUiService } from './getAllSchemasFromUiService';
import type { ILoggedUser } from '../user';

export async function getNewSchemas({
  preImportSchemas,
  rootAuthority,
  guardianApiGatewayUrl,
}: {
  guardianApiGatewayUrl: string;
  rootAuthority: ILoggedUser;
  preImportSchemas: string[];
}) {
  const postImportSchemas = await getAllSchemasFromUiService({
    guardianApiGatewayUrl,
    rootAuthority,
  });

  return postImportSchemas.filter((schema) =>
    preImportSchemas.includes(schema.name as string),
  );
}
