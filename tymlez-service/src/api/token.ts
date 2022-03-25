import assert from 'assert';
import { Request, Response, Router } from 'express';
import type { IToken } from 'interfaces';
import { loginToUiService, UserName } from '../modules/user';
import {
  createTokenWithRetry,
  getUserKycFromUiServiceWithRetry,
  getTokensWithRetry,
  setUserKycWithRetry,
  associateUserTokenWithRetry,
} from '../modules/token';

export const makeTokenApi = ({
  guardianApiGatewayUrl,
}: {
  guardianApiGatewayUrl: string;
}) => {
  const tokenApi = Router();

  tokenApi.get('/', async (req: Request, res: Response) => {
    const user = await loginToUiService({
      guardianApiGatewayUrl,
      username: 'RootAuthority',
    });

    const tokens = await getTokensWithRetry({ guardianApiGatewayUrl, user });

    res.status(200).json(tokens);
  });

  tokenApi.post('/create', async (req: Request, res: Response) => {
    const inputToken: IToken = req.body;

    assert(inputToken, `token is missing`);

    const rootAuthority = await loginToUiService({
      guardianApiGatewayUrl,
      username: 'RootAuthority',
    });

    const createdToken = await createTokenWithRetry({
      rootAuthority,
      guardianApiGatewayUrl,
      inputToken,
    });

    res.status(200).json(createdToken);
  });

  tokenApi.post('/user-kyc', async (req: Request, res: Response) => {
    const userKycInput: IUserKycInput = req.body;

    assert(userKycInput, `input is missing`);

    const rootAuthority = await loginToUiService({
      guardianApiGatewayUrl,
      username: 'RootAuthority',
    });

    const userKyc = await getUserKycFromUiServiceWithRetry({
      guardianApiGatewayUrl,
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

    const user = await loginToUiService({
      guardianApiGatewayUrl,
      username: userKycInput.username as UserName,
    });
    if (!userKyc.associated) {
      await associateUserTokenWithRetry({
        guardianApiGatewayUrl,
        user,
        token: userKyc,
      });
    }
    const tokenInfo = await setUserKycWithRetry({
      guardianApiGatewayUrl,
      tokenId: userKycInput.tokenId,
      username: userKycInput.username,
      rootAuthority,
    });
    res.status(200).json(tokenInfo);
  });

  return tokenApi;
};

interface IUserKycInput {
  tokenId: string;
  username: string;
  value: boolean;
}
