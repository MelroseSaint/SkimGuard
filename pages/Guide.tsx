import React from 'react';
import { Hand, Eye, Bluetooth, CheckCircle, Search, Scale } from 'lucide-react';

const Guide: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="mb-8">
        <div className="flex items-center space-x-2 mb-2">
           <span className="text-xs font-mono text-primary font-bold uppercase tracking-wider">Standard Operating Procedure</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Inspection Protocol</h1>
        <p className="text-slate-400 max-w-2xl mt-2">
           Follow this deterministic checklist for every endpoint. Do not rely on visual inspection alone. 
           Physical manipulation is required for 90% of detection cases.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         {/* Step 1 */}
         <GuideCard 
            step="01"
            title="The Wiggle Test"
            icon={<Hand className="w-6 h-6 text-primary" />}
            description="Grasp the card reader firmly. Apply multidirectional force. Authentic readers are built into the chassis and should have zero play."
            points={[
               "Pull outward firmly (overlay skimmers use tape)",
               "Twist left and right",
               "Check for uneven gaps around the bezel"
            ]}
         />

         {/* Step 2 */}
         <GuideCard 
            step="02"
            title="Visual Alignment"
            icon={<Eye className="w-6 h-6 text-secondary" />}
            description="Inspect the materials. Skimmers are often 3D printed or use cheaper plastics than the ATM body."
            points={[
               "Look for color mismatch with the machine",
               "Check for glue residue around edges",
               "Verify if the card slot graphic is obscured"
            ]}
         />

         {/* Step 3 */}
         <GuideCard 
            step="03"
            title="Digital Spectrum Scan"
            icon={<Bluetooth className="w-6 h-6 text-accent" />}
            description="Use the 'Scan' tool to check for rogue Bluetooth transmissions. Skimmers need to send data to the thief nearby."
            points={[
               "Run scan for 30 seconds within 1 meter",
               "Look for 'HC-05', 'HC-06' or random MAC addresses",
               "High RSSI (-30 to -50dBm) indicates very close proximity"
            ]}
         />

         {/* Step 4 */}
         <GuideCard 
            step="04"
            title="Keypad Integrity"
            icon={<Search className="w-6 h-6 text-danger" />}
            description="Keypad overlays record PINs. They sit on top of the real keys."
            points={[
               "The keypad should be flush with the casing",
               "Keys should have a tactile 'click'",
               "Look for a hidden camera pointing at the keys (pinhole)"
            ]}
         />
      </div>

      <div className="mt-8 p-6 bg-primary/10 border border-primary/20 rounded-xl flex items-start space-x-4">
         <CheckCircle className="w-6 h-6 text-primary shrink-0 mt-1" />
         <div>
            <h3 className="text-lg font-bold text-white">Verification Complete?</h3>
            <p className="text-sm text-slate-300 mt-1">
               Once all steps are performed, use the <strong className="text-white">Live Monitor</strong> to log the specific evidence and generate a signed report.
            </p>
         </div>
      </div>
      
      {/* Disclaimer Footer */}
      <div className="mt-12 border-t border-border pt-8 text-center md:text-left">
         <div className="flex items-center space-x-2 mb-4 justify-center md:justify-start">
             <Scale className="w-5 h-5 text-slate-500" />
             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Legal & Ethical Disclosure</h3>
         </div>
         <p className="text-xs text-slate-500 leading-relaxed max-w-4xl">
            <strong>SkimGuard</strong> is an evidence collection utility. It does not determine criminal intent or guilt. 
            All incidents logged are <em>user-confirmed</em> and have not been verified by law enforcement authorities at the time of capture. 
            This tool prioritizes <strong>evidence integrity</strong> over user identity; anonymity does not reduce the credibility of the cryptographic proof. 
            Confirmations are considered <strong>irreversible</strong> to maintain the chain of custody.
         </p>
      </div>
    </div>
  );
};

const GuideCard: React.FC<{step: string, title: string, description: string, points: string[], icon: React.ReactNode}> = ({step, title, description, points, icon}) => (
   <div className="bg-surface border border-border rounded-xl p-6 relative overflow-hidden group hover:border-slate-500 transition-colors">
      <div className="absolute top-0 right-0 p-4 opacity-10 font-black text-6xl text-slate-500 select-none group-hover:opacity-20 transition-opacity">
         {step}
      </div>
      
      <div className="relative z-10">
         <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center mb-4">
            {icon}
         </div>
         <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
         <p className="text-sm text-slate-400 mb-4 leading-relaxed">{description}</p>
         
         <ul className="space-y-2">
            {points.map((p, i) => (
               <li key={i} className="flex items-start text-sm text-slate-300">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 mr-2 shrink-0"></span>
                  {p}
               </li>
            ))}
         </ul>
      </div>
   </div>
);

export default Guide;