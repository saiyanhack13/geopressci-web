import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/types';
import { toast } from 'react-hot-toast';
import {
  Bell,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  Settings
} from 'lucide-react';

import Button from '../ui/Button';
import { appointmentService, Appointment } from '../../services/appointmentService';

interface NotificationItem {
  id: string;
  type: 'reminder' | 'status_change' | 'cancellation' | 'reschedule';
  title: string;
  message: string;
  appointment?: Appointment;
  timestamp: Date;
  read: boolean;
  urgent: boolean;
}

interface AppointmentNotificationsProps {
  className?: string;
}

const AppointmentNotifications: React.FC<AppointmentNotificationsProps> = ({ className }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    if (user && notificationsEnabled) {
      // Simuler des notifications en temps réel
      const interval = setInterval(() => {
        checkForNewNotifications();
      }, 30000); // Vérifier toutes les 30 secondes

      // Vérification initiale
      checkForNewNotifications();
      
      return () => clearInterval(interval);
    }
  }, [user, notificationsEnabled]);

  const checkForNewNotifications = async () => {
    if (!user) return;

    try {
      // Récupérer les rendez-vous à venir
      const response = await appointmentService.getAppointments({
        client: user._id,
        status: 'confirmed',
        startDate: new Date().toISOString(),
        sortBy: 'appointmentDate',
        sortOrder: 'asc',
        limit: 10
      });

      const upcomingAppointments = response.appointments;
      const now = new Date();
      const newNotifications: NotificationItem[] = [];

      upcomingAppointments.forEach(appointment => {
        const appointmentTime = new Date(appointment.appointmentDate);
        const timeDiff = appointmentTime.getTime() - now.getTime();
        const hoursUntil = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutesUntil = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

        // Rappel 24h avant
        if (hoursUntil === 24 && minutesUntil <= 5) {
          newNotifications.push(createReminderNotification(appointment, '24h'));
        }
        
        // Rappel 2h avant
        if (hoursUntil === 2 && minutesUntil <= 5) {
          newNotifications.push(createReminderNotification(appointment, '2h'));
        }
        
        // Rappel 30min avant
        if (hoursUntil === 0 && minutesUntil === 30) {
          newNotifications.push(createReminderNotification(appointment, '30min'));
        }
      });

      if (newNotifications.length > 0) {
        setNotifications(prev => [...newNotifications, ...prev]);
        
        // Afficher les notifications toast
        newNotifications.forEach(notification => {
          if (notification.urgent) {
            toast(notification.message, {
              icon: '🔔',
              duration: 6000,
              position: 'top-right'
            });
          }
          
          // Son de notification si activé
          if (soundEnabled) {
            playNotificationSound();
          }
        });
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des notifications:', error);
    }
  };

  const createReminderNotification = (appointment: Appointment, timeframe: string): NotificationItem => {
    const pressingName = typeof appointment.pressing === 'object' 
      ? appointment.pressing.businessName 
      : 'Pressing';
    
    const timeLabels = {
      '24h': { label: '24 heures', urgent: false },
      '2h': { label: '2 heures', urgent: true },
      '30min': { label: '30 minutes', urgent: true }
    };

    const { label, urgent } = timeLabels[timeframe as keyof typeof timeLabels];

    return {
      id: `reminder-${appointment._id}-${timeframe}`,
      type: 'reminder',
      title: `Rappel de rendez-vous`,
      message: `Votre rendez-vous chez ${pressingName} est dans ${label}`,
      appointment,
      timestamp: new Date(),
      read: false,
      urgent
    };
  };

  const playNotificationSound = () => {
    // Créer un son de notification simple
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const removeNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'reminder':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'status_change':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancellation':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'reschedule':
        return <Calendar className="w-5 h-5 text-orange-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className={`relative ${className}`}>
      {/* Bouton de notification */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel de notifications */}
      {showNotifications && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications ({unreadCount})
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`p-1 rounded ${
                  notificationsEnabled ? 'text-blue-600' : 'text-gray-400'
                }`}
                title={notificationsEnabled ? 'Désactiver les notifications' : 'Activer les notifications'}
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowNotifications(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Liste des notifications */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p>Aucune notification</p>
                <p className="text-sm">Vous serez notifié des rappels de rendez-vous</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className={`text-sm font-medium ${
                            !notification.read ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </h4>
                          <button
                            onClick={() => removeNotification(notification.id)}
                            className="text-gray-400 hover:text-gray-600 ml-2"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        
                        <p className={`text-sm ${
                          !notification.read ? 'text-gray-800' : 'text-gray-600'
                        }`}>
                          {notification.message}
                        </p>
                        
                        {notification.appointment && (
                          <div className="mt-2 text-xs text-gray-500">
                            📅 {appointmentService.formatAppointmentDateTime(notification.appointment)}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400">
                            {notification.timestamp.toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              Marquer comme lu
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={soundEnabled}
                      onChange={(e) => setSoundEnabled(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Son
                  </label>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllNotifications}
                  className="text-xs"
                >
                  Tout effacer
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AppointmentNotifications;
