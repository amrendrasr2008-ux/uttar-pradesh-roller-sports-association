import React, { useState } from 'react';
import { dbStore } from '../../lib/db';
import { ALL_OFFICIAL_AGE_GROUPS, matchAgeGroup } from '../../lib/ageGroupRules';
import { 
  Tournament, 
  TournamentEvent, 
  TournamentRegistration, 
  SkatingDiscipline, 
  AgeGroup, 
  Gender, 
  Skater 
} from '../../types';
import { TournamentResultUploader } from './TournamentResultUploader';
import { TournamentReport } from './TournamentReport';
import { 
  Trophy, 
  Plus, 
  Calendar, 
  MapPin, 
  Radio, 
  CheckCircle2, 
  ArrowLeft, 
  Users, 
  Zap, 
  FileText, 
  Search, 
  Filter, 
  Trash2, 
  UserPlus, 
  Sparkles, 
  Award,
  Layers,
  Flag,
  ListOrdered,
  Edit3,
  CheckSquare,
  Square,
  Check,
  AlertCircle,
  Upload
} from 'lucide-react';

const ALL_AGE_GROUPS: AgeGroup[] = ALL_OFFICIAL_AGE_GROUPS as AgeGroup[];

const ALL_GENDERS: Gender[] = ['Male', 'Female', 'Other'];

const ALL_DISCIPLINES: SkatingDiscipline[] = [
  'Speed Adjustable',
  'Speed Toy Inline',
  'Speed Quad',
  'Speed Inline',
  'Artistic',
  'Freestyle',
  'Roller Hockey',
  'Skateboarding'
];

export const TournamentManager: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>(() => dbStore.getTournaments());
  const districts = dbStore.getDistricts();
  const clubs = dbStore.getClubs();
  const allSkaters = dbStore.getSkaters();

  // Active view: null = Dashboard list, string = specific Tournament ID being managed
  const [activeTournamentId, setActiveTournamentId] = useState<string | null>(null);
  
  // Dashboard filters
  const [statusFilter, setStatusFilter] = useState<'All' | 'Upcoming' | 'Live' | 'Completed'>('All');
  const [dashboardSearch, setDashboardSearch] = useState('');

  // Modals state
  const [showAddTourModal, setShowAddTourModal] = useState(false);
  const [showEditTourModal, setShowEditTourModal] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);

  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TournamentEvent | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<TournamentEvent | null>(null);
  const [eventsVersion, setEventsVersion] = useState(0);
  const [editEventForm, setEditEventForm] = useState({
    raceNumber: '',
    discipline: 'Speed Inline' as SkatingDiscipline,
    distance: '',
    ageGroup: 'Sub-Junior: 12 to 15 years' as AgeGroup,
    gender: 'Male' as Gender
  });

  const [showAddSkaterModal, setShowAddSkaterModal] = useState(false);
  const [selectedEventForSkater, setSelectedEventForSkater] = useState<TournamentEvent | null>(null);

  // Sub-tab inside dedicated Tournament Management Page
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'events' | 'startlist' | 'livescore' | 'report'>('overview');

  // Form states
  const [tourForm, setTourForm] = useState({
    tournamentNumber: `UPRSA-TN-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 90) + 10)}`,
    nameEn: '',
    nameHi: '',
    venue: '',
    districtName: 'Lucknow',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    lastDate: new Date().toISOString().split('T')[0],
    maxEventsPerSkater: 2,
    ageGroupEventLimits: {
      'Tiny Tots (Under 6)': 2,
      'Tiny Tots (6-8 Years)': 2,
      'Cadet (8-10 Years)': 2,
      'Cadet (10-12 Years)': 2,
      'Sub-Junior (12-15 Years)': 3,
      'Junior (15-18 Years)': 3,
      'Senior (18+ Years)': 3,
      'Masters (35+ Years)': 3
    } as Record<string, number>,
    disciplineEventLimits: {
      'Speed Adjustable': 2,
      'Speed Toy Inline': 2,
      'Speed Quad': 3,
      'Speed Inline': 3,
      'Artistic': 2,
      'Freestyle': 2,
      'Roller Hockey': 1,
      'Skateboarding': 1
    } as Record<string, number>,
    disciplineAgeGroupEventLimits: {
      'Speed Quad': {
        'Tiny Tots (Under 6)': 2,
        'Tiny Tots (6-8 Years)': 2,
        'Cadet (8-10 Years)': 2,
        'Cadet (10-12 Years)': 2,
        'Sub-Junior (12-15 Years)': 3,
        'Junior (15-18 Years)': 3,
        'Senior (18+ Years)': 3,
        'Masters (35+ Years)': 3
      },
      'Speed Inline': {
        'Tiny Tots (Under 6)': 2,
        'Tiny Tots (6-8 Years)': 2,
        'Cadet (8-10 Years)': 2,
        'Cadet (10-12 Years)': 2,
        'Sub-Junior (12-15 Years)': 3,
        'Junior (15-18 Years)': 3,
        'Senior (18+ Years)': 3,
        'Masters (35+ Years)': 3
      },
      'Speed Adjustable': {
        'Tiny Tots (Under 6)': 2,
        'Tiny Tots (6-8 Years)': 2,
        'Cadet (8-10 Years)': 2,
        'Cadet (10-12 Years)': 2,
        'Sub-Junior (12-15 Years)': 2,
        'Junior (15-18 Years)': 2,
        'Senior (18+ Years)': 2,
        'Masters (35+ Years)': 2
      }
    } as Record<string, Record<string, number>>,
    organizer: 'Uttar Pradesh Roller Sports Association',
    status: 'Upcoming' as 'Upcoming' | 'Live' | 'Completed'
  });

  // Selected discipline tab for Age Group & Category Limit matrix in tournament creation
  const [limitTabDisc, setLimitTabDisc] = useState<SkatingDiscipline>('Speed Quad');

  // Event form state (with multi-select Age Groups & Genders, Heat Count & Max Participants removed)
  const [eventDiscipline, setEventDiscipline] = useState<SkatingDiscipline>('Speed Inline');
  const [eventRaceNumber, setEventRaceNumber] = useState('RACE-01');
  const [eventDistance, setEventDistance] = useState('500 Meter Rink Race');
  
  // Multi-select Checkbox State for Age Groups and Gender
  const [selectedAgeGroups, setSelectedAgeGroups] = useState<AgeGroup[]>([
    'Sub-Junior (12-15 Years)'
  ]);
  const [selectedGenders, setSelectedGenders] = useState<Gender[]>([
    'Male',
    'Female'
  ]);

  // Skater selection search
  const [skaterSearch, setSkaterSearch] = useState('');
  const [skaterDistrictFilter, setSkaterDistrictFilter] = useState('');
  const [selectedSkaterIds, setSelectedSkaterIds] = useState<string[]>([]);

  // Search in Start List / Registrations
  const [startListSearch, setStartListSearch] = useState('');
  const [startListDistrictFilter, setStartListDistrictFilter] = useState('');
  const [startListEventFilter, setStartListEventFilter] = useState('');

  // Filtered Tournaments for Dashboard
  const filteredTournaments = tournaments.filter(t => {
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    const matchesSearch = dashboardSearch === '' || 
      (t.nameEn || '').toLowerCase().includes(dashboardSearch.toLowerCase()) ||
      (t.tournamentNumber || '').toLowerCase().includes(dashboardSearch.toLowerCase()) ||
      (t.venue || '').toLowerCase().includes(dashboardSearch.toLowerCase()) ||
      (t.districtName || '').toLowerCase().includes(dashboardSearch.toLowerCase()) ||
      (t.organizer || '').toLowerCase().includes(dashboardSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Open Edit Tournament Modal
  const openEditTournamentModal = (tour: Tournament) => {
    setEditingTournament(tour);
    setTourForm({
      tournamentNumber: tour.tournamentNumber,
      nameEn: tour.nameEn,
      nameHi: tour.nameHi || tour.nameEn,
      venue: tour.venue,
      districtName: tour.districtName,
      startDate: tour.startDate,
      endDate: tour.endDate,
      lastDate: tour.lastDate || tour.startDate || new Date().toISOString().split('T')[0],
      maxEventsPerSkater: tour.maxEventsPerSkater || 2,
      ageGroupEventLimits: tour.ageGroupEventLimits || {
        'Tiny Tots (Under 6)': 2,
        'Tiny Tots (6-8 Years)': 2,
        'Cadet (8-10 Years)': 2,
        'Cadet (10-12 Years)': 2,
        'Sub-Junior (12-15 Years)': 3,
        'Junior (15-18 Years)': 3,
        'Senior (18+ Years)': 3,
        'Masters (35+ Years)': 3
      },
      disciplineEventLimits: tour.disciplineEventLimits || {
        'Speed Adjustable': 2,
        'Speed Toy Inline': 2,
        'Speed Quad': 3,
        'Speed Inline': 3,
        'Artistic': 2,
        'Freestyle': 2,
        'Roller Hockey': 1,
        'Skateboarding': 1
      },
      disciplineAgeGroupEventLimits: tour.disciplineAgeGroupEventLimits || {
        'Speed Quad': {
          'Tiny Tots (Under 6)': 2,
          'Tiny Tots (6-8 Years)': 2,
          'Cadet (8-10 Years)': 2,
          'Cadet (10-12 Years)': 2,
          'Sub-Junior (12-15 Years)': 3,
          'Junior (15-18 Years)': 3,
          'Senior (18+ Years)': 3,
          'Masters (35+ Years)': 3
        },
        'Speed Inline': {
          'Tiny Tots (Under 6)': 2,
          'Tiny Tots (6-8 Years)': 2,
          'Cadet (8-10 Years)': 2,
          'Cadet (10-12 Years)': 2,
          'Sub-Junior (12-15 Years)': 3,
          'Junior (15-18 Years)': 3,
          'Senior (18+ Years)': 3,
          'Masters (35+ Years)': 3
        },
        'Speed Adjustable': {
          'Tiny Tots (Under 6)': 2,
          'Tiny Tots (6-8 Years)': 2,
          'Cadet (8-10 Years)': 2,
          'Cadet (10-12 Years)': 2,
          'Sub-Junior (12-15 Years)': 2,
          'Junior (15-18 Years)': 2,
          'Senior (18+ Years)': 2,
          'Masters (35+ Years)': 2
        }
      },
      organizer: tour.organizer || 'Uttar Pradesh Roller Sports Association',
      status: tour.status
    });
    setShowEditTourModal(true);
  };

  // Handle Create Tournament -> Auto opens its dedicated page
  const handleCreateTournament = (e: React.FormEvent) => {
    e.preventDefault();
    const created = dbStore.addTournament({
      tournamentNumber: tourForm.tournamentNumber,
      nameEn: tourForm.nameEn,
      nameHi: tourForm.nameHi || tourForm.nameEn,
      venue: tourForm.venue,
      districtName: tourForm.districtName,
      startDate: tourForm.startDate,
      endDate: tourForm.endDate,
      lastDate: tourForm.lastDate,
      maxEventsPerSkater: Number(tourForm.maxEventsPerSkater) || 2,
      ageGroupEventLimits: tourForm.ageGroupEventLimits,
      disciplineEventLimits: tourForm.disciplineEventLimits,
      disciplineAgeGroupEventLimits: tourForm.disciplineAgeGroupEventLimits,
      organizer: tourForm.organizer,
      status: tourForm.status
    });

    // Auto-seed standard Speed Quad, Speed Inline, and Adjustable competition events
    dbStore.seedStandardEventsForTournament(created.id);

    const updated = dbStore.getTournaments();
    setTournaments(updated);
    setShowAddTourModal(false);
    
    // Open dedicated Tournament Control Center page
    setActiveTournamentId(created.id);
    setActiveSubTab('events');
  };

  // Handle Update Existing Tournament
  const handleUpdateTournament = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTournament) return;

    dbStore.updateTournament(editingTournament.id, {
      tournamentNumber: tourForm.tournamentNumber,
      nameEn: tourForm.nameEn,
      nameHi: tourForm.nameHi,
      venue: tourForm.venue,
      districtName: tourForm.districtName,
      startDate: tourForm.startDate,
      endDate: tourForm.endDate,
      lastDate: tourForm.lastDate,
      maxEventsPerSkater: Number(tourForm.maxEventsPerSkater) || 2,
      ageGroupEventLimits: tourForm.ageGroupEventLimits,
      disciplineEventLimits: tourForm.disciplineEventLimits,
      disciplineAgeGroupEventLimits: tourForm.disciplineAgeGroupEventLimits,
      organizer: tourForm.organizer,
      status: tourForm.status
    });

    const updated = dbStore.getTournaments();
    setTournaments(updated);
    setShowEditTourModal(false);
    setEditingTournament(null);
  };

  // Handle Create Events (Support Batch Creation for selected Age Groups & Genders)
  const handleCreateEvents = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTournamentId) return;

    if (selectedAgeGroups.length === 0) {
      alert('कृपया कम से कम एक आयु वर्ग (Age Group) चुनें!');
      return;
    }

    if (selectedGenders.length === 0) {
      alert('कृपया कम से कम एक लिंग श्रेणी (Gender Category) चुनें!');
      return;
    }

    let createdCount = 0;

    // Loop through each checked Age Group and Gender
    selectedAgeGroups.forEach((ag) => {
      selectedGenders.forEach((gn) => {
        const isBatch = selectedAgeGroups.length > 1 || selectedGenders.length > 1;
        
        // Generate neat race code if multiple
        let raceCode = eventRaceNumber;
        if (isBatch) {
          const shortAg = ag.includes('Under') ? 'U6' : ag.includes('6-8') ? '6-8' : ag.includes('8-10') ? '8-10' : ag.includes('10-12') ? '10-12' : ag.includes('12-15') ? '12-15' : ag.includes('15-18') ? '15-18' : 'SR';
          const genderChar = gn.charAt(0);
          raceCode = `${eventRaceNumber}-${shortAg}-${genderChar}`;
        }

        dbStore.addEvent({
          tournamentId: activeTournamentId,
          discipline: eventDiscipline,
          ageGroup: ag,
          gender: gn,
          distance: eventDistance,
          raceNumber: raceCode,
          heatCount: 1,
          maxParticipants: 50
        });
        createdCount++;
      });
    });

    setShowAddEventModal(false);
    setEventsVersion(v => v + 1);
    setTournaments([...dbStore.getTournaments()]);
  };

  // Open Edit Event Modal
  const openEditEventModal = (ev: TournamentEvent) => {
    setEditingEvent(ev);
    setEditEventForm({
      raceNumber: ev.raceNumber || '',
      discipline: ev.discipline,
      distance: ev.distance,
      ageGroup: ev.ageGroup,
      gender: ev.gender
    });
    setShowEditEventModal(true);
  };

  // Handle Save Updated Event
  const handleUpdateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    dbStore.updateEvent(editingEvent.id, {
      raceNumber: editEventForm.raceNumber,
      discipline: editEventForm.discipline,
      distance: editEventForm.distance,
      ageGroup: editEventForm.ageGroup,
      gender: editEventForm.gender
    });

    setShowEditEventModal(false);
    setEditingEvent(null);
    setEventsVersion(v => v + 1);
    setTournaments([...dbStore.getTournaments()]);
  };

  // Open Delete Confirmation Modal
  const handleDeleteEvent = (ev: TournamentEvent) => {
    setDeletingEvent(ev);
  };

  // Confirm Delete Event
  const handleConfirmDelete = () => {
    if (!deletingEvent) return;
    dbStore.deleteEvent(deletingEvent.id);
    setDeletingEvent(null);
    setEventsVersion(v => v + 1);
    setTournaments([...dbStore.getTournaments()]);
  };

  // Age group toggle checkbox helper
  const toggleAgeGroup = (ag: AgeGroup) => {
    if (selectedAgeGroups.includes(ag)) {
      setSelectedAgeGroups(selectedAgeGroups.filter(item => item !== ag));
    } else {
      setSelectedAgeGroups([...selectedAgeGroups, ag]);
    }
  };

  // Gender toggle checkbox helper
  const toggleGender = (gn: Gender) => {
    if (selectedGenders.includes(gn)) {
      setSelectedGenders(selectedGenders.filter(item => item !== gn));
    } else {
      setSelectedGenders([...selectedGenders, gn]);
    }
  };

  // Handle Register Skaters into Event
  const handleRegisterSkatersToEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTournamentId || !selectedEventForSkater) return;

    selectedSkaterIds.forEach(skaterId => {
      const skater = allSkaters.find(s => s.id === skaterId);
      if (!skater) return;

      const generatedBib = String(Math.floor(100 + Math.random() * 800));
      dbStore.registerForTournament({
        tournamentId: activeTournamentId,
        eventId: selectedEventForSkater.id,
        skaterId: skater.id,
        skaterName: skater.name,
        registrationNumber: skater.registrationNumber,
        districtName: skater.districtName,
        clubName: skater.clubName,
        discipline: selectedEventForSkater.discipline,
        ageGroup: selectedEventForSkater.ageGroup,
        gender: selectedEventForSkater.gender,
        distance: selectedEventForSkater.distance,
        bibNumber: generatedBib,
        heatNumber: 1,
        status: 'approved'
      });
    });

    setShowAddSkaterModal(false);
    setSelectedSkaterIds([]);
    setSelectedEventForSkater(null);
    setTournaments(dbStore.getTournaments());
  };

  const activeTour = tournaments.find(t => t.id === activeTournamentId);
  const activeEvents = activeTournamentId ? dbStore.getEvents(activeTournamentId) : [];
  const activeRegistrations = activeTournamentId ? dbStore.getRegistrations(activeTournamentId) : [];

  // Filtered Start List / Registrations
  const filteredRegistrations = activeRegistrations.filter(r => {
    const matchesSearch = !startListSearch || 
      (r.skaterName || '').toLowerCase().includes(startListSearch.toLowerCase()) ||
      (r.registrationNumber || '').toLowerCase().includes(startListSearch.toLowerCase()) ||
      (r.bibNumber && r.bibNumber.includes(startListSearch)) ||
      (r.clubName || '').toLowerCase().includes(startListSearch.toLowerCase());

    const matchesDistrict = !startListDistrictFilter || r.districtName === startListDistrictFilter;
    const matchesEvent = !startListEventFilter || r.eventId === startListEventFilter;

    return matchesSearch && matchesDistrict && matchesEvent;
  });

  // Filter eligible skaters for registration modal
  const eligibleSkaters = allSkaters.filter(s => {
    const matchesSearch = !skaterSearch || 
      (s.name || '').toLowerCase().includes(skaterSearch.toLowerCase()) ||
      (s.registrationNumber || '').toLowerCase().includes(skaterSearch.toLowerCase());
    const matchesDistrict = !skaterDistrictFilter || s.districtName === skaterDistrictFilter;
    
    // Check discipline match if selected event exists
    const matchesDiscipline = !selectedEventForSkater || 
      s.discipline === selectedEventForSkater.discipline || 
      (s.discipline || '').toLowerCase().includes((selectedEventForSkater.discipline || '').toLowerCase());

    // Check gender match if selected event exists
    const matchesGender = !selectedEventForSkater || 
      s.gender === selectedEventForSkater.gender || 
      s.gender === 'Other';

    // Check age group match if selected event exists
    const matchesAgeGroup = !selectedEventForSkater || 
      matchAgeGroup(s.ageGroup, selectedEventForSkater.ageGroup) ||
      selectedEventForSkater.ageGroup === 'All' ||
      selectedEventForSkater.ageGroup === 'Open';

    // Check skater approved/active status
    const matchesStatus = s.status === 'approved' || s.status === 'active';

    return matchesSearch && matchesDistrict && matchesDiscipline && matchesGender && matchesAgeGroup && matchesStatus;
  });

  return (
    <div className="space-y-6 text-slate-100">
      
      {/* SECTION A: TOURNAMENT DASHBOARD LIST (If no tournament is actively opened) */}
      {!activeTournamentId ? (
        <div className="space-y-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-2">
                <Trophy className="w-6 h-6 text-amber-400" /> Tournament Management Dashboard
              </h1>
              <p className="text-xs text-slate-400">Configure state championships, manage race events, generate start lists, and track live scores.</p>
            </div>

            <button
              onClick={() => {
                setTourForm({
                  tournamentNumber: `UPRSA-TN-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 90) + 10)}`,
                  nameEn: '',
                  nameHi: '',
                  venue: '',
                  districtName: 'Lucknow',
                  startDate: new Date().toISOString().split('T')[0],
                  endDate: new Date().toISOString().split('T')[0],
                  organizer: 'Uttar Pradesh Roller Sports Association',
                  status: 'Upcoming'
                });
                setShowAddTourModal(true);
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl transition flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-4 h-4" /> Create New Tournament
            </button>
          </div>

          {/* Quick Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <span className="text-2xl font-black text-amber-400">{tournaments.length}</span>
              <span className="block text-xs text-slate-400 font-bold uppercase tracking-wider">Total Tournaments</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <span className="text-2xl font-black text-red-500 flex items-center gap-1">
                <Radio className="w-4 h-4 animate-pulse" />
                {tournaments.filter(t => t.status === 'Live').length}
              </span>
              <span className="block text-xs text-slate-400 font-bold uppercase tracking-wider">Live Championships</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <span className="text-2xl font-black text-sky-400">{tournaments.filter(t => t.status === 'Upcoming').length}</span>
              <span className="block text-xs text-slate-400 font-bold uppercase tracking-wider">Upcoming Events</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <span className="text-2xl font-black text-emerald-400">{tournaments.filter(t => t.status === 'Completed').length}</span>
              <span className="block text-xs text-slate-400 font-bold uppercase tracking-wider">Completed</span>
            </div>
          </div>

          {/* Dashboard Search & Status Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
            {/* Status Tabs */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
              {(['All', 'Upcoming', 'Live', 'Completed'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex-1 sm:flex-initial ${
                    statusFilter === st ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st === 'Live' && <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-ping mr-1"></span>}
                  {st}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search tournament, venue, district..."
                value={dashboardSearch}
                onChange={(e) => setDashboardSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Tournaments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTournaments.map(tour => {
              const eventsCount = dbStore.getEvents(tour.id).length;
              const registrationsCount = dbStore.getRegistrations(tour.id).length;

              return (
                <div key={tour.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 hover:border-slate-700 transition flex flex-col justify-between shadow-lg relative group">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-amber-400 font-bold text-xs">{tour.tournamentNumber}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditTournamentModal(tour)}
                          className="px-2 py-1 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 rounded text-[11px] font-bold transition flex items-center gap-1 border border-slate-700"
                          title="टूर्नामेंट जानकारी एडिट करें"
                        >
                          <Edit3 className="w-3 h-3 text-amber-400 group-hover:text-slate-950" /> एडिट
                        </button>

                        <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider ${
                          tour.status === 'Live' ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse' :
                          tour.status === 'Upcoming' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {tour.status}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-white">{tour.nameEn}</h3>
                      {tour.nameHi && <p className="text-xs text-amber-300 font-hindi">{tour.nameHi}</p>}
                    </div>

                    <div className="space-y-1 text-xs text-slate-400 font-medium">
                      <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-amber-400" /> {tour.venue}</p>
                      <p className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-emerald-400" /> {tour.startDate} to {tour.endDate}</p>
                      {tour.lastDate && (
                        <p className="flex items-center gap-1.5 text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 w-fit">
                          <Calendar className="w-3.5 h-3.5 text-amber-400" /> रजिस्ट्रेशन लास्ट डेट: {tour.lastDate}
                        </p>
                      )}
                      <p className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-sky-400" /> Host District: {tour.districtName}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-center">
                      <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                        <span className="font-bold text-amber-400 text-sm block">{eventsCount}</span>
                        <span className="text-[10px] text-slate-500 uppercase">Configured Events</span>
                      </div>
                      <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                        <span className="font-bold text-emerald-400 text-sm block">{registrationsCount}</span>
                        <span className="text-[10px] text-slate-500 uppercase">Registered Skaters</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={() => {
                        setActiveTournamentId(tour.id);
                        setActiveSubTab('overview');
                      }}
                      className="flex-1 py-2.5 bg-slate-800 hover:bg-amber-500 text-slate-200 hover:text-slate-950 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 border border-slate-700 hover:border-amber-400"
                    >
                      Open Control Center →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      ) : (

        /* SECTION B: DEDICATED TOURNAMENT CONTROL CENTER (Specific Tournament Page) */
        activeTour && (
          <div className="space-y-6">
            
            {/* Top Control Header */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="space-y-1">
                  <button
                    onClick={() => setActiveTournamentId(null)}
                    className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 mb-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to All Tournaments
                  </button>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
                      {activeTour.tournamentNumber}
                    </span>
                    <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase ${
                      activeTour.status === 'Live' ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {activeTour.status}
                    </span>

                    {/* Edit Tournament Button */}
                    <button
                      onClick={() => openEditTournamentModal(activeTour)}
                      className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold text-xs rounded-lg border border-amber-500/30 transition flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-400" /> टूर्नामेंट एडिट करें
                    </button>
                  </div>

                  <h1 className="text-2xl font-black text-white">{activeTour.nameEn}</h1>
                  <p className="text-xs text-slate-400">
                    {activeTour.venue} • {activeTour.districtName} District • {activeTour.startDate} to {activeTour.endDate}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAddEventModal(true)}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow"
                  >
                    <Plus className="w-4 h-4" /> Add Race Event
                  </button>

                  <button
                    onClick={() => {
                      if (activeEvents.length > 0) {
                        setSelectedEventForSkater(activeEvents[0]);
                        setShowAddSkaterModal(true);
                      } else {
                        alert('Please create at least one event first.');
                      }
                    }}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow"
                  >
                    <UserPlus className="w-4 h-4" /> Register Skater
                  </button>
                </div>
              </div>

              {/* Sub-Navigation Tabs */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold border-b border-slate-800 pb-1">
                <button
                  onClick={() => setActiveSubTab('overview')}
                  className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
                    activeSubTab === 'overview' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white bg-slate-950'
                  }`}
                >
                  <Layers className="w-4 h-4" /> Overview & Events ({activeEvents.length})
                </button>

                <button
                  onClick={() => setActiveSubTab('startlist')}
                  className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
                    activeSubTab === 'startlist' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white bg-slate-950'
                  }`}
                >
                  <ListOrdered className="w-4 h-4" /> Start List & Entries ({activeRegistrations.length})
                </button>

                <button
                  onClick={() => setActiveSubTab('livescore')}
                  className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
                    activeSubTab === 'livescore' ? 'bg-emerald-600 text-white shadow font-black' : 'text-slate-400 hover:text-white bg-slate-950'
                  }`}
                >
                  <Upload className="w-4 h-4 text-emerald-400" /> Upload Results (रिजल्ट अपलोड)
                </button>

                <button
                  onClick={() => setActiveSubTab('report')}
                  className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
                    activeSubTab === 'report' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white bg-slate-950'
                  }`}
                >
                  <FileText className="w-4 h-4" /> Tournament Official Report
                </button>
              </div>
            </div>

            {/* TAB CONTENT 1: OVERVIEW & EVENTS */}
            {activeSubTab === 'overview' && (
              <div className="space-y-6">
                
                {/* Events List */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="font-black text-white text-base flex items-center gap-2">
                      <Flag className="w-5 h-5 text-amber-400" /> Configured Race Events ({activeEvents.length})
                    </h3>
                    <button
                      onClick={() => setShowAddEventModal(true)}
                      className="text-xs text-amber-400 font-bold hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Race Event
                    </button>
                  </div>

                  {activeEvents.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 italic">
                      No events created for this tournament yet. Click "Add Race Event" above.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {activeEvents.map(ev => {
                        const eventRegs = activeRegistrations.filter(r => r.eventId === ev.id);

                        return (
                          <div key={ev.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 flex flex-col justify-between hover:border-slate-700 transition">
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="font-mono text-amber-400 text-xs font-bold">{ev.raceNumber || 'RACE'}</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">{ev.discipline}</span>
                                  <button
                                    type="button"
                                    onClick={() => openEditEventModal(ev)}
                                    className="p-1 bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-slate-300 rounded transition border border-slate-800"
                                    title="इवेंट एडिट करें"
                                  >
                                    <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteEvent(ev)}
                                    className="p-1 bg-slate-900 hover:bg-red-600 text-slate-300 hover:text-white rounded transition border border-slate-800"
                                    title="इवेंट डिलीट करें"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                  </button>
                                </div>
                              </div>
                              <h4 className="font-black text-white text-sm">{ev.distance}</h4>
                              <p className="text-xs text-slate-400">{ev.ageGroup} • {ev.gender}</p>
                            </div>

                            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                              <span className="text-slate-400">{eventRegs.length} Participants</span>
                              <button
                                onClick={() => {
                                  setSelectedEventForSkater(ev);
                                  setShowAddSkaterModal(true);
                                }}
                                className="px-2.5 py-1 bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-slate-950 rounded text-[11px] font-bold transition"
                              >
                                + Add Skaters
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* TAB CONTENT 2: START LIST & PARTICIPANTS */}
            {activeSubTab === 'startlist' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4 p-6">
                
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="font-black text-white text-lg flex items-center gap-2">
                      <ListOrdered className="w-5 h-5 text-amber-400" /> Start List & Race Participants
                    </h3>
                    <p className="text-xs text-slate-400">View bib numbers, heat numbers, lane positions, and event assignments.</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    {/* Event Filter */}
                    <select
                      value={startListEventFilter}
                      onChange={(e) => setStartListEventFilter(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="">All Events</option>
                      {activeEvents.map(ev => (
                        <option key={ev.id} value={ev.id}>{ev.discipline} — {ev.distance}</option>
                      ))}
                    </select>

                    {/* District Filter */}
                    <select
                      value={startListDistrictFilter}
                      onChange={(e) => setStartListDistrictFilter(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="">All Districts</option>
                      {districts.map(d => (
                        <option key={d.id} value={d.nameEn}>{d.nameEn}</option>
                      ))}
                    </select>

                    {/* Search */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search skater or bib..."
                        value={startListSearch}
                        onChange={(e) => setStartListSearch(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="p-3">Bib #</th>
                        <th className="p-3">Heat #</th>
                        <th className="p-3">Skater Name</th>
                        <th className="p-3">Reg No</th>
                        <th className="p-3">District</th>
                        <th className="p-3">Club</th>
                        <th className="p-3">Event / Distance</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {filteredRegistrations.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-500 italic">
                            No participant entries match the selected filters.
                          </td>
                        </tr>
                      ) : (
                        filteredRegistrations.map(reg => (
                          <tr key={reg.id} className="hover:bg-slate-800/40">
                            <td className="p-3 font-mono font-bold text-amber-400 text-sm">{reg.bibNumber || '—'}</td>
                            <td className="p-3 font-mono font-bold text-sky-400">Heat {reg.heatNumber || 1}</td>
                            <td className="p-3 font-extrabold text-white text-sm">{reg.skaterName}</td>
                            <td className="p-3 font-mono text-slate-400 text-[10px]">{reg.registrationNumber}</td>
                            <td className="p-3">{reg.districtName}</td>
                            <td className="p-3">{reg.clubName}</td>
                            <td className="p-3 text-amber-300">{reg.discipline} — {reg.distance}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                                APPROVED
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

            {/* TAB CONTENT 3: TOURNAMENT RESULT UPLOAD */}
            {activeSubTab === 'livescore' && (
              <TournamentResultUploader tournamentId={activeTour.id} />
            )}

            {/* TAB CONTENT 4: OFFICIAL TOURNAMENT REPORT */}
            {activeSubTab === 'report' && (
              <TournamentReport tournamentId={activeTour.id} />
            )}

          </div>
        )
      )}

      {/* CREATE TOURNAMENT MODAL */}
      {showAddTourModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" /> Create Championship / Tournament
            </h2>

            <form onSubmit={handleCreateTournament} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold">Tournament Number</label>
                  <input
                    required
                    placeholder="e.g. UPRSA-TN-2026-05"
                    value={tourForm.tournamentNumber}
                    onChange={(e) => setTourForm({ ...tourForm, tournamentNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold">Status</label>
                  <select
                    value={tourForm.status}
                    onChange={(e) => setTourForm({ ...tourForm, status: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                  >
                    <option value="Upcoming">Upcoming</option>
                    <option value="Live">Live</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold">Championship Name (English)</label>
                <input
                  required
                  placeholder="e.g. 42nd UP State Roller Skating Championship"
                  value={tourForm.nameEn}
                  onChange={(e) => setTourForm({ ...tourForm, nameEn: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold">Championship Name (Hindi)</label>
                <input
                  placeholder="e.g. 42वीं उत्तर प्रदेश राज्य रोलर स्केटिंग प्रतियोगिता"
                  value={tourForm.nameHi}
                  onChange={(e) => setTourForm({ ...tourForm, nameHi: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-hindi"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold">Host District</label>
                  <select
                    value={tourForm.districtName}
                    onChange={(e) => setTourForm({ ...tourForm, districtName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    {districts.map(d => (
                      <option key={d.id} value={d.nameEn}>{d.nameEn}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold">Venue Rink / Address</label>
                  <input
                    required
                    placeholder="e.g. KD Singh Babu Stadium Rink"
                    value={tourForm.venue}
                    onChange={(e) => setTourForm({ ...tourForm, venue: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={tourForm.startDate}
                    onChange={(e) => setTourForm({ ...tourForm, startDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={tourForm.endDate}
                    onChange={(e) => setTourForm({ ...tourForm, endDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-amber-400 font-extrabold block mb-1">फॉर्म की लास्ट डेट (Last Date)</label>
                  <input
                    type="date"
                    required
                    value={tourForm.lastDate}
                    onChange={(e) => setTourForm({ ...tourForm, lastDate: e.target.value })}
                    className="w-full bg-slate-950 border border-amber-500/50 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>
              </div>

              {/* DYNAMIC AGE GROUP & DISCIPLINE EVENT SELECTION MATRIX LIMITS */}
              <div className="bg-slate-950 border border-amber-500/40 p-4 rounded-2xl space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
                  <div>
                    <label className="text-amber-400 font-black text-xs sm:text-sm block flex items-center gap-2">
                      <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
                      कैटगरी एवं आयु वर्ग अनुसार मैच चयन सेटिंग्स (Match Limits Rules)
                    </label>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      यहाँ सेट करें कि <strong>Speed Quad, Speed Inline या Adjustable</strong> आदि में किस एज ग्रुप (उदा. Under 6, Cadet, Senior) का बच्चा अधिकतम कितने मैच सेलेक्ट कर सकता है:
                    </p>
                  </div>
                </div>

                {/* 1. Category Tabs */}
                <div>
                  <label className="text-[11px] font-bold text-amber-300 mb-1.5 block uppercase tracking-wider">
                    1. स्केट्स कैटेगरी (Discipline) चुनें:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_DISCIPLINES.map((disc) => (
                      <button
                        key={disc}
                        type="button"
                        onClick={() => setLimitTabDisc(disc)}
                        className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-1.5 ${
                          limitTabDisc === disc
                            ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 scale-105'
                            : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                        }`}
                      >
                        {disc}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Matrix for Selected Discipline */}
                <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-2.5 gap-2">
                    <span className="text-amber-400 font-black text-xs flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span className="underline decoration-amber-500">{limitTabDisc}</span> हेतु सभी आयु वर्गों (Age Groups) की मैच सीमाएं:
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400 font-bold mr-1">इस Category के सभी ग्रुप को बनाएं:</span>
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => {
                            const matrix = { ...(tourForm.disciplineAgeGroupEventLimits || {}) };
                            const discLimits = { ...(matrix[limitTabDisc] || {}) };
                            ALL_AGE_GROUPS.forEach(ag => {
                              discLimits[ag] = val;
                            });
                            setTourForm({
                              ...tourForm,
                              disciplineAgeGroupEventLimits: {
                                ...matrix,
                                [limitTabDisc]: discLimits
                              }
                            });
                          }}
                          className="px-2 py-0.5 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 rounded font-black text-[10px] border border-slate-700"
                        >
                          {val} Matches
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Age Group Rows for Selected Discipline */}
                  <div className="space-y-2">
                    {ALL_AGE_GROUPS.map((ag) => {
                      const matrix = tourForm.disciplineAgeGroupEventLimits || {};
                      const currentVal = matrix[limitTabDisc]?.[ag] ?? tourForm.ageGroupEventLimits?.[ag] ?? tourForm.maxEventsPerSkater ?? 2;

                      return (
                        <div key={ag} className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-950/90 p-2.5 rounded-xl border border-slate-800 gap-2">
                          <div>
                            <span className="text-white font-extrabold text-xs">{ag}</span>
                            <span className="block text-[10px] text-amber-400/80 font-medium">
                              {limitTabDisc} • {ag}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((num) => (
                              <button
                                key={num}
                                type="button"
                                onClick={() => {
                                  const matrix = { ...(tourForm.disciplineAgeGroupEventLimits || {}) };
                                  const discLimits = { ...(matrix[limitTabDisc] || {}) };
                                  discLimits[ag] = num;
                                  setTourForm({
                                    ...tourForm,
                                    disciplineAgeGroupEventLimits: {
                                      ...matrix,
                                      [limitTabDisc]: discLimits
                                    }
                                  });
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                                  currentVal === num
                                    ? 'bg-amber-500 text-slate-950 shadow-md border border-amber-400 scale-105'
                                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                                }`}
                              >
                                {num} {num === 1 ? 'Match' : 'Matches'}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button type="button" onClick={() => setShowAddTourModal(false)} className="flex-1 py-2.5 bg-slate-800 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-amber-500 text-slate-950 font-black rounded-xl">Save & Open Control Center</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TOURNAMENT MODAL */}
      {showEditTourModal && editingTournament && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-amber-400" /> एडिट टूर्नामेंट (Edit Tournament Details)
            </h2>

            <form onSubmit={handleUpdateTournament} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold">Tournament Number</label>
                  <input
                    required
                    value={tourForm.tournamentNumber}
                    onChange={(e) => setTourForm({ ...tourForm, tournamentNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold">Status</label>
                  <select
                    value={tourForm.status}
                    onChange={(e) => setTourForm({ ...tourForm, status: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                  >
                    <option value="Upcoming">Upcoming</option>
                    <option value="Live">Live</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold">Championship Name (English)</label>
                <input
                  required
                  value={tourForm.nameEn}
                  onChange={(e) => setTourForm({ ...tourForm, nameEn: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold">Championship Name (Hindi)</label>
                <input
                  value={tourForm.nameHi}
                  onChange={(e) => setTourForm({ ...tourForm, nameHi: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-hindi"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold">Host District</label>
                  <select
                    value={tourForm.districtName}
                    onChange={(e) => setTourForm({ ...tourForm, districtName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    {districts.map(d => (
                      <option key={d.id} value={d.nameEn}>{d.nameEn}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold">Venue Rink / Address</label>
                  <input
                    required
                    value={tourForm.venue}
                    onChange={(e) => setTourForm({ ...tourForm, venue: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={tourForm.startDate}
                    onChange={(e) => setTourForm({ ...tourForm, startDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={tourForm.endDate}
                    onChange={(e) => setTourForm({ ...tourForm, endDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-amber-400 font-extrabold block mb-1">फॉर्म की लास्ट डेट (Last Date)</label>
                  <input
                    type="date"
                    required
                    value={tourForm.lastDate}
                    onChange={(e) => setTourForm({ ...tourForm, lastDate: e.target.value })}
                    className="w-full bg-slate-950 border border-amber-500/50 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>
              </div>

              {/* DYNAMIC AGE GROUP & DISCIPLINE EVENT SELECTION MATRIX LIMITS */}
              <div className="bg-slate-950 border border-amber-500/40 p-4 rounded-2xl space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
                  <div>
                    <label className="text-amber-400 font-black text-xs sm:text-sm block flex items-center gap-2">
                      <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
                      कैटगरी एवं आयु वर्ग अनुसार मैच चयन सेटिंग्स (Match Limits Rules)
                    </label>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      यहाँ सेट करें कि <strong>Speed Quad, Speed Inline या Adjustable</strong> आदि में किस एज ग्रुप (उदा. Under 6, Cadet, Senior) का बच्चा अधिकतम कितने मैच सेलेक्ट कर सकता है:
                    </p>
                  </div>
                </div>

                {/* 1. Category Tabs */}
                <div>
                  <label className="text-[11px] font-bold text-amber-300 mb-1.5 block uppercase tracking-wider">
                    1. स्केट्स कैटेगरी (Discipline) चुनें:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_DISCIPLINES.map((disc) => (
                      <button
                        key={disc}
                        type="button"
                        onClick={() => setLimitTabDisc(disc)}
                        className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-1.5 ${
                          limitTabDisc === disc
                            ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 scale-105'
                            : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                        }`}
                      >
                        {disc}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Matrix for Selected Discipline */}
                <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-2.5 gap-2">
                    <span className="text-amber-400 font-black text-xs flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span className="underline decoration-amber-500">{limitTabDisc}</span> हेतु सभी आयु वर्गों (Age Groups) की मैच सीमाएं:
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400 font-bold mr-1">इस Category के सभी ग्रुप को बनाएं:</span>
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => {
                            const matrix = { ...(tourForm.disciplineAgeGroupEventLimits || {}) };
                            const discLimits = { ...(matrix[limitTabDisc] || {}) };
                            ALL_AGE_GROUPS.forEach(ag => {
                              discLimits[ag] = val;
                            });
                            setTourForm({
                              ...tourForm,
                              disciplineAgeGroupEventLimits: {
                                ...matrix,
                                [limitTabDisc]: discLimits
                              }
                            });
                          }}
                          className="px-2 py-0.5 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 rounded font-black text-[10px] border border-slate-700"
                        >
                          {val} Matches
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Age Group Rows for Selected Discipline */}
                  <div className="space-y-2">
                    {ALL_AGE_GROUPS.map((ag) => {
                      const matrix = tourForm.disciplineAgeGroupEventLimits || {};
                      const currentVal = matrix[limitTabDisc]?.[ag] ?? tourForm.ageGroupEventLimits?.[ag] ?? tourForm.maxEventsPerSkater ?? 2;

                      return (
                        <div key={ag} className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-950/90 p-2.5 rounded-xl border border-slate-800 gap-2">
                          <div>
                            <span className="text-white font-extrabold text-xs">{ag}</span>
                            <span className="block text-[10px] text-amber-400/80 font-medium">
                              {limitTabDisc} • {ag}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((num) => (
                              <button
                                key={num}
                                type="button"
                                onClick={() => {
                                  const matrix = { ...(tourForm.disciplineAgeGroupEventLimits || {}) };
                                  const discLimits = { ...(matrix[limitTabDisc] || {}) };
                                  discLimits[ag] = num;
                                  setTourForm({
                                    ...tourForm,
                                    disciplineAgeGroupEventLimits: {
                                      ...matrix,
                                      [limitTabDisc]: discLimits
                                    }
                                  });
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                                  currentVal === num
                                    ? 'bg-amber-500 text-slate-950 shadow-md border border-amber-400 scale-105'
                                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                                }`}
                              >
                                {num} {num === 1 ? 'Match' : 'Matches'}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditTourModal(false);
                    setEditingTournament(null);
                  }}
                  className="flex-1 py-2.5 bg-slate-800 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2.5 bg-amber-500 text-slate-950 font-black rounded-xl">
                  अपडेट सेव करें (Save Changes)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / ADD RACE EVENT MODAL (With Multi-Select Checkboxes for Age Group & Gender, Heat Count & Max Participants removed) */}
      {showAddEventModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-lg font-black text-white">Add Race Event to Tournament</h2>
                <p className="text-xs text-slate-400">Select disciplines, multiple age groups & genders to allow event registration.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddEventModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold bg-slate-800 px-2.5 py-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEvents} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Race Number / Code</label>
                  <input
                    required
                    placeholder="e.g. RACE-01"
                    value={eventRaceNumber}
                    onChange={(e) => setEventRaceNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Discipline</label>
                  <select
                    value={eventDiscipline}
                    onChange={(e) => setEventDiscipline(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                  >
                    <option value="Speed Inline">Speed Inline</option>
                    <option value="Speed Quad">Speed Quad</option>
                    <option value="Speed Adjustable">Speed Adjustable</option>
                    <option value="Inline Freestyle">Inline Freestyle</option>
                    <option value="Roller Hockey">Roller Hockey</option>
                    <option value="Artistic Skating">Artistic Skating</option>
                    <option value="Skateboarding">Skateboarding</option>
                  </select>
                </div>
              </div>

              {/* Distance / Race Description */}
              <div>
                <label className="text-slate-300 font-bold block mb-1">Distance / Race Description</label>
                <input
                  required
                  placeholder="e.g. 500 Meter Rink Race, 1000m Lap, 3000m Point-to-Point"
                  value={eventDistance}
                  onChange={(e) => setEventDistance(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                />
              </div>

              {/* MULTI-SELECT AGE GROUPS CHECKBOXES */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-amber-400" />
                    अनुमति प्राप्त आयु वर्ग (Select Allowed Age Groups) <span className="text-red-400">*</span>
                  </label>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setSelectedAgeGroups([...ALL_AGE_GROUPS])}
                      className="text-amber-400 hover:underline font-bold"
                    >
                      सब सेलेक्ट करें
                    </button>
                    <span className="text-slate-600">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedAgeGroups([])}
                      className="text-slate-400 hover:underline font-bold"
                    >
                      सब हटाएं
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {ALL_AGE_GROUPS.map((ag) => {
                    const isChecked = selectedAgeGroups.includes(ag);
                    return (
                      <label
                        key={ag}
                        onClick={() => toggleAgeGroup(ag)}
                        className={`p-2 rounded-lg border text-xs cursor-pointer transition flex items-center gap-2 select-none ${
                          isChecked
                            ? 'bg-amber-500/20 border-amber-500 text-white font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          isChecked ? 'bg-amber-500 border-amber-500 text-slate-950' : 'border-slate-700 bg-slate-950'
                        }`}>
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="text-[11px]">{ag}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* MULTI-SELECT GENDER CHECKBOXES */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-amber-400" />
                    अनुमति प्राप्त लिंग श्रेणी (Select Allowed Genders) <span className="text-red-400">*</span>
                  </label>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setSelectedGenders([...ALL_GENDERS])}
                      className="text-amber-400 hover:underline font-bold"
                    >
                      सब सेलेक्ट करें
                    </button>
                    <span className="text-slate-600">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedGenders([])}
                      className="text-slate-400 hover:underline font-bold"
                    >
                      सब हटाएं
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  {ALL_GENDERS.map((gn) => {
                    const isChecked = selectedGenders.includes(gn);
                    return (
                      <label
                        key={gn}
                        onClick={() => toggleGender(gn)}
                        className={`p-2 rounded-lg border text-xs cursor-pointer transition flex items-center justify-center gap-2 select-none ${
                          isChecked
                            ? 'bg-amber-500/20 border-amber-500 text-white font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          isChecked ? 'bg-amber-500 border-amber-500 text-slate-950' : 'border-slate-700 bg-slate-950'
                        }`}>
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="text-[11px]">{gn}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Summary note */}
              <div className="text-[11px] text-amber-300/80 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20 flex items-center justify-between">
                <span>
                  कुल <strong className="text-amber-400">{selectedAgeGroups.length * selectedGenders.length}</strong> इवेंट्स ऑटोमैटिक क्रिएट हो जाएंगे ({selectedAgeGroups.length} एज ग्रुप × {selectedGenders.length} जेंडर)
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddEventModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={selectedAgeGroups.length === 0 || selectedGenders.length === 0}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black rounded-xl shadow-lg"
                >
                  Save Events ({selectedAgeGroups.length * selectedGenders.length})
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* EDIT RACE EVENT MODAL */}
      {showEditEventModal && editingEvent && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-amber-400" /> Edit Race Event
                </h2>
                <p className="text-xs text-slate-400">इवेंट विवरण, दूरी, अनुशासन (Discipline) या आयु वर्ग अपडेट करें।</p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditEventModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold bg-slate-800 px-2.5 py-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateEvent} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Race Code / Number</label>
                  <input
                    required
                    placeholder="e.g. IN-500M-M"
                    value={editEventForm.raceNumber}
                    onChange={(e) => setEditEventForm({ ...editEventForm, raceNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Discipline</label>
                  <select
                    value={editEventForm.discipline}
                    onChange={(e) => setEditEventForm({ ...editEventForm, discipline: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                  >
                    <option value="Speed Inline">Speed Inline</option>
                    <option value="Speed Quad">Speed Quad</option>
                    <option value="Speed Adjustable">Speed Adjustable</option>
                    <option value="Inline Freestyle">Inline Freestyle</option>
                    <option value="Roller Hockey">Roller Hockey</option>
                    <option value="Artistic Skating">Artistic Skating</option>
                    <option value="Skateboarding">Skateboarding</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Race Distance / Title</label>
                <input
                  required
                  placeholder="e.g. 500 Meter Rink Race (Inline)"
                  value={editEventForm.distance}
                  onChange={(e) => setEditEventForm({ ...editEventForm, distance: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Age Group</label>
                  <select
                    value={editEventForm.ageGroup}
                    onChange={(e) => setEditEventForm({ ...editEventForm, ageGroup: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                  >
                    {ALL_AGE_GROUPS.map(ag => (
                      <option key={ag} value={ag}>{ag}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Gender</label>
                  <select
                    value={editEventForm.gender}
                    onChange={(e) => setEditEventForm({ ...editEventForm, gender: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                  >
                    {ALL_GENDERS.map(gn => (
                      <option key={gn} value={gn}>{gn}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditEventModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                >
                  रद्द करें (Cancel)
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-lg"
                >
                  इवेंट अपडेट करें (Update Event)
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* DELETE EVENT CONFIRMATION MODAL */}
      {deletingEvent && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl text-center">
            
            <div className="w-14 h-14 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto text-red-400">
              <Trash2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-white">इवेंट डिलीट करें (Delete Event)?</h3>
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                क्या आप वाकई <strong className="text-amber-400">{deletingEvent.raceNumber || deletingEvent.distance}</strong> ({deletingEvent.discipline} - {deletingEvent.ageGroup}) को डिलीट करना चाहते हैं?
              </p>
              <p className="text-[11px] text-red-400 font-semibold bg-red-950/50 p-2 rounded-lg border border-red-800/50">
                ⚠️ चेतावनी: इस इवेंट से जुड़े सभी स्केटर्स की एंट्री भी हट जाएगी।
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingEvent(null)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-extrabold text-xs transition"
              >
                रद्द करें (Cancel)
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-extrabold text-xs transition shadow-lg flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> हाँ, डिलीट करें (Delete)
              </button>
            </div>

          </div>
        </div>
      )}

      {/* REGISTER SKATER MODAL */}
      {showAddSkaterModal && selectedEventForSkater && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-lg font-black text-white">Register Skater into Event</h2>
            <p className="text-xs text-amber-400 font-bold">
              Event: {selectedEventForSkater.discipline} — {selectedEventForSkater.distance} ({selectedEventForSkater.ageGroup})
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search skater by name or reg #..."
                value={skaterSearch}
                onChange={(e) => setSkaterSearch(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
              />
              <select
                value={skaterDistrictFilter}
                onChange={(e) => setSkaterDistrictFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
              >
                <option value="">All Districts</option>
                {districts.map(d => (
                  <option key={d.id} value={d.nameEn}>{d.nameEn}</option>
                ))}
              </select>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1 bg-slate-950 p-2 rounded-xl border border-slate-800">
              {eligibleSkaters.map(skater => {
                const isSelected = selectedSkaterIds.includes(skater.id);

                return (
                  <div
                    key={skater.id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedSkaterIds(selectedSkaterIds.filter(id => id !== skater.id));
                      } else {
                        setSelectedSkaterIds([...selectedSkaterIds, skater.id]);
                      }
                    }}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer transition flex items-center justify-between ${
                      isSelected ? 'bg-amber-500/20 border-amber-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <strong className="text-white block">{skater.name}</strong>
                      <span className="text-[10px] text-slate-400">{skater.registrationNumber} • {skater.districtName}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {isSelected ? 'SELECTED' : 'SELECT'}
                    </span>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleRegisterSkatersToEvent} className="pt-2 flex gap-2">
              <button type="button" onClick={() => setShowAddSkaterModal(false)} className="flex-1 py-2 bg-slate-800 rounded-xl font-bold text-xs">Cancel</button>
              <button
                type="submit"
                disabled={selectedSkaterIds.length === 0}
                className="flex-1 py-2 bg-amber-500 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs"
              >
                Register {selectedSkaterIds.length} Skaters
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
