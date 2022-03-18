import axios from 'axios';
import { getRandomKeyFromUiService } from '../key';
import type { ILoggedUser } from './ILoggedUser';
import { getUserProfileFromUiService } from './getUserProfileFromUiService';
import type { IUser } from 'interfaces';
import { uploadToIpfs } from '../ipfs';

export async function initRootAuthority(
  rootAuthority: ILoggedUser,
  uiServiceBaseUrl: string,
) {
  const profile = await getUserProfileFromUiService({
    uiServiceBaseUrl,
    user: rootAuthority,
  });
  if (profile?.confirmed) {
    console.log('Skip because root config already initialized');
    return {
      message: 'Skip because root config already initialized',
    };
  }

  await initRootConfig({ uiServiceBaseUrl, rootAuthority });
  return {
    success: true,
  };
}

async function initRootConfig({
  uiServiceBaseUrl,
  rootAuthority,
}: {
  uiServiceBaseUrl: string;
  rootAuthority: ILoggedUser;
}) {
  const randomKey = await getRandomKeyFromUiService({
    uiServiceBaseUrl,
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

  const vcDocUrl = await uploadToIpfs(uiServiceBaseUrl, rootAuthority, vcDoc);
  console.log('vcDocument URL', vcDocUrl);
  await axios.put(
    `${uiServiceBaseUrl}/api/v1/profile`,
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
      uiServiceBaseUrl,
      user: rootAuthority,
    });

    if (userProfile && userProfile.confirmed) {
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}
