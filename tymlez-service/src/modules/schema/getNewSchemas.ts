import { getAllSchemasFromUiService } from './getAllSchemasFromUiService';
import type { ILoggedUser } from '../user';

export async function getNewSchemas({
  preImportSchemas,
  rootAuthority,
  uiServiceBaseUrl,
}: {
  uiServiceBaseUrl: string;
  rootAuthority: ILoggedUser;
  preImportSchemas: string[];
}) {
  const postImportSchemas = await getAllSchemasFromUiService({
    uiServiceBaseUrl,
    rootAuthority,
  });

  return postImportSchemas.filter((schema) =>
    preImportSchemas.includes(schema.name as string),
  );
}
