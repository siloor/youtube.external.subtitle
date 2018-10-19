# YouTube External Subtitle

According to YouTube's [policy](http://support.google.com/youtube/answer/2734796?hl=en), only the owner of the content can add subtitle to a video.

With YouTube External Subtitle you can display subtitles over the embedded video from YouTube on your site. These texts could be translations, comments or lyrics as well. (Any kind of texts is allowed)

If you would like to make subtitle for a video, there are a lot of tools helping you.

- YouTube has an automatic english speech recognition logic, that does a really good job and makes only a few mistakes. Its a very big help by timing the subtitles.
- On [DownSub.com](http://downsub.com/) you can download the subtitles from YouTube as an SRT file.
- There are a lot of good open source SRT editors out there.

## Examples

- [Basic example](http://siloor.com/youtube.external.subtitle/examples/basic)
- [Load an SRT file](http://siloor.com/youtube.external.subtitle/examples/srt)
- [More subtitles](http://siloor.com/youtube.external.subtitle/examples/moresubtitles)

## Limitations

By using YouTube's flash video player the subtitle is not visible, the Flash Player is on the top of everything. That is why YouTube External Subtitle is forcing to use YouTube's HTML5 video player (it adds a html5=1 parameter to the iframe's source). This should be an issue only by some very old browsers.

By some mobile devices the fullscreen feature hides the subtitle as well, because the native video player requires the whole screen.

If the fullscreen feature is not that important for you and you have a very huge mobile traffic, maybe you should consider to disable the fullscreen button on the video player (fs=0 parameter).

The script supports AMD.
