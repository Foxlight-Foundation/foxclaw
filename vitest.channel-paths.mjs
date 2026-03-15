export const channelTestRoots = [
  "extensions/slack",
  "src/browser",
];

export const channelTestPrefixes = channelTestRoots.map((root) => `${root}/`);
export const channelTestInclude = channelTestRoots.map((root) => `${root}/**/*.test.ts`);
export const channelTestExclude = channelTestRoots.map((root) => `${root}/**`);
