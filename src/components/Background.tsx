export function Background() {
  return (
    <div className="background" aria-hidden="true">
      <div className="background__sky" />
      <div className="background__sun" />
      <div className="background__grid" />
      <div className="background__horizon" />
      <div className="background__scanlines" />
      <div className="background__grain" />
      <div className="background__vignette" />
      <div className="background__palms">
        <img
          className="background__palm background__palm--left"
          src="/palms.png"
          alt=""
          draggable={false}
        />
        <img
          className="background__palm background__palm--right"
          src="/palms.png"
          alt=""
          draggable={false}
        />
      </div>
    </div>
  )
}
