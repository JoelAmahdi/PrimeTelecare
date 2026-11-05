const fs = require('fs');
let content = fs.readFileSync('src/components/screens/NewPrescriptionScreen.tsx', 'utf8');

const oldButtons = `        {/* Final Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => {
              triggerHaptic('selection');
              onNavigate('prescription-detail');
            }}
            className="py-3.5 border border-slate-300 text-[#022434] font-extrabold font-outfit text-xs sm:text-sm rounded-2xl hover:bg-slate-100 transition-all flex items-center justify-center space-x-1.5"
          >
            <Eye className="w-4 h-4" />
            <span>Preview E-Rx</span>
          </button>

          <button
            onClick={handleSaveAndSend}
            className="py-3.5 bg-[#006c44] hover:bg-[#022434] text-white font-extrabold font-outfit text-xs sm:text-sm rounded-2xl transition-all shadow-md active:scale-98 flex items-center justify-center space-x-1.5"
          >
            <Send className="w-4 h-4" />
            <span>Sign, Seal & Issue E-Prescription</span>
          </button>
        </div>`;

const newButtons = `        {/* Final Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            onClick={() => {
              triggerHaptic('selection');
              onNavigate('prescription-detail');
            }}
            className="flex-1 py-3.5 border border-slate-200 text-slate-700 font-bold font-outfit text-[13px] sm:text-sm rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center space-x-2"
          >
            <Eye className="w-4 h-4 text-slate-500" />
            <span>Preview E-Rx</span>
          </button>

          <button
            onClick={handleSaveAndSend}
            className="flex-[1.5] py-3.5 bg-[#006c44] hover:bg-[#022434] text-white font-bold font-outfit text-[13px] sm:text-sm rounded-xl transition-all shadow-sm active:scale-95 flex items-center justify-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>Sign & Issue E-Rx</span>
          </button>
        </div>`;

content = content.replace(oldButtons, newButtons);
fs.writeFileSync('src/components/screens/NewPrescriptionScreen.tsx', content);
