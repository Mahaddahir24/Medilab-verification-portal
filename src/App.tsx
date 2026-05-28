import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldCheck,
  Search,
  Printer,
  QrCode,
  Plus,
  Check,
  X,
  ShieldAlert,
  FileText,
  User,
  Calendar,
  Shield,
  RefreshCw,
  Eye,
  Building,
  Phone,
  Stethoscope,
  Info,
  Layers,
  Sparkles
} from "lucide-react";
import { PatientReport, LabTest } from "./types";
import { INITIAL_REPORTS } from "./data";

export default function App() {
  // Load reports from LocalStorage or use preloaded dataset
  const [reports, setReports] = useState<PatientReport[]>(() => {
    const saved = localStorage.getItem("medilab_reports");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing stored reports, using defaults.", e);
      }
    }
    return INITIAL_REPORTS;
  });

  // Save to LocalStorage whenever reports change
  useEffect(() => {
    localStorage.setItem("medilab_reports", JSON.stringify(reports));
  }, [reports]);

  // Terminal States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReportId, setSelectedReportId] = useState("1876");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [stampUrl, setStampUrl] = useState("");
  const [qrTargetEnv, setQrTargetEnv] = useState<"production" | "sandbox">("production");

  // Simulated Verification Authenticity Override (to show unverified states)
  const [verificationOverride, setVerificationOverride] = useState<Record<string, boolean>>({});

  // Form State for creating a new report
  const [newPatient, setNewPatient] = useState({
    id: "",
    name: "",
    age: 35,
    gender: "Male" as "Male" | "Female" | "Other",
    company: "",
    passportNo: "",
    phone: "",
    doctor: "Dr. Sadam Adan Ahmed",
    resultDate: new Date().toISOString().split("T")[0],
    hcv: "Negative",
    hepB: "Negative",
    hiv: "Negative",
    tpha: "Negative"
  });

  // Read Query Parameter on Mount & dynamic changes (e.g., QR scanner deep links)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryId = params.get("id");
    const queryPassport = params.get("passport");
    const queryToken = params.get("token");

    if (queryToken) {
      const match = reports.find((r) => r.token === queryToken);
      if (match) {
        setSelectedReportId(match.id);
      }
    } else if (queryId) {
      const match = reports.find((r) => r.id === queryId);
      if (match) {
        setSelectedReportId(queryId);
      }
    } else if (queryPassport) {
      const match = reports.find(
        (r) => r.passportNo.toLowerCase() === queryPassport.toLowerCase()
      );
      if (match) {
        setSelectedReportId(match.id);
      }
    }
  }, [reports]);

  // Handle setting parameters to support physical link testing directly
  const updateUrlParam = (report: PatientReport) => {
    const newUrl = `${window.location.origin}${window.location.pathname}?token=${report.token || "a3b8899c3a"}`;
    window.history.replaceState({ path: newUrl }, "", newUrl);
  };

  const handleSelectReport = (id: string) => {
    setSelectedReportId(id);
    const match = reports.find((r) => r.id === id);
    if (match) {
      updateUrlParam(match);
    }
  };

  // Find dynamic patient active report
  const activeReport = reports.find((r) => r.id === selectedReportId) || reports[0];

  // Check if active report is verified
  const isCurrentlyVerified = activeReport
    ? verificationOverride[activeReport.id] !== false && activeReport.verified
    : false;

  // Filter passengers in terminal panel
  const filteredReports = reports.filter((r) => {
    const query = searchQuery.toLowerCase();
    return (
      r.name.toLowerCase().includes(query) ||
      r.id.includes(query) ||
      r.passportNo.toLowerCase().includes(query) ||
      r.company.toLowerCase().includes(query)
    );
  });

  // Calculate stats
  const totalReportsCount = reports.length;
  const verifiedCount = reports.filter((r) => verificationOverride[r.id] !== false && r.verified).length;

  const handlePrint = () => {
    window.print();
  };

  const resetToFactoryDefault = () => {
    if (confirm("Miyaad la hubtaa inaad dib u dhigto dhammaan diiwaannada Medilab? (Are you sure you want to reset records to original preloaded defaults?)")) {
      setReports(INITIAL_REPORTS);
      setVerificationOverride({});
      setSelectedReportId("1876");
      const cleanUrl = `${window.location.origin}${window.location.pathname}`;
      window.history.replaceState({ path: cleanUrl }, "", cleanUrl);
    }
  };

  const handleCreateReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatient.id || !newPatient.name) {
      alert("Fadlan qor lambarka boortada iyo magaca (Please write the Patient ID and Name)");
      return;
    }

    // Check duplicate ID
    if (reports.some((r) => r.id === newPatient.id)) {
      alert("Lambarka ID-ga ee bukaanka mar hore ayaa la isticmaalay! (This Patient ID already exists!)");
      return;
    }

    const created: PatientReport = {
      id: newPatient.id,
      name: newPatient.name.toUpperCase(),
      age: Number(newPatient.age),
      gender: newPatient.gender,
      company: newPatient.company.toUpperCase() || "PRIVATE CO",
      passportNo: newPatient.passportNo.toUpperCase() || "N/A",
      phone: newPatient.phone || "N/A",
      doctor: newPatient.doctor,
      resultDate: newPatient.resultDate,
      verified: true,
      token: Math.random().toString(16).slice(2, 12),
      tests: [
        { name: "HCV", result: newPatient.hcv as any, unit: "test" },
        { name: "Hepatitis B Surface Antigen", result: newPatient.hepB as any, unit: "test" },
        { name: "HIV Test", result: newPatient.hiv as any, unit: "test" },
        { name: "TPHA", result: newPatient.tpha as any, unit: "test" }
      ]
    };

    setReports((prev) => [...prev, created]);
    setSelectedReportId(created.id);
    updateUrlParam(created);
    setShowCreateModal(false);

    // Reset Form fields
    setNewPatient({
      id: "",
      name: "",
      age: 35,
      gender: "Male",
      company: "",
      passportNo: "",
      phone: "",
      doctor: "Dr. Sadam Adan Ahmed",
      resultDate: new Date().toISOString().split("T")[0],
      hcv: "Negative",
      hepB: "Negative",
      hiv: "Negative",
      tpha: "Negative"
    });
  };

  // Generate dynamic QR code URL based on target environment
  const targetBaseUrl = qrTargetEnv === "production"
    ? "https://mymedilabscom.vercel.app"
    : window.location.origin;

  const verificationLink = activeReport
    ? `${targetBaseUrl}/Lab_Track/php/verify.php?token=${activeReport.token || "a3b8899c3a"}`
    : "";

  const qrCodeUrl = verificationLink
    ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verificationLink)}&color=0459a8`
    : "";

  return (
    <div id="medilab-system-root" className="min-h-screen bg-slate-900 text-slate-100 font-sans antialiased overflow-x-hidden flex flex-col">
      
      {/* SECURITY TERMINAL TOP BAR (NO-PRINT) */}
      <header className="no-print bg-slate-950 border-b border-slate-800 shrink-0 relative z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="bg-blue-600/20 text-blue-400 p-2 rounded-lg border border-blue-500/30">
              <Shield className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold tracking-widest text-emerald-400 uppercase">
                  MGQ Airport Gate Health Control
                </span>
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              </div>
              <h1 className="font-display text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                MEDILAB <span className="text-blue-400 font-medium">Verify Terminal</span>
              </h1>
            </div>
          </div>

          {/* Time & Counter Stats */}
          <div className="flex items-center gap-5 text-xs text-slate-400 font-mono">
            <div className="hidden md:block border-l border-slate-800 pl-4">
              <span className="text-slate-500">STATION:</span>{" "}
              <span className="text-slate-200">WABERI, MOGADISHU-SOMALIA</span>
            </div>
            <div className="hidden lg:block border-l border-slate-800 pl-4">
              <span className="text-slate-500">SYSTEM TIME:</span>{" "}
              <span className="text-blue-400">2026-05-27 23:22:11 UTC</span>
            </div>
            <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
              <span className="text-slate-500">TOTAL DIAL:</span>{" "}
              <span className="bg-blue-900/40 text-blue-300 px-1.5 py-0.5 rounded border border-blue-800">
                {verifiedCount}/{totalReportsCount} Verified
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* DASHBOARD GRID CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
        
        {/* LEFT PANEL: ADMINISTRATION & SEARCH (NO-PRINT) */}
        <section id="terminal-control-side" className="no-print lg:col-span-5 xl:col-span-4 flex flex-col gap-6">
          
          {/* SEARCH & QUICK VERIFY CARD */}
          <div className="bg-slate-950/40 backdrop-blur-md p-5 rounded-2xl border border-slate-800 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-300 tracking-wide uppercase flex items-center gap-1.5 font-display">
                <Search className="w-4 h-4 text-blue-400" /> Bukaanka Baar (Verify Passport)
              </h2>
              <button
                onClick={resetToFactoryDefault}
                className="text-[11px] text-slate-500 hover:text-red-400 hover:underline transition-colors flex items-center gap-1 font-mono"
                title="Reset local changes and restore original Ukrainian Helicopters report"
              >
                <RefreshCw className="w-2.5 h-2.5" /> Reload Reset
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Fadlan qor Magaca ama Baasaboorka..."
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 pl-10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500 transition-all font-sans"
              />
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-3 p-0.5 hover:bg-slate-800 rounded-full"
                >
                  <X className="w-3.5 h-3.5 text-slate-400" />
                </button>
              )}
            </div>

            {/* QUICK PASSENGER SELECTION LIST */}
            <div className="flex flex-col gap-2 max-h-[170px] overflow-y-auto pr-1">
              <span className="text-[11px] font-mono text-slate-500">CURRENT CERTIFIED CLEARANCES:</span>
              <div className="flex flex-col gap-1.5">
                {filteredReports.map((r) => {
                  const isCurReport = r.id === activeReport?.id;
                  const isVerified = verificationOverride[r.id] !== false && r.verified;
                  return (
                    <button
                      key={r.id}
                      onClick={() => handleSelectReport(r.id)}
                      className={`text-left text-xs p-2.5 rounded-lg border transition-all flex items-center justify-between ${
                        isCurReport
                          ? "bg-blue-950/60 border-blue-500 text-white shadow-md shadow-blue-500/10"
                          : "bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/60 text-slate-300"
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="font-semibold flex items-center gap-1 truncate text-slate-200">
                          {r.name}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span>ID: {r.id}</span>
                          <span>•</span>
                          <span>Passport: {r.passportNo}</span>
                        </div>
                      </div>
                      
                      <div className="shrink-0 flex items-center gap-1.5">
                        {isVerified ? (
                          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" title="Verified Authethic" />
                        ) : (
                          <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" title="Failed / Suspended" />
                        )}
                        <span className="text-[10px] text-slate-500 font-mono">#{r.id}</span>
                      </div>
                    </button>
                  );
                })}
                {filteredReports.length === 0 && (
                  <div className="text-center py-4 bg-slate-900/30 rounded-lg border border-dashed border-slate-800 text-slate-500 text-xs">
                    Natiijo lama helin (No match found)
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SCANNER REAL-TIME LINK GENERATOR */}
          <div className="bg-slate-950/40 backdrop-blur-md p-5 rounded-2xl border border-slate-800 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-300 tracking-wide uppercase flex items-center gap-1.5 font-display">
                <QrCode className="w-4.5 h-4.5 text-blue-400" /> QR Verification Engine
              </h2>
            </div>
            
            {/* Target Address Toggle */}
            <div className="flex border border-slate-800 rounded-xl bg-slate-950/60 p-1">
              <button
                type="button"
                onClick={() => setQrTargetEnv("production")}
                className={`flex-1 text-center py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  qrTargetEnv === "production"
                    ? "bg-blue-600 text-white font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Vercel Link
              </button>
              <button
                type="button"
                onClick={() => setQrTargetEnv("sandbox")}
                className={`flex-1 text-center py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  qrTargetEnv === "sandbox"
                    ? "bg-slate-800 text-white font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Sandbox Preview
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-normal">
              {qrTargetEnv === "production" 
                ? "Generates an official barcode redirecting smartphones to the Vercel production portal." 
                : "Generates a sandbox barcode for immediate testing on the local workspace inside the AI Studio preview."}
            </p>

            <div className="bg-white p-3.5 rounded-xl self-center shadow-lg border-2 border-slate-300 relative group transition-all duration-300 hover:scale-[1.02]">
              {activeReport ? (
                <>
                  <img
                    src={qrCodeUrl}
                    alt="Immigration QR code"
                    className="w-32 h-32 select-none"
                    referrerPolicy="no-referrer"
                  />
                  {/* Internal logo inside QR code simulation */}
                  <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 bg-white p-1 rounded-md border border-slate-200">
                    <span className="text-[10px] font-extrabold text-[#0459a8]">MD</span>
                  </div>
                </>
              ) : (
                <div className="w-32 h-32 flex items-center justify-center text-slate-900 font-mono text-xs">
                  Generating QR...
                </div>
              )}
            </div>

            <div className="bg-blue-950/35 border border-blue-900/50 p-3 rounded-xl text-xs text-blue-200">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-blue-300">Target Verification Link:</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(verificationLink);
                    alert("Link-ga waa la koobiyey! (Link Copied!)");
                  }}
                  className="text-[10px] bg-blue-900/50 text-blue-300 hover:bg-blue-800 px-1.5 py-0.5 rounded border border-blue-800 cursor-pointer"
                >
                  Copy Link
                </button>
              </div>
              <div className="font-mono text-[10px] text-emerald-400 break-all bg-slate-950/60 p-1.5 rounded border border-slate-800/80">
                {verificationLink}
              </div>
            </div>
          </div>

          {/* ACTION & INTEGRITY DEBUNG CONTROL */}
          <div className="bg-slate-950/40 backdrop-blur-md p-5 rounded-2xl border border-slate-800 flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-slate-300 tracking-wide uppercase flex items-center gap-1.5 font-display">
              <Shield className="w-4 h-4 text-emerald-400" /> Verification Testing Sandbox
            </h2>
            
            <div className="flex flex-col gap-3">
              {/* Toggle to mock fail verification */}
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">
                    Integrity System Status
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono ${
                    isCurrentlyVerified 
                      ? "bg-emerald-900/30 text-emerald-400 border border-emerald-800" 
                      : "bg-red-900/30 text-red-400 border border-red-800"
                  }`}>
                    {isCurrentlyVerified ? "LEGITIMATE" : "INVALID REPORT"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Simulate standard counterfeit report checks by flipping this security switch.
                </p>

                <div className="mt-2 flex items-center justify-between border-t border-slate-800/80 pt-2">
                  <span className="text-[11px] text-slate-300">Report Status</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isCurrentlyVerified}
                      onChange={(e) => {
                        if (activeReport) {
                          setVerificationOverride((prev) => ({
                            ...prev,
                            [activeReport.id]: e.target.checked
                          }));
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handlePrint}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Certificate
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> New Report
                </button>
              </div>
            </div>
          </div>

          {/* ADVISORY FOOTNOTE */}
          <div className="text-[11px] text-slate-500 leading-snug px-2 flex gap-2">
            <Info className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
            <div>
              Medilab security checkpoints are located next to Dahabshiil Bank in Mogadishu. For support contact <span className="text-slate-400">m.labsdiagnostic@gmail.com</span>
            </div>
          </div>
        </section>

        {/* RIGHT PANEL: LIVE REPORT VIEW RENDERER (RESPONSIVE VIEW) */}
        <section id="report-view-canvas" className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
          
          <div className="no-print hidden lg:flex items-center justify-between text-slate-400 text-xs px-2 select-none">
            <span className="flex items-center gap-1 font-mono">
              <Eye className="w-3.5 h-3.5 text-blue-500" /> LIVE CERTIFICATE STAGE
            </span>
            <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px]">
              A4 Border Safe Margin Scale
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-1 md:p-4 lg:p-6 transition-all shadow-xl shadow-slate-950/40 print:bg-white print:border-none print:shadow-none print:p-0">
            
            {/* STAGE CONTAINER WITH LIGHT BACKGROUND FOR AUTHENTIC LAB SHEET LOOK */}
            <div className="print-container bg-[#dfe1e6] p-2 sm:p-4 md:p-6 rounded-2xl text-slate-900 relative shadow-inner overflow-hidden print:bg-white print:p-0 print:text-black">
              
              {/* OVERLAY DIAGONAL STATS IF UNVERIFIED COUBNTERFEIT WARNING */}
              <AnimatePresence>
                {!isCurrentlyVerified && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center overflow-hidden"
                  >
                    {/* diagonal red banner watermark */}
                    <div className="absolute transform -rotate-25 bg-red-600/15 border-y-4 border-red-500/40 text-red-600/70 py-4 px-12 text-center select-none w-[120%] font-black tracking-widest text-[22px] md:text-[36px] uppercase">
                      INVALID DOCUMENT • DIGNIIN REPORT FAUX
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* CORE MEDICAL REPORT CONTAINER */}
              <div className="max-w-4xl mx-auto flex flex-col gap-4 bg-transparent">
                
                {/* 1. STATE EMBLEM & MEDICAL BRAND HEADER */}
                <div className="print-header bg-gradient-to-r from-[#eaf2fd] to-white rounded-xl py-4 px-4 sm:px-6 flex items-center justify-between gap-4 shadow-sm border border-slate-200/50 print:bg-white print:border-none print:shadow-none">
                  
                  {/* Left Clinic Logo Emblem */}
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-white rounded-full border border-blue-100 flex items-center justify-center shadow-sm relative shrink-0">
                      {/* Medilab stylized SVG cross and diagnostic lines */}
                      <svg viewBox="0 0 100 100" className="w-12 h-12">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#0459a8" strokeWidth="6" />
                        <rect x="42" y="25" width="16" height="50" rx="4" fill="#1b9bc5" />
                        <rect x="25" y="42" width="50" height="16" rx="4" fill="#3cb54a" />
                        <path d="M 45 45 L 55 45 L 55 55 L 45 55 Z" fill="white" />
                      </svg>
                    </div>
                    <span className="text-[8px] font-bold text-[#0459a8] mt-1 tracking-widest font-mono">EST. 2018</span>
                  </div>

                  {/* Header Center Title Details */}
                  <div className="text-center flex-1">
                    <h1 className="text-[#0459a8] font-semibold text-lg sm:text-2xl md:text-3xl font-display uppercase tracking-tight font-extrabold flex items-center justify-center gap-1.5 leading-none">
                      MEDILAB <span className="text-[#1b9bc5]">DIAGNOSTIC CENTER</span>
                    </h1>
                    <p className="text-slate-500 font-display font-medium text-xs sm:text-sm mt-1 tracking-wide">
                      Official Laboratory Verification Report
                    </p>

                    <div className="w-4/5 h-1 bg-[#1b9bc5] mx-auto mt-2.5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#0459a8] via-[#1b9bc5] to-[#3cb54a]" />
                    </div>

                    <div className="text-[10px] sm:text-xs text-slate-650 leading-relaxed max-w-lg mx-auto font-sans font-medium mt-2 text-[#445]">
                      <b className="text-slate-800">Address:</b> Aden Adde International Airport, Next To Dahabshiil Bank, Waberi, Mogadishu-Somalia<br />
                      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 mt-0.5 font-sans">
                        <span><b>Tel:</b> +252 613523011</span>
                        <span className="hidden sm:inline">•</span>
                        <span><b>Email:</b> m.labsdiagnostic@gmail.com</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Mirror Logo Emblem */}
                  <div className="hidden sm:flex flex-col items-center">
                    <div className="w-16 h-16 bg-white rounded-full border border-blue-100 flex items-center justify-center shadow-sm shrink-0">
                      <svg viewBox="0 0 100 100" className="w-12 h-12">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#0459a8" strokeWidth="6" />
                        <rect x="42" y="25" width="16" height="50" rx="4" fill="#1b9bc5" />
                        <rect x="25" y="42" width="50" height="16" rx="4" fill="#3cb54a" />
                        <path d="M 45 45 L 55 45 L 55 55 L 45 55 Z" fill="white" />
                      </svg>
                    </div>
                    <span className="text-[8px] font-bold text-[#1b9bc5] mt-1 tracking-widest font-mono font-bold">MOGADISHU</span>
                  </div>

                </div>

                {/* 2. DYNAMIC INTEGRITY ALERT SUCCESS / FAILED BANNER */}
                <div 
                  className={`mt-1 border-l-[6px] rounded-r-xl p-4 transition-all duration-300 shadow-md ${
                    isCurrentlyVerified
                      ? "bg-emerald-50 border-emerald-500 text-emerald-900"
                      : "bg-red-50 border-red-500 text-red-900"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 p-1 rounded-full ${isCurrentlyVerified ? "bg-emerald-100/80 text-emerald-600" : "bg-red-100/80 text-red-600"}`}>
                      {isCurrentlyVerified ? (
                        <ShieldCheck className="w-6 h-6 shrink-0" />
                      ) : (
                        <ShieldAlert className="w-6 h-6 shrink-0 animate-bounce" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-[#1c6c2b] text-[16px] md:text-xl flex items-center gap-1.5">
                        {isCurrentlyVerified 
                          ? "✅ Patient waa sax wuxuuna ka yimid Medilab Diagnostic System" 
                          : "❌ DIGNIIN: Lab Report-kan kama diiwaan gashan diiwaanka Medilab"}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-650 font-medium mt-1">
                        {isCurrentlyVerified 
                          ? "This patient clearance report is verified as authentic, matching centralized logs at Medilab Mogadishu." 
                          : "Authentication failure: The verification token or patient data does not match the central system."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. PATIENT BIO GRID CARD */}
                <div className="print-card bg-[#f7f7f7] rounded-xl border-l-[5px] border-[#3cb54a] p-5 sm:p-6 shadow-sm border border-slate-200/50 flex flex-col md:flex-row md:justify-between gap-6 print:bg-white">
                  
                  {/* Left bio fields block */}
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-y-3.5 gap-x-6 text-[#222]">
                    <div className="text-sm">
                      <span className="text-slate-500 text-xs font-semibold block uppercase tracking-wider">Patient Identification</span>
                      <span className="font-extrabold text-[15px] sm:text-base text-slate-900 font-display flex items-center gap-1 mt-0.5">
                        <User className="w-4 h-4 text-theme-dark/10 text-blue-500 shrink-0" /> {activeReport?.name || "UNKNOWN"}
                      </span>
                    </div>

                    <div className="text-sm">
                      <span className="text-slate-500 text-xs font-semibold block uppercase tracking-wider">Patient ID Number</span>
                      <span className="font-mono font-bold text-slate-800 text-[14px] mt-0.5 bg-slate-200/75 print:bg-transparent px-1.5 py-0.5 rounded inline-block">
                        {activeReport?.id || "N/A"}
                      </span>
                    </div>

                    <div className="text-sm">
                      <span className="text-slate-500 text-xs font-semibold block uppercase tracking-wider">Age & Gender</span>
                      <span className="font-bold text-slate-800 mt-0.5 block">
                        {activeReport?.age || "0"} Years old <span className="text-slate-400">|</span> {activeReport?.gender || "Other"}
                      </span>
                    </div>

                    <div className="text-sm">
                      <span className="text-slate-500 text-xs font-semibold block uppercase tracking-wider">Passport Number</span>
                      <span className="font-bold text-slate-800 tracking-wide font-mono mt-0.5 block uppercase">
                        {activeReport?.passportNo || "N/A"}
                      </span>
                    </div>

                    <div className="text-sm">
                      <span className="text-slate-500 text-xs font-semibold block uppercase tracking-wider">Employer / Company Name</span>
                      <span className="font-bold text-slate-800 tracking-wide mt-0.5 flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {activeReport?.company || "PRIVATE INDIVIDUAL"}
                      </span>
                    </div>

                    <div className="text-sm">
                      <span className="text-slate-500 text-xs font-semibold block uppercase tracking-wider">Telephone Line</span>
                      <span className="font-bold text-slate-800 mt-0.5 block font-mono">
                        {activeReport?.phone || "N/A"}
                      </span>
                    </div>

                    <div className="text-sm">
                      <span className="text-slate-500 text-xs font-semibold block uppercase tracking-wider">Certified Medical Practitioner</span>
                      <span className="font-bold text-slate-800 mt-0.5 flex items-center gap-1 capitalize">
                        <Stethoscope className="w-3.5 h-3.5 text-teal-500 shrink-0" /> {activeReport?.doctor || "N/A"}
                      </span>
                    </div>

                    <div className="text-sm">
                      <span className="text-slate-500 text-xs font-semibold block uppercase tracking-wider">Verification Date</span>
                      <span className="font-bold text-slate-800 mt-0.5 flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" /> {activeReport?.resultDate || "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Right stamp validation box */}
                  <div className="md:w-44 shrink-0 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-slate-200/80 pt-4 md:pt-0 md:pl-4">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-24 h-24 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center justify-center relative shadow-sm p-1">
                        {isCurrentlyVerified ? (
                          <>
                            {/* Medilab Diagnostic Seal SVG */}
                            <svg viewBox="0 0 100 100" className="w-full h-full opacity-85 rotate-12">
                              <circle cx="50" cy="50" r="42" fill="none" stroke="#0459a8" strokeWidth="2" strokeDasharray="3 3" />
                              <circle cx="50" cy="50" r="38" fill="none" stroke="#0459a8" strokeWidth="1" />
                              <path id="sealPath" d="M 22 50 A 28 28 0 1 1 78 50" fill="none" />
                              <text className="text-[7.5px] font-bold font-mono text-[#0459a8]" tracking-widest="2.5">
                                <textPath href="#sealPath" startOffset="10%">MEDILAB DIAGNOSTIC</textPath>
                              </text>
                              <circle cx="50" cy="50" r="22" fill="#eaf2fd/30" stroke="#3cb54a" strokeWidth="1.5" />
                              <text x="50" y="47" textAnchor="middle" className="text-[7px] font-bold font-mono text-[#0459a8]">VERIFIED</text>
                              <text x="50" y="56" textAnchor="middle" className="text-[8px] font-extrabold fill-[#3cb54a]">OK</text>
                              <text x="50" y="65" textAnchor="middle" className="text-[5.5px] fill-slate-500 font-mono">SEAL</text>
                            </svg>
                          </>
                        ) : (
                          <div className="flex flex-col items-center text-red-600">
                            <ShieldAlert className="w-10 h-10 animate-ping" />
                            <span className="text-[10px] uppercase font-bold tracking-tight mt-1 font-mono">BLOCKED</span>
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-2 block font-semibold">
                        {isCurrentlyVerified ? "Official Seal" : "Seal Revoked"}
                      </span>
                    </div>
                  </div>

                </div>

                {/* 4. CLINICAL IMMUNOLOGY LAB SHEET */}
                <div className="rounded-xl overflow-hidden shadow-sm border border-slate-200/50">
                  
                  {/* Immunology Heading Ribbon */}
                  <div className="bg-[#0075f2] text-white px-4 py-3 font-semibold font-display tracking-wide text-sm sm:text-base flex items-center justify-between">
                    <span>Clinical Immunology</span>
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-mono">
                      Blood Panel Clearance
                    </span>
                  </div>

                  {/* Immunology Results Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse bg-[#f7f7f7] text-left text-sm print:bg-white m-0 rounded-none shadow-none">
                      <thead>
                        <tr className="bg-[#eceff1] border-b border-slate-200">
                          <th className="py-3.5 px-4 font-semibold text-slate-700 font-display border border-slate-200 text-xs uppercase tracking-wider">Test / Diagnostic Assay</th>
                          <th className="py-3.5 px-4 font-semibold text-slate-700 font-display border border-slate-200 text-xs uppercase tracking-wider">Measured Result</th>
                          <th className="py-3.5 px-4 font-semibold text-slate-700 font-display border border-slate-200 text-xs uppercase tracking-wider">Unit</th>
                          <th className="py-3.5 px-4 font-semibold text-slate-700 font-display border border-slate-200 text-xs uppercase tracking-wider">Clinical Remark</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {activeReport?.tests.map((test, index) => {
                          const isNegative = test.result === "Negative" || test.result === "Non-Reactive";
                          return (
                            <tr key={index} className="hover:bg-slate-50/50 transition-colors bg-white print:hover:bg-white">
                              {/* Test Name */}
                              <td className="py-3.5 px-4 border border-slate-200 font-medium text-slate-900">
                                {test.name}
                              </td>
                              {/* Test Result Indicator */}
                              <td className="py-3.5 px-4 border border-slate-200 font-bold">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ${
                                  isNegative
                                    ? "bg-emerald-50 text-emerald-800 font-bold border border-emerald-200"
                                    : "bg-red-50 text-red-800 font-bold border border-red-200 animate-pulse"
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${isNegative ? "bg-emerald-500" : "bg-red-600"}`}></span>
                                  {isCurrentlyVerified ? test.result : "REJECTED"}
                                </span>
                              </td>
                              {/* Test Unit */}
                              <td className="py-2.5 px-4 border border-slate-200 font-mono text-slate-500 text-xs capitalize">
                                {test.unit}
                              </td>
                              {/* Remark */}
                              <td className="py-2.5 px-4 border border-slate-200 text-slate-500 italic text-xs">
                                {isCurrentlyVerified ? (
                                  test.remark || <span className="text-slate-400 font-normal">Normal immunological bounds</span>
                                ) : (
                                  <span className="text-red-500 font-bold uppercase tracking-wider">Invalid Checksum</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 5. METRIC STAMP BLOCK & SIGNATORY LINES */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-2 pt-4 border-t border-slate-300 border-dashed text-slate-700">
                  
                  {/* Terms & Conditions advisory disclaimer block */}
                  <div className="text-[11px] text-slate-550 leading-relaxed font-sans mt-1">
                    <span className="font-bold text-slate-800 uppercase tracking-wide block mb-1">Authenticity & Legal Notice:</span>
                    This report verifies biological immunology clearance for transit validation. Altering or printing simulated or fake certificate letters is subject to legal penalty under Somalian Federal Aviation and Port regulations. Medilab database retains absolute digital logs for safety reference.
                  </div>

                  {/* Signatory authorized signature line */}
                  <div className="flex flex-col items-end text-right justify-end pr-2">
                    <div className="flex flex-col items-center">
                      <div className="h-10 relative flex items-center justify-center translate-y-2 select-none">
                        {/* doctor's simulated elegant cursive signature path */}
                        {isCurrentlyVerified ? (
                          <svg viewBox="0 0 150 40" className="w-36 h-10 opacity-80">
                            <path
                              d="M10,25 Q30,15 45,20 T70,18 T95,25 Q115,10 130,15 T145,20"
                              fill="none"
                              stroke="#002d62"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            />
                            <circle cx="45" cy="20" r="1.5" fill="#3cb54a" />
                          </svg>
                        ) : (
                          <span className="text-red-500 font-bold uppercase tracking-widest text-[11px] border border-red-500 p-1 bg-red-50 rounded">
                            BLOCKED BY CONTROL
                          </span>
                        )}
                      </div>
                      <div className="w-48 border-t border-slate-400 my-1"></div>
                      <span className="text-xs font-bold text-slate-900 block tracking-tight">Dr. Sadam Adan Ahmed</span>
                      <span className="text-[10px] text-slate-500 uppercase font-mono tracking-widest block font-medium">
                        Head of Immunology Research
                      </span>
                    </div>
                  </div>

                </div>

                {/* 6. IMMIGRATION CONTROL FOOTER LOGS */}
                <footer className="footer-line mt-6 border-t-[3px] border-[#1b84d6] pt-4 text-center text-slate-500 text-xs leading-relaxed">
                  © 2026 Medilab Diagnostic Center — All rights reserved.<br />
                  <span className="font-display font-semibold text-slate-650 tracking-wide mt-1 block">
                    Designed & Verified by Daryeel Tech IT Team
                  </span>
                </footer>

              </div>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER ADVISORY BANNER - NO-PRINT */}
      <footer className="no-print mt-auto bg-slate-950 border-t border-slate-800 py-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <p>© 2026 Medilab Diagnostic Center. Designed & Verified by Daryeel Tech IT Team.</p>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
            <span className="font-mono text-[11px] text-slate-500">
              Cloud Service Connected to Mogadishu Port Health Network
            </span>
          </div>
        </div>
      </footer>

      {/* CREATE NEW REPORT SLIDE-OVER MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto"
            >
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-white text-base">
                      New Clearance Registration
                    </h3>
                    <p className="text-xs text-slate-400">Add medical logs onto local memory database</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateReportSubmit} className="flex flex-col gap-4 text-sm">
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Patient ID (Lambarka)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2042"
                      value={newPatient.id}
                      onChange={(e) => setNewPatient((prev) => ({ ...prev, id: e.target.value.trim() }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white placeholder:text-slate-650 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Passport No
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. FS879183"
                      value={newPatient.passportNo}
                      onChange={(e) => setNewPatient((prev) => ({ ...prev, passportNo: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white placeholder:text-slate-650 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Full Patient Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. OLEKSANDR PETRENKO"
                    value={newPatient.name}
                    onChange={(e) => setNewPatient((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white placeholder:text-slate-650 focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Age
                    </label>
                    <input
                      type="number"
                      value={newPatient.age}
                      onChange={(e) => setNewPatient((prev) => ({ ...prev, age: Number(e.target.value) }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Gender
                    </label>
                    <select
                      value={newPatient.gender}
                      onChange={(e) => setNewPatient((prev) => ({ ...prev, gender: e.target.value as any }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Company / Organization
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. TURKISH AIRLINES"
                      value={newPatient.company}
                      onChange={(e) => setNewPatient((prev) => ({ ...prev, company: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white placeholder:text-slate-650 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 839180"
                      value={newPatient.phone}
                      onChange={(e) => setNewPatient((prev) => ({ ...prev, phone: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white placeholder:text-slate-650 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Doctor Name
                    </label>
                    <input
                      type="text"
                      value={newPatient.doctor}
                      onChange={(e) => setNewPatient((prev) => ({ ...prev, doctor: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Result Release Date
                    </label>
                    <input
                      type="date"
                      value={newPatient.resultDate}
                      onChange={(e) => setNewPatient((prev) => ({ ...prev, resultDate: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                </div>

                {/* Immunology Panel Results Selection */}
                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 mt-2">
                  <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-blue-400" /> Bio-Assay Results Matrix
                  </span>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                        HCV Status
                      </label>
                      <select
                        value={newPatient.hcv}
                        onChange={(e) => setNewPatient((prev) => ({ ...prev, hcv: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                      >
                        <option value="Negative">Negative</option>
                        <option value="Positive">Positive</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                        Hep B Surface Ag
                      </label>
                      <select
                        value={newPatient.hepB}
                        onChange={(e) => setNewPatient((prev) => ({ ...prev, hepB: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                      >
                        <option value="Negative">Negative</option>
                        <option value="Positive">Positive</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                        HIV Test Status
                      </label>
                      <select
                        value={newPatient.hiv}
                        onChange={(e) => setNewPatient((prev) => ({ ...prev, hiv: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                      >
                        <option value="Negative">Negative</option>
                        <option value="Positive">Positive</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                        TPHA Syphilis
                      </label>
                      <select
                        value={newPatient.tpha}
                        onChange={(e) => setNewPatient((prev) => ({ ...prev, tpha: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                      >
                        <option value="Negative">Negative</option>
                        <option value="Positive">Positive</option>
                        <option value="Non-Reactive">Non-Reactive</option>
                        <option value="Reactive">Reactive</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800/80 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Ka laabo (Cancel)
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-2 rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-500/10 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" /> Diiwaangeli (Register)
                  </button>
                </div>

              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
