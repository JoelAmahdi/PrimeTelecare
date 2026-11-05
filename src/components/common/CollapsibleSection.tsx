import React, { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

export interface CollapsibleSectionProps {
  id?: string;
  title: ReactNode | string;
  subtitle?: ReactNode | string;
  icon?: ReactNode;
  badge?: ReactNode | string | number;
  action?: ReactNode;
  isOpen?: boolean;
  defaultOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
  maxHeight?: string;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  children: ReactNode;
  emptyState?: ReactNode;
  itemCount?: number;
  variant?: 'card' | 'minimal' | 'bordered';
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  id,
  title,
  subtitle,
  icon,
  badge,
  action,
  isOpen: controlledIsOpen,
  defaultOpen = false,
  onToggle,
  maxHeight = 'max-h-80 sm:max-h-96',
  className = '',
  headerClassName = '',
  contentClassName = '',
  children,
  emptyState,
  itemCount,
  variant = 'card',
}) => {
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(defaultOpen);
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : uncontrolledIsOpen;

  const handleToggle = () => {
    triggerHaptic('light');
    const nextState = !isOpen;
    if (!isControlled) {
      setUncontrolledIsOpen(nextState);
    }
    onToggle?.(nextState);
  };

  const variantContainerClass =
    variant === 'minimal'
      ? 'border-b border-slate-200/80'
      : variant === 'bordered'
      ? 'bg-white rounded-2xl border border-slate-200/80 shadow-xs'
      : 'bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm transition-all duration-200 hover:border-slate-200';

  return (
    <div id={id} className={`font-nunito ${variantContainerClass} ${className}`}>
      {/* Header bar */}
      <div
        onClick={handleToggle}
        className={`flex items-center justify-between cursor-pointer select-none group ${headerClassName}`}
      >
        <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0 flex-1">
          {icon && (
            <div className="p-1.5 sm:p-2 bg-emerald-50 text-[#006c44] rounded-xl shrink-0 group-hover:bg-emerald-100 transition-colors">
              {icon}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2 flex-wrap">
              <h3 className="font-bold font-outfit text-[#022434] text-xs sm:text-sm leading-tight group-hover:text-[#006c44] transition-colors truncate">
                {title}
              </h3>
              {badge !== undefined && (
                <span className="bg-slate-100 text-slate-700 text-[10px] sm:text-xs font-bold font-outfit px-2 py-0.5 rounded-full shrink-0">
                  {badge}
                </span>
              )}
            </div>

            {subtitle && (
              <p className="text-[10px] sm:text-xs text-slate-400 font-nunito mt-0.5 leading-snug truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0 ml-2">
          {action && (
            <div
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              {action}
            </div>
          )}

          <div className="p-1 sm:p-1.5 rounded-full bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600 transition-all shrink-0">
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-250 ease-out ${
                isOpen ? 'rotate-180 text-[#006c44]' : ''
              }`}
            />
          </div>
        </div>
      </div>

      {/* Expandable Collapsible Body with Fixed Height Scroll Constraints */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div
              className={`mt-3.5 pt-3 border-t border-slate-100/90 overflow-y-auto overscroll-contain ${maxHeight} focus:outline-none ${contentClassName}`}
            >
              {itemCount === 0 && emptyState ? emptyState : children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
