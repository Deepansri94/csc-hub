import React, { useState } from 'react';
import { 
  Printer, 
  Copy, 
  Layers, 
  CreditCard, 
  FileCheck, 
  Book, 
  Scan, 
  Plus, 
  Trash2, 
  Calculator, 
  ArrowRight,
  Sparkles,
  Check
} from 'lucide-react';
import { InvoiceItem, XeroxItemType, PaperSize, PageSide } from '../types';

interface PresetItem {
  id: XeroxItemType;
  title: string;
  sub: string;
  size: PaperSize;
  sides: PageSide;
  defaultRate: number;
  icon: any;
  color: string;
}

const XEROX_PRESETS: PresetItem[] = [
  {
    id: 'bw_xerox',
    title: 'B&W Xerox (A4)',
    sub: 'Standard Photocopy',
    size: 'A4',
    sides: 'single',
    defaultRate: 3.0,
    icon: Copy,
    color: 'from-slate-700 to-slate-900',
  },
  {
    id: 'color_xerox',
    title: 'Color Xerox (A4)',
    sub: 'Full Color Photocopy',
    size: 'A4',
    sides: 'single',
    defaultRate: 10.0,
    icon: Copy,
    color: 'from-amber-600 to-orange-700',
  },
  {
    id: 'bw_print',
    title: 'B&W Printout (A4)',
    sub: 'Direct Computer Print',
    size: 'A4',
    sides: 'single',
    defaultRate: 5.0,
    icon: Printer,
    color: 'from-blue-700 to-blue-900',
  },
  {
    id: 'color_print',
    title: 'Color Printout (A4)',
    sub: 'High-Res Laser Color',
    size: 'A4',
    sides: 'single',
    defaultRate: 15.0,
    icon: Printer,
    color: 'from-indigo-600 to-violet-800',
  },
  {
    id: 'photo_print',
    title: 'Passport Photos (8 Set)',
    sub: 'Glossy Photo Sheet',
    size: 'Photo4x6',
    sides: 'single',
    defaultRate: 60.0,
    icon: Sparkles,
    color: 'from-pink-600 to-rose-700',
  },
  {
    id: 'pvc_card',
    title: 'PVC Smart Card Print',
    sub: 'Aadhaar / PAN / Ayushman',
    size: 'PVC',
    sides: 'double',
    defaultRate: 80.0,
    icon: CreditCard,
    color: 'from-emerald-700 to-teal-900',
  },
  {
    id: 'lamination',
    title: 'A4 Lamination',
    sub: 'Military Grade Pouch',
    size: 'A4',
    sides: 'single',
    defaultRate: 25.0,
    icon: FileCheck,
    color: 'from-cyan-700 to-blue-800',
  },
  {
    id: 'spiral_binding',
    title: 'Spiral Binding',
    sub: 'Plastic Coil + OHP Sheet',
    size: 'A4',
    sides: 'single',
    defaultRate: 40.0,
    icon: Book,
    color: 'from-purple-700 to-indigo-900',
  },
  {
    id: 'scanning',
    title: 'Document Scan & Send',
    sub: 'PDF to WhatsApp / Email',
    size: 'A4',
    sides: 'single',
    defaultRate: 10.0,
    icon: Scan,
    color: 'from-slate-800 to-zinc-950',
  },
];

interface XeroxCalculatorProps {
  onAddToCart: (item: InvoiceItem) => void;
  onQuickBill: (items: InvoiceItem[]) => void;
}

export const XeroxCalculator: React.FC<XeroxCalculatorProps> = ({
  onAddToCart,
  onQuickBill,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<PresetItem>(XEROX_PRESETS[0]);
  const [pages, setPages] = useState<number>(1);
  const [copies, setCopies] = useState<number>(1);
  const [sides, setSides] = useState<PageSide>('single');
  const [paperSize, setPaperSize] = useState<PaperSize>('A4');
  const [customRate, setCustomRate] = useState<number>(selectedPreset.defaultRate);
  const [customNote, setCustomNote] = useState<string>('');
  const [addedAnimation, setAddedAnimation] = useState(false);

  // When preset changes, update default rate & paper size
  const handleSelectPreset = (preset: PresetItem) => {
    setSelectedPreset(preset);
    setPaperSize(preset.size);
    setSides(preset.sides);
    
    // Auto rate adjustments based on sides
    let rate = preset.defaultRate;
    if (preset.id === 'bw_xerox' && sides === 'double') rate = 5.0;
    if (preset.id === 'color_xerox' && sides === 'double') rate = 18.0;
    setCustomRate(rate);
  };

  const handleSidesChange = (newSides: PageSide) => {
    setSides(newSides);
    if (selectedPreset.id === 'bw_xerox') {
      setCustomRate(newSides === 'double' ? 5.0 : 3.0);
    } else if (selectedPreset.id === 'color_xerox') {
      setCustomRate(newSides === 'double' ? 18.0 : 10.0);
    } else if (selectedPreset.id === 'bw_print') {
      setCustomRate(newSides === 'double' ? 8.0 : 5.0);
    } else if (selectedPreset.id === 'color_print') {
      setCustomRate(newSides === 'double' ? 25.0 : 15.0);
    }
  };

  // Calculate total:
  // For document scanning/lamination/pvc/binding, usually unit rate * pages/units
  const calculatedTotal = customRate * pages * copies;

  const buildInvoiceItem = (): InvoiceItem => {
    let sideText = sides === 'double' ? 'Double Sided' : 'Single Sided';
    if (['pvc_card', 'lamination', 'spiral_binding', 'photo_print'].includes(selectedPreset.id)) {
      sideText = '';
    }

    const detailsStr = [
      paperSize !== 'A4' ? paperSize : '',
      sideText,
      pages > 1 ? `${pages} pgs` : '',
      copies > 1 ? `${copies} sets` : '',
      customNote ? `(${customNote})` : '',
    ].filter(Boolean).join(' • ');

    return {
      id: 'xerox-' + Date.now(),
      name: selectedPreset.title,
      category: 'xerox',
      quantity: pages * copies,
      unitPrice: customRate / (pages > 1 && selectedPreset.id === 'spiral_binding' ? pages : 1),
      amount: calculatedTotal,
      details: detailsStr || `${pages * copies} units`,
    };
  };

  const handleAdd = () => {
    const item = buildInvoiceItem();
    onAddToCart(item);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1500);
  };

  const handleInstantBill = () => {
    const item = buildInvoiceItem();
    onQuickBill([item]);
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-4 sm:p-6 text-white shadow-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 mb-2">
            <Calculator className="w-3.5 h-3.5" />
            <span>High-Speed Counter Xerox & Print Calculator</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">Xerox, Printout & PVC Card Counter</h2>
          <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-xl">
            Quickly calculate photocopies, computer prints, photo paper sheets, laminations, and binding. Add directly to bill cart or print instant counter receipt.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 text-right">
          <p className="text-xs text-blue-200 font-medium">Standard A4 B&W Xerox Rate</p>
          <p className="text-xl font-black text-amber-400">₹3.00 <span className="text-xs font-normal text-slate-300">(Single)</span> / ₹5.00 <span className="text-xs font-normal text-slate-300">(Both)</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Preset Touch Buttons */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-800" />
            <span>1. Select Service / Job Type</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {XEROX_PRESETS.map((preset) => {
              const Icon = preset.icon;
              const isSelected = selectedPreset.id === preset.id;
              return (
                <div
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-3.5 rounded-2xl text-left transition-all border-2 relative overflow-hidden flex flex-col justify-between cursor-pointer group ${
                    isSelected
                      ? 'border-blue-900 bg-blue-50/80 shadow-md ring-2 ring-blue-900/20'
                      : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${preset.color} text-white flex items-center justify-center shadow-xs`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-black font-mono text-slate-900 bg-white px-2 py-0.5 rounded-full border border-slate-200 shadow-2xs">
                        ₹{preset.defaultRate}
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug group-hover:text-blue-900 transition-colors">
                      {preset.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {preset.sub}
                    </p>
                  </div>

                  {/* Product Card Action Footer with prominent Add Button */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      {preset.size}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectPreset(preset);
                        onAddToCart({
                          id: 'xerox-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
                          name: preset.title,
                          category: 'xerox',
                          quantity: 1,
                          unitPrice: preset.defaultRate,
                          amount: preset.defaultRate,
                          details: `${preset.title} (1 unit @ ₹${preset.defaultRate})`,
                        });
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-xs hover:shadow-sm transition active:scale-95 cursor-pointer"
                      title={`Add ${preset.title} directly to bill cart`}
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Parameters & Calculation Widget */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-md space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-blue-800">Selected Item</span>
              <h3 className="text-base sm:text-lg font-black text-slate-900">{selectedPreset.title}</h3>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-500 font-medium">Default Rate</span>
              <p className="text-sm font-bold font-mono text-slate-800">₹{selectedPreset.defaultRate} / unit</p>
            </div>
          </div>

          {/* Quick options: Sides & Paper Size */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Print Sides</label>
              <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => handleSidesChange('single')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition ${
                    sides === 'single' ? 'bg-white text-blue-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Single Side
                </button>
                <button
                  type="button"
                  onClick={() => handleSidesChange('double')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition ${
                    sides === 'double' ? 'bg-white text-blue-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Double Side
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Paper / Media Size</label>
              <select
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value as PaperSize)}
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-900"
              >
                <option value="A4">A4 (Standard 75/80 GSM)</option>
                <option value="Legal">Legal (Court / Stamp Paper)</option>
                <option value="A3">A3 (Large Size)</option>
                <option value="Photo4x6">Photo 4x6 (Glossy Paper)</option>
                <option value="PVC">PVC Plastic Smart Card</option>
              </select>
            </div>
          </div>

          {/* Number of Pages & Copies */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Number of Pages
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPages(Math.max(1, pages - 1))}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 transition"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={pages}
                  onChange={(e) => setPages(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full text-center font-mono font-bold text-base bg-slate-50 border border-slate-300 rounded-lg py-1 text-slate-900"
                />
                <button
                  onClick={() => setPages(pages + 1)}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 transition"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Number of Copies / Sets
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCopies(Math.max(1, copies - 1))}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 transition"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={copies}
                  onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full text-center font-mono font-bold text-base bg-slate-50 border border-slate-300 rounded-lg py-1 text-slate-900"
                />
                <button
                  onClick={() => setCopies(copies + 1)}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 transition"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Quick presets for copy count */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-500 font-medium">Quick Copies:</span>
            {[1, 2, 5, 10, 25, 50, 100].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setCopies(num)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold transition ${
                  copies === num ? 'bg-blue-900 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {num}
              </button>
            ))}
          </div>

          {/* Unit Rate Override & Note */}
          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Unit Rate (₹ per sheet)</label>
              <input
                type="number"
                step="0.5"
                value={customRate}
                onChange={(e) => setCustomRate(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Customer / Work Note</label>
              <input
                type="text"
                placeholder="e.g. Court affidavit, 10th marksheet"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-900"
              />
            </div>
          </div>

          {/* Calculated Total Card */}
          <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-xl p-4 shadow-inner">
            <div className="flex items-center justify-between text-xs text-slate-300 pb-2 border-b border-blue-900/60">
              <span>Total Sheets / Output Units:</span>
              <span className="font-mono font-bold text-white text-sm">{pages * copies} Sheets</span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="text-[10px] text-amber-300 uppercase tracking-widest font-black">Calculated Amount</p>
                <p className="text-xs text-slate-300">{pages} pgs × {copies} sets @ ₹{customRate}</p>
              </div>
              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
                  ₹{calculatedTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleAdd}
              className={`w-full py-3 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-98 ${
                addedAnimation
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-900 hover:bg-blue-800 text-white'
              }`}
            >
              {addedAnimation ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Added to Bill Cart!</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>Add to Current Bill Cart</span>
                </>
              )}
            </button>

            <button
              onClick={handleAdd}
              className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-200 hover:bg-slate-300 text-slate-900 flex items-center justify-center gap-2 shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Xerox Product</span>
            </button>

            <button
              onClick={handleInstantBill}
              className="w-full py-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center justify-center gap-2 shadow-xs transition"
            >
              <ArrowRight className="w-4 h-4 text-slate-950" />
              <span>Instant Xerox Counter Bill & Receipt</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
