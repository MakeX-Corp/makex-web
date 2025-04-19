import { uniqueNamesGenerator, Config, adjectives, colors, animals } from 'unique-names-generator';


export function generateAppName() {
  const config: Config = {
    dictionaries: [adjectives, colors, animals],
    separator: '-',
    style: 'lowerCase',
    length: 3
  };
  return uniqueNamesGenerator(config);
}