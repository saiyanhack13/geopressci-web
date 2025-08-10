import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'warning' | 'error';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface SecurityMetrics {
  totalLogins: number;
  failedLogins: number;
  suspiciousActivities: number;
  blockedIPs: number;
  activeAdmins: number;
  lastBackup: string;
  systemUptime: number;
  securityScore: number;
}

interface SecurityAlerts {
  id: string;
  type: 'login_failure' | 'suspicious_activity' | 'data_breach' | 'system_error';
  message: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  assignedTo?: string;
}

interface SecurityAuditProps {
  className?: string;
}

export const SecurityAudit: React.FC<SecurityAuditProps> = ({ className = "" }) => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics>({
    totalLogins: 0,
    failedLogins: 0,
    suspiciousActivities: 0,
    blockedIPs: 0,
    activeAdmins: 0,
    lastBackup: '',
    systemUptime: 0,
    securityScore: 0
  });
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlerts[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'logs' | 'metrics' | 'alerts'>('logs');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');

  useEffect(() => {
    const fetchSecurityData = async () => {
      try {
        // Simulation des données - à remplacer par les vraies API calls
        setTimeout(() => {
          setSecurityMetrics({
            totalLogins: 1247,
            failedLogins: 23,
            suspiciousActivities: 5,
            blockedIPs: 12,
            activeAdmins: 3,
            lastBackup: '2024-01-19 02:00:00',
            systemUptime: 99.8,
            securityScore: 87
          });

          setAuditLogs([
            {
              id: '1',
              timestamp: '2024-01-19 14:30:25',
              userId: 'admin_001',
              userName: 'Admin Principal',
              action: 'USER_SUSPEND',
              resource: 'users/12345',
              details: 'Suspension utilisateur pour activité suspecte',
              ipAddress: '192.168.1.100',
              userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
              status: 'success',
              severity: 'medium'
            },
            {
              id: '2',
              timestamp: '2024-01-19 14:25:12',
              userId: 'admin_002',
              userName: 'Admin Finances',
              action: 'PAYMENT_REFUND',
              resource: 'payments/67890',
              details: 'Remboursement transaction litigieuse',
              ipAddress: '192.168.1.101',
              userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
              status: 'success',
              severity: 'high'
            },
            {
              id: '3',
              timestamp: '2024-01-19 14:20:45',
              userId: 'system',
              userName: 'Système',
              action: 'LOGIN_FAILURE',
              resource: 'auth/login',
              details: 'Tentative de connexion échouée - mot de passe incorrect',
              ipAddress: '45.123.45.67',
              userAgent: 'curl/7.68.0',
              status: 'error',
              severity: 'medium'
            },
            {
              id: '4',
              timestamp: '2024-01-19 14:15:30',
              userId: 'admin_001',
              userName: 'Admin Principal',
              action: 'PRESSING_APPROVE',
              resource: 'pressings/54321',
              details: 'Validation nouveau pressing "Clean Express 2"',
              ipAddress: '192.168.1.100',
              userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
              status: 'success',
              severity: 'low'
            },
            {
              id: '5',
              timestamp: '2024-01-19 14:10:15',
              userId: 'system',
              userName: 'Système',
              action: 'BACKUP_COMPLETE',
              resource: 'system/backup',
              details: 'Sauvegarde automatique terminée avec succès',
              ipAddress: 'localhost',
              userAgent: 'System/1.0',
              status: 'success',
              severity: 'low'
            }
          ]);

          setSecurityAlerts([
            {
              id: '1',
              type: 'suspicious_activity',
              message: 'Tentatives de connexion multiples depuis IP suspecte',
              timestamp: '2024-01-19 14:20:45',
              severity: 'high',
              resolved: false,
              assignedTo: 'admin_001'
            },
            {
              id: '2',
              type: 'login_failure',
              message: '5 tentatives de connexion échouées en 10 minutes',
              timestamp: '2024-01-19 13:45:30',
              severity: 'medium',
              resolved: true,
              assignedTo: 'admin_002'
            },
            {
              id: '3',
              type: 'system_error',
              message: 'Erreur de connexion base de données (récupérée)',
              timestamp: '2024-01-19 12:30:15',
              severity: 'medium',
              resolved: true
            }
          ]);

          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Erreur lors du chargement des données de sécurité:', error);
        setLoading(false);
      }
    };

    fetchSecurityData();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '📊';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'login_failure': return '🔐';
      case 'suspicious_activity': return '🚨';
      case 'data_breach': return '💥';
      case 'system_error': return '⚙️';
      default: return '🔔';
    }
  };

  const formatUptime = (uptime: number) => {
    return `${uptime.toFixed(2)}%`;
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredLogs = auditLogs.filter(log => 
    filterSeverity === 'all' || log.severity === filterSeverity
  );

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Score Sécurité</p>
                <p className={`text-2xl font-bold ${getSecurityScoreColor(securityMetrics.securityScore)}`}>
                  {securityMetrics.securityScore}/100
                </p>
              </div>
              <div className="text-2xl">🛡️</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Uptime Système</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatUptime(securityMetrics.systemUptime)}
                </p>
              </div>
              <div className="text-2xl">⚡</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Connexions Échouées</p>
                <p className="text-2xl font-bold text-red-600">
                  {securityMetrics.failedLogins}
                </p>
              </div>
              <div className="text-2xl">🚫</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">IPs Bloquées</p>
                <p className="text-2xl font-bold text-orange-600">
                  {securityMetrics.blockedIPs}
                </p>
              </div>
              <div className="text-2xl">🔒</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'logs', label: '📋 Logs d\'Audit', icon: '📋' },
            { id: 'metrics', label: '📊 Métriques', icon: '📊' },
            { id: 'alerts', label: '🚨 Alertes', icon: '🚨' }
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

      {/* Audit Logs */}
      {activeTab === 'logs' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>📋 Journal d'Audit</CardTitle>
              <div className="flex gap-2">
                <select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value as any)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">Toutes les sévérités</option>
                  <option value="critical">🔴 Critique</option>
                  <option value="high">🟠 Élevée</option>
                  <option value="medium">🟡 Moyenne</option>
                  <option value="low">🟢 Faible</option>
                </select>
                <button className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
                  📤 Exporter
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <span className="text-lg">{getStatusIcon(log.status)}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{log.action}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(log.severity)}`}>
                            {log.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{log.details}</p>
                        <div className="text-xs text-gray-500 space-y-1">
                          <div>👤 {log.userName} ({log.userId})</div>
                          <div>🌐 {log.ipAddress}</div>
                          <div>🕒 {log.timestamp}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Metrics */}
      {activeTab === 'metrics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>📊 Métriques de Connexion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total connexions</span>
                  <span className="font-bold text-blue-600">{securityMetrics.totalLogins}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Connexions échouées</span>
                  <span className="font-bold text-red-600">{securityMetrics.failedLogins}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Activités suspectes</span>
                  <span className="font-bold text-orange-600">{securityMetrics.suspiciousActivities}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Admins actifs</span>
                  <span className="font-bold text-green-600">{securityMetrics.activeAdmins}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>💾 Sauvegarde & Système</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Dernière sauvegarde</span>
                  <span className="font-bold text-green-600">
                    {new Date(securityMetrics.lastBackup).toLocaleString('fr-FR')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Uptime système</span>
                  <span className="font-bold text-green-600">
                    {formatUptime(securityMetrics.systemUptime)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">IPs bloquées</span>
                  <span className="font-bold text-red-600">{securityMetrics.blockedIPs}</span>
                </div>
                <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  🔄 Lancer Sauvegarde
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Security Alerts */}
      {activeTab === 'alerts' && (
        <Card>
          <CardHeader>
            <CardTitle>🚨 Alertes de Sécurité</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {securityAlerts.map((alert) => (
                <div key={alert.id} className={`border rounded-lg p-4 ${
                  alert.resolved ? 'border-gray-200 bg-gray-50' : 'border-red-200 bg-red-50'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <span className="text-lg">{getAlertIcon(alert.type)}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                            {alert.severity.toUpperCase()}
                          </span>
                          {alert.resolved && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                              RÉSOLU
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-900 mb-2">{alert.message}</p>
                        <div className="text-xs text-gray-500">
                          🕒 {alert.timestamp}
                          {alert.assignedTo && (
                            <span className="ml-2">👤 Assigné à: {alert.assignedTo}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {!alert.resolved && (
                      <button className="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700">
                        ✅ Résoudre
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SecurityAudit;
