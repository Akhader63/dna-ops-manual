import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Download, Printer, Mail, ChevronDown, FileText, Layers,
  GitPullRequest, ShieldCheck, User, Clock, ArrowRight,
  CheckCircle2, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table';

/* ═══════════════════════════════════════════════
   Constants & Animation
   ═══════════════════════════════════════════════ */
const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

const fadeInUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.8, ease } },
};

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

/* ═══════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════ */
const CLIENT = 'No Client Selected';
const PREPARED = 'Solution ERP';
const VERSION = '2.1';
const DATE = 'December 15, 2024';

const EXEC_SUM = 'No shared manual data is available yet.';

/* ═══════════════════════════════════════════════
   Use Case Data (shared constants)
   ═══════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════
   Module Data
   ═══════════════════════════════════════════════ */
const MODULES: any[] = [];

/* ═══════════════════════════════════════════════
   Roles Data
   ═══════════════════════════════════════════════ */
const ROLES: any[] = [];

/* ═══════════════════════════════════════════════
   Approval Workflows Data
   ═══════════════════════════════════════════════ */
const APPROVALS: any[] = [];

/* ═══════════════════════════════════════════════
   Table of Contents Items
   ═══════════════════════════════════════════════ */
const TOC_ITEMS = [
  { id:'cover',label:'Cover',num:''},
  { id:'toc-section',label:'Table of Contents',num:''},
  { id:'exec-summary',label:'Executive Summary',num:'01'},
  { id:'mod-1',label:'Financial Management',num:'02'},
  { id:'mod-2',label:'Inventory & Warehouse',num:'03'},
  { id:'mod-3',label:'Purchase & Procurement',num:'04'},
  { id:'mod-4',label:'Sales & CRM',num:'05'},
  { id:'mod-5',label:'HR & Payroll',num:'06'},
  { id:'mod-6',label:'Manufacturing',num:'07'},
  { id:'approval-workflows',label:'Approval Workflows',num:'08'},
  { id:'role-definitions',label:'Role Definitions',num:'09'},
];

/* ═══════════════════════════════════════════════
   MAIN COMPONENT — SharedManual
   Client-facing read-only manual accessed via
   secure link with cover page and scroll-spy.
   ═══════════════════════════════════════════════ */
export default function SharedManual() {
  const { token } = useParams<{ token: string }>();

  /* ── State ── */
  const [activeSection, setActiveSection] = useState('cover');
  const [navVisible, setNavVisible] = useState(false);

  /* ── Refs ── */
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  /* ── Scroll spy via IntersectionObserver ── */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
            setNavVisible(entry.target.id !== 'cover');
          }
        });
      },
      { rootMargin: '-10% 0px -75% 0px', threshold: 0 }
    );
    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  /* ── Smooth scroll handler ── */
  const scrollTo = useCallback((id: string) => {
    const el = sectionRefs.current[id];
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - (id === 'cover' ? 0 : 56);
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }, []);

  /* ── Print handler ── */
  const handlePrint = () => window.print();

  /* ── Stats ── */
  const modCount = MODULES.length;
  const trxCount = MODULES.reduce((s, m) => s + m.tx.length, 0);
  const ucCount = MODULES.reduce((s, m) => s + m.tx.reduce((ts: any, t: any) => ts + t.ucs.length, 0), 0);

  /* ═══════ RENDER ═══════ */
  return (
    <div className="min-h-screen bg-white print:bg-white">
      {/* ═══════════════════════════════════════════
          Top Navigation Bar (fixed, 56px)
          ═══════════════════════════════════════════ */}
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 h-[56px] bg-white/90 backdrop-blur-md border-b border-dna-mercury',
          'flex items-center justify-between px-6 transition-all duration-300 print:hidden'
        )}
        style={{
          opacity: navVisible ? 1 : 0,
          transform: navVisible ? 'translateY(0)' : 'translateY(-100%)',
          pointerEvents: navVisible ? 'auto' : 'none',
        }}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <span className="text-base font-bold text-dna-pomegranate shrink-0">
            DNA
          </span>
          <span className="text-base font-bold text-black shrink-0">
            ERP
          </span>
          <span className="text-dna-silver">|</span>
          <span className="text-sm text-dna-tundora truncate">
            {CLIENT} — Operational Manual
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="text-dna-tundora"
            onClick={handlePrint}
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Print
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-dna-tundora"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Download PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-dna-mercury text-dna-tundora"
          >
            <Mail className="w-4 h-4 mr-1.5" />
            Contact Consultant
          </Button>
        </div>
      </header>

      {/* ═══════════════════════════════════════════
          Cover Page (full viewport)
          ═══════════════════════════════════════════ */}
      <section
        id="cover"
        ref={(el) => {
          sectionRefs.current['cover'] = el;
        }}
        className="relative min-h-screen bg-black flex items-center justify-center overflow-hidden print:min-h-auto print:py-16"
      >
        {/* Decorative orange glow */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full pointer-events-none print:hidden"
          style={{
            background:
              'radial-gradient(circle, rgba(243,53,12,0.25) 0%, transparent 70%)',
            top: '10%',
            right: '15%',
          }}
        />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="relative z-10 text-center px-6 max-w-3xl"
        >
          <motion.p
            variants={fadeInUp}
            className="text-[13px] font-medium text-dna-pomegranate uppercase tracking-[0.25em] mb-6"
          >
            Operational Manual
          </motion.p>

          <motion.h1
            variants={fadeInUp}
            className="text-[60px] font-bold text-white leading-tight mb-4"
          >
            {CLIENT}
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-xl font-normal text-white/70 mb-8"
          >
            Powered by DNA ERP
          </motion.p>

          <motion.div
            variants={fadeIn}
            className="w-[60px] h-[2px] bg-dna-pomegranate mx-auto mb-8"
          />

          <motion.div
            variants={fadeInUp}
            className="space-y-2 text-sm text-white/60"
          >
            <p>Prepared by {PREPARED}</p>
            <p>
              {DATE} &middot; Version {VERSION}
            </p>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 print:hidden cursor-pointer"
          onClick={() => scrollTo('toc-section')}
        >
          <span className="text-xs text-white/50 uppercase tracking-widest">
            Scroll
          </span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          >
            <ChevronDown className="w-5 h-5 text-white/50" />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════
          Table of Contents
          ═══════════════════════════════════════════ */}
      <section
        id="toc-section"
        ref={(el) => {
          sectionRefs.current['toc-section'] = el;
        }}
        className="bg-white py-20 px-10 print:py-10"
      >
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
          className="max-w-3xl mx-auto"
        >
          <motion.h2
            variants={fadeInUp}
            className="text-4xl font-bold text-black mb-12"
          >
            Contents
          </motion.h2>

          <nav className="space-y-1">
            {TOC_ITEMS.filter((item) => item.id !== 'cover').map((item) => (
              <motion.button
                key={item.id}
                variants={fadeInUp}
                onClick={() => scrollTo(item.id)}
                className={cn(
                  'w-full flex items-center gap-4 py-3 px-4 rounded-lg text-left transition-colors duration-200 group',
                  activeSection === item.id
                    ? 'bg-dna-pampas text-dna-pomegranate'
                    : 'text-black hover:bg-dna-pampas/50 hover:text-dna-pomegranate'
                )}
              >
                <span
                  className={cn(
                    'text-sm font-semibold w-8 shrink-0',
                    activeSection === item.id
                      ? 'text-dna-pomegranate'
                      : 'text-dna-silver group-hover:text-dna-pomegranate'
                  )}
                >
                  {item.num}
                </span>
                {!item.num && <span className="w-8 shrink-0" />}
                <span className="text-base font-medium">{item.label}</span>
                <ChevronRight
                  className={cn(
                    'w-4 h-4 ml-auto shrink-0 transition-colors',
                    activeSection === item.id
                      ? 'text-dna-pomegranate'
                      : 'text-dna-silver group-hover:text-dna-pomegranate'
                  )}
                />
              </motion.button>
            ))}
          </nav>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════
          Executive Summary
          ═══════════════════════════════════════════ */}
      <section
        id="exec-summary"
        ref={(el) => {
          sectionRefs.current['exec-summary'] = el;
        }}
        className="bg-white py-20 px-10 border-t border-dna-mercury print:py-10"
      >
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
          className="max-w-3xl mx-auto"
        >
          <motion.p
            variants={fadeInUp}
            className="text-sm font-semibold text-dna-pomegranate uppercase tracking-widest mb-4"
          >
            01
          </motion.p>
          <motion.h2
            variants={fadeInUp}
            className="text-4xl font-bold text-black mb-8"
          >
            Executive Summary
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="text-base font-normal text-dna-tundora leading-[1.8] mb-10"
          >
            {EXEC_SUM}
          </motion.p>
          <motion.div
            variants={fadeInUp}
            className="flex items-center gap-8 py-6 border-t border-dna-mercury"
          >
            {[
              { v: modCount, l: 'Modules' },
              { v: trxCount, l: 'Transactions' },
              { v: ucCount, l: 'Use Cases' },
              { v: ROLES.length, l: 'Roles' },
            ].map((s, i, a) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-3xl font-bold text-black">{s.v}</span>
                <span className="text-sm text-dna-silver">{s.l}</span>
                {i < a.length - 1 && (
                  <span className="text-dna-mercury ml-4">|</span>
                )}
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════
          Module Sections
          ═══════════════════════════════════════════ */}
      {MODULES.map((mod, mi) => (
        <div key={mod.id}>
          {/* Module Header */}
          <section
            id={mod.id}
            ref={(el) => {
              sectionRefs.current[mod.id] = el;
            }}
            style={{ backgroundColor: mod.color }}
            className="py-16 px-10 text-white print:py-8"
          >
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={staggerContainer}
              className="max-w-3xl mx-auto"
            >
              <motion.p
                variants={fadeInUp}
                className="text-[13px] font-medium text-white/70 uppercase tracking-widest mb-3"
              >
                Module {String(mi + 1).padStart(2, '0')}
              </motion.p>
              <motion.h2
                variants={fadeInUp}
                className="text-4xl font-bold mb-3"
              >
                {mod.name}
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                className="text-base text-white/80 leading-relaxed"
              >
                {mod.desc}
              </motion.p>
            </motion.div>
          </section>

          {/* Transactions */}
          {mod.tx.map((trx: any) => (
            <div
              key={trx.id}
              className="border-l-4 py-12 px-10 print:py-6"
              style={{ borderLeftColor: mod.color }}
            >
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-60px' }}
                variants={staggerContainer}
                className="max-w-3xl mx-auto"
              >
                <motion.p
                  variants={fadeInUp}
                  className="text-[13px] font-mono text-dna-tundora mb-1"
                >
                  {trx.code}
                </motion.p>
                <motion.h3
                  variants={fadeInUp}
                  className="text-2xl font-semibold text-black mb-2"
                >
                  {trx.name}
                </motion.h3>
                <motion.p
                  variants={fadeInUp}
                  className="text-base text-dna-tundora mb-10"
                >
                  {trx.desc}
                </motion.p>

                {/* Use Case Documentation */}
                {trx.ucs.map((uc: any) => (
                  <motion.div
                    key={uc.id}
                    variants={fadeInUp}
                    className="border border-dna-mercury rounded-xl p-8 mb-6 last:mb-0 print:break-inside-avoid"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                      <h4 className="text-xl font-semibold text-black">
                        {uc.name}
                      </h4>
                      <div className="flex items-center gap-2">
                        {uc.appr && (
                          <Badge
                            variant="outline"
                            className="border-dna-pomegranate text-dna-pomegranate"
                          >
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            Approval Required
                          </Badge>
                        )}
                        <Badge
                          variant="secondary"
                          className="bg-dna-cream text-dna-tundora"
                        >
                          <User className="w-3 h-3 mr-1" />
                          {uc.role}
                        </Badge>
                      </div>
                    </div>

                    {/* Module & Duration meta */}
                    <div className="flex items-center gap-4 mb-6 text-xs text-dna-tundora">
                      <span className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" />
                        {mod.name}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {uc.dur}
                      </span>
                    </div>

                    {/* Documentation Fields */}
                    <div className="space-y-6">
                      {/* Business Scenario */}
                      <div>
                        <p className="text-xs font-semibold text-dna-pomegranate uppercase tracking-wide mb-1.5">
                          Business Scenario
                        </p>
                        <p className="text-[15px] text-dna-tundora leading-relaxed">
                          {uc.scenario}
                        </p>
                      </div>

                      {/* Prerequisites & Duration */}
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-xs font-semibold text-dna-pomegranate uppercase tracking-wide mb-1.5">
                            Prerequisites
                          </p>
                          <ul className="space-y-1">
                            {uc.prereq.map((p: any, pi: number) => (
                              <li
                                key={pi}
                                className="text-[15px] text-dna-tundora flex items-start gap-2"
                              >
                                <CheckCircle2 className="w-4 h-4 text-status-green shrink-0 mt-0.5" />
                                {p}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-dna-pomegranate uppercase tracking-wide mb-1.5">
                            Estimated Duration
                          </p>
                          <p className="text-[15px] text-dna-tundora">
                            {uc.dur}
                          </p>
                        </div>
                      </div>

                      {/* Process Steps */}
                      <div>
                        <p className="text-xs font-semibold text-dna-pomegranate uppercase tracking-wide mb-3">
                          Process Steps
                        </p>
                        <div className="space-y-2">
                          {uc.steps.map((st: any) => (
                            <div
                              key={st.s}
                              className="flex items-start gap-3 text-sm py-2 px-3 bg-[#FAFAFA] rounded-lg"
                            >
                              <span
                                className="w-5 h-5 rounded-full text-white text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5"
                                style={{ backgroundColor: mod.color }}
                              >
                                {st.s}
                              </span>
                              <div className="leading-relaxed">
                                <span className="font-medium text-black">
                                  {st.a}
                                </span>
                                {st.d && (
                                  <span className="text-dna-tundora ml-2">
                                    — {st.d}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Required Inputs */}
                      <div>
                        <p className="text-xs font-semibold text-dna-pomegranate uppercase tracking-wide mb-1.5">
                          Required Inputs
                        </p>
                        <ul className="space-y-1">
                          {uc.inputs.map((inp: any, ii: number) => (
                            <li
                              key={ii}
                              className="text-[15px] text-dna-tundora flex items-start gap-2"
                            >
                              <FileText className="w-4 h-4 text-dna-silver shrink-0 mt-0.5" />
                              {inp}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Expected Outputs */}
                      <div>
                        <p className="text-xs font-semibold text-dna-pomegranate uppercase tracking-wide mb-1.5">
                          Expected Outputs
                        </p>
                        <ul className="space-y-1">
                          {uc.outputs.map((out: any, oi: number) => (
                            <li
                              key={oi}
                              className="text-[15px] text-dna-tundora flex items-start gap-2"
                            >
                              <CheckCircle2 className="w-4 h-4 text-status-green shrink-0 mt-0.5" />
                              {out}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Approval & Role footer */}
                      <div className="flex items-center gap-4 pt-4 border-t border-dna-mercury">
                        {uc.appr && (
                          <div>
                            <p className="text-xs font-semibold text-dna-pomegranate uppercase tracking-wide mb-1">
                              Approval Required
                            </p>
                            <p className="text-sm text-dna-tundora">
                              Yes — routed automatically
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-semibold text-dna-pomegranate uppercase tracking-wide mb-1">
                            Responsible Role
                          </p>
                          <p className="text-sm text-dna-tundora">{uc.role}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          ))}
        </div>
      ))}

      {/* ═══════════════════════════════════════════
          Approval Workflows
          ═══════════════════════════════════════════ */}
      <section
        id="approval-workflows"
        ref={(el) => {
          sectionRefs.current['approval-workflows'] = el;
        }}
        className="bg-[#FAFAFA] py-20 px-10 print:py-10"
      >
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
          className="max-w-5xl mx-auto"
        >
          <motion.div
            variants={fadeInUp}
            className="flex items-center gap-3 mb-10"
          >
            <GitPullRequest className="w-7 h-7 text-dna-pomegranate" />
            <h2 className="text-4xl font-bold text-black">
              Approval Workflows
            </h2>
          </motion.div>

          {/* Approval cards */}
          <div className="space-y-4 mb-10">
            {APPROVALS.slice(0, 6).map((a) => (
              <motion.div
                key={a.id}
                variants={fadeInUp}
                className="bg-white border border-dna-mercury rounded-xl p-6 print:break-inside-avoid"
              >
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-sm font-medium text-black">
                    {a.appr}
                  </span>
                  <ArrowRight className="w-4 h-4 text-dna-silver" />
                  <span className="text-sm text-dna-tundora">
                    Level {a.lv}
                  </span>
                  <Badge
                    variant="outline"
                    className="ml-auto border-status-green text-status-green"
                  >
                    {a.st}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-semibold text-dna-pomegranate uppercase tracking-wide mb-1">
                      Use Case
                    </p>
                    <p className="text-dna-tundora">{a.uc}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-dna-pomegranate uppercase tracking-wide mb-1">
                      Transaction
                    </p>
                    <p className="text-dna-tundora">{a.tx}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-dna-pomegranate uppercase tracking-wide mb-1">
                      SLA
                    </p>
                    <p className="text-dna-tundora flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {a.sla}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Full approval table */}
          <motion.div
            variants={fadeInUp}
            className="bg-white border border-dna-mercury rounded-xl overflow-hidden"
          >
            <Table>
              <TableHeader>
                <TableRow className="border-b border-dna-mercury">
                  {[
                    '#',
                    'Use Case',
                    'Transaction',
                    'Level',
                    'Approver',
                    'SLA',
                    'Status',
                  ].map((h) => (
                    <TableHead
                      key={h}
                      className="text-xs font-semibold text-dna-tundora uppercase tracking-wide"
                    >
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {APPROVALS.map((a, idx) => (
                  <TableRow
                    key={a.id}
                    className="border-b border-dna-mercury last:border-0"
                  >
                    <TableCell className="text-sm text-dna-tundora">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-black">
                      {a.uc}
                    </TableCell>
                    <TableCell className="text-sm text-dna-tundora">
                      {a.tx}
                    </TableCell>
                    <TableCell className="text-sm text-dna-tundora">
                      L{a.lv}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-black">
                      {a.appr}
                    </TableCell>
                    <TableCell className="text-sm text-dna-tundora">
                      {a.sla}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="border-status-green text-status-green text-xs"
                      >
                        {a.st}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════
          Role Definitions
          ═══════════════════════════════════════════ */}
      <section
        id="role-definitions"
        ref={(el) => {
          sectionRefs.current['role-definitions'] = el;
        }}
        className="bg-white py-20 px-10 border-t border-dna-mercury print:py-10"
      >
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
          className="max-w-4xl mx-auto"
        >
          <motion.h2
            variants={fadeInUp}
            className="text-4xl font-bold text-black mb-10"
          >
            Your Team&apos;s Roles
          </motion.h2>

          <div className="space-y-4">
            {ROLES.map((role) => {
              const RI = role.icon;
              return (
                <motion.div
                  key={role.id}
                  variants={fadeInUp}
                  className="border border-dna-mercury rounded-xl p-6 flex items-start gap-5 print:break-inside-avoid"
                >
                  {/* Left: Icon + Name */}
                  <div className="shrink-0 flex flex-col items-center gap-2 w-[80px]">
                    <div className="w-12 h-12 rounded-full bg-dna-pampas border border-dna-mercury flex items-center justify-center">
                      <RI className="w-6 h-6 text-dna-tundora" />
                    </div>
                    <p className="text-sm font-semibold text-black text-center">
                      {role.name}
                    </p>
                    <p className="text-xs text-dna-silver text-center">
                      {role.dept}
                    </p>
                  </div>

                  {/* Separator */}
                  <div className="w-px bg-dna-mercury self-stretch" />

                  {/* Right: Responsibilities + Modules */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-dna-pomegranate uppercase tracking-wide mb-2">
                      Responsibilities
                    </p>
                    <ul className="space-y-1.5 mb-4">
                      {role.resp.map((r: any, ri: number) => (
                        <li
                          key={ri}
                          className="text-sm text-dna-tundora flex items-start gap-2"
                        >
                          <ArrowRight className="w-3.5 h-3.5 text-dna-silver mt-0.5 shrink-0" />
                          {r}
                        </li>
                      ))}
                    </ul>
                    <div className="flex flex-wrap gap-1.5">
                      {role.mods.map((m: any, mi: number) => (
                        <Badge
                          key={mi}
                          variant="secondary"
                          className="bg-dna-cream text-dna-tundora text-xs font-normal"
                        >
                          {m}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════
          Floating TOC Nav (scroll spy dots)
          ═══════════════════════════════════════════ */}
      <nav className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden 2xl:block print:hidden">
        <div className="bg-white/90 backdrop-blur-md border border-dna-mercury rounded-full py-3 px-1.5 shadow-sm">
          <ul className="space-y-1">
            {TOC_ITEMS.filter((i) => i.id !== 'cover').map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => scrollTo(item.id)}
                  title={item.label}
                  className={cn(
                    'relative w-2 h-2 rounded-full transition-all duration-200 block mx-auto',
                    activeSection === item.id
                      ? 'bg-dna-pomegranate scale-125'
                      : 'bg-dna-silver hover:bg-dna-tundora'
                  )}
                />
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════
          Footer
          ═══════════════════════════════════════════ */}
      <footer className="bg-black py-16 px-10 text-center print:py-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          <motion.p
            variants={fadeInUp}
            className="text-lg font-semibold text-white mb-2"
          >
            Powered by DNA ERP
          </motion.p>
          <motion.p
            variants={fadeInUp}
            className="text-sm font-normal text-white/60 mb-8"
          >
            Redefining Enterprise Intelligence
          </motion.p>
          <motion.div
            variants={fadeIn}
            className="w-[40px] h-[1px] bg-dna-pomegranate mx-auto mb-6"
          />
          <motion.p
            variants={fadeInUp}
            className="text-xs text-white/40"
          >
            &copy; 2024 {PREPARED}. All rights reserved.
          </motion.p>
          <motion.p
            variants={fadeInUp}
            className="text-xs text-white/30 mt-1"
          >
            Secure token: {token?.slice(0, 8)}...
          </motion.p>
        </motion.div>
      </footer>

      {/* ═══════════════════════════════════════════
          Print Styles
          ═══════════════════════════════════════════ */}
      <style>{`@media print {
        header, nav { display: none !important; }
        .print\\:hidden { display: none !important; }
        .print\\:min-h-auto { min-height: auto !important; }
        .print\\:py-10 { padding-top: 2.5rem !important; padding-bottom: 2.5rem !important; }
        .print\\:py-6 { padding-top: 1.5rem !important; padding-bottom: 1.5rem !important; }
        .print\\:break-inside-avoid { break-inside: avoid !important; }
        section { page-break-inside: avoid; }
      }`}</style>
    </div>
  );
}
