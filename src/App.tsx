import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
// @ts-ignore
import html2pdf from "html2pdf.js";
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
  Sparkles,
  FileDown
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
  const [customBaseUrl, setCustomBaseUrl] = useState("https://mymedilabscom.vercel.app");

  // Simulated Verification Authenticity Override (to show unverified states)
  const [verificationOverride, setVerificationOverride] = useState<Record<string, boolean>>({});
  const [isExporting, setIsExporting] = useState(false);

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

  // Dynamic document title update during printing to suggest correct patient name as the PDF filename
  useEffect(() => {
    const handleBeforePrint = () => {
      if (activeReport) {
        document.title = `${activeReport.name.replace(/\s+/g, "_")}_Lab_Report`;
      }
    };
    const handleAfterPrint = () => {
      document.title = "Medilab Diagnostic Center";
    };
    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);
    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [activeReport]);

  const handlePrint = () => {
    const originalTitle = document.title;
    if (activeReport) {
      document.title = `${activeReport.name.replace(/\s+/g, "_")}_Lab_Report`;
    }
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById("laboratory-report-sheet");
    if (!element || !activeReport) return;

    setIsExporting(true);

    const filename = `${activeReport.name.trim().replace(/\s+/g, "_")}_Lab_Report.pdf`;

    const opt = {
      margin:       10,
      filename:     filename,
      image:        { type: "jpeg", quality: 0.98 },
      html2canvas:  { 
        scale: 2, 
        useCORS: true, 
        logging: false,
        letterRendering: true,
        allowTaint: true
      },
      jsPDF:        { unit: "mm", format: "a4", orientation: "portrait" }
    };

    const exporter = (html2pdf as any).default || html2pdf;

    exporter()
      .set(opt)
      .from(element)
      .save()
      .then(() => {
        setIsExporting(false);
      })
      .catch((error: any) => {
        console.error("PDF generation failed:", error);
        setIsExporting(false);
      });
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

  // Helper to extract test results or default to Negative as required
  const getTestResultVal = (report: PatientReport, nameKey: string): string => {
    if (!report || !report.tests) return "Negative";
    const found = report.tests.find(t => 
      t.name.toLowerCase().includes(nameKey.toLowerCase())
    );
    return found ? found.result : "Negative";
  };

  // Generate dynamic QR code URL based on production host URL in Serverless HTML mode
  const hcvVal = activeReport ? getTestResultVal(activeReport, "HCV") : "Negative";
  const hepBVal = activeReport ? getTestResultVal(activeReport, "Hepatitis B") : "Negative";
  const hivVal = activeReport ? getTestResultVal(activeReport, "HIV") : "Negative";
  const tphaVal = activeReport ? getTestResultVal(activeReport, "TPHA") : "Negative";

  const verificationLink = activeReport
    ? `${customBaseUrl}/verify.html?id=${activeReport.id}&name=${encodeURIComponent(activeReport.name)}&age=${activeReport.age}&gender=${activeReport.gender}&company=${encodeURIComponent(activeReport.company)}&passport=${encodeURIComponent(activeReport.passportNo)}&phone=${activeReport.phone || ""}&doctor=${encodeURIComponent(activeReport.doctor || "sadam adan Ahmed")}&date=${activeReport.resultDate}&hcv=${encodeURIComponent(hcvVal)}&hepb=${encodeURIComponent(hepBVal)}&hiv=${encodeURIComponent(hivVal)}&tpha=${encodeURIComponent(tphaVal)}`
    : "";

  const qrCodeUrl = verificationLink
    ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verificationLink)}&color=000000`
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
              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-widest font-mono font-bold">
                Serverless HTML
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-normal">
              Generates high-resolution official QR codes routing straight to your serverless verification system. It bypasses PHP processing for maximum reliability on Vercel.
            </p>

            {/* Custom Settings inputs for custom domain */}
            <div className="flex flex-col gap-2 mt-1 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/80">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono text-slate-500 uppercase">Production Host URL:</span>
                  <span className="text-[9px] text-emerald-400 font-mono font-bold">verify.html is automatic</span>
                </div>
                <input
                  type="text"
                  value={customBaseUrl}
                  onChange={(e) => setCustomBaseUrl(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-200 text-[11px] font-mono px-2 py-1 rounded-lg focus:outline-none focus:border-blue-500 w-full"
                  placeholder="URL of your production portal"
                />
              </div>
            </div>

            <a
              href={verificationLink}
              target="_blank"
              rel="noopener noreferrer"
              title="Click to open verification link"
              className="bg-white p-3.5 rounded-xl self-center shadow-lg border-2 border-slate-300 relative group transition-all duration-300 hover:scale-[1.02] cursor-pointer block"
            >
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
            </a>

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
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleDownloadPDF}
                    disabled={isExporting}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-semibold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-rose-600/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Export laboratory report as high-fidelity PDF format"
                  >
                    {isExporting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Exporting...
                      </>
                    ) : (
                      <>
                        <FileDown className="w-3.5 h-3.5" /> Export PDF
                      </>
                    )}
                  </button>
                  <button
                    onClick={handlePrint}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                    title="Print report using standard print layouts"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print Report
                  </button>
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Create New Report
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
              <div className="medilab-sheet mx-auto" style={{ maxWidth: "808px" }}>
                <style dangerouslySetInnerHTML={{__html: `
                  .medilab-sheet .container-sheet {
                    max-width: 800px;
                    margin: auto;
                    border: 1px solid #d1d5db;
                    padding: 35px 35px;
                    background: #fff;
                    color: #000;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    text-align: left;
                    box-sizing: border-box;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
                  }
                  
                  /* Header styling matching the screenshot */
                  .medilab-sheet .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 2px solid #e2e8f0;
                    padding-bottom: 15px;
                    margin-bottom: 22px;
                  }
                  .medilab-sheet .logo-box {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                  }
                  .medilab-sheet .logo-container {
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 6px;
                    background: #f8fafc;
                    width: 72px;
                    height: 72px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                  }
                  .medilab-sheet .logo {
                    max-width: 100%;
                    max-height: 100%;
                    object-fit: contain;
                  }
                  .medilab-sheet .lab-name {
                    font-weight: 800;
                    font-size: 21px;
                    color: #1a4cd2;
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                    margin-bottom: 3px;
                  }
                  .medilab-sheet .lab-address,
                  .medilab-sheet .lab-tel {
                    font-size: 11.5px;
                    color: #1e293b;
                    font-weight: 500;
                    line-height: 1.4;
                  }
                  
                  /* Right side Meta Info styling */
                  .medilab-sheet .meta-info {
                    text-align: right;
                    font-size: 12.5px;
                    line-height: 1.6;
                    color: #1e293b;
                  }
                  .medilab-sheet .meta-label {
                    font-weight: 700;
                    color: #0f172a;
                  }
                  .medilab-sheet .meta-value {
                    font-weight: 400;
                    color: #1e293b;
                  }

                  /* Information Boxes side by side */
                  .medilab-sheet .info-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                    margin-bottom: 25px;
                  }
                  .medilab-sheet .box {
                    border: 1px solid #e2e8f0;
                    padding: 16px 20px;
                    border-radius: 12px;
                    background: #fff;
                  }
                  .medilab-sheet .box h3 {
                    font-size: 12.5px;
                    color: #155a79;
                    margin: 0 0 12px 0;
                    font-weight: 700;
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                  }
                  .medilab-sheet .row {
                    display: flex;
                    font-size: 12.5px;
                    margin-bottom: 6px;
                    line-height: 1.4;
                  }
                  .medilab-sheet .row:last-child {
                    margin-bottom: 0;
                  }
                  .medilab-sheet .label {
                    width: 130px;
                    color: #4b5563;
                    font-weight: 500;
                    flex-shrink: 0;
                  }
                  .medilab-sheet .value {
                    font-weight: 700;
                    color: #000000;
                  }

                  /* Test Results Title and Table */
                  .medilab-sheet .section-title {
                    font-size: 13px;
                    color: #155a79;
                    font-weight: 700;
                    letter-spacing: 0.5px;
                    margin: 0 0 10px 0;
                    text-align: left;
                    text-transform: uppercase;
                  }
                  .medilab-sheet .results-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 25px;
                  }
                  .medilab-sheet .results-table th {
                    text-align: left;
                    border-bottom: 1.5px solid #cbd5e1;
                    padding: 8px;
                    font-size: 12.5px;
                    color: #155a79;
                    font-weight: 600;
                  }
                  .medilab-sheet .results-table td {
                    padding: 9px 8px;
                    font-size: 12.5px;
                    border-bottom: 1px solid #f1f5f9;
                    color: #000000;
                  }
                  .medilab-sheet .results-table tr.category td {
                    font-weight: 700;
                    color: #155a79 !important;
                    font-size: 13px;
                    padding: 14px 8px 6px 8px;
                    border-bottom: none !important;
                  }

                  /* Signatures matching referenced layout (Stamp & Signature side by side on left) */
                  .medilab-sheet .sig-section {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 25px;
                    padding-top: 20px;
                    border-top: 1.5px dashed #cbd5e1;
                  }
                  .medilab-sheet .sig-box {
                    font-size: 12.5px;
                    line-height: 1.6;
                    color: #374151;
                    text-align: left;
                  }

                  /* Footer & QR */
                  .medilab-sheet .footer {
                    margin-top: 25px;
                    border-top: 1.5px solid #e2e8f0;
                    padding-top: 12px;
                    font-size: 11px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    color: #4b5563;
                  }
                  .medilab-sheet .qr-section {
                    text-align: center;
                    margin-top: 25px;
                    color: #000;
                  }

                  /* Media print query for high contrast, absolute high fidelity, and A4 precision */
                  @media print {
                    @page {
                      size: A4 portrait;
                      margin: 10mm 12mm !important;
                    }
                    * {
                      -webkit-print-color-adjust: exact !important;
                      print-color-adjust: exact !important;
                    }
                    body {
                      background: #fff !important;
                      color: #000000 !important;
                    }
                    .medilab-sheet .container-sheet {
                      width: 100% !important;
                      max-width: 100% !important;
                      min-height: auto !important;
                      padding: 35px 35px !important;
                      margin: 0 auto !important;
                      border: none !important;
                      box-shadow: none !important;
                      background: #fff !important;
                      color: #000000 !important;
                      box-sizing: border-box !important;
                      page-break-inside: avoid !important;
                      break-inside: avoid !important;
                    }
                    .medilab-sheet .header {
                      border-bottom: 2px solid #e2e8f0 !important;
                    }
                    .medilab-sheet .label {
                      color: #4b5563 !important;
                      font-weight: 500 !important;
                    }
                    .medilab-sheet .value {
                      color: #000000 !important;
                      font-weight: 700 !important;
                    }
                    .medilab-sheet .box {
                      border: 1px solid #e2e8f0 !important;
                      background: #fff !important;
                      padding: 16px 20px !important;
                      border-radius: 12px !important;
                    }
                    .medilab-sheet .box h3 {
                      color: #155a79 !important;
                      font-weight: 700 !important;
                      border-bottom: none !important;
                    }
                    .medilab-sheet .section-title {
                      color: #155a79 !important;
                      font-weight: 700 !important;
                    }
                    .medilab-sheet .results-table {
                      margin-bottom: 25px !important;
                    }
                    .medilab-sheet .results-table th {
                      color: #155a79 !important;
                      border-bottom: 1.5px solid #cbd5e1 !important;
                      font-weight: 700 !important;
                    }
                    .medilab-sheet .results-table td {
                      border-bottom: 1px solid #f1f5f9 !important;
                      color: #000000 !important;
                      font-weight: 500 !important;
                    }
                    .medilab-sheet .results-table tr.category td {
                      color: #155a79 !important;
                      font-weight: 700 !important;
                    }
                    .medilab-sheet .sig-section {
                      margin-top: 25px !important;
                      padding-top: 20px !important;
                      border-top: 1.5px dashed #cbd5e1 !important;
                    }
                    .medilab-sheet .sig-box {
                      color: #374151 !important;
                    }
                    .medilab-sheet .footer {
                      margin-top: 25px !important;
                      padding-top: 12px !important;
                      border-top: 1.5px solid #e2e8f0 !important;
                      color: #4b5563 !important;
                    }
                    .medilab-sheet .qr-section {
                      margin-top: 25px !important;
                    }
                    .medilab-sheet .qr-section img {
                      width: 80px !important;
                      height: 80px !important;
                    }
                  }
                `}} />

                <div id="laboratory-report-sheet" className="container-sheet relative bg-white">
                  
                  {/* OVERLAY DIAGONAL STATE IF UNVERIFIED COUBNTERFEIT WARNING */}
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

                  <div className="header">
                    <div className="logo-box">
                      <div className="logo-container">
                        <img 
                          src="https://i.postimg.cc/SxkDdY6z/Logo.png" 
                          alt="MEDILAB DIEGNOSTIC Logo" 
                          className="logo"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <div className="lab-name">MEDILAB DIEGNOSTIC</div>
                        <div className="lab-address">Address: AdenAdde InternationalAirport,NextTo Dahabshiil Bank, Waberi, Mogadishu-Somalia</div>
                        <div className="lab-tel">Tel: +252 613523011 • Email: m.labsdiagnostic@gmail.com</div>
                      </div>
                    </div>
                    <div className="meta-info">
                      <div><span className="meta-label">Boono #:</span> <span className="meta-value">{activeReport?.id || "2026"}</span></div>
                      <div><span className="meta-label">Printed:</span> <span className="meta-value">{activeReport?.resultDate || "24 May 2026"}</span></div>
                      <div><span className="meta-label">Printed By:</span> <span className="meta-value">{activeReport?.doctor || "sadam adan Ahmed"}</span></div>
                    </div>
                  </div>

                  {/* DYNAMIC INTEGRITY ALERT WARNING */}
                  {!isCurrentlyVerified && (
                    <div style={{ marginBottom: "15px", padding: "10px", background: "#fdf2f2", borderLeft: "4px solid #f05252", borderRadius: "4px", color: "#9b1c1c", fontSize: "12px", textAlign: "left" }}>
                      <strong style={{ display: "block", textTransform: "uppercase", marginBottom: "2px" }}>⚠️ INVALID DOCUMENT / SYSTEM COUBNTERFEIT WARNING</strong>
                      This report has been marked as suspended or simulated and does not match central health registry logs.
                    </div>
                  )}

                  <div className="info-grid">
                    <div className="box">
                      <h3>PATIENT INFORMATION</h3>
                      <div className="row">
                        <div className="label">Patient Name</div>
                        <div className="value">{activeReport?.name || "MYKOLA VORONA"}</div>
                      </div>
                      <div className="row">
                        <div className="label">Patient ID</div>
                        <div className="value">{activeReport?.id || "1876"}</div>
                      </div>
                      <div className="row">
                        <div className="label">Age / Gender</div>
                        <div className="value">{activeReport?.age || "44"} / {activeReport?.gender || "Male"}</div>
                      </div>
                      <div className="row">
                        <div className="label">Phone</div>
                        <div className="value">{activeReport?.phone || "839180"}</div>
                      </div>
                      <div className="row">
                        <div className="label">Passport NO</div>
                        <div className="value">{activeReport?.passportNo || "FS879183"}</div>
                      </div>
                    </div>
                    <div className="box">
                      <h3>LAB ORDER DETAILS</h3>
                      <div className="row">
                        <div className="label">Compony</div>
                        <div className="value">{activeReport?.company || "UKRANIAN HELICOPTERS"}</div>
                      </div>
                      <div className="row">
                        <div className="label">Sample Type</div>
                        <div className="value">Blood</div>
                      </div>
                      <div className="row">
                        <div className="label">Collected By</div>
                        <div className="value">Medilab</div>
                      </div>
                      <div className="row">
                        <div className="label">result time</div>
                        <div className="value">{activeReport?.resultDate || "2026-05-24"}</div>
                      </div>
                      <div className="row">
                        <div className="label">Status</div>
                        <div className="value" style={{ color: "#000000" }}>Final</div>
                      </div>
                    </div>
                  </div>

                  <div className="section-title">TEST RESULTS</div>
                  <table className="results-table">
                    <thead>
                      <tr>
                        <th>Test Name</th>
                        <th>Result</th>
                        <th>Unit</th>
                        <th>Reference Range</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="category">
                        <td colSpan={5}>Immunology</td>
                      </tr>
                      {activeReport?.tests.map((test, idx) => {
                        const isNegative = test.result === "Negative" || test.result === "Non-Reactive";
                        return (
                          <tr key={idx}>
                            <td style={{ fontWeight: "600" }}>{test.name}</td>
                            <td style={{ fontWeight: "700" }}>
                              {isCurrentlyVerified ? test.result : "REJECTED"}
                            </td>
                            <td>{test.unit}</td>
                            <td>Negative</td>
                            <td>
                              {isCurrentlyVerified ? (
                                test.remark || ""
                              ) : (
                                <span style={{ color: "#e03131", fontWeight: "bold", textTransform: "uppercase", fontSize: "11px" }}>Invalid Checksum</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  <div className="sig-section">
                    {/* First column: Name & Signature */}
                    <div className="sig-box" style={{ flex: "1" }}>
                      <div>
                        Medilab Diegnostic<br />
                        Name & Signature
                      </div>
                      {isCurrentlyVerified && (
                        <div style={{ display: "flex", alignItems: "center", marginTop: "15px" }}>
                          <img 
                            src="https://i.postimg.cc/44vc5LBv/Signature.png" 
                            alt="Signature" 
                            style={{ height: "115px", width: "auto", mixBlendMode: "multiply", display: "block" }} 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                    </div>

                    {/* Second column: Doctor Authorization with Stamp */}
                    <div className="sig-box" style={{ flex: "1", paddingLeft: "80px" }}>
                      <div>
                        Authorized By<br />
                        {activeReport?.doctor || "sadam adan Ahmed"}
                      </div>
                    </div>
                  </div>

                  <div className="footer">
                    <div>Notes: Results are for Medilab Diegnostic.</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ 
                        border: "1.2px dashed #000", 
                        padding: "3px 5px", 
                        fontSize: "9px", 
                        fontWeight: "900", 
                        borderRadius: "5px", 
                        lineHeight: "1", 
                        background: "#fff", 
                        color: "#000",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        letterSpacing: "0.5px"
                      }}>DT</span> Powered & Designed by <strong>Mogadisho tech</strong>
                    </div>
                  </div>

                  <div className="qr-section">
                    <div style={{ background: "#fff", width: "80px", height: "80px", margin: "auto", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #eee", borderRadius: "4px" }}>
                      {activeReport ? (
                        <a href={verificationLink} target="_blank" rel="noopener noreferrer" style={{ display: "block" }}>
                          <img
                            src={qrCodeUrl}
                            alt="Verification QR"
                            className="w-20 h-20 select-none cursor-pointer"
                            style={{ width: "80px", height: "80px" }}
                            referrerPolicy="no-referrer"
                          />
                        </a>
                      ) : (
                        <div style={{ background: "#eee", width: "80px", height: "80px" }}>[QR]</div>
                      )}
                    </div>
                    <div style={{ fontSize: "10px", marginTop: "6px" }}>Scan to Verify Result</div>
                  </div>

                </div>
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
