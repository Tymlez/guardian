import assert from 'assert';
import axios from 'axios';
import { Request, Response, Router } from 'express';
import type { IToken } from 'interfaces';
import { loginToUiService } from '../modules/user';
import {
  createTokenWithRetry,
  getUserKycFromUiService,
  getTokesnWithRetry,
} from '../modules/token';
import promiseRetry from 'promise-retry';

export const makeTokenApi = ({
  uiServiceBaseUrl,
}: {
  uiServiceBaseUrl: string;
}) => {
  const tokenApi = Router();

  tokenApi.get('/', async (req: Request, res: Response) => {
    const user = await loginToUiService({
      uiServiceBaseUrl,
      username: 'RootAuthority',
    });

    const tokens = await getTokesnWithRetry({ uiServiceBaseUrl, user });

    res.status(200).json(tokens);
  });

  tokenApi.post('/create', async (req: Request, res: Response) => {
    const inputToken: IToken = req.body;

    assert(inputToken, `token is missing`);

    const rootAuthority = await loginToUiService({
      uiServiceBaseUrl,
      username: 'RootAuthority',
    });

    const createdToken = await createTokenWithRetry({
      rootAuthority,
      uiServiceBaseUrl,
      inputToken,
    });

    res.status(200).json(createdToken);
  });

  tokenApi.post('/user-kyc', async (req: Request, res: Response) => {
    const userKycInput: IUserKycInput = req.body;

    assert(userKycInput, `input is missing`);

    const rootAuthority = await loginToUiService({
      uiServiceBaseUrl,
      username: 'RootAuthority',
    });

    const userKyc = await getUserKycFromUiService({
      uiServiceBaseUrl,
      tokenId: userKycInput.tokenId,
      username: userKycInput.username,
      rootAuthority,
    });

    if (userKyc.kyc == userKycInput.value) {
      console.log(
        `Skip because no change user ${userKycInput.username} and token '${userKycInput.tokenId}' KYC.`,
        userKycInput,
        userKyc,
      );
      res.status(200).json({});
      return;
    }
    const fn = async () => {
      await axios.put(
        `${uiServiceBaseUrl}/api/v1/tokens/${userKycInput.tokenId}/${userKycInput.username}/grantKyc`,
        userKycInput,
        {
          headers: {
            authorization: `Bearer ${rootAuthority.accessToken}`,
          },
        },
      );
    };
    await promiseRetry(
      async (retry) => {
        fn().catch(retry);
      },
      { retries: 3 },
    );
    res.status(200).json(userKycInput);
  });

  return tokenApi;
};

interface IUserKycInput {
  tokenId: string;
  username: string;
  value: boolean;
}
