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
  Info,
  Calendar,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { fetchCitizenLookup } from '../../api/client';

// Bilingual translations dictionary (English & Marathi)
const TRANSLATIONS = {
  en: {
    appTitle: 'Swachh Pune Citizen',
    appSubtitle: 'Smart Waste Tracker & Segregation Guide',
    langToggle: 'मराठी',
    selectWard: 'Select Your Pune Ward',
    detectGps: 'Auto-Detect via GPS',
    pickupSchedule: 'Your Collection Schedule',
    etaTitle: 'Estimated Arrival',
    etaSubtitle: 'Waste tipper truck is on route',
    stopsAway: '3 stops away from your zone',
    depot: 'Assigned Transfer Station',
    segregationTitle: 'SBM-U 2.0 Waste Segregation Guide',
    segregationSubtitle: 'Four-bin source segregation guidelines as mandated by PMC',
    reportTitle: 'Report Overflowing Bin',
    reportSubtitle: 'Help PMC keep Pune clean. Snap a photo and alert our AI dispatchers.',
    reportBtn: 'Submit Grievance',
    reportSuccess: 'Complaint Registered Successfully!',
    ticketNumber: 'Ticket ID',
    ticketMessage: 'AI route optimizer has re-prioritized this bin for the next scheduled vehicle.',
    wasteStreams: {
      wet: { title: 'Wet / Organic', desc: 'Kitchen scraps, food waste, fruit peels, flowers', bin: 'Green Bin' },
      dry: { title: 'Dry / Recyclable', desc: 'Paper, cardboard, plastic bottles, metal cans, glass', bin: 'Blue Bin' },
      sanitary: { title: 'Sanitary / Reject', desc: 'Diapers, sanitary pads, band-aids, masks', bin: 'Red Bin' },
      ewaste: { title: 'E-Waste / Hazardous', desc: 'Old batteries, CFL bulbs, cables, electronic items', bin: 'Grey Bin' },
    },
    days: {
      Monday: 'Monday',
      Tuesday: 'Tuesday',
      Wednesday: 'Wednesday',
      Thursday: 'Thursday',
      Friday: 'Friday',
      Saturday: 'Saturday',
      Sunday: 'Sunday',
    }
  },
  mr: {
    appTitle: 'स्वच्छ पुणे नागरिक',
    appSubtitle: 'स्मार्ट कचरा संकलन व वर्गीकरण मार्गदर्शक',
    langToggle: 'English',
    selectWard: 'तुमचा पुणे प्रभाग निवडा',
    detectGps: 'जीपीएस द्वारे शोधा',
    pickupSchedule: 'तुमचे संकलन वेळापत्रक',
    etaTitle: 'अंदाजे आगमन वेळ',
    etaSubtitle: 'कचरा गाडी आपल्या मार्गावर आहे',
    stopsAway: 'आपल्या प्रभागापासून ३ थांबे दूर',
    depot: 'नियुक्त कचरा हस्तांतरण केंद्र',
    segregationTitle: 'स्वच्छ भारत २.० कचरा वर्गीकरण मार्गदर्शक',
    segregationSubtitle: 'पुणे महानगरपालिकेनुसार चार-डब्यांचे वर्गीकरण',
    reportTitle: 'कचराकुंडी भरल्याची तक्रार नोंदवा',
    reportSubtitle: 'पुणे स्वच्छ ठेवण्यास मदत करा. फोटो काढा आणि आमच्या एआय प्रणालीला कळवा.',
    reportBtn: 'तक्रार दाखल करा',
    reportSuccess: 'तक्रार यशस्वीरित्या नोंदवली गेली!',
    ticketNumber: 'तक्रार क्रमांक',
    ticketMessage: 'एआय रूट ऑप्टिमायझरने पुढील गाडीसाठी या डब्याला प्राधान्य दिले आहे.',
    wasteStreams: {
      wet: { title: 'ओला कचरा', desc: 'किचनचा कचरा, खरकटे अन्न, फळांची साले, फुले', bin: 'हिरवा डबा' },
      dry: { title: 'सुका कचरा', desc: 'कागद, पुठ्ठा, प्लास्टिकच्या बाटल्या, धातू, काच', bin: 'निळा डबा' },
      sanitary: { title: 'सॅनिटरी कचरा', desc: 'डायपर, सॅनिटरी पॅड, बँडेज, मास्क', bin: 'लाल डबा' },
      ewaste: { title: 'ई-कचरा / घातक', desc: 'जुन्या बॅटऱ्या, सीएफएल बल्ब, वायर्स, इलेक्ट्रॉनिक वस्तू', bin: 'राखाडी डबा' },
    },
    days: {
      Monday: 'सोमवार',
      Tuesday: 'मंगळवार',
      Wednesday: 'बुधवार',
      Thursday: 'गुरुवार',
      Friday: 'शुक्रवार',
      Saturday: 'शनिवार',
      Sunday: 'रविवार',
    }
  }
};

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
  const [selectedWard, setSelectedWard] = useState('PUNE_W01');
  const [citizenData, setCitizenData] = useState(null);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [complaintText, setComplaintText] = useState('');
  const [photoSelected, setPhotoSelected] = useState(false);

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchCitizenLookup(selectedWard);
        setCitizenData(data);
      } catch (err) {
        console.warn('[Citizen] Failed to load lookup data, using fallback:', err.message);
      }
    }
    loadData();
  }, [selectedWard]);

  const currentWardInfo = PUNE_WARDS_LIST.find(w => w.id === selectedWard) || PUNE_WARDS_LIST[0];

  const handleReportSubmit = (e) => {
    e.preventDefault();
    const newTicket = `PMC-SBM-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    setTicketId(newTicket);
    setReportSuccess(true);
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
  };

  const handleGpsDetect = () => {
    // Simulate smart GPS match to Kothrud-Bavdhan
    setSelectedWard('PUNE_W03');
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2C2624] font-body pb-24">
      {/* Top App Bar with Bilingual Switcher */}
      <header className="sticky top-0 z-40 bg-[#FDFBF7]/90 backdrop-blur-md border-b border-[#E5D9CC] px-4 md:px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-terracotta text-white flex items-center justify-center font-bold shadow-md">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-editorial text-lg md:text-xl font-bold text-terracotta-dark">
              {t.appTitle}
            </h1>
            <p className="text-xs text-taupe font-sans">{t.appSubtitle}</p>
          </div>
        </div>

        {/* Language Toggle Button */}
        <button
          onClick={() => setLang(lang === 'en' ? 'mr' : 'en')}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sand hover:bg-sand-dark border border-[#DCC0BB] text-xs font-bold text-terracotta transition-all shadow-sm active:scale-95"
        >
          <Languages className="w-4 h-4 text-terracotta" />
          <span>{t.langToggle}</span>
        </button>
      </header>

      {/* Main Responsive Citizen Container */}
      <main className="max-w-xl mx-auto px-4 pt-6 flex flex-col gap-6">
        {/* Ward Selector Card */}
        <div className="bg-[#F5ECE3] border border-[#DCC0BB] rounded-2xl p-5 shadow-sm flex flex-col gap-3">
          <label className="text-xs uppercase font-bold text-taupe tracking-wider">
            {t.selectWard}
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              className="flex-1 bg-white border border-[#DCC0BB] rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-terracotta/40"
            >
              {PUNE_WARDS_LIST.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.id} — {lang === 'mr' ? w.nameMr : w.nameEn} ({lang === 'mr' ? t.days[w.day] : w.day})
                </option>
              ))}
            </select>

            <button
              onClick={handleGpsDetect}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-terracotta hover:bg-terracotta-dark text-white rounded-xl text-xs font-bold transition-colors shadow-sm active:scale-95 whitespace-nowrap"
            >
              <MapPin className="w-4 h-4" />
              <span>{t.detectGps}</span>
            </button>
          </div>
        </div>

        {/* Real-Time Tipper Arrival ETA Card */}
        <div className="bg-gradient-to-br from-terracotta to-[#9A402F] text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-mono tracking-widest text-orange-200">
                {t.pickupSchedule}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-mono backdrop-blur-sm">
                {currentWardInfo.id}
              </span>
            </div>

            <div>
              <div className="text-sm text-orange-100 font-sans">{t.etaTitle}</div>
              <div className="font-editorial text-4xl md:text-5xl font-bold tracking-tight mt-1">
                08:45 AM
              </div>
              <p className="text-xs text-orange-200 mt-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{t.stopsAway}</span>
              </p>
            </div>

            <div className="pt-3 border-t border-white/20 flex items-center justify-between text-xs text-orange-100 font-sans">
              <div>
                <span className="opacity-80 block">{t.depot}</span>
                <span className="font-bold text-white">
                  {lang === 'mr' ? currentWardInfo.nameMr : currentWardInfo.nameEn} Transfer Hub
                </span>
              </div>
              <div className="text-right">
                <span className="opacity-80 block">Scheduled Day</span>
                <span className="font-bold text-white">
                  {lang === 'mr' ? t.days[currentWardInfo.day] : currentWardInfo.day}
                </span>
              </div>
            </div>
          </div>

          {/* Decorative background circle */}
          <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-white/10 blur-xl pointer-events-none"></div>
        </div>

        {/* SBM-U 2.0 Four-Bin Waste Segregation Guide */}
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="font-editorial text-xl font-bold text-[#2C2624]">
              {t.segregationTitle}
            </h2>
            <p className="text-xs text-taupe mt-0.5">{t.segregationSubtitle}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* 1. Wet Waste */}
            <div className="bg-[#F5ECE3] border-l-4 border-[#22C55E] rounded-2xl p-4 shadow-sm flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#166534]">{t.wasteStreams.wet.title}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DCFCE7] text-[#166534]">
                  {t.wasteStreams.wet.bin}
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {t.wasteStreams.wet.desc}
              </p>
            </div>

            {/* 2. Dry Waste */}
            <div className="bg-[#F5ECE3] border-l-4 border-[#3B82F6] rounded-2xl p-4 shadow-sm flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#1E40AF]">{t.wasteStreams.dry.title}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DBEAFE] text-[#1E40AF]">
                  {t.wasteStreams.dry.bin}
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {t.wasteStreams.dry.desc}
              </p>
            </div>

            {/* 3. Sanitary Waste */}
            <div className="bg-[#F5ECE3] border-l-4 border-[#EF4444] rounded-2xl p-4 shadow-sm flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#991B1B]">{t.wasteStreams.sanitary.title}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEE2E2] text-[#991B1B]">
                  {t.wasteStreams.sanitary.bin}
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {t.wasteStreams.sanitary.desc}
              </p>
            </div>

            {/* 4. E-Waste */}
            <div className="bg-[#F5ECE3] border-l-4 border-[#64748B] rounded-2xl p-4 shadow-sm flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#334155]">{t.wasteStreams.ewaste.title}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E2E8F0] text-[#334155]">
                  {t.wasteStreams.ewaste.bin}
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {t.wasteStreams.ewaste.desc}
              </p>
            </div>
          </div>
        </div>

        {/* Report Overflowing Bin Grievance Card */}
        <div className="bg-[#F5ECE3] border border-[#DCC0BB] rounded-3xl p-6 shadow-sm flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-terracotta" />
              <h3 className="font-editorial text-lg font-bold text-terracotta-dark">
                {t.reportTitle}
              </h3>
            </div>
            <p className="text-xs text-taupe mt-1">{t.reportSubtitle}</p>
          </div>

          {!reportSuccess ? (
            <form onSubmit={handleReportSubmit} className="flex flex-col gap-3.5">
              <textarea
                placeholder={lang === 'mr' ? 'कचराकुंडीचे स्थान किंवा वर्णन लिहा...' : 'Describe location or landmark of overflowing bin...'}
                value={complaintText}
                onChange={(e) => setComplaintText(e.target.value)}
                rows={3}
                required
                className="w-full bg-white border border-[#DCC0BB] rounded-2xl p-3.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-terracotta/40 placeholder:text-slate-400"
              />

              <div className="flex items-center gap-3">
                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-sand-dark border border-dashed border-[#DCC0BB] rounded-xl text-xs text-taupe font-bold cursor-pointer transition-colors">
                  <Camera className="w-4 h-4 text-terracotta" />
                  <span>{photoSelected ? (lang === 'mr' ? 'फोटो जोडला गेला' : 'Photo Attached') : (lang === 'mr' ? 'कचऱ्याचा फोटो जोडा' : 'Attach Bin Photo')}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={() => setPhotoSelected(true)}
                  />
                </label>

                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-terracotta hover:bg-terracotta-dark text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>{t.reportBtn}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-[#DCFCE7] border border-[#86EFAC] rounded-2xl p-4 text-center flex flex-col items-center gap-2 animate-in fade-in zoom-in duration-300">
              <CheckCircle2 className="w-8 h-8 text-[#166534]" />
              <h4 className="font-bold text-sm text-[#166534]">{t.reportSuccess}</h4>
              <p className="text-xs font-mono font-bold text-[#166534]">
                {t.ticketNumber}: <span className="underline">{ticketId}</span>
              </p>
              <p className="text-[11px] text-[#166534]/90 max-w-sm mt-1">
                {t.ticketMessage}
              </p>
              <button
                onClick={() => {
                  setReportSuccess(false);
                  setComplaintText('');
                  setPhotoSelected(false);
                }}
                className="mt-2 text-xs font-bold text-[#166534] underline hover:opacity-80"
              >
                {lang === 'mr' ? 'दुसरी तक्रार नोंदवा' : 'Report another issue'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
