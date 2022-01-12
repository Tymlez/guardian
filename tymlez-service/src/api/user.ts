import assert from 'assert';
import axios from 'axios';
import { Request, Response, Router } from 'express';
import { IUserProfile, UserState } from 'interfaces';
import type { IUser } from 'modules/ui-service/IUser';
import { resolve } from 'path/posix';
import { loginToUiService, LoginType } from '../modules/ui-service';

export const makeUserApi = ({
  uiServiceBaseUrl,
}: {
  uiServiceBaseUrl: string;
}) => {
  const userApi = Router();

  userApi.post(
    '/init-installer/:username',
    async (req: Request, res: Response) => {
      const { username } = req.params as { username: LoginType };

      assert(
        username === 'Installer' || username === 'Installer2',
        `Unexpected username: ${username}`,
      );

      const user = await initUser({ uiServiceBaseUrl, username });

      res.status(200).json(user);
    },
  );

  userApi.post('/state/:username', async (req: Request, res: Response) => {
    const { username } = req.params as { username: LoginType };

    const user = await loginToUiService({
      uiServiceBaseUrl,
      username,
    });

    const { data: userState } = await axios.get(
      `${uiServiceBaseUrl}/api/profile/user-state`,
      {
        headers: {
          authorization: `Bearer ${user.accessToken}`,
        },
      },
    );

    res.status(200).json(userState);
  });

  return userApi;
};

async function initUser({
  uiServiceBaseUrl,
  username,
}: {
  uiServiceBaseUrl: string;
  username: LoginType;
}) {
  const user = await loginToUiService({
    uiServiceBaseUrl,
    username,
  });

  if (user.state < UserState.HEDERA_CONFIRMED) {
    await initHederaProfile({ uiServiceBaseUrl, user });
  }

  await associateTokens({ uiServiceBaseUrl, user });

  return await getUserProfile({ uiServiceBaseUrl, user });
}

async function initHederaProfile({
  uiServiceBaseUrl,
  user,
}: {
  uiServiceBaseUrl: string;
  user: IUser;
}) {
  const { data: randomKey } = await axios.get(
    `${uiServiceBaseUrl}/api/profile/random-key`,
    {
      headers: {
        authorization: `Bearer ${user.accessToken}`,
      },
    },
  );

  await axios.post(
    `${uiServiceBaseUrl}/api/profile/set-hedera-profile`,
    {
      hederaAccountId: randomKey.id,
      hederaAccountKey: randomKey.key,
    },
    {
      headers: {
        authorization: `Bearer ${user.accessToken}`,
      },
    },
  );

  let userProfile: IUserProfile | undefined = undefined;

  while (!userProfile || userProfile.state < UserState.HEDERA_CONFIRMED) {
    console.log('Waiting for user to be initialized', userProfile);

    userProfile = await getUserProfile({ uiServiceBaseUrl, user });

    if (userProfile && userProfile.state >= UserState.HEDERA_CONFIRMED) {
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}

async function associateTokens({
  uiServiceBaseUrl,
  user,
}: {
  uiServiceBaseUrl: string;
  user: IUser;
}) {
  const { data: userTokens } = (await axios.get(
    `${uiServiceBaseUrl}/api/tokens/user-tokens`,
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
        await axios.post(
          `${uiServiceBaseUrl}/api/tokens/associate`,
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

async function getUserProfile({
  uiServiceBaseUrl,
  user,
}: {
  uiServiceBaseUrl: string;
  user: IUser;
}): Promise<IUserProfile | undefined> {
  return (
    await axios.get(`${uiServiceBaseUrl}/api/profile/user-state`, {
      headers: {
        authorization: `Bearer ${user.accessToken}`,
      },
    })
  ).data;
}

interface IUserTokenResponse {
  id: string;
  associated: boolean;
  tokenId: string;
}