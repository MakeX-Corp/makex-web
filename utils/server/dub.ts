import { Dub } from "dub";

export const dub = new Dub({
  token: process.env.DUB_API_KEY, // optional, defaults to DUB_API_KEY env variable
});