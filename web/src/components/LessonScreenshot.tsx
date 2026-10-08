/**
 * A phone screenshot in a lesson, under the same ruled head and mono
 * caption as the drawn figures.
 *
 * Every screenshot is processed to 780×1595 (status bar cropped, 2× a
 * 390px phone width) before it is committed, so the size is fixed here
 * and the page reserves the space before the image arrives.
 */
export default function LessonScreenshot({
  src,
  alt,
  caption,
}: {
  src: string
  alt: string
  caption: string
}) {
  return (
    <figure className="shot">
      <figcaption>{caption}</figcaption>
      <img src={src} alt={alt} width={780} height={1595} loading="lazy" decoding="async" />
    </figure>
  )
}
