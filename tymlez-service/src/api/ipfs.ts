import { Request, Response, Router } from 'express';
import { uploadToIpfs } from '../modules/ipfs';
import { loginToUiService } from '../modules/user';

export const useIpfsApi = ({
  guardianApiGatewayUrl,
}: {
  guardianApiGatewayUrl: string;
}) => {
  const ipfsRouter = Router();

  ipfsRouter.post('/upload', async (req: Request, res: Response) => {
    const rootAuthority = await loginToUiService({
      guardianApiGatewayUrl,
      username: 'RootAuthority',
    });

    const url = await uploadToIpfs(
      guardianApiGatewayUrl,
      rootAuthority,
      req.body,
    );
    res.json({ url });
  });

  return ipfsRouter;
};
