const fs = require('fs');
let content = fs.readFileSync('src/components/screens/ActiveChatScreen.tsx', 'utf8');

const idx = content.indexOf("es';\nimport { mockDoctors");
if (idx !== -1) {
    let before = content.substring(0, idx);
    let after = `                  </div>
                ))}
              </div>
              )}
            </div>
          )}

          {/* EMPTY STATE */}
          {filteredConsultations.length === 0 && (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="font-bold font-outfit text-[#022434] text-base">No consultations found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto font-nunito">
                No consultations match your current search or filter criteria. Try resetting filters or search terms.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveTab('all');
                  setTypeFilter('all');
                }}
                className="px-4 py-2 bg-[#1c3a4a] text-white text-xs font-bold font-outfit rounded-xl"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Patient Consultation Summary PDF Modal */}
      <ConsultationSummaryPDFModal
        isOpen={isSummaryModalOpen}
        user={currentUserPatient}
        consultationRecord={selectedConsultationForPDF}
        onClose={() => setIsSummaryModalOpen(false)}
      />

      {/* Clinician Structured Documentation Modal */}
      <ClinicalDocumentationModal
        isOpen={isDocModalOpen}
        patientName={selectedPatientForDoc}
        doctorUser={currentUserDoctor}
        onClose={() => setIsDocModalOpen(false)}
      />

      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </div>
  );
};
`;
    fs.writeFileSync('src/components/screens/ActiveChatScreen.tsx', before + after);
    console.log("FIXED!");
} else {
    console.log("NOT FOUND!");
}
