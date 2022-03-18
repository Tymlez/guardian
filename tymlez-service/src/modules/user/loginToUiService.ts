import assert from 'assert';
import axios from 'axios';
import type { ILoggedUser } from './ILoggedUser';

export async function loginToUiService({
  uiServiceBaseUrl,
  username,
}: {
  uiServiceBaseUrl: string;
  username: UserName;
}) {
  const loginDetail = LOGIN_DETAILS[username];
  assert(loginDetail, `Cannot find login detail for ${username}`);
  console.log('username', username);
  const { data: user } = (await axios.post(
    `${uiServiceBaseUrl}/api/v1/accounts/login`,
    { username, password: loginDetail.password },
  )) as { data: ILoggedUser | undefined };

  assert(user, `Failed to login as ${username}`);

  return user;
}

const LOGIN_DETAILS = {
  RootAuthority: { password: 'test' },
  Installer: { password: 'test' },
  Installer2: { password: 'test' },
};

export type UserName = keyof typeof LOGIN_DETAILS;
export type InstallerUserName = Extract<UserName, 'Installer' | 'Installer2'>;
