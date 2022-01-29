export interface IPolicyPackage {
  id: string;
  policy: {
    id: string;
    inputPolicyTag: string;
  };
  schemas: {
    id: string;
    uuid: string;
    inputName: string;
  }[];
}
