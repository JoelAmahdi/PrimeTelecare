import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { triggerHaptic } from '../../utils/haptics';

export interface StandardDropdownProps {
  id?: string;
  trigger: ReactNode | ((isOpen: boolean) => ReactNode);
  children: ReactNode;
  isOpen?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  align?: 'left' | 'right' | 'center';
  width?: string;
  maxHeight?: string;
  className?: string;
  menuClassName?: string;
  closeOnSelect?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
}

export const StandardDropdown: React.FC<StandardDropdownProps> = ({
  id,
  trigger,
  children,
  isOpen: controlledIsOpen,
  defaultOpen = false,
  onOpenChange,
  align = 'right',
  width = 'w-56',
  maxHeight = 'max-h-64 sm:max-h-72',
  className = '',
  menuClassName = '',
  closeOnSelect = true,
  header,
  footer,
}) => {
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(defaultOpen);
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : uncontrolledIsOpen;

  const containerRef = useRef<HTMLDivElement>(null);

  const setOpen = (nextOpen: boolean) => {
    if (!isControlled) {
      setUncontrolledIsOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  };

  const handleToggle = () => {
    triggerHaptic('light');
    setOpen(!isOpen);
  };

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const alignmentClass =
    align === 'left'
      ? 'left-0 origin-top-left'
      : align === 'center'
      ? 'left-1/2 -translate-x-1/2 origin-top'
      : 'right-0 origin-top-right';

  return (
    <div id={id} ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {/* Trigger Element */}
      <div onClick={handleToggle} className="cursor-pointer">
        {typeof trigger === 'function' ? trigger(isOpen) : trigger}
      </div>

      {/* Floating Animated Dropdown Menu with Fixed Height Constraints */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute top-full mt-2 z-50 ${alignmentClass} ${width} bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden flex flex-col font-nunito ${menuClassName}`}
            onClick={(e) => {
              if (closeOnSelect) {
                // If clicked an action item
                const target = e.target as HTMLElement;
                if (target.closest('[data-dropdown-item]')) {
                  setOpen(false);
                }
              }
            }}
          >
            {header && (
              <div className="px-3.5 py-2.5 bg-slate-50/90 border-b border-slate-100 text-xs font-semibold text-[#022434] shrink-0">
                {header}
              </div>
            )}

            {/* Scrollable Items with Fixed Height Constraint */}
            <div
              className={`p-1.5 space-y-0.5 overflow-y-auto overscroll-contain ${maxHeight} focus:outline-none`}
            >
              {children}
            </div>

            {footer && (
              <div className="px-3.5 py-2 bg-slate-50/80 border-t border-slate-100 text-[11px] text-slate-500 shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export interface StandardDropdownItemProps {
  id?: string;
  icon?: ReactNode;
  label: ReactNode;
  description?: string;
  badge?: ReactNode;
  active?: boolean;
  destructive?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export const StandardDropdownItem: React.FC<StandardDropdownItemProps> = ({
  id,
  icon,
  label,
  description,
  badge,
  active = false,
  destructive = false,
  disabled = false,
  onClick,
  className = '',
}) => {
  const handleClick = (e: React.MouseEvent) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    triggerHaptic(destructive ? 'medium' : 'light');
    onClick?.();
  };

  return (
    <button
      id={id}
      type="button"
      data-dropdown-item="true"
      disabled={disabled}
      onClick={handleClick}
      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium font-outfit flex items-center justify-between transition-colors ${
        disabled
          ? 'opacity-40 cursor-not-allowed text-slate-400'
          : destructive
          ? 'text-rose-700 hover:bg-rose-50 hover:text-rose-800'
          : active
          ? 'bg-emerald-50 text-[#006c44] font-bold'
          : 'text-[#022434] hover:bg-slate-50 hover:text-[#006c44]'
      } ${className}`}
    >
      <div className="flex items-center space-x-2.5 min-w-0 flex-1">
        {icon && (
          <span
            className={`shrink-0 ${
              destructive ? 'text-rose-500' : active ? 'text-[#006c44]' : 'text-slate-400'
            }`}
          >
            {icon}
          </span>
        )}
        <div className="min-w-0 flex-1 truncate">
          <div className="truncate">{label}</div>
          {description && (
            <div className="text-[10px] text-slate-400 font-nunito truncate font-normal mt-0.5">
              {description}
            </div>
          )}
        </div>
      </div>

      {badge && <span className="ml-2 shrink-0">{badge}</span>}
    </button>
  );
};

export const StandardDropdownDivider: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`my-1 border-t border-slate-100 ${className}`} />
);

export const StandardDropdownHeader: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div
    className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-outfit ${className}`}
  >
    {children}
  </div>
);
