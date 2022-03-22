import axios from 'axios';
import type { ILoggedUser } from './ILoggedUser';
import { getUserProfileFromUiService } from './getUserProfileFromUiService';
import { loginToUiService, UserName } from './loginToUiService';
import { getRandomKeyFromUiServiceWithRetry } from '../key';
import { updateProfile } from './updateProfile';
import pLimit from 'p-limit';

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
  const profile = await getUserProfileFromUiService({ uiServiceBaseUrl, user });
  if (profile?.confirmed) {
    return {
      message: `User '${username}' is already initialized.`,
      profile,
    };
  }
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
  const randomKey = await getRandomKeyFromUiServiceWithRetry({
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
    if (userProfile && userProfile.failed) {
      console.log('failed to setup installer account, retrying.....');
      await initInstallerHederaProfile({ uiServiceBaseUrl, user });
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}

async function associateUserToken({
  uiServiceBaseUrl,
  user,
  token,
}: {
  uiServiceBaseUrl: string;
  user: ILoggedUser;
  token: IUserTokenResponse;
}) {
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
}
async function associateInstallerWithTokens({
  uiServiceBaseUrl,
  user,
}: {
  uiServiceBaseUrl: string;
  user: ILoggedUser;
}) {
  const { data: userTokens } = await axios.get<IUserTokenResponse[]>(
    `${uiServiceBaseUrl}/api/v1/tokens`,
    {
      headers: {
        authorization: `Bearer ${user.accessToken}`,
      },
    },
  );
  const limit = pLimit(1);
  await Promise.all(
    userTokens
      .filter((token) => !token.associated)
      .map((token) =>
        limit(
          async () =>
            await associateUserToken({ uiServiceBaseUrl, user, token }),
        ),
      ),
  );
}

interface IUserTokenResponse {
  id: string;
  associated: boolean;
  tokenId: string;
}
