import axios from 'axios';
import { getRandomKeyFromUiServiceWithRetry } from '../key';
import type { ILoggedUser } from './ILoggedUser';
import { getUserProfileFromUiService } from './getUserProfileFromUiService';
import type { IUser } from 'interfaces';
import { uploadToIpfs } from '../ipfs';
import promiseRetry from 'promise-retry';

export async function initRootAuthority(
  rootAuthority: ILoggedUser,
  guardianApiGatewayUrl: string,
) {
  const profile = await getUserProfileFromUiService({
    guardianApiGatewayUrl,
    user: rootAuthority,
  });
  if (profile?.confirmed) {
    console.log('Skip because root config already initialized');
    return {
      message: 'Skip because root config already initialized',
    };
  }

  await initRootConfigWithRetry({ guardianApiGatewayUrl, rootAuthority });
  return {
    success: true,
  };
}

interface IInitRootConfig {
  guardianApiGatewayUrl: string;
  rootAuthority: ILoggedUser;
}
async function initRootConfig({
  guardianApiGatewayUrl,
  rootAuthority,
}: IInitRootConfig) {
  const randomKey = await getRandomKeyFromUiServiceWithRetry({
    guardianApiGatewayUrl,
    user: rootAuthority,
  });
  console.log('Update profile with ', randomKey);
  const vcDoc = {
    '@context': {
      '@version': 1.1,
      '@vocab': 'https://w3id.org/traceability/#undefinedTerm',
      id: '@id',
      type: '@type',
      'RootAuthority&1.0.0': {
        '@id': 'undefined#RootAuthority&1.0.0',
        '@context': { date: { '@id': 'https://www.schema.org/text' } },
      },
    },
  };

  const vcDocUrl = await uploadToIpfs(
    guardianApiGatewayUrl,
    rootAuthority,
    vcDoc,
  );
  console.log('vcDocument URL', vcDocUrl);
  await axios.put(
    `${guardianApiGatewayUrl}/api/v1/profiles/${rootAuthority.username}`,
    {
      vcDocument: {
        name: 'Tymlez',
        type: 'RootAuthority&1.0.0',
        '@context': [vcDocUrl],
      },
      hederaAccountId: randomKey.id,
      hederaAccountKey: randomKey.key,
      addressBook: {
        appnetName: 'Test Identity SDK appnet',
        didServerUrl: 'http://localhost:3000/api/v1',
        didTopicMemo: 'Test Identity SDK appnet DID topic',
        vcTopicMemo: 'Test Identity SDK appnet VC topic',
      },
    },
    {
      headers: {
        authorization: `Bearer ${rootAuthority.accessToken}`,
      },
    },
  );

  let userProfile: IUser | undefined;

  while (!userProfile || !userProfile.confirmed) {
    console.log('Waiting for user to be initialized', userProfile);

    userProfile = await getUserProfileFromUiService({
      guardianApiGatewayUrl,
      user: rootAuthority,
    });

    if (userProfile && userProfile.confirmed) {
      break;
    }
    if (userProfile && userProfile.failed) {
      throw new Error('Unable to setup root account');
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}

async function initRootConfigWithRetry(params: IInitRootConfig, retries = 3) {
  return promiseRetry(async (retry) => {
    return initRootConfig(params).catch(retry);
  });
}
