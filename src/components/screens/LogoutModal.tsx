import React from 'react';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmLogout: () => void;
}

export const LogoutModal: React.FC<LogoutModalProps> = ({ isOpen, onClose, onConfirmLogout }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200 text-center space-y-4 border border-slate-100">
        <h2 className="text-xl font-extrabold font-outfit text-[#022434]">
          Log out of Prime Telecare?
        </h2>

        <p className="text-xs text-slate-600 font-nunito leading-relaxed px-2">
          You will need to sign back in to access your family's health records and appointments.
        </p>

        <div className="space-y-2.5 pt-2">
          <button
            onClick={onConfirmLogout}
            className="w-full py-3.5 bg-red-600 text-white font-bold font-outfit text-base rounded-2xl shadow-md hover:bg-red-700 transition-all transform active:scale-98"
          >
            Log Out
          </button>

          <button
            onClick={onClose}
            className="w-full py-3.5 bg-slate-100 text-[#022434] font-bold font-outfit text-base rounded-2xl hover:bg-slate-200 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
