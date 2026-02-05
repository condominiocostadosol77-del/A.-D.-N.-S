import React, { useState } from 'react';
import { 
  FileText, 
  Printer, 
  Gift, 
  Heart, 
  MapPin, 
  Calendar 
} from 'lucide-react';
import { Sector } from '../types';

interface MinutesProps {
  currentSector: string;
  sectors: Sector[];
}

type MinuteType = 'donation' | 'wedding';

const Minutes: React.FC<MinutesProps> = ({ currentSector, sectors }) => {
  const [activeTab, setActiveTab] = useState<MinuteType>('donation');

  // Donation State
  const [donationData, setDonationData] = useState({
    date: new Date().toISOString().split('T')[0],
    donorName: '',
    itemDescription: '',
    value: '',
    receiverName: '',
    sector: currentSector === 'ALL' ? 'SEDE' : currentSector,
  });

  // Wedding State
  const [weddingData, setWeddingData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '19:00',
    groomName: '',
    brideName: '',
    officiantName: '',
    civilRegistryInfo: '', // Optional: Cartório, Livro, Folha
    location: 'Templo Sede',
    witness1: '',
    witness2: '',
    secretary1: '',
    secretary2: '',
    sector: currentSector === 'ALL' ? 'SEDE' : currentSector,
  });

  const getSectorName = (id: string) => {
    return sectors.find(s => s.id === id)?.name || id;
  };

  const getLongDate = (dateStr: string) => {
    if (!dateStr) return '___ de _________ de ______';
    const date = new Date(dateStr);
    // Adicionar fuso horário para garantir o dia correto
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
    
    return adjustedDate.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header and Tabs (Hidden on Print) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-700" />
            Emissão de Atas e Documentos
          </h2>
          <p className="text-sm text-slate-500 mt-1">
             Gere documentos oficiais prontos para impressão e assinatura.
          </p>
        </div>
        <button 
            onClick={handlePrint}
            className="bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-900 transition-colors shadow-sm"
        >
            <Printer className="w-4 h-4" />
            Imprimir Documento
        </button>
      </div>

      <div className="flex border-b border-slate-200 overflow-x-auto print:hidden">
        <button 
            onClick={() => setActiveTab('donation')} 
            className={`px-6 py-3 font-medium text-sm transition-colors relative whitespace-nowrap flex items-center gap-2 ${activeTab === 'donation' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Gift className="w-4 h-4" />
          Ata de Donativo
          {activeTab === 'donation' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-600"></div>}
        </button>
        <button 
            onClick={() => setActiveTab('wedding')} 
            className={`px-6 py-3 font-medium text-sm transition-colors relative whitespace-nowrap flex items-center gap-2 ${activeTab === 'wedding' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Heart className="w-4 h-4" />
          Ata de Casamento
          {activeTab === 'wedding' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-600"></div>}
        </button>
      </div>

      {/* Input Forms (Hidden on Print) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 print:hidden">
        
        {/* DONATION FORM */}
        {activeTab === 'donation' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
             <div className="col-span-2 mb-2">
                <h3 className="font-semibold text-slate-700">Dados da Doação</h3>
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data do Recebimento</label>
                <input type="date" className="w-full p-2 border rounded-lg focus:ring-emerald-500"
                  value={donationData.date} onChange={e => setDonationData({...donationData, date: e.target.value})} />
             </div>

             <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Setor / Congregação</label>
                 <select className="w-full p-2 border rounded-lg focus:ring-emerald-500 bg-slate-50"
                    value={donationData.sector} onChange={e => setDonationData({...donationData, sector: e.target.value})}>
                    {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                 </select>
             </div>

             <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Doador</label>
                <input type="text" className="w-full p-2 border rounded-lg focus:ring-emerald-500"
                  placeholder="Nome completo de quem doou"
                  value={donationData.donorName} onChange={e => setDonationData({...donationData, donorName: e.target.value})} />
             </div>

             <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição do Item / Bem</label>
                <textarea className="w-full p-2 border rounded-lg focus:ring-emerald-500" rows={2}
                  placeholder="Ex: 01 Geladeira marca X, usada em bom estado..."
                  value={donationData.itemDescription} onChange={e => setDonationData({...donationData, itemDescription: e.target.value})} />
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Valor Estimado (R$)</label>
                <input type="text" className="w-full p-2 border rounded-lg focus:ring-emerald-500"
                  placeholder="0,00"
                  value={donationData.value} onChange={e => setDonationData({...donationData, value: e.target.value})} />
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Recebido Por (Representante)</label>
                <input type="text" className="w-full p-2 border rounded-lg focus:ring-emerald-500"
                  placeholder="Nome de quem recebeu"
                  value={donationData.receiverName} onChange={e => setDonationData({...donationData, receiverName: e.target.value})} />
             </div>
          </div>
        )}

        {/* WEDDING FORM */}
        {activeTab === 'wedding' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
             <div className="col-span-2 mb-2">
                <h3 className="font-semibold text-slate-700">Dados da Cerimônia</h3>
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                <input type="date" className="w-full p-2 border rounded-lg focus:ring-emerald-500"
                  value={weddingData.date} onChange={e => setWeddingData({...weddingData, date: e.target.value})} />
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Horário</label>
                <input type="time" className="w-full p-2 border rounded-lg focus:ring-emerald-500"
                  value={weddingData.time} onChange={e => setWeddingData({...weddingData, time: e.target.value})} />
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Noivo</label>
                <input type="text" className="w-full p-2 border rounded-lg focus:ring-emerald-500"
                  value={weddingData.groomName} onChange={e => setWeddingData({...weddingData, groomName: e.target.value})} />
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Noiva</label>
                <input type="text" className="w-full p-2 border rounded-lg focus:ring-emerald-500"
                  value={weddingData.brideName} onChange={e => setWeddingData({...weddingData, brideName: e.target.value})} />
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Celebrante / Pastor</label>
                <input type="text" className="w-full p-2 border rounded-lg focus:ring-emerald-500"
                  value={weddingData.officiantName} onChange={e => setWeddingData({...weddingData, officiantName: e.target.value})} />
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Local da Cerimônia</label>
                <input type="text" className="w-full p-2 border rounded-lg focus:ring-emerald-500"
                  value={weddingData.location} onChange={e => setWeddingData({...weddingData, location: e.target.value})} />
             </div>

             <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Dados Registro Civil (Opcional)</label>
                <input type="text" className="w-full p-2 border rounded-lg focus:ring-emerald-500"
                  placeholder="Ex: Cartório X, Livro B-20, Folha 100..."
                  value={weddingData.civilRegistryInfo} onChange={e => setWeddingData({...weddingData, civilRegistryInfo: e.target.value})} />
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Testemunha 1</label>
                <input type="text" className="w-full p-2 border rounded-lg focus:ring-emerald-500"
                  value={weddingData.witness1} onChange={e => setWeddingData({...weddingData, witness1: e.target.value})} />
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Testemunha 2</label>
                <input type="text" className="w-full p-2 border rounded-lg focus:ring-emerald-500"
                  value={weddingData.witness2} onChange={e => setWeddingData({...weddingData, witness2: e.target.value})} />
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">1º Secretário(a)</label>
                <input type="text" className="w-full p-2 border rounded-lg focus:ring-emerald-500"
                  value={weddingData.secretary1} onChange={e => setWeddingData({...weddingData, secretary1: e.target.value})} />
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">2º Secretário(a)</label>
                <input type="text" className="w-full p-2 border rounded-lg focus:ring-emerald-500"
                  value={weddingData.secretary2} onChange={e => setWeddingData({...weddingData, secretary2: e.target.value})} />
             </div>
          </div>
        )}
      </div>

      {/* DOCUMENT PREVIEW / PRINT AREA */}
      <div className="bg-white shadow-lg mx-auto print:shadow-none print:w-full print:m-0 print:border-none p-12 md:p-16 max-w-[210mm] min-h-[297mm] text-justify relative">
         
         {/* HEADER DO DOCUMENTO */}
         <div className="text-center mb-12">
            <h1 className="text-xl font-bold font-serif uppercase tracking-widest text-slate-900 mb-2">
               A. D. NATIVIDADE DA SERRA
            </h1>
            <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">
               Igreja Evangélica Assembleia de Deus – Ministério Taubaté – Setor Natividade da Serra
            </p>
            <p className="text-sm font-medium text-slate-500 mt-1 uppercase">
               {activeTab === 'donation' 
                  ? getSectorName(donationData.sector)
                  : getSectorName(weddingData.sector)
               }
            </p>
            <div className="w-24 h-1 bg-slate-800 mx-auto mt-4 mb-2"></div>
            <h2 className="text-lg font-bold uppercase underline mt-8">
               {activeTab === 'donation' ? 'ATA DE RECEBIMENTO DE DONATIVO' : 'ATA DE CERIMÔNIA DE CASAMENTO'}
            </h2>
         </div>

         {/* DOCUMENT BODY - DONATION */}
         {activeTab === 'donation' && (
            <div className="font-serif leading-loose text-slate-800 space-y-6">
               <p>
                  Aos <span className="font-bold">{getLongDate(donationData.date)}</span>, 
                  a Igreja Evangélica Assembleia de Deus – Ministério Taubaté – Setor Natividade da Serra, 
                  situada na localidade de {getSectorName(donationData.sector)}, 
                  representada neste ato por <span className="font-bold uppercase">{donationData.receiverName || '__________________________'}</span>, 
                  declara para os devidos fins que recebeu, a título de <span className="font-bold">DOAÇÃO VOLUNTÁRIA E DEFINITIVA</span>, 
                  sem quaisquer ônus ou encargos para a instituição, o(s) seguinte(s) bem(ns):
               </p>

               <div className="my-8 p-6 border border-slate-300 bg-slate-50 print:bg-transparent print:border-slate-400 rounded">
                  <p className="font-bold mb-2">Descrição do Bem:</p>
                  <p className="whitespace-pre-wrap italic">{donationData.itemDescription || '_____________________________________________________________________'}</p>
                  
                  <div className="mt-4 flex gap-2">
                     <span className="font-bold">Valor Estimado:</span> 
                     <span>{donationData.value ? `R$ ${donationData.value}` : '_________________'}</span>
                  </div>
               </div>

               <p>
                  O doador, Sr(a). <span className="font-bold uppercase">{donationData.donorName || '__________________________'}</span>, 
                  declara ser o legítimo proprietário do bem acima descrito e o transfere livre e desembaraçado de quaisquer dívidas 
                  ou litígios, transferindo a posse e a propriedade plena para a Igreja a partir desta data.
               </p>

               <p>
                  Por ser verdade, firmam o presente documento.
               </p>

               <div className="mt-20 flex flex-col gap-16 items-center">
                   <div className="text-center w-full max-w-md">
                       <div className="border-t border-black pt-2 mb-1">
                          <span className="font-bold uppercase">{donationData.donorName}</span>
                       </div>
                       <p className="text-sm">Doador(a)</p>
                   </div>

                   <div className="text-center w-full max-w-md">
                       <div className="border-t border-black pt-2 mb-1">
                          <span className="font-bold uppercase">{donationData.receiverName}</span>
                       </div>
                       <p className="text-sm">Representante da Igreja (Recebedor)</p>
                   </div>
               </div>
            </div>
         )}

         {/* DOCUMENT BODY - WEDDING */}
         {activeTab === 'wedding' && (
            <div className="font-serif leading-loose text-slate-800 space-y-6">
               <p>
                  Aos <span className="font-bold">{getLongDate(weddingData.date)}</span>, 
                  às {weddingData.time} horas, no local denominado {weddingData.location}, 
                  perante a Igreja e as testemunhas abaixo assinadas, foi realizada a Cerimônia de Casamento Religioso de:
               </p>

               <div className="text-center text-lg font-bold my-8 uppercase space-y-2">
                   <p>{weddingData.groomName || '____________________'}</p>
                   <p className="text-sm font-normal normal-case">&</p>
                   <p>{weddingData.brideName || '____________________'}</p>
               </div>

               <p>
                  A cerimônia foi oficiada pelo Celebrante <span className="font-bold uppercase">{weddingData.officiantName || '____________________'}</span>, 
                  seguindo os ritos e princípios bíblicos adotados por esta Instituição Eclesiástica. 
                  Os contraentes manifestaram livre e espontaneamente a vontade de contrair matrimônio, 
                  prometendo fidelidade e amor mútuo.
               </p>

               {weddingData.civilRegistryInfo && (
                   <p>
                       Declara-se ainda que o Casamento Civil foi devidamente registrado no {weddingData.civilRegistryInfo}.
                   </p>
               )}

               <p>
                  E, para constar nos arquivos da Igreja, lavra-se a presente ata que vai assinada pelos cônjuges, 
                  pelo celebrante e pelas testemunhas presentes.
               </p>

               <div className="mt-16 grid grid-cols-2 gap-12 text-center text-sm">
                   <div>
                       <div className="border-t border-black pt-2 mb-1 font-bold uppercase">{weddingData.groomName}</div>
                       <p>O Noivo</p>
                   </div>
                   <div>
                       <div className="border-t border-black pt-2 mb-1 font-bold uppercase">{weddingData.brideName}</div>
                       <p>A Noiva</p>
                   </div>

                   <div className="col-span-2 mt-4">
                       <div className="border-t border-black pt-2 mb-1 font-bold uppercase max-w-md mx-auto">{weddingData.officiantName}</div>
                       <p>Pastor</p>
                   </div>

                   <div className="mt-4">
                       <div className="border-t border-black pt-2 mb-1 uppercase">{weddingData.witness1 || '____________________'}</div>
                       <p>Testemunha 1</p>
                   </div>
                   <div className="mt-4">
                       <div className="border-t border-black pt-2 mb-1 uppercase">{weddingData.witness2 || '____________________'}</div>
                       <p>Testemunha 2</p>
                   </div>
                   
                   {/* Secretários - Layout Invertido (Nome em cima, linha embaixo) */}
                   <div className="mt-4">
                       <div className="uppercase font-bold mb-1 min-h-[1.5em]">{weddingData.secretary1}</div>
                       <div className="border-t border-black pt-2 mb-1 w-full"></div>
                       <p>1º Secretário(a)</p>
                   </div>
                   <div className="mt-4">
                       <div className="uppercase font-bold mb-1 min-h-[1.5em]">{weddingData.secretary2}</div>
                       <div className="border-t border-black pt-2 mb-1 w-full"></div>
                       <p>2º Secretário(a)</p>
                   </div>
               </div>
            </div>
         )}
         
         {/* Footer do documento */}
         <div className="absolute bottom-12 left-0 w-full text-center text-xs text-slate-400 font-sans print:text-black">
            <p>Documento gerado pelo Sistema de Gestão Eclesiástica - A. D. NATIVIDADE DA SERRA</p>
         </div>
      </div>
    </div>
  );
};

export default Minutes;