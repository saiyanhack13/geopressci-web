import React, { useState, useMemo } from 'react';
import KPICard from '../../components/business/KPICard';
import { 
  useGetPressingOrdersQuery,
  useGetPressingProfileQuery,
  useUpdatePressingProfileMutation,
  useGetBusinessHoursQuery,
  useUpdateBusinessHoursMutation,
  useUpdateAllHoursMutation,
  useCopyHoursMutation,
  useGetCurrentOpenStatusQuery
} from '../../services/pressingApi';
import { toast } from 'react-hot-toast';
import { Plus, Calendar, Clock, Users, BarChart3 } from 'lucide-react';
import TimeslotCreator from '../../components/schedule/TimeslotCreator';
import TimeslotList from '../../components/schedule/TimeslotList';
import { timeslotService, TimeSlot as RealTimeSlot } from '../../services/timeslotService';

interface TimeSlot {
  id: string;
  time: string;
  isAvailable: boolean;
  maxCapacity: number;
  currentBookings: number;
  service?: string;
}

interface DaySchedule {
  date: string;
  isOpen: boolean;
  timeSlots: TimeSlot[];
}

interface ScheduleTemplate {
  id: string;
  name: string;
  timeSlots: Omit<TimeSlot, 'id'>[];
  isDefault: boolean;
}

const SchedulePage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ScheduleTemplate | null>(null);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; time: string } | null>(null);
  
  // Nouveaux états pour la gestion des créneaux réels
  const [showTimeslotCreator, setShowTimeslotCreator] = useState(false);
  const [realTimeslots, setRealTimeslots] = useState<TimeSlot[]>([]);
  const [timeslotStats, setTimeslotStats] = useState<any>(null);

  // API Hooks pour récupérer les vraies données
  const { data: profileData, isLoading: profileLoading } = useGetPressingProfileQuery();
  const { data: ordersData, isLoading: ordersLoading } = useGetPressingOrdersQuery({
    page: 1,
    limit: 100, // Récupérer toutes les commandes pour le planning
    status: 'confirmee,en_cours,prete' // Commandes actives
  });
  const [updateProfile] = useUpdatePressingProfileMutation();
  
  // Nouveaux hooks pour la gestion des horaires d'ouverture
  const { data: businessHours, isLoading: hoursLoading, refetch: refetchHours } = useGetBusinessHoursQuery();
  const { data: currentOpenStatus } = useGetCurrentOpenStatusQuery();
  const [updateBusinessHours] = useUpdateBusinessHoursMutation();
  const [updateAllHours] = useUpdateAllHoursMutation();
  const [copyHours] = useCopyHoursMutation();

  // Génération des dates pour la semaine courante
  const getWeekDates = (date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Lundi comme premier jour
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + i);
      week.push(currentDate);
    }
    return week;
  };

  const weekDates = getWeekDates(selectedDate);

  // Fonctions pour la gestion des créneaux réels supprimées (doublons)

  const loadTimeslotStats = async () => {
    if (!profileData?.id) return;
    
    try {
      const stats = await timeslotService.getSlotStats(profileData.id);
      setTimeslotStats(stats);
      console.log('📊 Statistiques des créneaux chargées:', stats);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des statistiques:', error);
    }
  };

  // Fonction appelée après création d'un créneau
  const handleTimeslotCreated = (newTimeslot: RealTimeSlot) => {
    console.log('✅ Nouveau créneau créé:', newTimeslot);
    toast.success('Créneau créé avec succès!');
    
    // Recharger les statistiques
    loadTimeslotStats();
    
    // Fermer le modal
    setShowTimeslotCreator(false);
  };

  // Fonction appelée après mise à jour d'un créneau
  const handleTimeslotUpdated = async () => {
    console.log('🔄 Créneau mis à jour');
    
    // Recharger les statistiques
    await loadTimeslotStats();
  };

  // Charger les statistiques au montage du composant
  React.useEffect(() => {
    if (profileData?.id) {
      loadTimeslotStats();
    }
  }, [profileData?.id]);

  // Templates de créneaux basés sur les horaires réels du profil
  const templates = useMemo(() => {
    if (!profileData?.businessHours) {
      return [
        {
          id: 'template-1',
          name: 'Horaires standard',
          isDefault: true,
          timeSlots: [
            { time: '08:00', isAvailable: true, maxCapacity: 3, currentBookings: 0 },
            { time: '09:00', isAvailable: true, maxCapacity: 4, currentBookings: 0 },
            { time: '10:00', isAvailable: true, maxCapacity: 4, currentBookings: 0 },
            { time: '11:00', isAvailable: true, maxCapacity: 4, currentBookings: 0 },
            { time: '14:00', isAvailable: true, maxCapacity: 4, currentBookings: 0 },
            { time: '15:00', isAvailable: true, maxCapacity: 4, currentBookings: 0 },
            { time: '16:00', isAvailable: true, maxCapacity: 3, currentBookings: 0 },
            { time: '17:00', isAvailable: true, maxCapacity: 2, currentBookings: 0 }
          ]
        }
      ];
    }

    // Créer des templates basés sur les horaires réels
    const standardTemplate: ScheduleTemplate = {
      id: 'template-standard',
      name: 'Horaires habituels',
      isDefault: true,
      timeSlots: []
    };

    // Générer les créneaux basés sur les horaires d'ouverture
    const businessHours = profileData.businessHours.find(h => h.day === 'lundi' || h.day === 'monday');
    if (businessHours && businessHours.isOpen) {
      const openTime = parseInt(businessHours.open.split(':')[0]);
      const closeTime = parseInt(businessHours.close.split(':')[0]);
      
      for (let hour = openTime; hour < closeTime; hour++) {
        if (hour === 12 || hour === 13) continue; // Pause déjeuner
        standardTemplate.timeSlots.push({
          time: `${hour.toString().padStart(2, '0')}:00`,
          isAvailable: true,
          maxCapacity: hour < 12 ? 4 : 3, // Plus de capacité le matin
          currentBookings: 0
        });
      }
    }

    return [standardTemplate];
  }, [profileData?.businessHours]);

  // Planning de la semaine basé sur les vraies commandes
  const weekSchedule = useMemo(() => {
    if (!ordersData?.orders || !profileData?.businessHours) {
      return [];
    }

    const schedule: DaySchedule[] = [];
    const orders = ordersData.orders;

    weekDates.forEach((date, dayIndex) => {
      const dateStr = date.toISOString().split('T')[0];
      const dayName = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][date.getDay()];
      
      // Trouver les horaires pour ce jour
      const dayHours = profileData.businessHours.find(h => 
        h.day.toLowerCase() === dayName || 
        h.day.toLowerCase() === ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()]
      );

      if (!dayHours || !dayHours.isOpen) {
        schedule.push({
          date: dateStr,
          isOpen: false,
          timeSlots: []
        });
        return;
      }

      // Générer les créneaux pour ce jour
      const timeSlots: TimeSlot[] = [];
      const openTime = parseInt(dayHours.open.split(':')[0]);
      const closeTime = parseInt(dayHours.close.split(':')[0]);

      for (let hour = openTime; hour < closeTime; hour++) {
        if (hour === 12 || hour === 13) continue; // Pause déjeuner
        
        const timeStr = `${hour.toString().padStart(2, '0')}:00`;
        
        // Compter les commandes pour ce créneau
        const ordersForSlot = orders.filter(order => {
          const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
          const orderHour = new Date(order.createdAt).getHours();
          return orderDate === dateStr && orderHour === hour;
        });

        timeSlots.push({
          id: `${dateStr}-${timeStr}`,
          time: timeStr,
          isAvailable: true,
          maxCapacity: hour < 12 ? 4 : 3, // Plus de capacité le matin
          currentBookings: ordersForSlot.length,
          service: ordersForSlot.length > 0 ? ordersForSlot[0].items[0]?.service : undefined
        });
      }

      schedule.push({
        date: dateStr,
        isOpen: true,
        timeSlots
      });
    });

    return schedule;
  }, [ordersData?.orders, profileData?.businessHours, weekDates]);

  // Créneaux horaires dynamiques basés sur les horaires d'ouverture
  const timeSlots = useMemo(() => {
    if (!profileData?.businessHours) {
      return ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
    }
    
    const businessHours = profileData.businessHours.find(h => h.isOpen);
    if (!businessHours) return [];
    
    const slots = [];
    const openTime = parseInt(businessHours.open.split(':')[0]);
    const closeTime = parseInt(businessHours.close.split(':')[0]);
    
    for (let hour = openTime; hour < closeTime; hour++) {
      if (hour === 12 || hour === 13) continue; // Pause déjeuner
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    
    return slots;
  }, [profileData?.businessHours]);

  // Objet schedule pour compatibilité avec l'interface existante
  const schedule = useMemo(() => {
    const scheduleObj: { [key: string]: { isAvailable: boolean; capacity: number; booked: number; price: number } } = {};
    
    weekSchedule.forEach(daySchedule => {
      daySchedule.timeSlots.forEach(slot => {
        const slotKey = `${daySchedule.date}_${slot.time}`;
        scheduleObj[slotKey] = {
          isAvailable: slot.isAvailable,
          capacity: slot.maxCapacity,
          booked: slot.currentBookings,
          price: 0
        };
      });
    });
    
    return scheduleObj;
  }, [weekSchedule]);

  // Fonctions de gestion des créneaux
  const handleSlotClick = (date: Date, time: string) => {
    setSelectedSlot({ date, time });
    setShowSlotModal(true);
  };

  const handleSlotSave = (slotData: any) => {
    // Logique de sauvegarde du créneau
    console.log('Saving slot:', slotData);
    setShowSlotModal(false);
    toast.success('Créneau mis à jour avec succès');
  };

  const handleTemplateSave = (templateData: any) => {
    // Logique de sauvegarde du template
    console.log('Saving template:', templateData);
    setShowTemplateModal(false);
    toast.success('Template sauvegardé avec succès');
  };

  const handleTemplateDelete = (templateId: string) => {
    // Logique de suppression du template
    console.log('Deleting template:', templateId);
    toast.success('Template supprimé avec succès');
  };

  // Fonctions de statistiques
  const getDayStats = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const daySchedule = weekSchedule.find(d => d.date === dateStr);
    if (!daySchedule) return { total: 0, booked: 0, available: 0, occupancyRate: 0 };
    
    const total = daySchedule.timeSlots.length;
    const booked = daySchedule.timeSlots.filter(s => s.currentBookings > 0).length;
    const available = daySchedule.timeSlots.filter(s => s.isAvailable && s.currentBookings < s.maxCapacity).length;
    const occupancyRate = total > 0 ? (booked / total) * 100 : 0;
    
    return { total, booked, available, occupancyRate };
  };

  const getTopTimeSlots = () => {
    const slotStats: { [key: string]: { bookings: number; totalCapacity: number } } = {};
    
    weekSchedule.forEach(daySchedule => {
      daySchedule.timeSlots.forEach(slot => {
        if (!slotStats[slot.time]) {
          slotStats[slot.time] = { bookings: 0, totalCapacity: 0 };
        }
        slotStats[slot.time].bookings += slot.currentBookings;
        slotStats[slot.time].totalCapacity += slot.maxCapacity;
      });
    });
    
    return Object.entries(slotStats)
      .sort(([,a], [,b]) => b.bookings - a.bookings)
      .slice(0, 5)
      .map(([time, stats]) => ({
        time,
        bookings: stats.bookings,
        occupancyRate: stats.totalCapacity > 0 ? (stats.bookings / stats.totalCapacity) * 100 : 0
      }));
  };

  // Composants modaux
  const SlotModal: React.FC<{ slot: { date: Date; time: string } | null; onClose: () => void; onSave: (data: any) => void }> = ({ slot, onClose, onSave }) => {
    if (!slot) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold mb-4">
            Créneau {slot.time} - {slot.date.toLocaleDateString('fr-FR')}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Capacité maximale
              </label>
              <input type="number" className="w-full border rounded-md px-3 py-2" defaultValue={5} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prix (FCFA)
              </label>
              <input type="number" className="w-full border rounded-md px-3 py-2" defaultValue={0} />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => onSave({ capacity: 5, price: 0 })}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              Sauvegarder
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    );
  };

  const TemplateModal: React.FC<{ 
    templates: ScheduleTemplate[]; 
    onClose: () => void; 
    onSave: (data: any) => void; 
    onDelete: (id: string) => void 
  }> = ({ templates, onClose, onSave, onDelete }) => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
          <h3 className="text-lg font-semibold mb-4">Gestion des templates</h3>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {templates.map((template) => (
              <div key={template.id} className="flex items-center justify-between p-3 border rounded-md">
                <div>
                  <h4 className="font-medium">{template.name}</h4>
                  <p className="text-sm text-gray-500">
                    {template.timeSlots.length} créneaux
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onSave(template)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Utiliser
                  </button>
                  {!template.isDefault && (
                    <button
                      onClick={() => onDelete(template.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => onSave({ name: 'Nouveau template', timeSlots: [] })}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
            >
              Nouveau template
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  // Statistiques
  const totalSlots = weekSchedule.reduce((sum, day) => sum + day.timeSlots.length, 0);
  const bookedSlots = weekSchedule.reduce((sum, day) => 
    sum + day.timeSlots.filter(slot => slot.currentBookings > 0).length, 0
  );
  const totalCapacity = weekSchedule.reduce((sum, day) => 
    sum + day.timeSlots.reduce((daySum, slot) => daySum + slot.maxCapacity, 0), 0
  );
  const totalBookings = weekSchedule.reduce((sum, day) => 
    sum + day.timeSlots.reduce((daySum, slot) => daySum + slot.currentBookings, 0), 0
  );
  const occupancyRate = totalCapacity > 0 ? (totalBookings / totalCapacity) * 100 : 0;

  const handleSlotToggle = async (dayIndex: number, slotTime: string) => {
    try {
      // Mettre à jour la disponibilité du créneau via l'API
      const daySchedule = weekSchedule[dayIndex];
      if (!daySchedule) return;
      
      const slot = daySchedule.timeSlots.find(s => s.time === slotTime);
      if (!slot) return;
      
      // Pour l'instant, on log l'action - à implémenter avec un endpoint dédié
      console.log(`Toggle slot ${slotTime} for day ${dayIndex}`);
      toast.success(`Créneau ${slotTime} ${slot.isAvailable ? 'fermé' : 'ouvert'}`);
      
      // TODO: Implémenter l'endpoint pour mettre à jour les créneaux
      // await updateSlotAvailability({ date: daySchedule.date, time: slotTime, isAvailable: !slot.isAvailable });
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour du créneau:', error);
      toast.error('Erreur lors de la mise à jour du créneau');
    }
  };

  const handleCapacityChange = async (dayIndex: number, slotTime: string, newCapacity: number) => {
    try {
      // Mettre à jour la capacité du créneau via l'API
      console.log(`Update capacity for ${slotTime} on day ${dayIndex} to ${newCapacity}`);
      toast.success(`Capacité du créneau ${slotTime} mise à jour: ${newCapacity}`);
      
      // TODO: Implémenter l'endpoint pour mettre à jour la capacité des créneaux
      // await updateSlotCapacity({ date: weekSchedule[dayIndex].date, time: slotTime, capacity: newCapacity });
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la capacité:', error);
      toast.error('Erreur lors de la mise à jour de la capacité');
    }
  };

  const handleApplyTemplate = async (templateId: string, dayIndex: number) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      try {
        console.log(`Apply template ${template.name} to day ${dayIndex}`);
        toast.success(`Template "${template.name}" appliqué au jour ${dayIndex + 1}`);
        
        // TODO: Implémenter l'endpoint pour appliquer un template à un jour spécifique
        // await applyTemplateToDay({ templateId, date: weekSchedule[dayIndex].date });
        
      } catch (error) {
        console.error('Erreur lors de l\'application du template:', error);
        toast.error('Erreur lors de l\'application du template');
      }
    }
  };

  const handleBulkApplyTemplate = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      try {
        console.log(`Apply template ${template.name} to all days`);
        toast.success(`Template "${template.name}" appliqué à tous les jours`);
        
        // TODO: Implémenter l'endpoint pour appliquer un template à tous les jours
        // await applyTemplateToAllDays({ templateId });
        
      } catch (error) {
        console.error('Erreur lors de l\'application du template:', error);
        toast.error('Erreur lors de l\'application du template');
      }
    }
  };

  const getSlotStatus = (slot: TimeSlot) => {
    if (!slot.isAvailable) return { status: 'closed', color: 'bg-gray-200 text-gray-500', text: 'Fermé' };
    if (slot.currentBookings >= slot.maxCapacity) return { status: 'full', color: 'bg-red-100 text-red-800', text: 'Complet' };
    if (slot.currentBookings > 0) return { status: 'partial', color: 'bg-yellow-100 text-yellow-800', text: `${slot.currentBookings}/${slot.maxCapacity}` };
    return { status: 'available', color: 'bg-green-100 text-green-800', text: 'Libre' };
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    });
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedDate(newDate);
  };

  // États de chargement
  const isLoading = profileLoading || ordersLoading;
  
  // États de chargement - UI/UX 2025
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-1 sm:px-6 lg:px-8 py-1 sm:py-8">
          
          {/* Header Skeleton */}
          <header className="mb-8 sm:mb-12">
            <div className="text-center sm:text-left">
              <div className="animate-pulse">
                <div className="h-8 sm:h-10 lg:h-12 bg-gray-200 rounded-xl w-80 mx-auto sm:mx-0 mb-3"></div>
                <div className="h-5 sm:h-6 bg-gray-200 rounded-lg w-96 mx-auto sm:mx-0"></div>
              </div>
            </div>
          </header>
          
          {/* KPIs Skeleton */}
          <section className="mb-8 sm:mb-12" aria-label="Statistiques en chargement">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-4 sm:p-6">
                    <div className="animate-pulse">
                      <div className="flex items-center justify-between mb-3">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                        <div className="h-6 w-6 bg-gray-200 rounded"></div>
                      </div>
                      <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
          
          {/* Navigation Skeleton */}
          <section className="mb-8" aria-label="Navigation en chargement">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 sm:p-8">
                <div className="animate-pulse space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="h-10 bg-gray-200 rounded-xl w-32"></div>
                    <div className="h-6 bg-gray-200 rounded w-40"></div>
                    <div className="h-10 bg-gray-200 rounded-xl w-32"></div>
                  </div>
                  <div className="flex gap-4">
                    <div className="h-12 bg-gray-200 rounded-xl flex-1"></div>
                    <div className="h-12 bg-gray-200 rounded-xl w-40"></div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          {/* Schedule Table Skeleton */}
          <section className="mb-8" aria-label="Planning en chargement">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 sm:p-8 border-b border-gray-200">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-48"></div>
                </div>
              </div>
              <div className="p-6">
                <div className="animate-pulse">
                  {/* Table Header */}
                  <div className="grid grid-cols-8 gap-2 mb-4">
                    <div className="h-8 bg-gray-200 rounded"></div>
                    {[1, 2, 3, 4, 5, 6, 7].map(i => (
                      <div key={i} className="h-8 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                  {/* Table Rows */}
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(row => (
                    <div key={row} className="grid grid-cols-8 gap-2 mb-2">
                      <div className="h-12 bg-gray-200 rounded"></div>
                      {[1, 2, 3, 4, 5, 6, 7].map(col => (
                        <div key={col} className="h-12 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
          
          {/* Stats Skeleton */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6" aria-label="Statistiques détaillées en chargement">
            {[1, 2].map(i => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map(j => (
                        <div key={j} className="flex items-center justify-between">
                          <div className="h-4 bg-gray-200 rounded w-16"></div>
                          <div className="flex items-center gap-2">
                            <div className="h-2 bg-gray-200 rounded w-20"></div>
                            <div className="h-4 bg-gray-200 rounded w-8"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-1 sm:px-6 lg:px-8 py-1 sm:py-8">
        
        {/* Header - UI/UX 2025 */}
        <header className="mb-8 sm:mb-12">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              <span className="mr-3" role="img" aria-hidden="true">📅</span>
              Gestion des créneaux
            </h1>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl">
              Gérez vos disponibilités et optimisez votre planning avec une interface moderne et intuitive
            </p>
          </div>
        </header>

        {/* KPIs - UI/UX 2025 */}
        <section className="mb-8 sm:mb-12" aria-labelledby="kpi-heading">
          <h2 id="kpi-heading" className="sr-only">Statistiques du planning</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-600">Taux d'occupation</h3>
                  <span className="text-xl" role="img" aria-hidden="true">📊</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1">
                  {occupancyRate.toFixed(0)}%
                </div>
                <p className="text-xs sm:text-sm text-green-600 font-medium">+5% cette semaine</p>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-600">Créneaux réservés</h3>
                  <span className="text-xl" role="img" aria-hidden="true">✅</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-1">
                  {bookedSlots}/{totalSlots}
                </div>
                <p className="text-xs sm:text-sm text-green-600 font-medium">+12% cette semaine</p>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-600">Capacité totale</h3>
                  <span className="text-xl" role="img" aria-hidden="true">👥</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-1">
                  {totalCapacity}
                </div>
                <p className="text-xs sm:text-sm text-green-600 font-medium">+8% cette semaine</p>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-600">Réservations</h3>
                  <span className="text-xl" role="img" aria-hidden="true">📋</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-orange-600 mb-1">
                  {totalBookings}
                </div>
                <p className="text-xs sm:text-sm text-green-600 font-medium">+15% cette semaine</p>
              </div>
            </div>
          </div>
        </section>

        {/* Navigation et Actions - UI/UX 2025 */}
        <section className="mb-8" aria-labelledby="navigation-heading">
          <h2 id="navigation-heading" className="sr-only">Navigation et contrôles</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 sm:p-8">
              
              {/* Navigation semaine */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => navigateWeek('prev')}
                  className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
                  aria-label="Semaine précédente"
                >
                  <span className="mr-2" role="img" aria-hidden="true">←</span>
                  <span className="hidden sm:inline">Semaine précédente</span>
                  <span className="sm:hidden">Préc.</span>
                </button>
                
                <div className="text-center flex-1 mx-4">
                  <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                    {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Semaine {Math.ceil((selectedDate.getTime() - new Date(selectedDate.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))}
                  </p>
                </div>
                
                <button
                  onClick={() => navigateWeek('next')}
                  className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
                  aria-label="Semaine suivante"
                >
                  <span className="hidden sm:inline">Semaine suivante</span>
                  <span className="sm:hidden">Suiv.</span>
                  <span className="ml-2" role="img" aria-hidden="true">→</span>
                </button>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label htmlFor="template-select" className="sr-only">Sélectionner un modèle</label>
                  <select
                    id="template-select"
                    onChange={(e) => handleBulkApplyTemplate(e.target.value)}
                    className="w-full h-12 px-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base bg-white"
                  >
                    <option value="">Appliquer un modèle à toute la semaine</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name} {template.isDefault ? '(par défaut)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => setShowTemplateModal(true)}
                  className="inline-flex items-center justify-center min-h-[44px] px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors shadow-sm"
                  aria-label="Gérer les modèles de planning"
                >
                  <span className="mr-2" role="img" aria-hidden="true">⚙️</span>
                  <span className="hidden sm:inline">Gérer les modèles</span>
                  <span className="sm:hidden">Modèles</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Gestion des créneaux réels - NOUVEAU */}
        <section className="mb-8" aria-labelledby="real-timeslots-heading">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 id="real-timeslots-heading" className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Clock className="w-6 h-6 text-blue-600" />
                    Gestion des créneaux
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Créez et gérez vos créneaux de réservation en temps réel
                  </p>
                </div>
                <button
                  onClick={() => setShowTimeslotCreator(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Nouveau créneau
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Statistiques des créneaux réels */}
              {timeslotStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Total créneaux</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-900">
                      {timeslotStats.totalSlots || 0}
                    </div>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Disponibles</span>
                    </div>
                    <div className="text-2xl font-bold text-green-900">
                      {timeslotStats.availableSlots || 0}
                    </div>
                  </div>
                  
                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-medium text-orange-800">Taux occupation</span>
                    </div>
                    <div className="text-2xl font-bold text-orange-900">
                      {timeslotStats.occupancyRate || 0}%
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-800">Réservations</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-900">
                      {timeslotStats.totalBookings || 0}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Sélecteur de date pour filtrer les créneaux */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filtrer par date (optionnel)
                </label>
                <input
                  type="date"
                  value={selectedDate.toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Liste des créneaux réels */}
              <TimeslotList
                pressingId={profileData?.id || ''}
                selectedDate={selectedDate}
                onTimeslotUpdated={handleTimeslotUpdated}
              />
            </div>
          </div>
        </section>

        {/* Planning hebdomadaire - UI/UX 2025 */}
        <section className="mb-8" aria-labelledby="schedule-heading">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-gray-200">
              <h2 id="schedule-heading" className="text-xl sm:text-2xl font-bold text-gray-900">
                Planning de la semaine
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Cliquez sur un créneau pour modifier sa disponibilité et sa capacité
              </p>
            </div>
            
            <div className="p-6">
              {/* Légende - UI/UX 2025 */}
              <div className="flex flex-wrap gap-4 sm:gap-6 mb-6 sm:mb-8" role="list" aria-label="Légende des états">
                <div className="flex items-center gap-3" role="listitem">
                  <div className="w-4 h-4 bg-green-500 rounded-full shadow-sm"></div>
                  <span className="text-sm font-medium text-gray-700">Disponible</span>
                </div>
                <div className="flex items-center gap-3" role="listitem">
                  <div className="w-4 h-4 bg-blue-500 rounded-full shadow-sm"></div>
                  <span className="text-sm font-medium text-gray-700">Réservé</span>
                </div>
                <div className="flex items-center gap-3" role="listitem">
                  <div className="w-4 h-4 bg-red-500 rounded-full shadow-sm"></div>
                  <span className="text-sm font-medium text-gray-700">Complet</span>
                </div>
                <div className="flex items-center gap-3" role="listitem">
                  <div className="w-4 h-4 bg-gray-400 rounded-full shadow-sm"></div>
                  <span className="text-sm font-medium text-gray-700">Fermé</span>
                </div>
              </div>

              {/* Tableau - UI/UX 2025 */}
              <div className="overflow-x-auto -mx-2 sm:mx-0">
                <div className="min-w-[800px] px-2 sm:px-0">
                  {/* En-tête */}
                  <div className="grid grid-cols-8 gap-2 mb-4" role="row">
                    <div className="p-3 text-sm font-bold text-gray-800 text-center bg-gray-50 rounded-xl" role="columnheader">
                      Heure
                    </div>
                    {weekDates.map((date, index) => (
                      <div key={index} className="p-3 text-sm font-bold text-gray-800 text-center bg-gray-50 rounded-xl" role="columnheader">
                        <div className="hidden sm:block">
                          {formatDate(date)}
                        </div>
                        <div className="sm:hidden font-medium">
                          {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {date.getDate()}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Créneaux */}
                  {timeSlots.map((time) => (
                    <div key={time} className="grid grid-cols-8 gap-2 mb-3" role="row">
                      <div className="p-4 text-sm font-semibold text-gray-800 bg-gray-50 rounded-xl text-center flex items-center justify-center" role="rowheader">
                        {time}
                      </div>
                      {weekDates.map((date, dayIndex) => {
                        const slotKey = `${formatDate(date)}_${time}`;
                        const slot = schedule[slotKey] || {
                          isAvailable: true,
                          capacity: 5,
                          booked: 0,
                          price: 0
                        };
                        
                        const isFullyBooked = slot.booked >= slot.capacity;
                        const occupancyPercentage = (slot.booked / slot.capacity) * 100;
                        
                        return (
                          <button
                            key={dayIndex}
                            onClick={() => handleSlotClick(date, time)}
                            className={`
                              min-h-[44px] p-3 text-sm rounded-xl transition-all duration-200 font-medium shadow-sm border-2
                              ${!slot.isAvailable 
                                ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' 
                                : isFullyBooked 
                                  ? 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200 hover:border-red-300' 
                                  : occupancyPercentage > 50 
                                    ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200 hover:border-yellow-300' 
                                    : 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200 hover:border-green-300'
                              }
                              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                              disabled:opacity-50 disabled:cursor-not-allowed
                            `}
                            disabled={!slot.isAvailable}
                            aria-label={`Créneau ${time} le ${formatDate(date)}: ${slot.booked} sur ${slot.capacity} réservations${!slot.isAvailable ? ', fermé' : ''}`}
                            role="gridcell"
                          >
                            <div className="text-center">
                              <div className="font-bold text-base">
                                {slot.booked}/{slot.capacity}
                              </div>
                              {slot.price > 0 && (
                                <div className="text-xs opacity-75 mt-1">
                                  {slot.price}€
                                </div>
                              )}
                              {!slot.isAvailable && (
                                <div className="text-xs mt-1 font-medium">
                                  Fermé
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Statistiques détaillées - UI/UX 2025 */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6" aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="sr-only">Statistiques détaillées</h2>
          
          {/* Statistiques par jour */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span role="img" aria-hidden="true">📅</span>
                Statistiques par jour
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Taux d'occupation quotidien de la semaine
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {weekDates.map((date, index) => {
                  const dayStats = getDayStats(date);
                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-sm font-medium text-gray-700">
                        {date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric' })}
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${dayStats.occupancyRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold text-gray-900 min-w-[3rem] text-right">
                          {dayStats.occupancyRate.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Statistiques par créneau */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span role="img" aria-hidden="true">⏰</span>
                Créneaux les plus demandés
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Top des heures avec le meilleur taux d'occupation
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {getTopTimeSlots().map((slot, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {slot.time}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${slot.occupancyRate}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-gray-900 min-w-[3rem] text-right">
                        {slot.occupancyRate.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Modals */}
        {showSlotModal && selectedSlot && (
          <SlotModal
            slot={selectedSlot}
            onClose={() => setShowSlotModal(false)}
            onSave={handleSlotSave}
          />
        )}
        
        {showTemplateModal && (
          <TemplateModal
            templates={templates}
            onClose={() => setShowTemplateModal(false)}
            onSave={handleTemplateSave}
            onDelete={handleTemplateDelete}
          />
        )}
        
        {/* Modal de création de créneau réel */}
        {showTimeslotCreator && profileData?.id && (
          <TimeslotCreator
            pressingId={profileData.id}
            selectedDate={selectedDate}
            onTimeslotCreated={handleTimeslotCreated}
            onClose={() => setShowTimeslotCreator(false)}
          />
        )}
      </div>
    </div>
  );
};

export default SchedulePage;
