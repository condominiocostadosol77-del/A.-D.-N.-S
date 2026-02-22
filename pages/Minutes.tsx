import React, { useState } from 'react';
import { 
  FileText, 
  Printer, 
  Gift, 
  Heart, 
  Users,
  Sparkles,
  Loader2
} from 'lucide-react';
import { Sector } from '../types';
import { GoogleGenAI } from "@google/genai";

interface MinutesProps {
  currentSector: string;
  sectors: Sector[];
}

type MinuteType = 'donation' | 'wedding' | 'meeting';

const Minutes: React.FC<MinutesProps> = ({ currentSector, sectors }) => {
  const [activeTab, setActiveTab] = useState<MinuteType>('donation');
  const [isGenerating, setIsGenerating] = useState(false);

  // Donation State
  const [donationData, setDonationData] = useState({
    date: new Date().toISOString().split('T')[0],
    donorName: '',
    donorDoc: '', // RG ou CPF opcional para ficar mais formal
    itemDescription: '',
    value: '',
    pastorName: '',
    secretary1: '',
    secretary2: '',
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

  // Meeting State
  const [meetingData, setMeetingData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '19:30',
    endTime: '21:00',
    type: 'Reunião Ordinária', // Ordinária, Extraordinária, Diretoria, Obreiros
    president: '',
    secretary: '',
    rawContent: '', // O que o usuário digita
    generatedContent: '', // O que a IA gera
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

  const handleGenerateMinute = async () => {
    if (!meetingData.rawContent) return;

    setIsGenerating(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        alert("Chave de API do Gemini não configurada.");
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      const model = ai.models.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `
        Você é um secretário experiente de uma igreja evangélica Assembleia de Deus.
        Sua tarefa é transformar as anotações informais abaixo em uma Ata de Reunião formal, bem redigida e corrigida ortograficamente.
        
        Detalhes da Reunião:
        - Data: ${getLongDate(meetingData.date)}
        - Horário Início: ${meetingData.time}
        - Horário Término: ${meetingData.endTime}
        - Tipo: ${meetingData.type}
        - Presidente: ${meetingData.president}
        - Secretário: ${meetingData.secretary}
        - Local/Setor: ${getSectorName(meetingData.sector)}

        Anotações (O que ocorreu):
        "${meetingData.rawContent}"

        Instruções:
        1. Escreva o texto corrido da ata, começando com a data e horário de início, quem presidiu, e narrando os fatos de forma formal e eclesiástica.
        2. Corrija qualquer erro de português.
        3. Use termos adequados ao ambiente de igreja (ex: "irmãos", "paz do Senhor", "deliberações").
        4. Finalize com o encerramento padrão de uma ata, mencionando o horário de término ("Nada mais havendo a tratar, encerrou-se a reunião às ${meetingData.endTime}...").
        5. NÃO inclua cabeçalhos (título da igreja) ou rodapés (assinaturas), pois isso já existe no layout do documento. Apenas o CORPO do texto.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      setMeetingData(prev => ({ ...prev, generatedContent: text }));
    } catch (error) {
      console.error("Erro ao gerar ata:", error);
      alert("Erro ao gerar a ata. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCorrectSpelling = async (section: 'meeting' | 'donation', field: string, value: string) => {
      if (!value) return;
      setIsGenerating(true); // Reusing loading state
      try {
          const apiKey = process.env.GEMINI_API_KEY;
          if (!apiKey) return;
          
          const ai = new GoogleGenAI({ apiKey });
          const model = ai.models.getGenerativeModel({ model: "gemini-2.5-flash" });
          
          const prompt = `Corrija a ortografia e gramática do seguinte texto, mantendo o sentido original: "${value}"`;
          
          const result = await model.generateContent(prompt);
          const response = await result.response;
          const text = response.text();
          
          if (section === 'meeting') {
              setMeetingData(prev => ({ ...prev, [field]: text.trim() }));
          } else if (section === 'donation') {
              setDonationData(prev => ({ ...prev, [field]: text.trim() }));
          }
      } catch (error) {
          console.error("Erro na correção:", error);
      } finally {
          setIsGenerating(false);
      }
  }

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
          Termo de Doação
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
        <button 
            onClick={() => setActiveTab('meeting')} 
            className={`px-6 py-3 font-medium text-sm transition-colors relative whitespace-nowrap flex items-center gap-2 ${activeTab === 'meeting' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Users className="w-4 h-4" />
          Ata de Reunião
          {activeTab === 'meeting' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-600"></div>}
        </button>
      </div>

      {/* Input Forms (Hidden on Print) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 print:hidden">
        
        {/* DONATION FORM */}
        {activeTab === 'donation' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
             <div className="col-span-2 mb-2">
                <h3 className="font-semibold text-slate-700">Dados da Doação e Diretoria</h3>
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data do Termo</label>
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

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Doador</label>
                <input type="text" className="w-full p-2 border rounded-lg focus:ring-emerald-500"
                  placeholder="Nome completo de quem doou"
                  value={donationData.donorName} onChange={e => setDonationData({...donationData, donorName: e.target.value})} />
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">RG/CPF do Doador (Opcional)</label>
                <input type="text" className="w-full p-2 border rounded-lg focus:ring-emerald-500"
                  placeholder="Para fins de registro"
                  value={donationData.donorDoc} onChange={e => setDonationData({...donationData, donorDoc: e.target.value})} />
             </div>

             <div className="col-span-2">
                <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-slate-700">Descrição do Item / Bem</label>
                    <button 
                        onClick={() => handleCorrectSpelling('donation', 'itemDescription', donationData.itemDescription)}
                        disabled={isGenerating || !donationData.itemDescription}
                        className="text-xs text-emerald-600 hover:text-emerald-800 flex items-center gap-1 disabled:opacity-50"
                    >
                        <Sparkles className="w-3 h-3" />
                        Corrigir Ortografia
                    </button>
                </div>
                <textarea className="w-full p-2 border rounded-lg focus:ring-emerald-500" rows={2}
                  placeholder="Ex: 01 Geladeira marca X, modelo Y, nº de série Z, cor branca, em bom estado de conservação..."
                  value={donationData.itemDescription} onChange={e => setDonationData({...donationData, itemDescription: e.target.value})} />
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Valor Estimado (R$)</label>
                <input type="text" className="w-full p-2 border rounded-lg focus:ring-emerald-500"
                  placeholder="0,00"
                  value={donationData.value} onChange={e => setDonationData({...donationData, value: e.target.value})} />
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pastor Responsável</label>
                <input type="text" className="w-full p-2 border rounded-lg focus:ring-emerald-500"
                  value={donationData.pastorName} onChange={e => setDonationData({...donationData, pastorName: e.target.value})} />
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">1º Secretário(a)</label>
                <input type="text" className="w-full p-2 border rounded-lg focus:ring-emerald-500"
                  value={donationData.secretary1} onChange={e => setDonationData({...donationData, secretary1: e.target.value})} />
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">2º Secretário(a)</label>
                <input type="text" className="w-full p-2 border rounded-lg focus:ring-emerald-500"
                  value={donationData.secretary2} onChange={e => setDonationData({...donationData, secretary2: e.target.value})} />
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

        {/* MEETING FORM */}
        {activeTab === 'meeting' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
             <div className="col-span-2 mb-2">
                <h3 className="font-semibold text-slate-700">Dados da Reunião</h3>
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                <input type="date" className="w-full p-2 border rounded-lg focus:ring-emerald-500"
                  value={meetingData.date} onChange={e => setMeetingData({...meetingData, date: e.target.value})} />
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Horário Início</label>
                <input type="time" className="w-full p-2 border rounded-lg focus:ring-emerald-500"
                  value={meetingData.time} onChange={e => setMeetingData({...meetingData, time: e.target.value})} />
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Horário Término</label>
                <input type="time" className="w-full p-2 border rounded-lg focus:ring-emerald-500"
                  value={meetingData.endTime} onChange={e => setMeetingData({...meetingData, endTime: e.target.value})} />
             </div>

             <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Setor / Congregação</label>
                 <select className="w-full p-2 border rounded-lg focus:ring-emerald-500 bg-slate-50"
                    value={meetingData.sector} onChange={e => setMeetingData({...meetingData, sector: e.target.value})}>
                    {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                 </select>
             </div>

             <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Reunião</label>
                 <select className="w-full p-2 border rounded-lg focus:ring-emerald-500 bg-slate-50"
                    value={meetingData.type} onChange={e => setMeetingData({...meetingData, type: e.target.value})}>
                    <option value="Reunião Ordinária">Reunião Ordinária</option>
                    <option value="Reunião Extraordinária">Reunião Extraordinária</option>
                    <option value="Reunião de Diretoria">Reunião de Diretoria</option>
                    <option value="Reunião de Obreiros">Reunião de Obreiros</option>
                    <option value="Assembleia Geral">Assembleia Geral</option>
                 </select>
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Presidente / Dirigente</label>
                <input type="text" className="w-full p-2 border rounded-lg focus:ring-emerald-500"
                  value={meetingData.president} onChange={e => setMeetingData({...meetingData, president: e.target.value})} />
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Secretário(a)</label>
                <input type="text" className="w-full p-2 border rounded-lg focus:ring-emerald-500"
                  value={meetingData.secretary} onChange={e => setMeetingData({...meetingData, secretary: e.target.value})} />
             </div>

             <div className="col-span-2">
                <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-slate-700">
                        O que ocorreu na reunião? (Anotações)
                    </label>
                    <button 
                        onClick={() => handleCorrectSpelling('meeting', 'rawContent', meetingData.rawContent)}
                        disabled={isGenerating || !meetingData.rawContent}
                        className="text-xs text-emerald-600 hover:text-emerald-800 flex items-center gap-1 disabled:opacity-50"
                    >
                        <Sparkles className="w-3 h-3" />
                        Corrigir Ortografia
                    </button>
                </div>
                <textarea 
                  className="w-full p-3 border rounded-lg focus:ring-emerald-500 min-h-[150px]" 
                  rows={6}
                  placeholder="Descreva aqui os assuntos tratados, decisões tomadas, quem falou, etc. Ex: O Pastor iniciou a reunião orando. Foi tratado sobre a reforma do telhado. O irmão João sugeriu fazer um mutirão..."
                  value={meetingData.rawContent} 
                  onChange={e => setMeetingData({...meetingData, rawContent: e.target.value})} 
                />
             </div>

             <div className="col-span-2 flex justify-end">
                <button 
                    onClick={handleGenerateMinute}
                    disabled={isGenerating || !meetingData.rawContent}
                    className="bg-emerald-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Gerando Ata Formal...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-5 h-5" />
                            Gerar Ata Formal com IA
                        </>
                    )}
                </button>
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
                  : activeTab === 'wedding' 
                    ? getSectorName(weddingData.sector)
                    : getSectorName(meetingData.sector)
               }
            </p>
            <div className="w-24 h-1 bg-slate-800 mx-auto mt-4 mb-2"></div>
            <h2 className="text-lg font-bold uppercase underline mt-8">
               {activeTab === 'donation' ? 'TERMO DE DOAÇÃO VOLUNTÁRIA E TRANSFERÊNCIA DE BENS' : 
                activeTab === 'wedding' ? 'ATA DE CERIMÔNIA DE CASAMENTO' : 
                `ATA DE ${meetingData.type.toUpperCase()}`}
            </h2>
         </div>

         {/* DOCUMENT BODY - DONATION */}
         {activeTab === 'donation' && (
            <div className="font-serif leading-loose text-slate-800 space-y-6">
               <p>
                  Pelo presente instrumento, de um lado, a <span className="font-bold">IGREJA EVANGÉLICA ASSEMBLEIA DE DEUS – MINISTÉRIO TAUBATÉ – SETOR NATIVIDADE DA SERRA</span>, 
                  organização religiosa sem fins lucrativos, doravante denominada simplesmente <span className="font-bold">DONATÁRIA</span>, e de outro lado, o(a) Sr(a).
                  <span className="font-bold uppercase"> {donationData.donorName || '__________________________'}</span>
                  {donationData.donorDoc ? `, portador(a) do documento nº ${donationData.donorDoc}` : ''}, 
                  doravante denominado(a) <span className="font-bold">DOADOR(A)</span>, têm entre si justo e contratado o seguinte:
               </p>

               <div className="space-y-4">
                  <p>
                     <span className="font-bold decoration-slate-400 underline">CLÁUSULA PRIMEIRA - DA NATUREZA DA DOAÇÃO:</span><br/>
                     O(A) DOADOR(A), movido(a) por fé e liberalidade, realiza este ato de forma totalmente voluntária, espontânea e gratuita, sem qualquer coação ou vício de consentimento. 
                     A doação tem por objetivo contribuir para a manutenção do templo, o sustento das atividades eclesiásticas e o fomento das obras de assistência social da Igreja.
                  </p>

                  <p>
                     <span className="font-bold decoration-slate-400 underline">CLÁUSULA SEGUNDA - DO OBJETO:</span><br/>
                     O objeto da presente doação consiste no bem abaixo descrito e avaliado:
                  </p>

                  <div className="my-2 p-4 border border-slate-800 bg-slate-50 print:bg-transparent rounded">
                     <p className="font-bold mb-1 uppercase">Descrição Detalhada:</p>
                     <p className="whitespace-pre-wrap italic text-justify leading-normal">{donationData.itemDescription || '_____________________________________________________________________'}</p>
                     
                     <div className="mt-2 flex gap-2 justify-end">
                        <span className="font-bold">Valor Estimado:</span> 
                        <span>{donationData.value ? `R$ ${donationData.value}` : '_________________'}</span>
                     </div>
                  </div>

                  <p>
                     <span className="font-bold decoration-slate-400 underline">CLÁUSULA TERCEIRA - DA DESTINAÇÃO E PROPRIEDADE:</span><br/>
                     O(A) DOADOR(A) declara que o bem ora doado é de sua legítima propriedade e origem lícita, transferindo à DONATÁRIA, a partir desta data, a plena posse, 
                     domínio e propriedade do referido bem, para que seja incorporado definitivamente ao patrimônio da Igreja e utilizado conforme suas finalidades estatutárias.
                  </p>

                  <p>
                     <span className="font-bold decoration-slate-400 underline">CLÁUSULA QUARTA - DA IRREVOGABILIDADE:</span><br/>
                     A presente doação é feita em caráter irrevogável e irretratável, renunciando o(a) DOADOR(A), seus herdeiros e sucessores, a qualquer direito de reivindicação futura sobre o bem doado.
                  </p>
               </div>

               <p className="mt-6">
                  E por ser a expressão da verdade e da livre vontade das partes, firmam o presente termo.
               </p>

               <p className="text-right mt-8">
                  Natividade da Serra, {getLongDate(donationData.date)}.
               </p>

               <div className="mt-16 grid grid-cols-2 gap-12 text-center text-sm font-sans break-inside-avoid">
                   <div className="col-span-2 w-2/3 mx-auto">
                       <div className="border-t border-black pt-2 mb-1 uppercase font-bold">{donationData.donorName}</div>
                       <p className="text-xs">Assinatura do(a) Doador(a)</p>
                   </div>

                   <div className="col-span-2 w-2/3 mx-auto mt-8">
                       <div className="border-t border-black pt-2 mb-1 uppercase font-bold">{donationData.pastorName}</div>
                       <p className="text-xs">Pastor Responsável</p>
                   </div>

                   <div className="mt-4">
                       <div className="border-t border-black pt-2 mb-1 uppercase font-bold">{donationData.secretary1}</div>
                       <p className="text-xs">1º Secretário(a)</p>
                   </div>

                   <div className="mt-4">
                       <div className="border-t border-black pt-2 mb-1 uppercase font-bold">{donationData.secretary2}</div>
                       <p className="text-xs">2º Secretário(a)</p>
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

               <div className="mt-16 grid grid-cols-2 gap-12 text-center text-sm break-inside-avoid">
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

         {/* DOCUMENT BODY - MEETING */}
         {activeTab === 'meeting' && (
            <div className="font-serif leading-loose text-slate-800 space-y-6">
                {/* Se não houver conteúdo gerado, mostrar placeholder ou o conteúdo raw formatado */}
                {meetingData.generatedContent ? (
                    <div className="whitespace-pre-wrap text-justify">
                        {meetingData.generatedContent}
                    </div>
                ) : (
                    <div className="text-slate-400 italic text-center py-12 border-2 border-dashed border-slate-200 rounded-lg">
                        {meetingData.rawContent ? (
                            <p>Clique em "Gerar Ata Formal" para visualizar o documento final.</p>
                        ) : (
                            <p>Preencha os dados da reunião e as anotações acima para gerar a ata.</p>
                        )}
                    </div>
                )}

                {/* Assinaturas da Ata de Reunião */}
                {meetingData.generatedContent && (
                    <div className="mt-16 grid grid-cols-2 gap-12 text-center text-sm break-inside-avoid">
                        <div className="col-span-2 w-2/3 mx-auto mt-8">
                            <div className="border-t border-black pt-2 mb-1 uppercase font-bold">{meetingData.president || '____________________'}</div>
                            <p>Presidente / Dirigente</p>
                        </div>

                        <div className="col-span-2 w-2/3 mx-auto mt-4">
                            <div className="border-t border-black pt-2 mb-1 uppercase font-bold">{meetingData.secretary || '____________________'}</div>
                            <p>Secretário(a)</p>
                        </div>
                    </div>
                )}
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