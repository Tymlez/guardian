import axios from 'axios';
import type { ILoggedUser } from './ILoggedUser';
import { getUserProfileFromUiService } from './getUserProfileFromUiService';
import { loginToUiService, UserName } from './loginToUiService';
import { getRandomKeyFromUiService } from '../key';
import { updateProfile } from './updateProfile';

export async function initInstaller({
  uiServiceBaseUrl,
  username,
}: {
  uiServiceBaseUrl: string;
  username: UserName;
}) {
  const user = await loginToUiService({
    uiServiceBaseUrl,
    username,
  });

  await initInstallerHederaProfile({ uiServiceBaseUrl, user });

  await associateInstallerWithTokens({ uiServiceBaseUrl, user });

  return await getUserProfileFromUiService({ uiServiceBaseUrl, user });
}

async function initInstallerHederaProfile({
  uiServiceBaseUrl,
  user,
}: {
  uiServiceBaseUrl: string;
  user: ILoggedUser;
}) {
  const randomKey = await getRandomKeyFromUiService({
    uiServiceBaseUrl,
    user,
  });
  await updateProfile({
    uiServiceBaseUrl,
    user,
    profile: {
      hederaAccountId: randomKey.id,
      hederaAccountKey: randomKey.key,
    },
  });

  let userProfile = await getUserProfileFromUiService({
    uiServiceBaseUrl,
    user,
  });

  while (!userProfile || !userProfile.confirmed) {
    console.log('Waiting for user to be initialized', userProfile);

    userProfile = await getUserProfileFromUiService({ uiServiceBaseUrl, user });

    if (userProfile && userProfile.confirmed) {
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}

async function associateInstallerWithTokens({
  uiServiceBaseUrl,
  user,
}: {
  uiServiceBaseUrl: string;
  user: ILoggedUser;
}) {
  const { data: userTokens } = (await axios.get(
    `${uiServiceBaseUrl}/api/v1/tokens`,
    {
      headers: {
        authorization: `Bearer ${user.accessToken}`,
      },
    },
  )) as { data: IUserTokenResponse[] };

  await Promise.all(
    userTokens
      .filter((token) => !token.associated)
      .map(async (token) => {
        await axios.put(
          `${uiServiceBaseUrl}/api/v1/tokens/${token.tokenId}/associate`,
          {
            tokenId: token.tokenId,
            associated: true,
          },
          {
            headers: {
              authorization: `Bearer ${user.accessToken}`,
            },
          },
        );
      }),
  );
}

interface IUserTokenResponse {
  id: string;
  associated: boolean;
  tokenId: string;
}
