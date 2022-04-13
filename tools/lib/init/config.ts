import { assert } from 'console';

const prefix = (
  name: string,
  uppercase = false,
  overrides: { [x: string]: string } = {},
) => {
  assert(
    process.env.CLIENT_NAME,
    'Missing CLIENT_NAME in environment variables',
  );
  if (process.env.CLIENT_NAME?.toLocaleLowerCase() === 'uon') {
    const prefixText = overrides['uon'] || 'Uon';
    return (uppercase ? prefixText.toUpperCase() : prefixText) + name;
  }

  const prefixText = overrides['tymlez'] || overrides['default'] || 'Tymlez';
  return (uppercase ? prefixText.toUpperCase() : prefixText) + name;
};
export const config = () => {
  return {
    installerSchemaName: prefix('Installer'),
    deviceSchemaName: prefix('Device', false, {
      uon: 'Uon',
      default: 'Tymlez',
    }),
    withPrefix: (name: string) => {
      return prefix(name, false, {
        uon: 'Uon',
        default: 'Tymlez',
      });
    },
  };
};
