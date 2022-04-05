import assert from 'assert';
import axios from 'axios';
import type { ILoggedUser } from './ILoggedUser';

export async function loginToUiService({
  guardianApiGatewayUrl,
  username,
}: {
  guardianApiGatewayUrl: string;
  username: UserName;
}) {
  const loginDetail = LOGIN_DETAILS[username];
  assert(loginDetail, `Cannot find login detail for ${username}`);
  const { data: user } = (await axios.post(
    `${guardianApiGatewayUrl}/api/v1/accounts/login`,
    { username, password: loginDetail.password },
  )) as { data: ILoggedUser | undefined };

  assert(user, `Failed to login as ${username}`);

  return user;
}

const LOGIN_DETAILS = {
  RootAuthority: { password: 'test' },
  Installer: { password: 'test' },
  Installer2: { password: 'test' },
  Auditor: { password: 'test' },
};

export type UserName = keyof typeof LOGIN_DETAILS;
export type InstallerUserName = Extract<
  UserName,
  'Installer' | 'Installer2' | 'Auditor'
>;
