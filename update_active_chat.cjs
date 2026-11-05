const fs = require('fs');

let content = fs.readFileSync('src/components/screens/ActiveChatScreen.tsx', 'utf8');

// 1. Remove "New Booking" for doctor
const newBookingOld = `            <button
              onClick={() => onNavigate('doctor-discovery')}
              className="px-4 py-2 sm:py-2.5 bg-[#022434] hover:bg-[#006c44] text-white text-sm font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Booking</span>
            </button>`;

const newBookingNew = `            {role !== 'doctor' && (
              <button
                onClick={() => onNavigate('doctor-discovery')}
                className="px-4 py-3 sm:py-2.5 bg-[#022434] hover:bg-[#006c44] text-white text-sm font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center space-x-2 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>New Booking</span>
              </button>
            )}`;
content = content.replace(newBookingOld, newBookingNew);

// 2. Hide tab filter for doctor
const tabFilterOld = `              <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
                {(['all', 'new', 'previous'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      triggerHaptic('selection');
                      setActiveTab(tab);
                    }}
                    className={\`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold font-outfit transition-all whitespace-nowrap shrink-0 \${
                      activeTab === tab
                        ? 'bg-[#1c3a4a] text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }\`}
                  >
                    {tab === 'all' ? 'All Sessions' : tab === 'new' ? 'Active & Upcoming' : 'Completed'}
                  </button>
                ))}
              </div>`;

const tabFilterNew = `              {role !== 'doctor' && (
                <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
                  {(['all', 'new', 'previous'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => {
                        triggerHaptic('selection');
                        setActiveTab(tab);
                      }}
                      className={\`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold font-outfit transition-all whitespace-nowrap shrink-0 \${
                        activeTab === tab
                          ? 'bg-[#1c3a4a] text-white shadow-md'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }\`}
                    >
                      {tab === 'all' ? 'All Sessions' : tab === 'new' ? 'Active & Upcoming' : 'Completed'}
                    </button>
                  ))}
                </div>
              )}`;
content = content.replace(tabFilterOld, tabFilterNew);

// 3. Fix Active sessions accordion header
const activeHeaderOld = `                <button 
                  onClick={() => {
                    triggerHaptic('light');
                    setIsActiveSessionsExpanded(!isActiveSessionsExpanded);
                  }}
                  className="w-full flex items-center justify-between border-b border-slate-200/80 pb-2.5 hover:opacity-80 transition-opacity group"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse ring-2 ring-emerald-500/30" />
                    <h3 className="font-bold font-outfit text-sm text-[#022434] tracking-tight">
                      Active & Upcoming
                    </h3>
                    <span className="bg-emerald-50 text-[#006c44] border border-emerald-200/60 text-[11px] font-bold px-2 py-0.5 rounded-md">
                      {newConsultations.length} Queue
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] text-slate-400 font-nunito hidden sm:inline group-hover:text-slate-500 transition-colors">Live Schedule</span>
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                      {isActiveSessionsExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                      )}
                    </div>
                  </div>
                </button>`;

const activeHeaderNew = `                <button 
                  onClick={() => {
                    triggerHaptic('light');
                    setIsActiveSessionsExpanded(!isActiveSessionsExpanded);
                  }}
                  className="w-full flex items-center justify-between border-b border-slate-200/80 py-3 hover:opacity-80 transition-opacity group"
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse ring-2 ring-emerald-500/30" />
                    <h3 className="font-bold font-outfit text-sm text-[#022434] tracking-tight">
                      Active & Upcoming
                    </h3>
                    <span className="bg-emerald-50 text-[#006c44] border border-emerald-200/60 text-[11px] font-bold px-3 py-1 rounded-md">
                      {newConsultations.length} Queue
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-[11px] text-slate-400 font-nunito hidden sm:inline group-hover:text-slate-500 transition-colors">Live Schedule</span>
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors shrink-0">
                      {isActiveSessionsExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                  </div>
                </button>`;
content = content.replace(activeHeaderOld, activeHeaderNew);

// 4. Fix Completed sessions accordion header
const compHeaderOld = `                <button 
                  onClick={() => {
                    triggerHaptic('light');
                    setIsCompletedSessionsExpanded(!isCompletedSessionsExpanded);
                  }}
                  className="w-full flex items-center justify-between border-b border-slate-200/80 pb-2.5 hover:opacity-80 transition-opacity group"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <h3 className="font-bold font-outfit text-sm text-[#022434] tracking-tight">
                      Completed Sessions
                    </h3>
                    <span className="bg-slate-100 text-slate-600 text-[11px] font-bold px-2 py-0.5 rounded-md border border-slate-200/60">
                      {previousConsultations.length} Logs
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] text-slate-400 font-nunito hidden sm:inline group-hover:text-slate-500 transition-colors">Clinical History</span>
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                      {isCompletedSessionsExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                      )}
                    </div>
                  </div>
                </button>`;

const compHeaderNew = `                <button 
                  onClick={() => {
                    triggerHaptic('light');
                    setIsCompletedSessionsExpanded(!isCompletedSessionsExpanded);
                  }}
                  className="w-full flex items-center justify-between border-b border-slate-200/80 py-3 hover:opacity-80 transition-opacity group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 text-slate-500" />
                    </div>
                    <h3 className="font-bold font-outfit text-sm text-[#022434] tracking-tight">
                      Completed Sessions
                    </h3>
                    <span className="bg-slate-100 text-slate-600 text-[11px] font-bold px-3 py-1 rounded-md border border-slate-200/60">
                      {previousConsultations.length} Logs
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-[11px] text-slate-400 font-nunito hidden sm:inline group-hover:text-slate-500 transition-colors">Clinical History</span>
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors shrink-0">
                      {isCompletedSessionsExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                  </div>
                </button>`;
content = content.replace(compHeaderOld, compHeaderNew);

// 5. Update hit areas in the active card action buttons
const activeCardBtnsOld = `                            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                              <button
                                onClick={() => {
                                  if (isConsultationPaid(item.id) || item.status === 'live' || item.status === 'completed') {
                                    triggerHaptic('selection');
                                    setActiveSession(item);
                                  } else {
                                    handleStartConsultationCall(item);
                                  }
                                }}
                                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold font-outfit text-xs transition-colors shrink-0"
                              >
                                Open Chat
                              </button>
                              <button
                                onClick={() => handleStartConsultationCall(item)}
                                className="px-4 py-2 bg-[#77daa4] hover:bg-[#006c44] hover:text-white text-[#022434] font-bold font-outfit text-xs rounded-xl shadow-xs transition-all active:scale-95 shrink-0"
                              >
                                Start Call
                              </button>
                            </div>`;

const activeCardBtnsNew = `                            <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-slate-100">
                              <button
                                onClick={() => {
                                  if (isConsultationPaid(item.id) || item.status === 'live' || item.status === 'completed') {
                                    triggerHaptic('selection');
                                    setActiveSession(item);
                                  } else {
                                    handleStartConsultationCall(item);
                                  }
                                }}
                                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold font-outfit text-xs transition-colors shrink-0"
                              >
                                Open Chat
                              </button>
                              <button
                                onClick={() => handleStartConsultationCall(item)}
                                className="px-5 py-2.5 bg-[#77daa4] hover:bg-[#006c44] hover:text-white text-[#022434] font-bold font-outfit text-xs rounded-xl shadow-xs transition-all active:scale-95 shrink-0"
                              >
                                Start Call
                              </button>
                            </div>`;
content = content.replace(activeCardBtnsOld, activeCardBtnsNew);

// 6. Update hit areas in the completed card action buttons
const completedCardBtnsOld = `                            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                              {role === 'doctor' && (
                                <button
                                  onClick={() => {
                                    triggerHaptic('selection');
                                    setSelectedPatientForDoc(item.patientName);
                                    setIsDocModalOpen(true);
                                  }}
                                  className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#006c44] border border-emerald-200/80 font-bold font-outfit text-xs rounded-xl transition-all flex items-center space-x-1.5 shrink-0"
                                >
                                  <Stethoscope className="w-3.5 h-3.5" />
                                  <span>Document Encounter</span>
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  triggerHaptic('selection');
                                  setSelectedConsultationForPDF(item);
                                  setIsSummaryModalOpen(true);
                                }}
                                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200/80 font-bold font-outfit text-xs rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center space-x-1.5"
                              >
                                <FileText className="w-3.5 h-3.5 text-blue-700" />
                                <span>EHR Summary</span>
                              </button>

                              <button
                                onClick={() => {
                                  triggerHaptic('selection');
                                  onNavigate('prescription-detail');
                                }}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold font-outfit text-xs rounded-xl whitespace-nowrap shrink-0"
                              >
                                Details
                              </button>
                            </div>`;

const completedCardBtnsNew = `                            <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-slate-100">
                              {role === 'doctor' && (
                                <button
                                  onClick={() => {
                                    triggerHaptic('selection');
                                    setSelectedPatientForDoc(item.patientName);
                                    setIsDocModalOpen(true);
                                  }}
                                  className="px-5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-[#006c44] border border-emerald-200/80 font-bold font-outfit text-xs rounded-xl transition-all flex items-center space-x-1.5 shrink-0"
                                >
                                  <Stethoscope className="w-3.5 h-3.5" />
                                  <span>Document Encounter</span>
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  triggerHaptic('selection');
                                  setSelectedConsultationForPDF(item);
                                  setIsSummaryModalOpen(true);
                                }}
                                className="px-5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200/80 font-bold font-outfit text-xs rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center space-x-1.5"
                              >
                                <FileText className="w-3.5 h-3.5 text-blue-700" />
                                <span>EHR Summary</span>
                              </button>

                              <button
                                onClick={() => {
                                  triggerHaptic('selection');
                                  onNavigate('prescription-detail');
                                }}
                                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold font-outfit text-xs rounded-xl whitespace-nowrap shrink-0"
                              >
                                Details
                              </button>
                            </div>`;
content = content.replace(completedCardBtnsOld, completedCardBtnsNew);

fs.writeFileSync('src/components/screens/ActiveChatScreen.tsx', content);

