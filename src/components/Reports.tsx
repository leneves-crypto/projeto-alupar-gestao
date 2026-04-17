import React, { useState } from 'react';
import { FileText, Download, CheckCircle, Clock, AlertCircle, Filter, Eye, X, Image as ImageIcon, CheckSquare, Square, Calendar, User, MapPin } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Card } from './Card';
import { Button } from './Button';
import { MaintenanceTask, Team, Abnormality, PMOReport, GroundingPoint } from '../types';
import { maintenanceService } from '../services/maintenanceService';
import { PMO_TEMPLATES } from '../constants/pmoTemplates';

interface ReportsProps {
  tasks: MaintenanceTask[];
  teams: Team[];
  abnormalities: Abnormality[];
  userRole: string;
  grounding: GroundingPoint[];
  pmoReports: PMOReport[];
}

export const Reports: React.FC<ReportsProps> = ({ tasks, teams, abnormalities, userRole, grounding, pmoReports }) => {
  const [filter, setFilter] = useState<'all' | 'concluido' | 'pendente'>('all');
  const [activeReport, setActiveReport] = useState<'tasks' | 'abnormalities' | 'pmo' | 'grounding'>('tasks');
  const [selectedPMO, setSelectedPMO] = useState<PMOReport | null>(null);
  const [selectedAbnormality, setSelectedAbnormality] = useState<Abnormality | null>(null);

  console.log('Reports Component Rendered:', { 
    tasksCount: tasks.length, 
    pmoCount: pmoReports.length,
    userRole 
  });

  const validTeams = ['EQUIPE_01', 'EQUIPE_02', 'EQUIPE_03', 'EQUIPE_04', 'EQUIPE_05'];
  const filteredTeams = teams.filter(t => validTeams.includes(t.id));
  const filteredTasks = (tasks || [])
    .filter(t => t && validTeams.includes(t.teamId) && (filter === 'all' || t.status === filter));
  const filteredAbnormalities = (abnormalities || []).filter(a => validTeams.includes(a.teamId));
  const filteredGrounding = (grounding || []).filter(g => validTeams.includes(g.responsibleTeamId));
  const filteredPmoReports = (pmoReports || []).filter(r => validTeams.includes(r.teamId));

  const stats = React.useMemo(() => {
    const s = {
      total: filteredTasks.length,
      completed: filteredTasks.filter(t => t && t.status === 'concluido').length,
      pending: filteredTasks.filter(t => t && t.status === 'pendente').length,
      inProgress: filteredTasks.filter(t => t && t.status === 'em_execucao').length,
      totalPMOs: filteredPmoReports.length
    };
    console.log('Recalculated Stats:', s);
    return s;
  }, [filteredTasks, filteredPmoReports]);

  const generatePMOPDF = (report: PMOReport) => {
    const doc = new jsPDF();
    const timestamp = new Date().toLocaleString('pt-BR');
    
    // Header
    doc.setFillColor(0, 51, 102);
    doc.rect(0, 0, 210, 40, 'F');
    
    const pmoKey = report.pmoNumber.replace(' ', '-');
    const pmoCode = report.pmoNumber.replace('-', ' ');
    const equipmentName = PMO_TEMPLATES[pmoKey]?.title || '';
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(pmoCode, 15, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${equipmentName} • ${report.assetTag}`, 15, 30);
    doc.text(`Data: ${report.date.split('-').reverse().join('/')}`, 15, 35);

    doc.setTextColor(0, 51, 102);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Dados Gerais', 15, 50);

    const generalData = [
      ['Subestação', report.substation],
      ['Executor', report.executor],
      ['Data', report.date.split('-').reverse().join('/')],
      ['Hora Início', report.startTime],
      ['Hora Fim', report.endTime],
      ['Status', report.status.toUpperCase()]
    ];

    autoTable(doc, {
      startY: 55,
      body: generalData,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } }
    });

    let currentY = (doc as any).lastAutoTable.finalY + 10;

    // Technical Data Section
    if (report.technicalData && Object.keys(report.technicalData).length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Dados Técnicos do Equipamento', 15, currentY);
      currentY += 5;

      const techData = Object.entries(report.technicalData).map(([key, value]) => [key, value]);
      autoTable(doc, {
        startY: currentY,
        body: techData,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: { 0: { fontStyle: 'bold', fillColor: [245, 245, 245], cellWidth: 60 } }
      });
      currentY = (doc as any).lastAutoTable.finalY + 10;
    }

    report.sections.forEach(section => {
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(section.title, 15, currentY);
      currentY += 5;

      const itemsData = section.items.map(item => [
        item.description,
        item.type === 'measurement' ? '-' : (item.status === 'C' ? 'CONFORME' : item.status === 'NC' ? 'NÃO CONFORME' : 'N/A'),
        item.measurement ? `${item.measurement} ${item.unit || ''}` : '-'
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Atividade', 'Status', 'Medição']],
        body: itemsData,
        headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255] },
        styles: { fontSize: 9 },
      });

      currentY = (doc as any).lastAutoTable.finalY + 10;
    });

    if (report.observations) {
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Observações', 15, currentY);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(report.observations, 15, currentY + 7, { maxWidth: 180 });
      currentY += 20;
    }

    // Evidence Photos
    if (report.photos && report.photos.length > 0) {
      if (currentY > 200) {
        doc.addPage();
        currentY = 20;
      } else {
        currentY += 10;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Evidências Fotográficas', 15, currentY);
      currentY += 10;

      let xOffset = 15;
      const imgWidth = 85;
      const imgHeight = 85;

      report.photos.forEach((photo, index) => {
        if (currentY + imgHeight + 15 > 280) {
          doc.addPage();
          currentY = 20;
        }

        try {
          // Check if it's a base64 or URL
          const format = photo.url.includes('png') ? 'PNG' : 'JPEG';
          doc.addImage(photo.url, format, xOffset, currentY, imgWidth, imgHeight);
          
          doc.setFontSize(8);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(100, 100, 100);
          doc.text(photo.caption || `Evidência ${index + 1}`, xOffset, currentY + imgHeight + 5);
          
          if (xOffset === 15) {
            xOffset = 110;
          } else {
            xOffset = 15;
            currentY += imgHeight + 15;
          }
        } catch (e) {
          console.error('Error adding image to PDF:', e);
          doc.setFontSize(8);
          doc.setTextColor(255, 0, 0);
          doc.text(`Erro ao carregar imagem: ${photo.caption}`, xOffset, currentY + 5);
          if (xOffset === 15) xOffset = 110; else { xOffset = 15; currentY += 15; }
        }
      });
    }

    doc.save(`PMO_${report.pmoNumber}_${report.substation}_${new Date().getTime()}.pdf`);
  };

  const generateAbnormalityPDF = (ab: Abnormality) => {
    const doc = new jsPDF();
    const timestamp = new Date(ab.reportedAt).toLocaleString('pt-BR');
    const team = teams.find(t => t.id === ab.teamId);

    // Header
    doc.setFillColor(153, 27, 27); // Red for abnormalities
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('RELATÓRIO DE ANORMALIDADE / INCIDENTE', 15, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 15, 35);

    // Content Section
    doc.setTextColor(0, 51, 102);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Identificação do Evento', 15, 55);

    const identificationData = [
      ['TAG do Equipamento', ab.assetTag || 'Não informada'],
      ['Data e Hora do Reporte', timestamp],
      ['Equipe Responsável', team?.name || ab.teamId],
      ['Gravidade', ab.severity.toUpperCase()],
      ['Responsável pelo Reporte', `${ab.reportedByName || 'N/A'} (${userRole.toUpperCase()})`]
    ];

    autoTable(doc, {
      startY: 60,
      body: identificationData,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: 'bold', fillColor: [245, 245, 245], cellWidth: 60 } }
    });

    let currentY = (doc as any).lastAutoTable.finalY + 15;

    // Description Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Descrição Detalhada', 15, currentY);
    currentY += 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    const splitDescription = doc.splitTextToSize(ab.description, 180);
    doc.text(splitDescription, 15, currentY);
    currentY += (splitDescription.length * 6) + 15;

    // Evidence Section
    if (ab.photoUrl) {
      if (currentY > 200) {
        doc.addPage();
        currentY = 20;
      }
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 51, 102);
      doc.text('Evidência Fotográfica', 15, currentY);
      currentY += 10;

      try {
        const imgWidth = 120;
        const imgHeight = 120;
        const xOffset = (210 - imgWidth) / 2;
        
        // Determine image format
        const format = ab.photoUrl.includes('png') ? 'PNG' : 'JPEG';
        doc.addImage(ab.photoUrl, format, xOffset, currentY, imgWidth, imgHeight);
      } catch (e) {
        console.error('Error adding image to abnormality PDF:', e);
        doc.setFontSize(10);
        doc.setTextColor(255, 0, 0);
        doc.text('Erro ao carregar a evidência fotográfica no PDF.', 15, currentY + 5);
      }
    }

    doc.save(`Anormalidade_${ab.assetTag || 'Geral'}_${new Date().getTime()}.pdf`);
  };

  const generatePMOConsolidatedPDF = () => {
    const doc = new jsPDF();
    const timestamp = new Date().toLocaleString('pt-BR');
    
    // Header
    doc.setFillColor(0, 51, 102);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('CONSOLIDADO DE PMOs - ALUPAR', 15, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em: ${timestamp}`, 15, 30);
    doc.text(`Responsável: ${userRole.toUpperCase()}`, 15, 35);

    doc.setTextColor(0, 51, 102);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo das Fichas de Manutenção', 15, 55);

    const tableData = pmoReports.map(report => [
      report.substation,
      PMO_TEMPLATES[report.pmoNumber.replace(' ', '-')]?.title || report.pmoNumber,
      report.executor,
      report.date.split('-').reverse().join('/'),
      report.status === 'finalizado' ? 'CONCLUÍDO' : 'RASCUNHO'
    ]);

    autoTable(doc, {
      startY: 65,
      head: [['Subestação', 'Ficha PMO', 'Executor', 'Data', 'Status']],
      body: tableData,
      headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      styles: { fontSize: 9, cellPadding: 3 },
    });

    doc.save(`consolidado_pmo_${new Date().getTime()}.pdf`);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const timestamp = new Date().toLocaleString('pt-BR');
    
    // Header
    doc.setFillColor(0, 51, 102); // #003366
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('RELATÓRIO DE CAMPO - ALUPAR', 15, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em: ${timestamp}`, 15, 30);
    doc.text('Sistema de Gestão de Manutenção em Tempo Real', 15, 35);

    if (activeReport === 'tasks') {
      // Consolidated Tasks Report
      doc.setTextColor(0, 51, 102);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Status das Manutenções (PMOs)', 15, 55);

      const tableData = filteredTasks.map(task => [
        task.assetTag,
        teams.find(t => t.id === task.teamId)?.name || task.teamId,
        task.pmo,
        task.status.toUpperCase().replace('_', ' '),
        new Date(task.updatedAt).toLocaleString('pt-BR')
      ]);

      autoTable(doc, {
        startY: 65,
        head: [['Equipamento', 'Equipe', 'PMO', 'Status', 'Última Atualização']],
        body: tableData,
        headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        styles: { fontSize: 9, cellPadding: 3 },
      });
    } else if (activeReport === 'abnormalities') {
      // Consolidated Abnormalities Report
      doc.setTextColor(0, 51, 102);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Relatório de Anormalidades', 15, 55);

      const tableData = filteredAbnormalities.map(ab => [
        new Date(ab.reportedAt).toLocaleString('pt-BR'),
        teams.find(t => t.id === ab.teamId)?.name || ab.teamId,
        ab.severity.toUpperCase(),
        ab.description
      ]);

      autoTable(doc, {
        startY: 65,
        head: [['Data/Hora', 'Equipe', 'Gravidade', 'Descrição']],
        body: tableData,
        headStyles: { fillColor: [153, 27, 27], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        styles: { fontSize: 9, cellPadding: 3 },
      });
    }

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Página ${i} de ${pageCount}`, 105, 285, { align: 'center' });
    }

    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
    
    const fileName = `Relatorio_${activeReport}_${new Date().getTime()}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <FileText className="text-blue-600" />
            <div>
              <p className="text-[10px] font-black uppercase text-blue-400">Total Fichas PMO</p>
              <p className="text-2xl font-black text-blue-900">{stats.totalPMOs}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-green-600" />
            <div>
              <p className="text-[10px] font-black uppercase text-green-400">Concluídos</p>
              <p className="text-2xl font-black text-green-900">{stats.completed}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-3">
            <Clock className="text-yellow-600" />
            <div>
              <p className="text-[10px] font-black uppercase text-yellow-400">Em Execução</p>
              <p className="text-2xl font-black text-yellow-900">{stats.inProgress}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-red-600" />
            <div>
              <p className="text-[10px] font-black uppercase text-red-400">Pendentes</p>
              <p className="text-2xl font-black text-red-900">{stats.pending}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Relatório de Atividades" className="overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
            <button
              onClick={() => setActiveReport('tasks')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                activeReport === 'tasks' ? 'bg-white text-[#003366] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Status Geral
            </button>
            <button
              onClick={() => setActiveReport('pmo')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                activeReport === 'pmo' ? 'bg-white text-[#003366] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Fichas PMO ({(pmoReports || []).length})
            </button>
            <button
              onClick={() => setActiveReport('abnormalities')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                activeReport === 'abnormalities' ? 'bg-white text-[#003366] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Anormalidades ({(abnormalities || []).length})
            </button>
            <button
              onClick={() => setActiveReport('grounding')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                activeReport === 'grounding' ? 'bg-white text-[#003366] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Aterramentos ({(grounding || []).length})
            </button>
          </div>
          
          <div className="flex gap-4 items-center">
            {activeReport === 'tasks' && (
              <div className="flex gap-2">
                {(['all', 'concluido', 'pendente'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                      filter === f ? 'bg-[#003366] text-white' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                    }`}
                  >
                    {f === 'all' ? 'Todos' : f === 'concluido' ? 'Concluídos' : 'Pendentes'}
                  </button>
                ))}
              </div>
            )}
            {activeReport === 'pmo' && (userRole === 'coordenador' || userRole === 'engenharia') && (
              <Button variant="outline" size="sm" className="gap-2 border-[#003366] text-[#003366]" onClick={generatePMOConsolidatedPDF}>
                <Download size={16} />
                Exportar Consolidado PMO
              </Button>
            )}
            <Button variant="primary" size="sm" className="gap-2" onClick={() => generatePDF()}>
              <Download size={16} />
              {activeReport === 'pmo' ? 'Exportar Lista' : 'Exportar PDF Consolidado'}
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {activeReport === 'tasks' ? (
            filteredTasks.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-500">
                    <th className="p-4 border-b">TAG</th>
                    <th className="p-4 border-b">PMO / DESCRIÇÃO</th>
                    <th className="p-4 border-b">EQUIPE</th>
                    <th className="p-4 border-b">STATUS</th>
                    <th className="p-4 border-b">INÍCIO</th>
                    <th className="p-4 border-b">FIM</th>
                    <th className="p-4 border-b text-center">AÇÕES</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-bold">
                  {filteredTasks.map((task) => {
                    const team = teams.find(t => t.id === task.teamId);
                    const report = pmoReports.find(r => r.taskId === task.id || r.id === task.reportId);
                    
                    return (
                      <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 border-b text-[#003366]">{task.assetTag}</td>
                        <td className="p-4 border-b">
                          <div className="text-[10px] font-black text-[#003366] uppercase leading-tight">
                            {task.pmo.replace('-', ' ')}
                          </div>
                          <div className="text-[8px] font-bold text-gray-400 uppercase">
                            {PMO_TEMPLATES[task.pmo.replace(' ', '-')]?.title || task.pmo}
                          </div>
                        </td>
                        <td className="p-4 border-b">{team?.name || task.teamId}</td>
                        <td className="p-4 border-b">
                          <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-black ${
                            task.status === 'concluido' ? 'bg-green-100 text-green-700' :
                            task.status === 'em_execucao' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {task.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-4 border-b text-gray-500 text-xs">{task.data_inicio || '-'}</td>
                        <td className="p-4 border-b text-gray-500 text-xs">{task.data_fim || '-'}</td>
                        <td className="p-4 border-b text-center">
                          <div className="flex justify-center gap-2">
                            <button 
                              onClick={() => {
                                if (task.status === 'pendente') {
                                  alert('Esta atividade ainda não foi iniciada pela equipe');
                                } else if (report) {
                                  setSelectedPMO(report);
                                } else {
                                  alert('Relatório não encontrado.');
                                }
                              }}
                              className={`p-3 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${
                                task.status === 'pendente' ? 'text-gray-400 hover:bg-gray-50' : 'text-blue-600 hover:bg-blue-50'
                              }`}
                              title="Visualizar Ficha PMO"
                            >
                              <Eye size={20} />
                            </button>
                            <button 
                              onClick={() => {
                                if (task.status === 'pendente') {
                                  alert('Esta atividade ainda não foi iniciada pela equipe');
                                } else if (report) {
                                  generatePMOPDF(report);
                                } else {
                                  alert('Relatório não disponível para download.');
                                }
                              }}
                              className={`p-3 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${
                                task.status === 'pendente' ? 'text-gray-300 opacity-50 cursor-not-allowed' : 'text-green-600 hover:bg-green-50'
                              }`}
                              title="Baixar PDF da PMO"
                            >
                              <Download size={20} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center">
                <FileText size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-400 font-bold">Nenhuma manutenção encontrada.</p>
              </div>
            )
          ) : activeReport === 'pmo' ? (
            filteredPmoReports.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-500">
                    <th className="p-4 border-b">Data</th>
                    <th className="p-4 border-b">Equipamento</th>
                    <th className="p-4 border-b">PMO</th>
                    <th className="p-4 border-b">Equipe</th>
                    <th className="p-4 border-b">Executor</th>
                    <th className="p-4 border-b text-center">AÇÕES</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-bold">
                  {filteredPmoReports.map((report) => {
                    const team = filteredTeams.find(t => t.id === report.teamId);
                    const pmoTitle = PMO_TEMPLATES[report.pmoNumber.replace(' ', '-')]?.title || report.pmoNumber;
                    return (
                      <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 border-b text-gray-400 text-xs">{report.date.split('-').reverse().join('/')}</td>
                        <td className="p-4 border-b text-[#003366]">{report.assetTag}</td>
                        <td className="p-4 border-b text-xs">{pmoTitle}</td>
                        <td className="p-4 border-b">{team?.name || report.teamId}</td>
                        <td className="p-4 border-b text-gray-500">{report.executor}</td>
                        <td className="p-4 border-b text-center">
                          <div className="flex justify-center gap-2">
                            <button 
                              onClick={() => setSelectedPMO(report)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Visualizar Ficha"
                            >
                              <Eye size={18} />
                            </button>
                            <button 
                              onClick={() => generatePMOPDF(report)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Baixar PDF"
                            >
                              <Download size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center">
                <FileText size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-400 font-bold">Nenhum registro encontrado.</p>
              </div>
            )
          ) : activeReport === 'abnormalities' ? (
            filteredAbnormalities.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-500">
                    <th className="p-4 border-b">Data/Hora</th>
                    <th className="p-4 border-b">Equipe</th>
                    <th className="p-4 border-b">Gravidade</th>
                    <th className="p-4 border-b">Descrição</th>
                    <th className="p-4 border-b text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-bold">
                  {filteredAbnormalities.map((ab) => {
                    const team = teams.find(t => t.id === ab.teamId);
                    return (
                      <tr key={ab.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 border-b text-gray-400 text-xs">
                          {new Date(ab.reportedAt).toLocaleString('pt-BR')}
                        </td>
                        <td className="p-4 border-b">{team?.name || ab.teamId}</td>
                        <td className="p-4 border-b">
                          <span className={`px-2 py-0.5 rounded text-[8px] uppercase font-black ${
                            ab.severity === 'critica' ? 'bg-red-600 text-white' :
                            ab.severity === 'alta' ? 'bg-orange-500 text-white' :
                            ab.severity === 'media' ? 'bg-yellow-400 text-white' :
                            'bg-blue-500 text-white'
                          }`}>
                            {ab.severity}
                          </span>
                        </td>
                        <td className="p-4 border-b text-red-600 truncate max-w-[200px]">{ab.description}</td>
                        <td className="p-4 border-b text-center">
                          <div className="flex justify-center gap-2">
                            <button 
                              onClick={() => setSelectedAbnormality(ab)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Visualizar Detalhes"
                            >
                              <Eye size={18} />
                            </button>
                            <button 
                              onClick={() => generateAbnormalityPDF(ab)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Baixar PDF do Reporte"
                            >
                              <Download size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center">
                <AlertCircle size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-400 font-bold">Nenhuma anormalidade reportada.</p>
              </div>
            )
          ) : activeReport === 'grounding' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-500">
                  <th className="p-4 border-b">TAG do Aterramento</th>
                  <th className="p-4 border-b">Equipe Responsável</th>
                  <th className="p-4 border-b">Status</th>
                  <th className="p-4 border-b">Horário de Inserção</th>
                </tr>
              </thead>
              <tbody className="text-sm font-bold">
                {filteredGrounding.map((g) => {
                  const team = filteredTeams.find(t => t.id === g.responsibleTeamId);
                  return (
                    <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 border-b text-[#003366]">{g.id}</td>
                      <td className="p-4 border-b text-gray-500">{team?.name || g.responsibleTeamId}</td>
                      <td className="p-4 border-b">
                        <div className="flex items-center gap-2">
                          {g.status === 'instalado' ? (
                            <CheckSquare className="text-green-600" size={16} />
                          ) : (
                            <Square className="text-gray-300" size={16} />
                          )}
                          <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-black ${
                            g.status === 'instalado' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {g.status === 'instalado' ? 'Inserido' : 'Não Inserido'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 border-b text-gray-400 text-xs">
                        {g.confirmedAt ? new Date(g.confirmedAt).toLocaleTimeString('pt-BR') : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : null}
        </div>
      </Card>

      {/* PMO Detail Modal */}
      {selectedPMO && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="bg-[#001a33] p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">
                  {selectedPMO.pmoNumber.replace('-', ' ')}
                </h3>
                <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mt-1">
                  {PMO_TEMPLATES[selectedPMO.pmoNumber.replace(' ', '-')]?.title || selectedPMO.pmoNumber} • {selectedPMO.assetTag}
                </p>
              </div>
              <button 
                onClick={() => setSelectedPMO(null)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase">Executor</p>
                  <p className="font-bold text-[#003366]">{selectedPMO.executor}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase">Data</p>
                  <p className="font-bold">{new Date(selectedPMO.date).toLocaleDateString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase">Início/Fim</p>
                  <p className="font-bold">{selectedPMO.startTime} - {selectedPMO.endTime}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase">Subestação</p>
                  <p className="font-bold">{selectedPMO.substation}</p>
                </div>
              </div>

              {selectedPMO.technicalData && Object.keys(selectedPMO.technicalData).length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-black uppercase text-sm text-[#003366] border-b-2 border-blue-100 pb-2">Dados Técnicos</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Object.entries(selectedPMO.technicalData).map(([key, value]) => (
                      <div key={key} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-[9px] font-black text-gray-400 uppercase">{key}</p>
                        <p className="text-sm font-bold text-[#003366]">{value || '-'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedPMO.sections.map((section) => (
                <div key={section.title} className="space-y-4">
                  <h4 className="font-black uppercase text-sm text-[#003366] border-b-2 border-blue-100 pb-2">{section.title}</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {section.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl">
                        <span className="text-sm font-bold text-gray-700">{item.description}</span>
                        <div className="flex items-center gap-3">
                          {item.measurement && (
                            <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded">
                              {item.measurement} {item.unit}
                            </span>
                          )}
                          {item.type !== 'measurement' && (
                            <span className={`px-3 py-1 rounded-lg font-black text-xs ${
                              item.status === 'C' ? 'bg-green-100 text-green-700' :
                              item.status === 'NC' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-500'
                            }`}>
                              {item.status || '-'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {selectedPMO.photos.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-black uppercase text-sm text-[#003366] border-b-2 border-blue-100 pb-2">Evidências Fotográficas</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedPMO.photos.map((photo, i) => (
                      <div key={i} className="space-y-2">
                        <div 
                          className="aspect-square rounded-2xl overflow-hidden border-2 border-gray-100 shadow-sm cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => window.open(photo.url, '_blank')}
                        >
                          <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover" />
                        </div>
                        <p className="text-[10px] font-bold text-gray-500 text-center uppercase">{photo.caption}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-50 border-t flex justify-end gap-4">
              <Button variant="outline" onClick={() => setSelectedPMO(null)}>Fechar</Button>
              <Button variant="primary" className="gap-2" onClick={() => generatePMOPDF(selectedPMO)}>
                <Download size={18} />
                Exportar PDF da Ficha
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Abnormality Detail Modal */}
      {selectedAbnormality && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden flex flex-col shadow-2xl">
            <div className="bg-red-600 p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <AlertCircle size={24} />
                <h3 className="text-xl font-black uppercase tracking-tight">Detalhes da Anormalidade</h3>
              </div>
              <button 
                onClick={() => setSelectedAbnormality(null)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Reportado Por</p>
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-gray-400" />
                    <p className="font-bold text-[#003366]">{selectedAbnormality.reportedByName || selectedAbnormality.reportedBy}</p>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Data/Hora</p>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400" />
                    <p className="font-bold">{new Date(selectedAbnormality.reportedAt).toLocaleString('pt-BR')}</p>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Equipe</p>
                  <p className="font-bold">{teams.find(t => t.id === selectedAbnormality.teamId)?.name || selectedAbnormality.teamId}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-1">TAG Equipamento</p>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-gray-400" />
                    <p className="font-bold text-red-600">{selectedAbnormality.assetTag || 'Não informada'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black text-gray-400 uppercase">Descrição Completa</p>
                <div className="p-6 bg-red-50 rounded-2xl border border-red-100">
                  <p className="text-sm font-bold text-red-900 leading-relaxed">{selectedAbnormality.description}</p>
                </div>
              </div>

              {selectedAbnormality.photoUrl && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase">Evidência Fotográfica</p>
                  <div 
                    className="w-full h-64 rounded-2xl overflow-hidden border-2 border-gray-100 shadow-sm cursor-pointer"
                    onClick={() => window.open(selectedAbnormality.photoUrl, '_blank')}
                  >
                    <img src={selectedAbnormality.photoUrl} alt="Evidência" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-50 border-t flex justify-end">
              <Button variant="outline" onClick={() => setSelectedAbnormality(null)}>Fechar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
