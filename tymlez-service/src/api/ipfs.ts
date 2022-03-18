import { Request, Response, Router } from 'express';
import { uploadToIpfs } from '../modules/ipfs';
import { loginToUiService } from '../modules/user';

export const useIpfsApi = ({
  uiServiceBaseUrl,
}: {
  uiServiceBaseUrl: string;
}) => {
  const ipfsRouter = Router();

  ipfsRouter.post('/upload', async (req: Request, res: Response) => {
    const rootAuthority = await loginToUiService({
      uiServiceBaseUrl,
      username: 'RootAuthority',
    });

    const url = await uploadToIpfs(uiServiceBaseUrl, rootAuthority, req.body);
    res.json({ url });
  });

  return ipfsRouter;
};
