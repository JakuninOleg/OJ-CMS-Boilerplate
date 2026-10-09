import { oj } from '../../oj.config';
export default function OJBrand({ compact = false }: { compact?: boolean }) {
  return <span className={`oj-brand${compact ? ' oj-brand--compact' : ''}`}>
    <img className="oj-brand__mark" src={oj.logo} alt="" width="40" height="40" />
    {!compact && <span className="oj-brand__copy"><strong className="oj-brand__title">{oj.name}</strong><small className="oj-brand__subtitle">{oj.subtitle}</small></span>}
  </span>;
}
