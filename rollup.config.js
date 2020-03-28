import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/youtube.external.subtitle.ts',
  output: [
    {
      dir: '.',
      format: 'umd',
      name: 'YoutubeExternalSubtitle'
    },
    {
      dir: 'docs/static/youtube.external.subtitle',
      format: 'umd',
      name: 'YoutubeExternalSubtitle'
    },
  ],
  plugins: [typescript()]
};
