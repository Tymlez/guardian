import { SSM } from 'aws-sdk';

const ssm = new SSM({ region: 'ap-southeast-2' });

export async function getParameters(
  names: string[],
): Promise<(string | undefined)[]> {
  const parameters = (
    await ssm
      .getParameters({
        Names: names,
        WithDecryption: true,
      })
      .promise()
  ).Parameters;

  const parametersMap = parameters?.reduce((acc, parameter) => {
    if (parameter.Name) {
      acc[parameter.Name] = parameter;
    }

    return acc;
  }, {} as Record<string, SSM.Parameter | undefined>);

  return names.map((name) => parametersMap?.[name]?.Value);
}
