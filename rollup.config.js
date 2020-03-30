import typescript from '@rollup/plugin-typescript';

const output = {
  dir: '.',
  format: 'umd',
  name: 'YoutubeExternalSubtitle'
};

const docsOutput = Object.assign(
  {},
  output,
  { dir: 'docs/static/youtube.external.subtitle' }
);

export default {
  input: 'src/youtube.external.subtitle.ts',
  output: [output, docsOutput],
  plugins: [typescript()]
};
