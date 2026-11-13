// One authored icon set: 24px grid, 2.25 stroke, round caps. Decorative by default.
import type { SVGProps } from "react";
type P = SVGProps<SVGSVGElement>;
const base = (props: P) => ({ viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.25, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true, ...props });
export const IconCheck = (p: P) => <svg {...base(p)}><path d="M5 12.5l4.2 4.2L19 7" /></svg>;
export const IconAlert = (p: P) => <svg {...base(p)}><path d="M12 7.5v5.5" /><circle cx="12" cy="16.6" r=".6" fill="currentColor" /><circle cx="12" cy="12" r="9" /></svg>;
export const IconDot = (p: P) => <svg {...base(p)}><circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" /></svg>;
export const IconUpload = (p: P) => <svg {...base(p)}><path d="M12 15V4m0 0L7.5 8.5M12 4l4.5 4.5" /><path d="M4 14v4a2 2 0 002 2h12a2 2 0 002-2v-4" /></svg>;
export const IconDownload = (p: P) => <svg {...base(p)}><path d="M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5" /><path d="M4 18.5h16" /></svg>;
export const IconMic = (p: P) => <svg {...base(p)}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21" /></svg>;
export const IconLock = (p: P) => <svg {...base(p)}><rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8 10.5V8a4 4 0 018 0v2.5" /></svg>;
export const IconSound = ({ on, ...p }: P & { on: boolean }) => <svg {...base(p)}><path d="M4 9.5v5h3.5L12 18V6L7.5 9.5z" />{on ? <path d="M15.5 9a4 4 0 010 6M18 6.5a7.5 7.5 0 010 11" /> : <path d="M16 9.5l5 5m0-5l-5 5" />}</svg>;
export const IconScan = (p: P) => <svg {...base(p)}><path d="M4 8V6a2 2 0 012-2h2M16 4h2a2 2 0 012 2v2M20 16v2a2 2 0 01-2 2h-2M8 20H6a2 2 0 01-2-2v-2M4 12h16" /></svg>;
export const IconSparkle = (p: P) => <svg {...base(p)}><path d="M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9z" /></svg>;
export const IconEye = (p: P) => <svg {...base(p)}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></svg>;
export const IconSend = (p: P) => <svg {...base(p)}><path d="M4.5 12L20 4.5 15.5 20l-3.2-6.3z" /><path d="M12.3 13.7L20 4.5" /></svg>;
export const IconPen = (p: P) => <svg {...base(p)}><path d="M4 20c3-1 4.5-3.5 6-5.5s3-2.5 4-1.5-1 3.5 1 4 3-2 5-2" /><path d="M14.5 4.5l3 3L9 16l-3.5.5.5-3.5z" /></svg>;
export const IconExpand = (p: P) => <svg {...base(p)}><path d="M9 4H4v5M15 4h5v5M20 15v5h-5M4 15v5h5" /></svg>;
export const IconShrink = (p: P) => <svg {...base(p)}><path d="M4 9h5V4M20 9h-5V4M15 20v-5h5M9 20v-5H4" /></svg>;
export const IconChat = (p: P) => <svg {...base(p)}><path d="M5 18.5V6.5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H8.5z" /><path d="M9 9.5h6M9 12.5h4" /></svg>;
export const IconCamera = (p: P) => <svg {...base(p)}><path d="M4 8.5A1.5 1.5 0 015.5 7h2.3l1.4-2.2h5.6L16.2 7h2.3A1.5 1.5 0 0120 8.5v9a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 17.5z" /><circle cx="12" cy="12.8" r="3.4" /></svg>;
export const IconFlip = (p: P) => <svg {...base(p)}><path d="M4.5 10a7.5 7.5 0 0113.4-3.3M19.5 14a7.5 7.5 0 01-13.4 3.3" /><path d="M18.5 3v4h-4M5.5 21v-4h4" /></svg>;
export const IconClose = (p: P) => <svg {...base(p)}><path d="M6 6l12 12M18 6L6 18" /></svg>;
/** The PaPhil mark: a paw print whose palm pad is a checkmark. */
export const BrandMark = (p: P) => <svg viewBox="0 0 40 40" aria-hidden {...p}>
  <rect width="40" height="40" rx="12" fill="var(--purple)" />
  <g fill="var(--gold)"><ellipse cx="11.5" cy="15" rx="3.2" ry="4" /><ellipse cx="17.5" cy="10.5" rx="3.2" ry="4" /><ellipse cx="24.5" cy="10.5" rx="3.2" ry="4" /><ellipse cx="30" cy="15.5" rx="3.2" ry="4" /></g>
  <path d="M13 24.5l5 5 10-10" fill="none" stroke="#fff" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
</svg>;
