interface ViewerControlsProps {
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
}

const ViewerControls = ({ onZoomIn, onZoomOut, onReset }: ViewerControlsProps) => (
  <div className="absolute right-4 top-4 flex flex-col gap-2">
    <button
      type="button"
      onClick={onZoomIn}
      className="rounded-full bg-white/90 px-3 py-2 text-sm font-semibold text-slate-900 shadow"
    >
      +
    </button>
    <button
      type="button"
      onClick={onZoomOut}
      className="rounded-full bg-white/90 px-3 py-2 text-sm font-semibold text-slate-900 shadow"
    >
      -
    </button>
    <button
      type="button"
      onClick={onReset}
      className="rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-slate-900 shadow"
    >
      Reset
    </button>
  </div>
)

export default ViewerControls
