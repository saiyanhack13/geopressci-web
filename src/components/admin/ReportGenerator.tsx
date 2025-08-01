import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'financial' | 'operational' | 'user' | 'performance';
  icon: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  lastGenerated?: string;
  autoGenerate: boolean;
}

interface ReportData {
  id: string;
  name: string;
  type: string;
  generatedAt: string;
  period: string;
  status: 'generating' | 'completed' | 'failed';
  fileSize: string;
  downloadUrl?: string;
}

interface ReportFilters {
  dateFrom: string;
  dateTo: string;
  includeUsers: boolean;
  includePressings: boolean;
  includeOrders: boolean;
  includePayments: boolean;
  includeAnalytics: boolean;
  format: 'pdf' | 'excel' | 'csv';
  language: 'fr' | 'en';
}

interface ReportGeneratorProps {
  className?: string;
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ className = "" }) => {
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([]);
  const [generatedReports, setGeneratedReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'templates' | 'generated' | 'custom'>('templates');
  
  const [customFilters, setCustomFilters] = useState<ReportFilters>({
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    includeUsers: true,
    includePressings: true,
    includeOrders: true,
    includePayments: true,
    includeAnalytics: true,
    format: 'pdf',
    language: 'fr'
  });

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        // Simulation des données - à remplacer par les vraies API calls
        setTimeout(() => {
          setReportTemplates([
            {
              id: 'financial_monthly',
              name: 'Rapport Financier Mensuel',
              description: 'Revenus, commissions, paiements et analyses financières',
              type: 'financial',
              icon: '💰',
              frequency: 'monthly',
              lastGenerated: '2024-01-15 09:00:00',
              autoGenerate: true
            },
            {
              id: 'user_activity',
              name: 'Activité Utilisateurs',
              description: 'Inscriptions, activité, rétention et engagement',
              type: 'user',
              icon: '👥',
              frequency: 'weekly',
              lastGenerated: '2024-01-18 10:30:00',
              autoGenerate: true
            },
            {
              id: 'pressing_performance',
              name: 'Performance Pressings',
              description: 'Classements, revenus, notes et croissance',
              type: 'performance',
              icon: '🏪',
              frequency: 'monthly',
              lastGenerated: '2024-01-10 14:15:00',
              autoGenerate: false
            },
            {
              id: 'operational_summary',
              name: 'Résumé Opérationnel',
              description: 'Commandes, livraisons, problèmes et KPIs',
              type: 'operational',
              icon: '📊',
              frequency: 'daily',
              lastGenerated: '2024-01-19 08:00:00',
              autoGenerate: true
            },
            {
              id: 'quarterly_review',
              name: 'Bilan Trimestriel',
              description: 'Analyse complète des performances trimestrielles',
              type: 'financial',
              icon: '📈',
              frequency: 'quarterly',
              lastGenerated: '2024-01-01 12:00:00',
              autoGenerate: false
            }
          ]);

          setGeneratedReports([
            {
              id: '1',
              name: 'Rapport Financier - Janvier 2024',
              type: 'financial',
              generatedAt: '2024-01-19 09:00:00',
              period: '01/01/2024 - 31/01/2024',
              status: 'completed',
              fileSize: '2.4 MB',
              downloadUrl: '/reports/financial_jan_2024.pdf'
            },
            {
              id: '2',
              name: 'Activité Utilisateurs - Semaine 3',
              type: 'user',
              generatedAt: '2024-01-18 10:30:00',
              period: '15/01/2024 - 21/01/2024',
              status: 'completed',
              fileSize: '1.8 MB',
              downloadUrl: '/reports/users_week3_2024.pdf'
            },
            {
              id: '3',
              name: 'Résumé Opérationnel - 19/01/2024',
              type: 'operational',
              generatedAt: '2024-01-19 08:00:00',
              period: '19/01/2024',
              status: 'completed',
              fileSize: '856 KB',
              downloadUrl: '/reports/operational_daily_19012024.pdf'
            },
            {
              id: '4',
              name: 'Performance Pressings - Décembre 2023',
              type: 'performance',
              generatedAt: '2024-01-15 14:15:00',
              period: '01/12/2023 - 31/12/2023',
              status: 'generating',
              fileSize: '-'
            }
          ]);

          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Erreur lors du chargement des rapports:', error);
        setLoading(false);
      }
    };

    fetchReportData();
  }, []);

  const handleGenerateReport = async (templateId: string) => {
    setGenerating(templateId);
    try {
      // Simulation de génération - à remplacer par les vraies API calls
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Ajouter le nouveau rapport à la liste
      const template = reportTemplates.find(t => t.id === templateId);
      if (template) {
        const newReport: ReportData = {
          id: Date.now().toString(),
          name: `${template.name} - ${new Date().toLocaleDateString('fr-FR')}`,
          type: template.type,
          generatedAt: new Date().toISOString(),
          period: `${customFilters.dateFrom} - ${customFilters.dateTo}`,
          status: 'completed',
          fileSize: '1.2 MB',
          downloadUrl: `/reports/${templateId}_${Date.now()}.pdf`
        };
        
        setGeneratedReports(prev => [newReport, ...prev]);
      }
    } catch (error) {
      console.error('Erreur lors de la génération:', error);
    } finally {
      setGenerating(null);
    }
  };

  const handleGenerateCustomReport = async () => {
    setGenerating('custom');
    try {
      // Simulation de génération personnalisée
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      const newReport: ReportData = {
        id: Date.now().toString(),
        name: `Rapport Personnalisé - ${new Date().toLocaleDateString('fr-FR')}`,
        type: 'custom',
        generatedAt: new Date().toISOString(),
        period: `${customFilters.dateFrom} - ${customFilters.dateTo}`,
        status: 'completed',
        fileSize: '3.1 MB',
        downloadUrl: `/reports/custom_${Date.now()}.${customFilters.format}`
      };
      
      setGeneratedReports(prev => [newReport, ...prev]);
      setActiveTab('generated');
    } catch (error) {
      console.error('Erreur lors de la génération:', error);
    } finally {
      setGenerating(null);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'financial': return '💰';
      case 'operational': return '📊';
      case 'user': return '👥';
      case 'performance': return '🏪';
      default: return '📄';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'generating': return 'text-yellow-600 bg-yellow-50';
      case 'failed': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'Quotidien';
      case 'weekly': return 'Hebdomadaire';
      case 'monthly': return 'Mensuel';
      case 'quarterly': return 'Trimestriel';
      case 'yearly': return 'Annuel';
      default: return frequency;
    }
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'templates', label: '📋 Modèles', icon: '📋' },
            { id: 'generated', label: '📄 Rapports Générés', icon: '📄' },
            { id: 'custom', label: '⚙️ Rapport Personnalisé', icon: '⚙️' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Report Templates */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span className="text-2xl">{template.icon}</span>
                  {template.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Fréquence:</span>
                    <span className="font-medium">{getFrequencyLabel(template.frequency)}</span>
                  </div>
                  {template.lastGenerated && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Dernière génération:</span>
                      <span className="font-medium">
                        {new Date(template.lastGenerated).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Auto-génération:</span>
                    <span className={`font-medium ${template.autoGenerate ? 'text-green-600' : 'text-gray-600'}`}>
                      {template.autoGenerate ? '✅ Activée' : '❌ Désactivée'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleGenerateReport(template.id)}
                  disabled={generating === template.id}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {generating === template.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Génération...
                    </>
                  ) : (
                    <>
                      📊 Générer Rapport
                    </>
                  )}
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Generated Reports */}
      {activeTab === 'generated' && (
        <Card>
          <CardHeader>
            <CardTitle>📄 Rapports Générés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {generatedReports.map((report) => (
                <div key={report.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getTypeIcon(report.type)}</span>
                      <div>
                        <h4 className="font-medium text-gray-900">{report.name}</h4>
                        <div className="text-sm text-gray-500 space-y-1">
                          <div>📅 Période: {report.period}</div>
                          <div>🕒 Généré: {new Date(report.generatedAt).toLocaleString('fr-FR')}</div>
                          <div>📁 Taille: {report.fileSize}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                        {report.status === 'completed' ? 'Terminé' : 
                         report.status === 'generating' ? 'En cours' : 'Échoué'}
                      </span>
                      {report.status === 'completed' && report.downloadUrl && (
                        <button className="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700">
                          📥 Télécharger
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom Report */}
      {activeTab === 'custom' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>⚙️ Configuration du Rapport</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de début
                  </label>
                  <input
                    type="date"
                    value={customFilters.dateFrom}
                    onChange={(e) => setCustomFilters({...customFilters, dateFrom: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    value={customFilters.dateTo}
                    onChange={(e) => setCustomFilters({...customFilters, dateTo: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Content Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contenu à inclure
                </label>
                <div className="space-y-2">
                  {[
                    { key: 'includeUsers', label: '👥 Données utilisateurs' },
                    { key: 'includePressings', label: '🏪 Données pressings' },
                    { key: 'includeOrders', label: '📦 Données commandes' },
                    { key: 'includePayments', label: '💳 Données paiements' },
                    { key: 'includeAnalytics', label: '📊 Analytics avancées' }
                  ].map((option) => (
                    <label key={option.key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={customFilters[option.key as keyof ReportFilters] as boolean}
                        onChange={(e) => setCustomFilters({
                          ...customFilters,
                          [option.key]: e.target.checked
                        })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Format and Language */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Format
                  </label>
                  <select
                    value={customFilters.format}
                    onChange={(e) => setCustomFilters({...customFilters, format: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="pdf">📄 PDF</option>
                    <option value="excel">📊 Excel</option>
                    <option value="csv">📋 CSV</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Langue
                  </label>
                  <select
                    value={customFilters.language}
                    onChange={(e) => setCustomFilters({...customFilters, language: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="fr">🇫🇷 Français</option>
                    <option value="en">🇺🇸 English</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleGenerateCustomReport}
                disabled={generating === 'custom'}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {generating === 'custom' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Génération en cours...
                  </>
                ) : (
                  <>
                    🚀 Générer Rapport Personnalisé
                  </>
                )}
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>📋 Aperçu du Rapport</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Période sélectionnée</h4>
                  <p className="text-sm text-gray-600">
                    Du {new Date(customFilters.dateFrom).toLocaleDateString('fr-FR')} au {new Date(customFilters.dateTo).toLocaleDateString('fr-FR')}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Sections incluses</h4>
                  <div className="space-y-1">
                    {customFilters.includeUsers && <div className="text-sm text-gray-600">✅ Données utilisateurs</div>}
                    {customFilters.includePressings && <div className="text-sm text-gray-600">✅ Données pressings</div>}
                    {customFilters.includeOrders && <div className="text-sm text-gray-600">✅ Données commandes</div>}
                    {customFilters.includePayments && <div className="text-sm text-gray-600">✅ Données paiements</div>}
                    {customFilters.includeAnalytics && <div className="text-sm text-gray-600">✅ Analytics avancées</div>}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Format de sortie</h4>
                  <p className="text-sm text-gray-600">
                    {customFilters.format.toUpperCase()} en {customFilters.language === 'fr' ? 'Français' : 'English'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ReportGenerator;
