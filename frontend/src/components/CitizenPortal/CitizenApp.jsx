import React, { useState, useEffect } from 'react';
import { 
  Languages, 
  MapPin, 
  Clock, 
  Trash2, 
  Camera, 
  Send, 
  CheckCircle2, 
  AlertTriangle,
  Truck,
  Recycle,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { fetchCitizenLookup } from '../../api/client';

const PUNE_WARDS_LIST = [
  { id: 'PUNE_W01', nameEn: 'Aundh-Baner', nameMr: 'औंध-बाणेर', day: 'Monday' },
  { id: 'PUNE_W02', nameEn: 'Ghole Road-Shivajinagar', nameMr: 'घोले रोड-शिवाजीनगर', day: 'Tuesday' },
  { id: 'PUNE_W03', nameEn: 'Kothrud-Bavdhan', nameMr: 'कोथरूड-बावधन', day: 'Wednesday' },
  { id: 'PUNE_W04', nameEn: 'Warje-Karvenagar', nameMr: 'वारजे-कर्वेनगर', day: 'Thursday' },
  { id: 'PUNE_W05', nameEn: 'Dhole Patil Road', nameMr: 'ढोले पाटील रोड', day: 'Friday' },
  { id: 'PUNE_W06', nameEn: 'Yerawada-Kalas-Dhanori', nameMr: 'येरवडा-कळस-धानोरी', day: 'Saturday' },
  { id: 'PUNE_W07', nameEn: 'Bhavani Peth', nameMr: 'भवानी पेठ', day: 'Monday' },
  { id: 'PUNE_W08', nameEn: 'Kasba-Vishrambaugwada', nameMr: 'कसबा-विश्रामबागवाडा', day: 'Tuesday' },
  { id: 'PUNE_W09', nameEn: 'Tilak Road-Sinhagad', nameMr: 'टिळक रोड-सिंहगड रोड', day: 'Wednesday' },
  { id: 'PUNE_W10', nameEn: 'Bibwewadi', nameMr: 'बिबवेवाडी', day: 'Thursday' },
  { id: 'PUNE_W11', nameEn: 'Sahakarnagar', nameMr: 'सहकारनगर', day: 'Friday' },
  { id: 'PUNE_W12', nameEn: 'Dhankawadi-Sahakarnagar', nameMr: 'धनकवडी-सहकारनगर', day: 'Saturday' },
  { id: 'PUNE_W13', nameEn: 'Hadapsar-Mundhwa', nameMr: 'हडपसर-मुंढवा', day: 'Monday' },
  { id: 'PUNE_W14', nameEn: 'Wanowrie-Ramtekdi', nameMr: 'वानवडी-रामटेकडी', day: 'Tuesday' },
  { id: 'PUNE_W15', nameEn: 'Nagar Road-Vadgaonsheri', nameMr: 'नगर रोड-वडगाव शेरी', day: 'Wednesday' },
];

export default function CitizenApp() {
  const [lang, setLang] = useState('en');
  const [selectedWard, setSelectedWard] = useState('PUNE_W03');
  const [reportSuccess, setReportSuccess] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [complaintText, setComplaintText] = useState('');
  const [photoAttached, setPhotoAttached] = useState(false);

  const currentWard = PUNE_WARDS_LIST.find(w => w.id === selectedWard) || PUNE_WARDS_LIST[2];

  const handleReportSubmit = (e) => {
    e.preventDefault();
    const newId = `PMC-SBM-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    setTicketId(newId);
    setReportSuccess(true);
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
  };

  return (
    <div className="min-h-screen bg-background-cream text-on-background font-body antialiased selection:bg-surface-sand selection:text-primary relative">
      <div className="grain-overlay"></div>
      <div className="w-full max-w-xl mx-auto px-4 py-6 flex flex-col gap-8 pb-32">
      {/* Top Header with Stitch Language Switcher */}
      <div className="flex justify-between items-center bg-surface-sand p-4 rounded-3xl border border-outline-variant/30 shadow-sm">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-primary font-bold block">
            {lang === 'mr' ? 'स्वच्छ पुणे नागरिक' : 'Swachh Pune Citizen'}
          </span>
          <h2 className="font-editorial text-xl font-bold text-on-background">
            {lang === 'mr' ? 'कचरा संकलन ट्रॅकर' : 'Civic Waste Tracker'}
          </h2>
        </div>

        <button
          onClick={() => setLang(lang === 'en' ? 'mr' : 'en')}
          className="bg-background-cream hover:bg-surface-dim px-4 py-2 rounded-full border border-outline-variant/40 text-on-surface-variant font-mono text-xs font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95"
        >
          <Languages className="w-3.5 h-3.5 text-primary" />
          <span>{lang === 'en' ? 'ENG / MAR' : 'मराठी / ENG'}</span>
        </button>
      </div>

      {/* Ward Selection Row */}
      <div className="bg-surface-sand p-4 rounded-2xl border border-outline-variant/30 flex flex-col gap-2 shadow-sm">
        <label className="font-mono text-[10px] uppercase text-muted-taupe tracking-wider font-bold">
          {lang === 'mr' ? 'तुमचा प्रभाग निवडा' : 'Select Your Municipal Ward'}
        </label>
        <select
          value={selectedWard}
          onChange={(e) => setSelectedWard(e.target.value)}
          className="bg-background-cream text-on-background text-sm font-semibold rounded-xl px-3 py-2 border border-outline-variant/40 focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {PUNE_WARDS_LIST.map((w) => (
            <option key={w.id} value={w.id}>
              {w.id} — {lang === 'mr' ? w.nameMr : w.nameEn} ({w.day})
            </option>
          ))}
        </select>
      </div>

      {/* Hero Live Tracking Section (Stitch Screen 5) */}
      <section className="bg-surface-sand rounded-[2.5rem] p-8 border border-outline-variant/30 shadow-sm flex flex-col gap-4 relative overflow-hidden">
        <div className="inline-flex items-center gap-2 bg-background-cream text-primary px-3.5 py-1 rounded-full font-mono text-xs font-bold w-fit border border-outline-variant/30">
          <Truck className="w-3.5 h-3.5" />
          <span>{lang === 'mr' ? 'थेट ट्रॅकिंग' : 'Live Tracking'}</span>
        </div>

        <div>
          <h1 className="font-editorial text-5xl md:text-6xl text-primary font-bold tracking-tight">
            08:45 AM
          </h1>
          <p className="font-editorial text-lg text-on-background opacity-80 mt-1">
            {lang === 'mr' ? 'अंदाजे आगमन वेळ' : 'Estimated Arrival'}
          </p>
        </div>

        <div className="pt-2 border-t border-outline-variant/30 flex items-center justify-between text-xs font-mono text-muted-taupe">
          <div className="flex items-center gap-2">
            <span className="font-bold text-on-background">Tipper MH-12-QZ-4821</span>
            <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
            <span className="text-secondary font-bold">
              {lang === 'mr' ? '३ थांबे दूर' : '3 stops away'}
            </span>
          </div>
          <span className="font-bold text-primary">{currentWard.id}</span>
        </div>
      </section>

      {/* SBM-U 2.0 Preparation Guide (Bento Style from Stitch Screen 5) */}
      <section className="flex flex-col gap-4">
        <div>
          <h3 className="font-editorial text-2xl font-bold text-on-background">
            {lang === 'mr' ? 'कचरा वर्गीकरण मार्गदर्शक' : 'Preparation Guide'}
          </h3>
          <p className="text-xs text-muted-taupe mt-0.5">
            {lang === 'mr' ? 'पुणे महानगरपालिकेनुसार चार-डब्यांचे वर्गीकरण' : 'Four-stream source segregation rules (SBM-U 2.0)'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Wet Waste */}
          <article className="bg-surface-sand rounded-[2rem] p-5 border-l-4 border-secondary border border-outline-variant/30 shadow-sm flex flex-col justify-between gap-3 hover:scale-[1.01] transition-transform">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono font-bold text-secondary uppercase tracking-wider block">
                  {lang === 'mr' ? 'हिरवा डबा' : 'GREEN BIN'}
                </span>
                <h4 className="font-editorial text-lg font-bold text-on-background mt-0.5">
                  {lang === 'mr' ? 'ओला कचरा' : 'Wet Waste'}
                </h4>
              </div>
              <div className="w-8 h-8 rounded-full bg-secondary/15 flex items-center justify-center text-secondary">
                <Trash2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xs text-muted-taupe">
              {lang === 'mr' ? 'किचनचा कचरा, खरकटे अन्न, फळांची साले, पाने' : 'Kitchen scraps, food waste, fruit peels, leftover leaves.'}
            </p>
          </article>

          {/* Dry Waste */}
          <article className="bg-surface-sand rounded-[2rem] p-5 border-l-4 border-primary border border-outline-variant/30 shadow-sm flex flex-col justify-between gap-3 hover:scale-[1.01] transition-transform">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono font-bold text-primary uppercase tracking-wider block">
                  {lang === 'mr' ? 'निळा डबा' : 'BLUE BIN'}
                </span>
                <h4 className="font-editorial text-lg font-bold text-on-background mt-0.5">
                  {lang === 'mr' ? 'सुका कचरा' : 'Dry Waste'}
                </h4>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary">
                <Recycle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xs text-muted-taupe">
              {lang === 'mr' ? 'कागद, पुठ्ठा, प्लास्टिकच्या बाटल्या, धातू, काच' : 'Cardboard, paper, plastic bottles, aluminum cans, glass.'}
            </p>
          </article>

          {/* Sanitary Waste */}
          <article className="bg-surface-sand rounded-[2rem] p-5 border-l-4 border-terracotta border border-outline-variant/30 shadow-sm flex flex-col justify-between gap-3 hover:scale-[1.01] transition-transform">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono font-bold text-terracotta uppercase tracking-wider block">
                  {lang === 'mr' ? 'लाल डबा' : 'RED BIN'}
                </span>
                <h4 className="font-editorial text-lg font-bold text-on-background mt-0.5">
                  {lang === 'mr' ? 'सॅनिटरी कचरा' : 'Sanitary Waste'}
                </h4>
              </div>
              <div className="w-8 h-8 rounded-full bg-terracotta/15 flex items-center justify-center text-terracotta">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xs text-muted-taupe">
              {lang === 'mr' ? 'डायपर, सॅनिटरी पॅड, बँडेज, वैद्यकीय मास्क' : 'Diapers, sanitary napkins, bandages, medical masks.'}
            </p>
          </article>

          {/* E-Waste */}
          <article className="bg-surface-sand rounded-[2rem] p-5 border-l-4 border-muted-taupe border border-outline-variant/30 shadow-sm flex flex-col justify-between gap-3 hover:scale-[1.01] transition-transform">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono font-bold text-muted-taupe uppercase tracking-wider block">
                  {lang === 'mr' ? 'राखाडी डबा' : 'GREY BIN'}
                </span>
                <h4 className="font-editorial text-lg font-bold text-on-background mt-0.5">
                  {lang === 'mr' ? 'ई-कचरा' : 'E-Waste'}
                </h4>
              </div>
              <div className="w-8 h-8 rounded-full bg-muted-taupe/15 flex items-center justify-center text-muted-taupe">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xs text-muted-taupe">
              {lang === 'mr' ? 'जुन्या बॅटऱ्या, सीएफएल बल्ब, वायर्स, इलेक्ट्रॉनिक वस्तू' : 'Batteries, CFL bulbs, cables, old electronic accessories.'}
            </p>
          </article>
        </div>
      </section>

      {/* Overflow Grievance Card */}
      <section className="bg-surface-sand rounded-[2rem] p-6 border border-outline-variant/30 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-primary" />
          <h3 className="font-editorial text-xl font-bold text-on-background">
            {lang === 'mr' ? 'कचराकुंडी भरल्याची तक्रार नोंदवा' : 'Report Overflowing Bin'}
          </h3>
        </div>

        {!reportSuccess ? (
          <form onSubmit={handleReportSubmit} className="flex flex-col gap-3">
            <textarea
              rows={3}
              required
              placeholder={lang === 'mr' ? 'कचराकुंडीचे स्थान किंवा वर्णन लिहा...' : 'Describe location or landmark of overflowing bin...'}
              value={complaintText}
              onChange={(e) => setComplaintText(e.target.value)}
              className="bg-background-cream text-on-background text-xs rounded-2xl p-3.5 border border-outline-variant/40 focus:outline-none focus:ring-1 focus:ring-primary"
            />

            <div className="flex items-center gap-3">
              <label className="flex-1 flex items-center justify-center gap-2 p-3 bg-background-cream hover:bg-surface-dim rounded-xl border border-dashed border-outline-variant/50 text-xs text-muted-taupe font-semibold cursor-pointer transition-colors">
                <Camera className="w-4 h-4 text-primary" />
                <span>{photoAttached ? (lang === 'mr' ? 'फोटो जोडला गेला' : 'Photo Attached') : (lang === 'mr' ? 'फोटो जोडा' : 'Attach Photo')}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={() => setPhotoAttached(true)}
                />
              </label>

              <button
                type="submit"
                className="px-6 py-3 bg-primary hover:bg-primary-container text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{lang === 'mr' ? 'तक्रार पाठवा' : 'Submit'}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-secondary/10 border border-secondary/30 rounded-2xl p-4 text-center flex flex-col items-center gap-2 animate-in fade-in zoom-in duration-300">
            <CheckCircle2 className="w-8 h-8 text-secondary" />
            <h4 className="font-bold text-sm text-secondary">
              {lang === 'mr' ? 'तक्रार यशस्वीरित्या नोंदवली गेली!' : 'Grievance Registered Successfully!'}
            </h4>
            <p className="font-mono text-xs font-bold text-on-background">
              Ticket ID: <span className="underline text-primary">{ticketId}</span>
            </p>
            <p className="text-[11px] text-muted-taupe mt-1 max-w-sm">
              {lang === 'mr' ? 'एआय रूट ऑप्टिमायझरने पुढील गाडीसाठी या डब्याला प्राधान्य दिले आहे.' : 'AI route optimizer has prioritized this stop for the next available vehicle dispatch.'}
            </p>
            <button
              onClick={() => {
                setReportSuccess(false);
                setComplaintText('');
                setPhotoAttached(false);
              }}
              className="mt-2 text-xs font-bold text-primary underline hover:opacity-80"
            >
              {lang === 'mr' ? 'दुसरी तक्रार नोंदवा' : 'Report another issue'}
            </button>
          </div>
        )}
      </section>
      </div>
    </div>
  );
}
