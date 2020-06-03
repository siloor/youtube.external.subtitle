import YoutubeExternalSubtitle from './youtube.external.subtitle';
import Subtitle from './subtitle';

test('the main script returns the Subtitle class', () => {
  expect(YoutubeExternalSubtitle.Subtitle).toBe(Subtitle);
});
