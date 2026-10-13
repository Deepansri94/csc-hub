import React, { useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { Operator } from '../types';

interface AuthModalProps {
  operators: Operator[];
  currentOperator: Operator;
  onSelectOperator: (op: Operator) => void;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  operators,
  currentOperator,
  onSelectOperator,
  onClose,
}) => {
  const [selectedOp, setSelectedOp] = useState<Operator>(currentOperator);
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPin === selectedOp.pin) {
      onSelectOperator(selectedOp);
      onClose();
    } else {
      setErrorMsg('Invalid PIN. Please enter the correct 4-digit PIN.');
      setEnteredPin('');
    }
  };

  const handleKeypadPress = (val: string) => {
    if (enteredPin.length < 4) {
      setEnteredPin(enteredPin + val);
    }
  };

  const handleKeypadBackspace = () => {
    setEnteredPin(enteredPin.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-900" />
            <h3 className="text-base font-black text-slate-900">Operator Authentication</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Kiosk Operator</label>
          <div className="grid grid-cols-2 gap-2">
            {operators.map((op) => (
              <button
                key={op.id}
                type="button"
                onClick={() => {
                  setSelectedOp(op);
                  setErrorMsg('');
                  setEnteredPin('');
                }}
                className={`p-2.5 rounded-xl border text-left transition ${
                  selectedOp.id === op.id
                    ? 'border-blue-900 bg-blue-50/80 shadow-xs ring-1 ring-blue-900'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <p className="font-bold text-xs text-slate-900 leading-tight">{op.name}</p>
                <p className="text-[10px] text-blue-800 font-semibold uppercase mt-0.5">{op.role}</p>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 text-center">
              Enter 4-Digit Security PIN
            </label>
            <div className="flex justify-center gap-3 py-2">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-10 h-12 rounded-xl border-2 flex items-center justify-center text-xl font-bold font-mono ${
                    enteredPin.length > idx
                      ? 'border-blue-900 bg-blue-50 text-blue-950'
                      : 'border-slate-300 bg-slate-50 text-transparent'
                  }`}
                >
                  {enteredPin.length > idx ? '●' : ''}
                </div>
              ))}
            </div>

            {errorMsg && (
              <p className="text-rose-600 text-xs font-semibold text-center mt-1">{errorMsg}</p>
            )}

            <p className="text-[10px] text-slate-400 text-center mt-1">
              Enter your assigned 4-digit security PIN.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  if (k === 'C') setEnteredPin('');
                  else if (k === '⌫') handleKeypadBackspace();
                  else handleKeypadPress(k);
                }}
                className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-bold font-mono text-sm transition"
              >
                {k}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={enteredPin.length !== 4}
            className="w-full py-3 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
          >
            Authenticate & Unlock Kiosk
          </button>
        </form>
      </div>
    </div>
  );
};
