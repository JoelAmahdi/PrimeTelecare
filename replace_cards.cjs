const fs = require('fs');
let content = fs.readFileSync('src/components/screens/ActiveChatScreen.tsx', 'utf8');

// Replacements for Section 1 (Active Sessions)
const activeCardOld = `<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left: Avatar & Info */}
                      <div className="flex items-start space-x-3 min-w-0">
                        <img
                          src={role === 'doctor' ? item.patientAvatar : item.doctorAvatar}
                          alt={item.patientName}
                          className="w-11 h-11 rounded-xl object-cover shrink-0 border border-slate-200 shadow-xs"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold font-outfit text-sm text-[#022434] truncate">
                              {role === 'doctor' ? item.patientName : item.doctorName}
                            </h4>
                            <span
                              className={\`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center space-x-1 \${
                                item.status === 'live'
                                  ? 'bg-emerald-500 text-white animate-pulse'
                                  : 'bg-amber-100 text-amber-900 border border-amber-200'
                              }\`}
                            >
                              <span>{item.status === 'live' ? '● LIVE' : 'UPCOMING'}</span>
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-nunito mt-0.5 leading-snug">
                            {role === 'doctor' ? \`Complaint: \${item.chiefComplaint}\` : \`\${item.specialty} • \${item.doctorName}\`}
                          </p>
                          <div className="flex items-center space-x-2.5 mt-2 text-[11px] font-medium text-slate-600">
                            <span className="flex items-center space-x-1 text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                              <Clock className="w-3 h-3 text-[#006c44]" />
                              <span>{item.dateTimeStr}</span>
                            </span>
                            <span className="flex items-center space-x-1 bg-emerald-50 text-[#006c44] border border-emerald-200/70 px-2 py-0.5 rounded-md">
                              {item.type === 'Video' && <Video className="w-3 h-3" />}
                              {item.type === 'Chat' && <MessageSquare className="w-3 h-3" />}
                              {item.type === 'Voice' && <Phone className="w-3 h-3" />}
                              <span>{item.type}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* Right: Actions */}
                      <div className="flex items-center space-x-2 shrink-0 sm:self-center pt-2 sm:pt-0 border-t sm:border-0 border-slate-100 justify-end">
                        <button
                          onClick={() => {
                            if (isConsultationPaid(item.id) || item.status === 'live' || item.status === 'completed') {
                              triggerHaptic('selection');
                              setActiveSession(item);
                            } else {
                              handleStartConsultationCall(item);
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium font-outfit text-xs transition-colors whitespace-nowrap shrink-0"
                        >
                          Open Chat
                        </button>
                        <button
                          onClick={() => handleStartConsultationCall(item)}
                          className="px-3 py-1.5 bg-[#77daa4] hover:bg-[#006c44] hover:text-white text-[#022434] font-semibold font-outfit text-xs rounded-xl shadow-xs transition-all active:scale-95 whitespace-nowrap shrink-0"
                        >
                          Start Call
                        </button>
                      </div>
                    </div>`;

const activeCardNew = `<div className="flex items-start space-x-3 sm:space-x-4">
                      {/* Avatar */}
                      <img
                        src={role === 'doctor' ? item.patientAvatar : item.doctorAvatar}
                        alt={item.patientName}
                        className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200 shadow-xs mt-0.5"
                      />
                      
                      {/* Content & Actions */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold font-outfit text-sm text-[#022434] truncate">
                            {role === 'doctor' ? item.patientName : item.doctorName}
                          </h4>
                          <span
                            className={\`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center space-x-1 tracking-wide \${
                              item.status === 'live'
                                ? 'bg-emerald-500 text-white animate-pulse'
                                : 'bg-amber-100 text-amber-900'
                            }\`}
                          >
                            <span>{item.status === 'live' ? '● LIVE' : 'UPCOMING'}</span>
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-nunito mt-1 leading-snug">
                          {role === 'doctor' ? \`Complaint: \${item.chiefComplaint}\` : \`\${item.specialty} • \${item.doctorName}\`}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="flex items-center space-x-1 text-slate-600 bg-slate-100/80 px-2 py-1 rounded-lg text-[11px] font-medium border border-slate-200/60">
                            <Clock className="w-3 h-3 text-[#006c44]" />
                            <span>{item.dateTimeStr}</span>
                          </span>
                          <span className="flex items-center space-x-1 bg-emerald-50 text-[#006c44] border border-emerald-200/60 px-2 py-1 rounded-lg text-[11px] font-medium">
                            {item.type === 'Video' && <Video className="w-3 h-3" />}
                            {item.type === 'Chat' && <MessageSquare className="w-3 h-3" />}
                            {item.type === 'Voice' && <Phone className="w-3 h-3" />}
                            <span>{item.type}</span>
                          </span>
                        </div>

                        {/* Actions aligned to text */}
                        <div className="flex flex-wrap items-center gap-2 mt-3.5 pt-3.5 border-t border-slate-100">
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
                        </div>
                      </div>
                    </div>`;

// Replacements for Section 2 (Completed Sessions)
const completedCardOld = `<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start space-x-3 min-w-0">
                        <img
                          src={role === 'doctor' ? item.patientAvatar : item.doctorAvatar}
                          alt={item.patientName}
                          className="w-11 h-11 rounded-xl object-cover shrink-0 border border-slate-200 grayscale-20"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold font-outfit text-sm text-[#022434] truncate">
                              {role === 'doctor' ? item.patientName : item.doctorName}
                            </h4>
                            <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center space-x-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Completed</span>
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-nunito mt-0.5 leading-snug">
                            Complaint: {item.chiefComplaint}
                          </p>
                          {item.notes && (
                            <div className="mt-1.5 p-2 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-600 font-nunito">
                              Note: {item.notes}
                            </div>
                          )}
                          <div className="flex items-center space-x-2 mt-2 text-[11px] font-medium text-slate-500">
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>{item.dateTimeStr}</span>
                            </span>
                            <span>•</span>
                            <span className="text-slate-600">{item.type} Session</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0 sm:self-center pt-2 sm:pt-0 border-t sm:border-0 border-slate-100 justify-end flex-wrap gap-y-1">
                        {role === 'doctor' && (
                          <button
                            onClick={() => {
                              triggerHaptic('selection');
                              setSelectedPatientForDoc(item.patientName);
                              setIsDocModalOpen(true);
                            }}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#006c44] border border-emerald-200/80 font-semibold font-outfit text-xs rounded-xl transition-all flex items-center space-x-1 shrink-0"
                          >
                            <Stethoscope className="w-3.5 h-3.5" />
                            <span>Document Encounter</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            triggerHaptic('selection');
                            setIsSummaryModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200/80 font-semibold font-outfit text-xs rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center space-x-1"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-700" />
                          <span>EHR Summary</span>
                        </button>

                        <button
                          onClick={() => {
                            triggerHaptic('selection');
                            onNavigate('prescription-detail');
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium font-outfit text-xs rounded-xl whitespace-nowrap shrink-0"
                        >
                          Details
                        </button>
                      </div>
                    </div>`;

const completedCardNew = `<div className="flex items-start space-x-3 sm:space-x-4">
                      {/* Avatar */}
                      <img
                        src={role === 'doctor' ? item.patientAvatar : item.doctorAvatar}
                        alt={item.patientName}
                        className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200 grayscale-20 mt-0.5"
                      />
                      
                      {/* Content & Actions */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold font-outfit text-sm text-[#022434] truncate">
                            {role === 'doctor' ? item.patientName : item.doctorName}
                          </h4>
                          <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center space-x-1 tracking-wide">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Completed</span>
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-nunito mt-1 leading-snug">
                          Complaint: {item.chiefComplaint}
                        </p>
                        
                        {item.notes && (
                          <div className="mt-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 font-nunito">
                            Note: {item.notes}
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-2 mt-2 text-[11px] font-medium text-slate-500 bg-slate-100/50 w-fit px-2 py-1 rounded-lg border border-slate-200/50">
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{item.dateTimeStr}</span>
                          </span>
                          <span>•</span>
                          <span className="text-slate-600">{item.type} Session</span>
                        </div>

                        {/* Actions aligned to text */}
                        <div className="flex flex-wrap items-center gap-2 mt-3.5 pt-3.5 border-t border-slate-100">
                          {role === 'doctor' && (
                            <button
                              onClick={() => {
                                triggerHaptic('selection');
                                setSelectedPatientForDoc(item.patientName);
                                setIsDocModalOpen(true);
                              }}
                              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#006c44] border border-emerald-200/80 font-bold font-outfit text-xs rounded-xl transition-all flex items-center space-x-1.5 shrink-0"
                            >
                              <Stethoscope className="w-3.5 h-3.5" />
                              <span>Document Encounter</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              triggerHaptic('selection');
                              setIsSummaryModalOpen(true);
                            }}
                            className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200/80 font-bold font-outfit text-xs rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center space-x-1.5"
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
                        </div>
                      </div>
                    </div>`;

if (content.includes(activeCardOld)) {
  content = content.replace(activeCardOld, activeCardNew);
} else {
  console.error('Active card old not found');
}

if (content.includes(completedCardOld)) {
  content = content.replace(completedCardOld, completedCardNew);
} else {
  console.error('Completed card old not found');
}

fs.writeFileSync('src/components/screens/ActiveChatScreen.tsx', content);
