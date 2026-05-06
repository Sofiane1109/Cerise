import { X } from 'lucide-react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}
export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-gray-900 border border-gray-800 rounded-xl ${onClick ? 'cursor-pointer hover:border-gray-700 transition-colors' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

interface ProgressBarProps {
  value: number;   // 0–100
  color?: string;
  height?: string;
}
export function ProgressBar({ value, color = 'bg-indigo-500', height = 'h-2' }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className={`w-full bg-gray-800 rounded-full ${height} overflow-hidden`}>
      <div
        className={`${height} ${color} rounded-full transition-all duration-500`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}
export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }: ModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className={`bg-gray-900 border border-gray-800 rounded-xl w-full ${maxWidth} my-4`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h3 className="font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

interface RatingProps {
  value: number;
  onChange: (v: number) => void;
  max?: number;
  labels?: string[];
}
export function Rating({ value, onChange, max = 5, labels }: RatingProps) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }, (_, i) => i + 1).map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          title={labels ? labels[n - 1] : String(n)}
          className={`w-9 h-9 rounded-lg text-sm font-bold transition-colors ${
            n <= value ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-500 hover:bg-gray-700 hover:text-gray-300'
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

export const INPUT = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors";
export const LABEL = "block text-xs font-medium text-gray-400 mb-1";
export const BTN_PRIMARY = "px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors";
export const BTN_GHOST = "px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg transition-colors";
export const TOOLTIP_STYLE = { backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#f3f4f6', fontSize: '12px' };
