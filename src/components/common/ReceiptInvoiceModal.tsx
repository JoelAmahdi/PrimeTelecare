import React from 'react';
import {
  X,
  FileText,
  Download,
  Printer,
  CheckCircle2,
  Building2,
  ShieldCheck,
  BadgeCheck,
  Share2,
} from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';
import { showToast } from '../../utils/toast';

interface ReceiptInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceData: {
    invoiceNo: string;
    date: string;
    patientName: string;
    patientEmail: string;
    doctorName: string;
    doctorSpecialty: string;
    doctorLicense: string;
    consultationType: string;
    consultationDate: string;
    consultationTime: string;
    baseFee: number;
    platformFee: number;
    vatFee: number;
    totalFee: number;
    paymentMethod: string;
    paymentReference: string;
    paymentStatus: 'Paid' | 'Pending' | 'Failed';
  };
}

export const ReceiptInvoiceModal: React.FC<ReceiptInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoiceData,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    triggerHaptic('medium');
    window.print();
  };

  const handleDownload = () => {
    triggerHaptic('success');
    showToast(`Downloading Official Tax Receipt ${invoiceData.invoiceNo}.pdf`, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Header Bar */}
        <div className="bg-[#022434] text-white p-5 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold font-outfit text-base text-white">Tax Invoice & Official Receipt</h3>
              <p className="text-xs text-slate-300 font-nunito">{invoiceData.invoiceNo}</p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-6 space-y-6 text-[#171c1f] font-nunito max-h-[75vh] overflow-y-auto">
          {/* Logo & Company Info */}
          <div className="flex justify-between items-start border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 bg-[#006c44] rounded-lg flex items-center justify-center text-white font-extrabold text-sm">
                  P
                </div>
                <span className="font-extrabold font-outfit text-lg text-[#022434]">Prime Telecare</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Prime Telehealth Systems Ltd.
                <br />
                TIN: 29481039-0001 • Medical Licence: MDCAN/TLH/2026/088
              </p>
            </div>

            <div className="text-right">
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  invoiceData.paymentStatus === 'Paid'
                    ? 'bg-emerald-100 text-[#006c44] border border-emerald-300'
                    : invoiceData.paymentStatus === 'Pending'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-red-100 text-red-800 border border-red-300'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                {invoiceData.paymentStatus}
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">
                Issued: {invoiceData.date}
              </span>
            </div>
          </div>

          {/* Billed To & Service Provider Info */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Billed To (Patient)</span>
              <strong className="font-bold text-[#022434] block text-sm">{invoiceData.patientName}</strong>
              <span className="text-slate-500 block">{invoiceData.patientEmail}</span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Attending Specialist</span>
              <strong className="font-bold text-[#022434] block text-sm">{invoiceData.doctorName}</strong>
              <span className="text-slate-500 block">{invoiceData.doctorSpecialty}</span>
              <span className="text-[10px] text-emerald-700 font-semibold block">Lic: {invoiceData.doctorLicense}</span>
            </div>
          </div>

          {/* Consultation Session Metadata */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Service Category:</span>
              <span className="font-bold text-[#022434]">{invoiceData.consultationType} Tele-Consultation</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Scheduled Date & Time:</span>
              <span className="font-bold text-[#022434]">{invoiceData.consultationDate} @ {invoiceData.consultationTime}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Payment Reference:</span>
              <span className="font-mono text-slate-700 font-bold">{invoiceData.paymentReference}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Payment Channel:</span>
              <span className="font-medium text-slate-800">{invoiceData.paymentMethod}</span>
            </div>
          </div>

          {/* Line Item Breakdown Table */}
          <div className="border rounded-2xl overflow-hidden border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold font-outfit uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Item Description</th>
                  <th className="p-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-nunito">
                <tr>
                  <td className="p-3">
                    <span className="font-semibold text-[#022434] block">Clinical Consultation Fee</span>
                    <span className="text-[10px] text-slate-500">30-Min Encrypted Tele-Session with Specialist</span>
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-slate-800">
                    ₦{invoiceData.baseFee.toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td className="p-3">
                    <span className="font-semibold text-[#022434] block">Platform & Tele-Infrastructure Charge</span>
                    <span className="text-[10px] text-slate-500">HD WebRTC Video/Audio Proxy & EHR Storage</span>
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-slate-800">
                    ₦{invoiceData.platformFee.toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td className="p-3">
                    <span className="font-semibold text-[#022434] block">Clinical Health Record Export Release</span>
                    <span className="text-[10px] text-slate-500">Official Dossier Export (Subject to Attending Doctor Sign-Off)</span>
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-[#006c44]">
                    INCLUDED
                  </td>
                </tr>
                <tr>
                  <td className="p-3">
                    <span className="font-semibold text-[#022434] block">Value Added Tax (VAT 7.5%)</span>
                    <span className="text-[10px] text-slate-500">Statutory Health Services Tax</span>
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-slate-800">
                    ₦{invoiceData.vatFee.toLocaleString()}
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-slate-50 font-outfit border-t border-slate-200">
                <tr>
                  <td className="p-3 font-extrabold text-sm text-[#022434]">Total Amount Paid:</td>
                  <td className="p-3 text-right font-mono font-extrabold text-base text-[#006c44]">
                    ₦{invoiceData.totalFee.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-start space-x-2 text-xs text-emerald-900">
            <BadgeCheck className="w-4 h-4 text-[#006c44] shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] leading-relaxed">
                This itemized receipt includes prescriber TIN & MDCN registration numbers required for health insurance claim submission & tax deductions.
              </span>
            </div>
          </div>
        </div>

        {/* Footer Action Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-bold font-outfit text-xs flex items-center space-x-1.5 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>

          <button
            onClick={handleDownload}
            className="px-5 py-2.5 bg-[#006c44] text-white hover:bg-[#005233] rounded-xl font-bold font-outfit text-xs flex items-center space-x-1.5 shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download Tax PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
