import type { ILoggedUser } from './ILoggedUser';
import { getUserProfileFromUiService } from './getUserProfileFromUiService';
import { loginToUiService, UserName } from './loginToUiService';
import { getRandomKeyFromUiServiceWithRetry } from '../key';
import { updateProfile } from './updateProfile';
import pLimit from 'p-limit';
import { associateUserTokenWithRetry, getTokensWithRetry } from '../token';
import type { ITokenInfo } from 'interfaces';

export async function initInstaller({
  guardianApiGatewayUrl,
  username,
}: {
  guardianApiGatewayUrl: string;
  username: UserName;
}) {
  const user = await loginToUiService({
    guardianApiGatewayUrl,
    username,
  });
  const profile = await getUserProfileFromUiService({
    guardianApiGatewayUrl,
    user,
  });
  if (profile?.confirmed) {
    await associateInstallerWithTokens({ guardianApiGatewayUrl, user });

    return {
      message: `User '${username}' is already initialized.`,
      profile,
    };
  }
  await initInstallerHederaProfile({ guardianApiGatewayUrl, user });

  await associateInstallerWithTokens({ guardianApiGatewayUrl, user });

  return await getUserProfileFromUiService({ guardianApiGatewayUrl, user });
}

async function initInstallerHederaProfile({
  guardianApiGatewayUrl,
  user,
}: {
  guardianApiGatewayUrl: string;
  user: ILoggedUser;
}) {
  const randomKey = await getRandomKeyFromUiServiceWithRetry({
    guardianApiGatewayUrl,
    user,
  });

  await updateProfile({
    guardianApiGatewayUrl,
    user,
    profile: {
      hederaAccountId: randomKey.id,
      hederaAccountKey: randomKey.key,
    },
  });

  let userProfile = await getUserProfileFromUiService({
    guardianApiGatewayUrl,
    user,
  });

  while (!userProfile || !userProfile.confirmed) {
    console.log('Waiting for user to be initialized', userProfile);

    userProfile = await getUserProfileFromUiService({
      guardianApiGatewayUrl,
      user,
    });

    if (userProfile && userProfile.confirmed) {
      break;
    }
    if (userProfile && userProfile.failed) {
      console.log('failed to setup installer account, retrying.....');
      await initInstallerHederaProfile({ guardianApiGatewayUrl, user });
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}

async function associateInstallerWithTokens({
  guardianApiGatewayUrl,
  user,
}: {
  guardianApiGatewayUrl: string;
  user: ILoggedUser;
}) {
  const userTokens = (await getTokensWithRetry({
    guardianApiGatewayUrl,
    user,
  })) as ITokenInfo[];

  const limit = pLimit(1);
  await Promise.all(
    userTokens
      .filter((token) => !token.associated)
      .map((token) =>
        limit(() =>
          associateUserTokenWithRetry({ guardianApiGatewayUrl, user, token }),
        ),
      ),
  );
}
