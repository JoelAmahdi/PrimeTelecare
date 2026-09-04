import React, { useState } from 'react';
import { Header } from '../common/Header';
import { StatusBar } from '../common/StatusBar';
import { Camera, Image as ImageIcon, FileText, X, Info } from 'lucide-react';
import { ScreenId } from '../../types';

interface UploadMediaScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

export const UploadMediaScreen: React.FC<UploadMediaScreenProps> = ({ onNavigate }) => {
  const [files, setFiles] = useState([
    {
      id: '1',
      name: 'Patient Photo.jpg',
      type: 'JPG',
      url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
    },
    {
      id: '2',
      name: 'Lab Report.pdf',
      type: 'PDF',
      url: '',
    },
  ]);

  const [note, setNote] = useState('');

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleAddDemoFile = () => {
    const newFile = {
      id: Date.now().toString(),
      name: `Medical Doc ${files.length + 1}.pdf`,
      type: 'PDF',
      url: '',
    };
    setFiles((prev) => [...prev, newFile]);
  };

  return (
    <div className="min-h-screen bg-[#f6fafd] pb-10 w-full max-w-4xl mx-auto px-4 sm:px-6 text-[#171c1f] flex flex-col justify-between">
      <div>
        <StatusBar className="-mx-4 sm:-mx-6" />
        <Header
          title="Upload Media"
          showBack
          onBack={() => onNavigate('book-consultation')}
          rightElement={
            <span className="text-xs font-bold bg-[#e6f9f0] text-[#006c44] px-2.5 py-1 rounded-full">
              Optional
            </span>
          }
        />

        <div className="px-5 space-y-5 mt-3">
          {/* Info Banner */}
          <div className="bg-[#e6f9f0] border border-emerald-200/80 p-4 rounded-2xl flex items-start space-x-3 text-slate-700">
            <Info className="w-5 h-5 text-[#006c44] shrink-0 mt-0.5" />
            <p className="text-xs font-nunito leading-relaxed">
              Share medical documents or photos to help your doctor better understand your condition.
            </p>
          </div>

          {/* Large Dashed Dropzone */}
          <button
            onClick={handleAddDemoFile}
            className="w-full h-40 border-2 border-dashed border-[#006c44]/50 bg-[#77daa4]/20 hover:bg-[#77daa4]/30 rounded-3xl flex flex-col items-center justify-center space-y-2 transition-all group active:scale-98"
          >
            <div className="flex space-x-3 text-[#006c44]">
              <Camera className="w-8 h-8 group-hover:scale-110 transition-transform" />
              <ImageIcon className="w-8 h-8 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-sm font-bold font-outfit text-slate-700">
              Tap to take a photo or upload files
            </span>
          </button>

          {/* Attached Files Grid */}
          <div className="grid grid-cols-4 gap-2.5">
            {files.map((file) => (
              <div
                key={file.id}
                className="relative h-24 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs flex flex-col items-center justify-center p-1"
              >
                {/* Delete 'X' Button */}
                <button
                  onClick={() => handleRemoveFile(file.id)}
                  className="absolute top-1 right-1 bg-slate-800/80 text-white rounded-full p-0.5 hover:bg-slate-900 z-10"
                >
                  <X className="w-3 h-3" />
                </button>

                {file.url ? (
                  <img src={file.url} alt={file.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <div className="flex flex-col items-center">
                    <FileText className="w-8 h-8 text-slate-400" />
                  </div>
                )}

                {/* Badge */}
                <span className="absolute bottom-1 right-1 bg-[#006c44] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                  {file.type}
                </span>
              </div>
            ))}

            {/* Empty Slots */}
            {Array.from({ length: Math.max(0, 4 - files.length) }).map((_, i) => (
              <div
                key={i}
                onClick={handleAddDemoFile}
                className="h-24 rounded-2xl border border-dashed border-slate-300 bg-slate-100/50 flex items-center justify-center cursor-pointer hover:bg-slate-100"
              >
                <span className="text-slate-400 text-xl font-bold">+</span>
              </div>
            ))}
          </div>

          {/* Doctor Note Field */}
          <div className="space-y-1">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note for your doctor (optional)"
              rows={4}
              className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-nunito focus:outline-none focus:border-[#006c44] shadow-xs"
            ></textarea>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-5 space-y-3">
        <button
          onClick={() => onNavigate('book-consultation')}
          className="w-full py-4 bg-[#1c3a4a] text-white font-bold font-outfit text-base rounded-2xl shadow-md hover:bg-[#022434] transition-all transform active:scale-98"
        >
          Upload & Continue
        </button>

        <button
          onClick={() => onNavigate('book-consultation')}
          className="w-full text-center py-2 text-[#006c44] font-bold font-outfit text-sm hover:underline"
        >
          Skip for Now
        </button>
      </div>
    </div>
  );
};
