import typescript from '@rollup/plugin-typescript';
import copy from 'rollup-plugin-copy';

export default {
  input: 'src/youtube.external.subtitle.ts',
  output: [
    {
      dir: 'dist',
      format: 'umd',
      name: 'YoutubeExternalSubtitle'
    }
  ],
  plugins: [
    typescript(),
    copy({
      targets: [
        { src: 'dist/*', dest: 'docs/static/youtube.external.subtitle' },
        { src: './LICENSE.md', dest: 'docs/_includes' },
        { src: './README.md', dest: 'docs/_includes' }
      ],
      hook: 'writeBundle'
    })
  ]
};
