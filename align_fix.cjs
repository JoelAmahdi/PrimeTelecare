const fs = require('fs');
let content = fs.readFileSync('src/components/screens/ActiveChatScreen.tsx', 'utf8');

// Active Sessions Header
const activeHeaderOld = `                  <div className="flex items-center space-x-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse ring-2 ring-emerald-500/30" />
                    <h3 className="font-bold font-outfit text-sm text-[#022434] tracking-tight">
                      Active & Upcoming
                    </h3>
                    <span className="bg-emerald-50 text-[#006c44] border border-emerald-200/60 text-[11px] font-bold px-3 py-1 rounded-md">
                      {newConsultations.length} Queue
                    </span>
                  </div>`;

const activeHeaderNew = `                  <div className="flex items-center space-x-3">
                    <div className="w-8 flex justify-center items-center shrink-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse ring-2 ring-emerald-500/30" />
                    </div>
                    <h3 className="font-bold font-outfit text-sm text-[#022434] tracking-tight">
                      Active & Upcoming
                    </h3>
                    <span className="bg-emerald-50 text-[#006c44] border border-emerald-200/60 text-[11px] font-bold px-3 py-1 rounded-md">
                      {newConsultations.length} Queue
                    </span>
                  </div>`;
content = content.replace(activeHeaderOld, activeHeaderNew);

// Completed Sessions Header
const compHeaderOld = `                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 text-slate-500" />
                    </div>
                    <h3 className="font-bold font-outfit text-sm text-[#022434] tracking-tight">
                      Completed Sessions
                    </h3>
                    <span className="bg-slate-100 text-slate-600 text-[11px] font-bold px-3 py-1 rounded-md border border-slate-200/60">
                      {previousConsultations.length} Logs
                    </span>
                  </div>`;

const compHeaderNew = `                  <div className="flex items-center space-x-3">
                    <div className="w-8 flex justify-center items-center shrink-0">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4 text-slate-500" />
                      </div>
                    </div>
                    <h3 className="font-bold font-outfit text-sm text-[#022434] tracking-tight">
                      Completed Sessions
                    </h3>
                    <span className="bg-slate-100 text-slate-600 text-[11px] font-bold px-3 py-1 rounded-md border border-slate-200/60">
                      {previousConsultations.length} Logs
                    </span>
                  </div>`;
content = content.replace(compHeaderOld, compHeaderNew);

fs.writeFileSync('src/components/screens/ActiveChatScreen.tsx', content);
