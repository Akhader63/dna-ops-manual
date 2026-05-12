import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Link2, Download, Edit3, Map, Copy, Check,
  Building2, Briefcase, User, Calendar, Tag,
  FileText, Layers, GitPullRequest, Users,
  ShieldCheck, Clock, ArrowRight, Lock, Unlock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableHeader, TableBody,
  TableHead, TableRow, TableCell,
} from '@/components/ui/table';
import { useModules } from '@/hooks/useData';

/* ═══════════════════════════════════════════════════════════
   Animation & Utility Helpers
   ═══════════════════════════════════════════════════════════ */
const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
};

function cn(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ');
}

/* ═══════════════════════════════════════════════════════════
   Type Definitions
   ═══════════════════════════════════════════════════════════ */
interface Step { s: number; a: string; d: string; }

interface UseCase {
  id: string; name: string; bs: string; pr: string[];
  st: Step[]; ar: boolean; rr: string; md: string;
  ip: string[]; op: string[]; ed: string;
}

/* ═══════════════════════════════════════════════════════════
   Use Case Data (compact single-line per object)
   ═══════════════════════════════════════════════════════════ */
const UC: Record<string, UseCase> = {
  uc1: { id:'uc-1',name:'Monthly Closing Entries',bs:'End-of-month financial closing process',pr:['Open accounting period','All sub-ledger entries posted'],st:[{s:1,a:'Verify all sub-ledger postings',d:'Check AP, AR, and inventory modules'},{s:2,a:'Run depreciation calculation',d:'Fixed asset module integration'},{s:3,a:'Post adjusting entries',d:'Accruals and prepayments'},{s:4,a:'Generate trial balance',d:'Validate debits equal credits'},{s:5,a:'Close accounting period',d:'Lock period from further changes'}],ar:true,rr:'Finance Manager',md:'Financial Management',ip:['Sub-ledger summaries','Depreciation schedules','Accrual worksheets'],op:['Closed period','Trial balance report','Financial statements'],ed:'2-3 business days' },
  uc2: { id:'uc-2',name:'Journal Voucher Creation',bs:'Manual journal entry for non-standard transactions',pr:['Supporting documentation','Approval memo'],st:[{s:1,a:'Prepare journal voucher',d:'Enter debit/credit lines'},{s:2,a:'Attach supporting docs',d:'Upload scanned documents'},{s:3,a:'Submit for approval',d:'Route to Finance Manager'},{s:4,a:'Post to GL',d:'Record in general ledger'}],ar:true,rr:'Accountant',md:'Financial Management',ip:['Supporting documents','Journal entry form'],op:['Posted journal voucher','GL entry'],ed:'1 business day' },
  uc3: { id:'uc-3',name:'Vendor Invoice Processing',bs:'Receive and process vendor invoices for payment',pr:['Purchase order issued','Goods receipt recorded'],st:[{s:1,a:'Receive invoice',d:'Scan and record vendor invoice'},{s:2,a:'Match to PO/GR',d:'Three-way matching verification'},{s:3,a:'Code to GL',d:'Assign account codes'},{s:4,a:'Schedule payment',d:'Apply payment terms'},{s:5,a:'Approve for payment',d:'Manager authorization'}],ar:true,rr:'Finance Manager',md:'Financial Management',ip:['Vendor invoice','Purchase order','Goods receipt'],op:['Posted AP invoice','Payment schedule'],ed:'2-5 business days' },
  uc4: { id:'uc-4',name:'Purchase Goods Receipt',bs:'Receive purchased materials into warehouse',pr:['PO approved','Delivery scheduled'],st:[{s:1,a:'Inspect delivery',d:'Check quantities and condition'},{s:2,a:'Record receipt',d:'Enter into inventory system'},{s:3,a:'Update stock levels',d:'Real-time inventory update'},{s:4,a:'Put away stock',d:'Move to designated bin location'}],ar:false,rr:'Storekeeper',md:'Inventory & Warehouse',ip:['Delivery note','Purchase order'],op:['Goods receipt note','Updated stock levels'],ed:'Same day' },
  uc5: { id:'uc-5',name:'Inter-Warehouse Transfer',bs:'Move stock between facility locations',pr:['Transfer request approved','Source stock available'],st:[{s:1,a:'Create transfer order',d:'Specify source, destination, items'},{s:2,a:'Pick stock',d:'Collect from source location'},{s:3,a:'Ship to destination',d:'Update in-transit status'},{s:4,a:'Receive at destination',d:'Confirm receipt and put away'}],ar:true,rr:'Storekeeper',md:'Inventory & Warehouse',ip:['Transfer request form'],op:['Transfer order','Updated stock in both locations'],ed:'1-3 business days' },
  uc6: { id:'uc-6',name:'Direct Material PO',bs:'Procure raw materials for production',pr:['Material requisition approved','Vendor selected'],st:[{s:1,a:'Create PO from requisition',d:'Auto-populate from approved req'},{s:2,a:'Verify pricing',d:'Check contract rates or get quote'},{s:3,a:'Submit for approval',d:'Route based on amount thresholds'},{s:4,a:'Send to vendor',d:'Email/fax PO to supplier'},{s:5,a:'Acknowledge PO',d:'Record vendor confirmation'}],ar:true,rr:'Purchase Officer',md:'Purchase & Procurement',ip:['Material requisition','Vendor quote'],op:['Purchase order','Vendor acknowledgment'],ed:'1-2 business days' },
  uc7: { id:'uc-7',name:'Standard Sales Order',bs:'Process a typical customer sales order',pr:['Customer account active','Credit limit check passed'],st:[{s:1,a:'Receive customer PO',d:'Enter sales order details'},{s:2,a:'Check availability',d:'ATP check against inventory'},{s:3,a:'Confirm pricing',d:'Apply pricing rules and discounts'},{s:4,a:'Approve order',d:'Manager sign-off if needed'},{s:5,a:'Create delivery',d:'Schedule shipment'},{s:6,a:'Generate invoice',d:'Bill customer upon delivery'}],ar:true,rr:'Sales Executive',md:'Sales & CRM',ip:['Customer purchase order'],op:['Sales order','Delivery note','Invoice'],ed:'1-3 business days' },
  uc8: { id:'uc-8',name:'New Hire Onboarding',bs:'Complete onboarding for newly hired employee',pr:['Hiring approval','Offer accepted'],st:[{s:1,a:'Create employee record',d:'Enter personal and job details'},{s:2,a:'Assign org structure',d:'Department, manager, cost center'},{s:3,a:'Set up payroll',d:'Salary, bank details, tax info'},{s:4,a:'Configure benefits',d:'Insurance, allowances, leave'},{s:5,a:'Issue system access',d:'Create user accounts'}],ar:true,rr:'General Manager',md:'HR & Payroll',ip:['Hiring documents','Offer letter'],op:['Employee record','System access credentials'],ed:'3-5 business days' },
  uc9: { id:'uc-9',name:'Make-to-Order Production',bs:'Manufacture products based on customer order',pr:['Sales order confirmed','BOM verified','Materials available'],st:[{s:1,a:'Create production order',d:'From sales order or manually'},{s:2,a:'Reserve materials',d:'Allocate inventory to order'},{s:3,a:'Issue materials',d:'Move to production floor'},{s:4,a:'Record labor',d:'Track operator time'},{s:5,a:'Quality inspection',d:'QC checkpoint verification'},{s:6,a:'Goods receipt to inventory',d:'Record finished goods'}],ar:true,rr:'General Manager',md:'Manufacturing',ip:['Sales order','BOM','Material availability report'],op:['Production order','Finished goods','QC report'],ed:'5-10 business days' },
};

/* ═══════════════════════════════════════════════════════════
   Modules, Roles, Approvals
   ═══════════════════════════════════════════════════════════ */
const CLIENT = { name: 'No Client Selected', industry: '', contact: '', version: '', effectiveDate: '', preparedBy: 'Solution ERP Consulting', description: 'No manual data is available yet.' };

const MODULES = [
  { id:'mod-1',name:'Financial Management',color:'#059669',desc:'Core financial operations including general ledger, accounts payable, accounts receivable, and financial reporting.',tx:[{id:'trx-1',code:'GL-001',name:'General Ledger Entry',desc:'Record and manage all financial journal entries across business units.',ucs:[UC.uc1,UC.uc2]},{id:'trx-2',code:'AP-001',name:'Accounts Payable Processing',desc:'Manage vendor invoices, payments, and reconciliations.',ucs:[UC.uc3]}]},
  { id:'mod-2',name:'Inventory & Warehouse',color:'#3B82F6',desc:'Stock management, warehouse operations, inventory tracking, and cycle counting processes.',tx:[{id:'trx-3',code:'INV-001',name:'Goods Receipt',desc:'Record incoming inventory from vendors or production.',ucs:[UC.uc4]},{id:'trx-4',code:'INV-002',name:'Stock Transfer',desc:'Transfer inventory between warehouses or bin locations.',ucs:[UC.uc5]}]},
  { id:'mod-3',name:'Purchase & Procurement',color:'#F59E0B',desc:'Procurement workflows, vendor management, purchase orders, and sourcing processes.',tx:[{id:'trx-5',code:'PO-001',name:'Purchase Order Creation',desc:'Create and manage purchase orders from requisition to approval.',ucs:[UC.uc6]}]},
  { id:'mod-4',name:'Sales & CRM',color:'#8B5CF6',desc:'Sales order processing, customer relationship management, quotations, and invoicing.',tx:[{id:'trx-6',code:'SO-001',name:'Sales Order Processing',desc:'Process customer orders from quotation to delivery.',ucs:[UC.uc7]}]},
  { id:'mod-5',name:'HR & Payroll',color:'#EC4899',desc:'Human resources management, employee records, attendance, payroll processing, and benefits.',tx:[{id:'trx-7',code:'HR-001',name:'Employee Onboarding',desc:'Process new employee setup and system access provisioning.',ucs:[UC.uc8]}]},
  { id:'mod-6',name:'Manufacturing',color:'#F3350C',desc:'Production planning, work orders, bill of materials, quality control, and shop floor operations.',tx:[{id:'trx-8',code:'MFG-001',name:'Production Order',desc:'Create and manage manufacturing work orders.',ucs:[UC.uc9]}]},
];

const ROLES = [
  { id:'r1',name:'Owner',dept:'Executive',resp:['Strategic oversight','Final approval authority','Policy decisions'],mods:['All Modules']},
  { id:'r2',name:'General Manager',dept:'Management',resp:['Operations oversight','Department coordination','Budget approval'],mods:['Manufacturing','HR & Payroll','Purchase & Procurement']},
  { id:'r3',name:'Finance Manager',dept:'Finance',resp:['Financial reporting oversight','AP/AR management','Month-end closing'],mods:['Financial Management']},
  { id:'r4',name:'Accountant',dept:'Finance',resp:['Journal entries','Bank reconciliations','Tax compliance'],mods:['Financial Management']},
  { id:'r5',name:'Purchase Officer',dept:'Procurement',resp:['Vendor management','PO processing','Price negotiation'],mods:['Purchase & Procurement']},
  { id:'r6',name:'Storekeeper',dept:'Warehouse',resp:['Inventory management','Goods receipt/issue','Stock counts'],mods:['Inventory & Warehouse']},
  { id:'r7',name:'Sales Executive',dept:'Sales',resp:['Order processing','Customer management','Sales reporting'],mods:['Sales & CRM']},
];

const APPROVALS = [
  { id:'a1',uc:'Monthly Closing Entries',tx:'GL Entry',lv:1,appr:'Finance Manager',sla:'24 hours',st:'Active'},{id:'a2',uc:'Journal Voucher Creation',tx:'GL Entry',lv:1,appr:'Finance Manager',sla:'12 hours',st:'Active'},
  { id:'a3',uc:'Vendor Invoice Processing',tx:'AP Processing',lv:1,appr:'Finance Manager',sla:'24 hours',st:'Active'},{id:'a4',uc:'Vendor Invoice Processing',tx:'AP Processing',lv:2,appr:'General Manager',sla:'48 hours',st:'Active'},
  { id:'a5',uc:'Inter-Warehouse Transfer',tx:'Stock Transfer',lv:1,appr:'Storekeeper',sla:'6 hours',st:'Active'},{id:'a6',uc:'Direct Material PO',tx:'PO Creation',lv:1,appr:'Purchase Officer',sla:'12 hours',st:'Active'},
  { id:'a7',uc:'Direct Material PO',tx:'PO Creation',lv:2,appr:'General Manager',sla:'24 hours',st:'Active'},{id:'a8',uc:'Standard Sales Order',tx:'Sales Order',lv:1,appr:'Sales Executive',sla:'12 hours',st:'Active'},
  { id:'a9',uc:'New Hire Onboarding',tx:'Employee Onboarding',lv:1,appr:'General Manager',sla:'48 hours',st:'Active'},{id:'a10',uc:'Make-to-Order Production',tx:'Production Order',lv:1,appr:'General Manager',sla:'24 hours',st:'Active'},
  { id:'a11',uc:'Purchase Goods Receipt',tx:'Goods Receipt',lv:1,appr:'Storekeeper',sla:'4 hours',st:'Active'},{id:'a12',uc:'Standard Sales Order',tx:'Sales Order',lv:2,appr:'Finance Manager',sla:'24 hours',st:'Active'},
];

interface NavItem { id: string; label: string; level: number; }

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT — ManualPreview
   Internal consultant preview with sidebar TOC, scroll-spy,
   share modal, and full document rendering.
   ═══════════════════════════════════════════════════════════ */
export default function ManualPreview() {
  const navigate = useNavigate();
  const { data: modulesData } = useModules();
  const modules = modulesData?.length ? modulesData : (MODULES as unknown[]);

  /* ── Local State ── */
  const [activeSection, setActiveSection] = useState('exec-summary');
  const [shareOpen, setShareOpen] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [passwordProtect, setPasswordProtect] = useState(false);
  const [allowDownload, setAllowDownload] = useState(true);
  const [expiryDate, setExpiryDate] = useState('');
  const [copied, setCopied] = useState(false);

  /* ── Section Refs ── */
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  /* ── Navigation Items ── */
  const navItems: NavItem[] = [
    { id: 'exec-summary', label: 'Executive Summary', level: 0 },
    { id: 'client-overview', label: 'Client Overview', level: 0 },
    ...MODULES.flatMap((m) => [
      { id: m.id, label: m.name, level: 0 },
      ...m.tx.map((t) => ({ id: t.id, label: t.name, level: 1 })),
    ]),
    { id: 'approval-workflows', label: 'Approval Workflows', level: 0 },
    { id: 'role-definitions', label: 'Role Definitions', level: 0 },
  ];

  /* ── Scroll Spy ── */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
    );
    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [modules]);

  const scrollToSection = useCallback((id: string) => {
    const el = sectionRefs.current[id];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  /* ── Share Handlers ── */
  const handleGenerateLink = () => {
    const token = Math.random().toString(36).substring(2, 15);
    setShareLink(`https://app.dnaerp.com/shared/${token}`);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── Stats ── */
  const modCount = MODULES.length;
  const trxCount = MODULES.reduce((s, m) => s + m.tx.length, 0);
  const ucCount = MODULES.reduce(
    (s, m) => s + m.tx.reduce((ts, t) => ts + t.ucs.length, 0),
    0
  );

  /* ═══════ RENDER ═══════ */
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] -m-6">
      {/* ═══════ Preview Header Bar ═══════ */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="bg-white border border-dna-alto rounded-xl mx-6 mt-4 p-5 shrink-0"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-black">
              {CLIENT.name} — Operation Manual
            </h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-dna-tundora flex-wrap">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                {CLIENT.name}
              </span>
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                Manufacturing
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Dec 15, 2024
              </span>
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                v{CLIENT.version}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Button variant="outline" size="sm" className="border-dna-mercury text-dna-tundora">
              <Edit3 className="w-4 h-4 mr-1.5" />
              Edit
            </Button>
            <Button variant="outline" size="sm" className="border-dna-mercury text-dna-tundora">
              <Download className="w-4 h-4 mr-1.5" />
              Download PDF
            </Button>
            <Button
              size="sm"
              className="bg-dna-pomegranate hover:bg-dna-pomegranate/90 text-white"
              onClick={() => setShareOpen(true)}
            >
              <Link2 className="w-4 h-4 mr-1.5" />
              Share with Client
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-dna-tundora"
              onClick={() => navigate('/roadmap-generator')}
            >
              <Map className="w-4 h-4 mr-1.5" />
              View Roadmap
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ═══════ Two-Column Layout ═══════ */}
      <div className="flex flex-1 overflow-hidden mt-4">
        {/* Left: Sticky TOC Navigation */}
        <nav className="w-[220px] shrink-0 bg-[#FAFAFA] border-r border-dna-mercury overflow-y-auto hidden lg:block">
          <div className="sticky top-0 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-dna-silver mb-3 px-2">
              Contents
            </p>
            <ul className="space-y-0.5">
              {navItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => scrollToSection(item.id)}
                    className={cn(
                      'w-full text-left text-sm px-3 py-1.5 rounded-md transition-all duration-200',
                      item.level === 1 && 'pl-6 text-[13px]',
                      activeSection === item.id
                        ? 'text-dna-pomegranate font-medium border-l-2 border-dna-pomegranate bg-white'
                        : 'text-dna-tundora hover:text-black hover:bg-white/60 border-l-2 border-transparent'
                    )}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Right: Document Content */}
        <div className="flex-1 overflow-y-auto bg-white border border-dna-alto rounded-tl-xl">
          {/* ── Executive Summary ── */}
          <section
            id="exec-summary"
            ref={(el) => { sectionRefs.current['exec-summary'] = el; }}
            className="bg-black text-white px-10 py-10"
          >
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              variants={fadeInUp}
            >
              <p className="text-[13px] font-medium text-dna-pomegranate uppercase tracking-widest mb-3">
                Operational Manual
              </p>
              <h2 className="text-4xl font-bold text-white mb-2">
                Executive Summary
              </h2>
              <p className="text-2xl font-normal text-white/80 mb-6">
                {CLIENT.name}
              </p>
              <p className="text-base font-normal text-white/90 max-w-3xl leading-relaxed mb-8">
                {CLIENT.description}
              </p>
              <div className="flex items-center gap-6 flex-wrap">
                {[
                  { v: modCount, l: 'Modules' },
                  { v: trxCount, l: 'Transactions' },
                  { v: ucCount, l: 'Use Cases' },
                  { v: ROLES.length, l: 'Roles' },
                  { v: APPROVALS.length, l: 'Approvals' },
                ].map((stat, i, arr) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-white">
                      {stat.v}
                    </span>
                    <span className="text-sm text-white/60">{stat.l}</span>
                    {i < arr.length - 1 && (
                      <span className="text-white/30 ml-2">|</span>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </section>

          {/* ── Client Overview ── */}
          <section
            id="client-overview"
            ref={(el) => { sectionRefs.current['client-overview'] = el; }}
            className="px-10 py-10 border-b border-dna-mercury"
          >
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              variants={fadeInUp}
            >
              <h2 className="text-3xl font-bold text-black mb-6">
                Client Overview
              </h2>
              <div className="grid grid-cols-2 gap-x-12 gap-y-5 max-w-2xl">
                {[
                  { l: 'Client Name', v: CLIENT.name, i: Building2 },
                  { l: 'Industry', v: CLIENT.industry, i: Briefcase },
                  { l: 'Contact', v: CLIENT.contact, i: User },
                  { l: 'Version', v: CLIENT.version, i: Tag },
                  { l: 'Effective Date', v: CLIENT.effectiveDate, i: Calendar },
                  { l: 'Prepared By', v: CLIENT.preparedBy, i: FileText },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <item.i className="w-4 h-4 text-dna-silver mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-dna-silver uppercase tracking-wide">
                        {item.l}
                      </p>
                      <p className="text-sm font-medium text-black mt-0.5">
                        {item.v}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </section>

          {/* ── Module Sections ── */}
          {MODULES.map((mod) => (
            <div key={mod.id}>
              <section
                id={mod.id}
                ref={(el) => { sectionRefs.current[mod.id] = el; }}
                style={{ backgroundColor: mod.color }}
                className="px-10 py-6 text-white"
              >
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-50px' }}
                  variants={fadeInUp}
                  className="flex items-center gap-3"
                >
                  <Layers className="w-8 h-8" />
                  <div>
                    <h2 className="text-3xl font-bold">{mod.name}</h2>
                    <p className="text-sm text-white/80 mt-1">{mod.desc}</p>
                  </div>
                </motion.div>
              </section>
              {mod.tx.map((trx) => (
                <div
                  key={trx.id}
                  id={trx.id}
                  ref={(el) => { sectionRefs.current[trx.id] = el; }}
                  className="border-l-4 py-8 px-10"
                  style={{ borderLeftColor: mod.color }}
                >
                  <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-50px' }}
                    variants={fadeInUp}
                  >
                    <p className="text-[13px] font-mono text-dna-tundora mb-1">
                      {trx.code}
                    </p>
                    <h3 className="text-2xl font-semibold text-black mb-2">
                      {trx.name}
                    </h3>
                    <p className="text-sm text-dna-tundora mb-6">
                      {trx.desc}
                    </p>
                    <div className="space-y-4 mt-6">
                      {trx.ucs.map((uc) => (
                        <div
                          key={uc.id}
                          className="bg-white border border-dna-mercury rounded-[10px] p-6"
                        >
                          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                            <h4 className="text-lg font-semibold text-black">
                              {uc.name}
                            </h4>
                            <div className="flex gap-2">
                              {uc.ar && (
                                <Badge
                                  variant="outline"
                                  className="border-dna-pomegranate text-dna-pomegranate text-xs"
                                >
                                  <ShieldCheck className="w-3 h-3 mr-1" />
                                  Approval Required
                                </Badge>
                              )}
                              <Badge
                                variant="secondary"
                                className="bg-dna-cream text-dna-tundora text-xs"
                              >
                                <User className="w-3 h-3 mr-1" />
                                {uc.rr}
                              </Badge>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-xs font-semibold text-dna-pomegranate uppercase tracking-wide mb-1">
                                Business Scenario
                              </p>
                              <p className="text-sm text-dna-tundora">{uc.bs}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-dna-pomegranate uppercase tracking-wide mb-1">
                                Prerequisites
                              </p>
                              <ul className="text-sm text-dna-tundora list-disc list-inside">
                                {uc.pr.map((p, pi) => (
                                  <li key={pi}>{p}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-dna-pomegranate uppercase tracking-wide mb-1">
                                Inputs
                              </p>
                              <ul className="text-sm text-dna-tundora list-disc list-inside">
                                {uc.ip.map((inp, ii) => (
                                  <li key={ii}>{inp}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-dna-pomegranate uppercase tracking-wide mb-1">
                                Outputs
                              </p>
                              <ul className="text-sm text-dna-tundora list-disc list-inside">
                                {uc.op.map((out, oi) => (
                                  <li key={oi}>{out}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-dna-pomegranate uppercase tracking-wide mb-2">
                              Process Steps
                            </p>
                            <div className="space-y-2">
                              {uc.st.map((step) => (
                                <div
                                  key={step.s}
                                  className="flex items-start gap-3 text-sm py-1.5 px-3 bg-[#FAFAFA] rounded-lg"
                                >
                                  <span
                                    className="w-5 h-5 rounded-full text-white text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5"
                                    style={{ backgroundColor: mod.color }}
                                  >
                                    {step.s}
                                  </span>
                                  <div>
                                    <span className="font-medium text-black">
                                      {step.a}
                                    </span>
                                    {step.d && (
                                      <span className="text-dna-tundora ml-2">
                                        — {step.d}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-dna-mercury text-xs text-dna-tundora">
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              {uc.ed}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5" />
                              {uc.md}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              ))}
            </div>
          ))}

          {/* ── Approval Workflows ── */}
          <section
            id="approval-workflows"
            ref={(el) => { sectionRefs.current['approval-workflows'] = el; }}
            className="bg-[#FAFAFA] px-10 py-10"
          >
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              variants={fadeInUp}
            >
              <div className="flex items-center gap-3 mb-6">
                <GitPullRequest className="w-6 h-6 text-dna-pomegranate" />
                <h2 className="text-3xl font-bold text-black">
                  Approval Workflows
                </h2>
              </div>
              <div className="bg-white border border-dna-mercury rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-dna-mercury">
                      <TableHead className="text-xs font-semibold text-dna-tundora uppercase tracking-wide w-[50px]">#</TableHead>
                      <TableHead className="text-xs font-semibold text-dna-tundora uppercase tracking-wide">Use Case</TableHead>
                      <TableHead className="text-xs font-semibold text-dna-tundora uppercase tracking-wide">Transaction</TableHead>
                      <TableHead className="text-xs font-semibold text-dna-tundora uppercase tracking-wide w-[80px]">Level</TableHead>
                      <TableHead className="text-xs font-semibold text-dna-tundora uppercase tracking-wide">Approver</TableHead>
                      <TableHead className="text-xs font-semibold text-dna-tundora uppercase tracking-wide w-[100px]">SLA</TableHead>
                      <TableHead className="text-xs font-semibold text-dna-tundora uppercase tracking-wide w-[100px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {APPROVALS.map((a, idx) => (
                      <TableRow key={a.id} className="border-b border-dna-mercury last:border-0">
                        <TableCell className="text-sm text-dna-tundora">{idx + 1}</TableCell>
                        <TableCell className="text-sm font-medium text-black">{a.uc}</TableCell>
                        <TableCell className="text-sm text-dna-tundora">{a.tx}</TableCell>
                        <TableCell className="text-sm text-dna-tundora">L{a.lv}</TableCell>
                        <TableCell className="text-sm font-medium text-black">{a.appr}</TableCell>
                        <TableCell className="text-sm text-dna-tundora">{a.sla}</TableCell>
                        <TableCell><Badge variant="outline" className="border-status-green text-status-green text-xs">{a.st}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </motion.div>
          </section>

          {/* ── Role Definitions ── */}
          <section
            id="role-definitions"
            ref={(el) => { sectionRefs.current['role-definitions'] = el; }}
            className="px-10 py-10"
          >
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              variants={fadeInUp}
            >
              <div className="flex items-center gap-3 mb-6">
                <Users className="w-6 h-6 text-dna-pomegranate" />
                <h2 className="text-3xl font-bold text-black">
                  Role Definitions
                </h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {ROLES.map((role) => (
                  <div key={role.id} className="bg-white border border-dna-mercury rounded-xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-dna-pampas border border-dna-mercury flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5 text-dna-tundora" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-2xl font-semibold text-black">{role.name}</h3>
                        <p className="text-sm text-dna-silver mb-3">{role.dept}</p>
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-dna-pomegranate uppercase tracking-wide mb-1.5">Key Responsibilities</p>
                          <ul className="space-y-1">
                            {role.resp.map((r, ri) => (
                              <li key={ri} className="text-sm text-dna-tundora flex items-start gap-2">
                                <ArrowRight className="w-3.5 h-3.5 text-dna-silver mt-0.5 shrink-0" />{r}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {role.mods.map((m, mi) => (
                            <Badge key={mi} variant="secondary" className="bg-dna-cream text-dna-tundora text-xs font-normal">{m}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </section>
          <div className="h-20" />
        </div>
      </div>

      {/* ═══════ Share Modal ═══════ */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="w-full max-w-[480px] p-0 overflow-hidden border border-dna-alto rounded-xl">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-lg font-semibold text-black">
              Share with Client
            </DialogTitle>
            <DialogDescription className="text-sm text-dna-tundora">
              Generate a secure link for your client to view this manual.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-5">
            {shareLink && (
              <div className="flex gap-2">
                <Input
                  value={shareLink}
                  readOnly
                  className="flex-1 bg-[#FAFAFA] border-dna-mercury text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="shrink-0 border-dna-mercury"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            )}
            <div className="flex items-center justify-between py-3 border-b border-dna-mercury">
              <div className="flex items-center gap-3">
                {passwordProtect ? (
                  <Lock className="w-4 h-4 text-dna-tundora" />
                ) : (
                  <Unlock className="w-4 h-4 text-dna-tundora" />
                )}
                <div>
                  <p className="text-sm font-medium text-black">Password Protection</p>
                  <p className="text-xs text-dna-silver">Require password to view</p>
                </div>
              </div>
              <Switch checked={passwordProtect} onCheckedChange={setPasswordProtect} />
            </div>
            <AnimatePresence>
              {passwordProtect && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2 overflow-hidden">
                  <label className="text-xs font-medium text-dna-tundora uppercase tracking-wide">Password</label>
                  <Input type="password" placeholder="Enter password" className="bg-[#FAFAFA] border-dna-mercury" />
                </motion.div>
              )}
            </AnimatePresence>
            <div className="space-y-2">
              <label className="text-xs font-medium text-dna-tundora uppercase tracking-wide">Expiry Date</label>
              <Input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="bg-[#FAFAFA] border-dna-mercury" />
            </div>
            <div className="flex items-center justify-between py-3 border-t border-dna-mercury">
              <div className="flex items-center gap-3">
                <Download className="w-4 h-4 text-dna-tundora" />
                <div>
                  <p className="text-sm font-medium text-black">Allow Download</p>
                  <p className="text-xs text-dna-silver">Client can download as PDF</p>
                </div>
              </div>
              <Switch checked={allowDownload} onCheckedChange={setAllowDownload} />
            </div>
          </div>
          <DialogFooter className="p-6 pt-0 gap-2">
            <Button variant="outline" onClick={() => setShareOpen(false)} className="border-dna-mercury">
              Cancel
            </Button>
            <Button
              onClick={handleGenerateLink}
              className="bg-dna-pomegranate hover:bg-dna-pomegranate/90 text-white"
            >
              <Link2 className="w-4 h-4 mr-1.5" />
              {shareLink ? 'Regenerate Link' : 'Generate Link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
