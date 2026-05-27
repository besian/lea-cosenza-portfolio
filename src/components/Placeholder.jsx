export function Placeholder({ c1, c2, label, lbl2, children, className = "" }) {
  return (
    <div className={"ph " + className} style={{ "--c1": c1, "--c2": c2 }}>
      {label && <span className="lbl">{label}</span>}
      {lbl2 && <span className="lbl2">{lbl2}</span>}
      {children}
    </div>
  );
}
