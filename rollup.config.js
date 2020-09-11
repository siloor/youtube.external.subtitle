import typescript from '@rollup/plugin-typescript';
import copy from 'rollup-plugin-copy';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'src/youtube.external.subtitle.ts',
  output: [
    {
      file: 'dist/youtube.external.subtitle.js',
      format: 'umd',
      name: 'YoutubeExternalSubtitle'
    },
    {
      file: 'dist/youtube.external.subtitle.min.js',
      format: 'umd',
      name: 'YoutubeExternalSubtitle',
      plugins: [
        terser({
          output: {
            comments: false
          }
        })
      ]
    }
  ],
  plugins: [
    typescript(),
    copy({
      targets: [
        { src: 'dist/*', dest: 'docs/static/vendor/youtube.external.subtitle' },
        { src: './LICENSE.md', dest: 'docs/_includes' },
        { src: './README.md', dest: 'docs/_includes' }
      ],
      hook: 'writeBundle'
    })
  ]
};
