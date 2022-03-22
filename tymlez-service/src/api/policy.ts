import assert from 'assert';
import axios from 'axios';
import { Request, Response, Router } from 'express';
import {
  getAllSchemasFromUiService,
  getNewSchemas,
  publishSchemasToUiService,
} from '../modules/schema';
import { v4 as uuidv4 } from 'uuid';
import { loginToUiService, ILoggedUser } from '../modules/user';
import {
  getAllPoliciesFromUiService,
  IPolicy,
  publishPolicyToUiService,
  // publishPolicyToUiService,
} from '../modules/policy';
import type { MongoRepository } from 'typeorm';
import type { PolicyPackage } from '@entity/policy-package';
import type { Schema } from 'interfaces';

export const makePolicyApi = ({
  uiServiceBaseUrl,
  policyPackageRepository,
}: {
  uiServiceBaseUrl: string;
  policyPackageRepository: MongoRepository<PolicyPackage>;
}) => {
  const policyApi = Router();

  policyApi.post('/import-package', async (req: Request, res: Response) => {
    const { package: inputPackage, publish } =
      req.body as IImportPolicyPackageRequestBody;

    assert(inputPackage, `package is missing`);

    const policyPackage = await policyPackageRepository.findOne({
      where: {
        'policy.inputPolicyTag': { $eq: inputPackage.policy.policyTag },
      },
    });

    if (policyPackage) {
      console.log(
        `Skip because policy package '${inputPackage.policy.policyTag}' was imported before.`,
      );
      res.status(200).json(policyPackage);
      return;
    }

    const rootAuthority = await loginToUiService({
      uiServiceBaseUrl,
      username: 'RootAuthority',
    });

    // const preImportSchemas = await getAllSchemasFromUiService({
    //   uiServiceBaseUrl,
    //   rootAuthority,
    // });

    const importedPolicy = await importPolicyPackage({
      rootAuthority,
      inputPackage,
      uiServiceBaseUrl,
    });

    const newSchemas = await getNewSchemas({
      uiServiceBaseUrl,
      rootAuthority,
      preImportSchemas: inputPackage.schemas.map((x) => x.name),
    });
    const unpublishedSchema = newSchemas.filter(
      (schema) => schema.status !== 'PUBLISHED',
    );
    console.log(
      `Publishing schemas`,
      unpublishedSchema.map((schema) => ({
        id: schema.id,
        uuid: schema.uuid,
        name: schema.name,
        status: schema.status,
      })),
    );
    await publishSchemasToUiService({
      uiServiceBaseUrl,
      rootAuthority,
      schemaIds: unpublishedSchema.map((schema) => schema.id),
      version: '1.0.0',
    });

    if (
      publish &&
      !['PUBLISH', 'PUBLISHED'].includes(importedPolicy.status as string)
    ) {
      console.log(`Publishing policy`, importedPolicy, {
        importedPolicy,
        id: importedPolicy.id,
        name: importedPolicy.name,
        policyTag: importedPolicy.policyTag,
        config: {
          id: importedPolicy.config?.id,
        },
      });
      await publishPolicyToUiService({
        policyId: importedPolicy.id,
        uiServiceBaseUrl,
        rootAuthority,
        policyVersion: '1.0.0',
      });
    }
    const newPolicyPackage = policyPackageRepository.create({
      policy: {
        ...importedPolicy,
        inputPolicyTag: inputPackage.policy.policyTag,
      },
      schemas: newSchemas.map((schema) => ({
        ...schema,
        inputName: inputPackage.schemas.find((inputSchema) =>
          schema.name?.startsWith(inputSchema.name),
        )!.name,
      })),
    });

    await policyPackageRepository.save(newPolicyPackage);

    res.status(200).json(newPolicyPackage);
  });

  policyApi.get('/list', async (req: Request, res: Response) => {
    const rootAuthority = await loginToUiService({
      uiServiceBaseUrl,
      username: 'RootAuthority',
    });

    assert(rootAuthority.did, `rootAuthority.did is missing`);

    const allPolicies = await getAllPoliciesFromUiService(
      uiServiceBaseUrl,
      rootAuthority,
    );

    res.status(200).json(allPolicies);
  });

  return policyApi;
};

// async function publishSchema(
//   uiServiceBaseUrl: string,
//   rootAuthority: ILoggedUser,
//   schema: Schema,
// ) {
//   const { data } = await axios.put<Schema[]>(
//     `${uiServiceBaseUrl}/api/v1/schemas/${schema.id}/publish`,
//     { version: '1.0.0' },
//     {
//       headers: {
//         authorization: `Bearer ${rootAuthority.accessToken}`,
//       },
//     },
//   );

//   return data;
// }

async function importSchema(
  uiServiceBaseUrl: string,
  rootAuthority: ILoggedUser,
  schema: Schema,
) {
  const { data } = await axios.post<Schema>(
    `${uiServiceBaseUrl}/api/v1/schemas`,
    schema,
    {
      headers: {
        authorization: `Bearer ${rootAuthority.accessToken}`,
      },
    },
  );

  return data;
}

async function createPolicy(
  uiServiceBaseUrl: string,
  rootAuthority: ILoggedUser,
  policy: IPolicy,
) {
  const allPolicies = await getAllPoliciesFromUiService(
    uiServiceBaseUrl,
    rootAuthority,
  );

  const findPolicies = allPolicies.find(
    (x) => x.policyTag === policy.policyTag,
  );
  if (!findPolicies) {
    console.log('create policy %s', policy.name);
    const { data } = await axios.post<IPolicy[]>(
      `${uiServiceBaseUrl}/api/v1/policies`,
      policy,
      {
        headers: {
          authorization: `Bearer ${rootAuthority.accessToken}`,
        },
      },
    );
    console.log('created policies result', data);
    return data.find((p) => p.policyTag === policy.policyTag);
  }
  return findPolicies;
}

async function importPolicyPackage({
  inputPackage,
  rootAuthority,
  uiServiceBaseUrl,
}: {
  rootAuthority: ILoggedUser;
  inputPackage: IImportPolicyPackage;
  uiServiceBaseUrl: string;
}) {
  assert(rootAuthority.did, `rootAuthority.did is missing`);

  const newPolicyConfigId = uuidv4();

  const packageImportData = {
    ...inputPackage,
    policy: {
      ...inputPackage.policy,
      config: {
        ...inputPackage.policy.config,
        id: newPolicyConfigId,
      },
      owner: rootAuthority.did,
      status: undefined,
      topicId: undefined,
    },
  };
  let existingSchemas = await getAllSchemasFromUiService({
    rootAuthority,
    uiServiceBaseUrl,
  });
  await Promise.all(
    packageImportData.schemas
      .filter((schema) => !existingSchemas.find((x) => x.name === schema.name))
      .map((schema) =>
        importSchema(uiServiceBaseUrl, rootAuthority, schema as Schema),
      ),
  );

  const importedPolicy = await createPolicy(
    uiServiceBaseUrl,
    rootAuthority,
    packageImportData.policy,
  );

  assert(
    importedPolicy,
    `Failed to import policy package ${inputPackage.policy.config.id} ${inputPackage.policy.name}`,
  );
  return importedPolicy;
}

interface IImportPolicyPackageRequestBody {
  package: IImportPolicyPackage;
  publish: boolean;
}

interface IImportPolicyPackage {
  policy: {
    id: string;
    name: string;
    policyTag: string;
    config: {
      id: string;
    };
  };
  schemas: {
    name: string;
  }[];
}
