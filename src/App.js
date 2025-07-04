import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  Play, 
  Pause, 
  Square, 
  Plus, 
  Edit, 
  Trash2, 
  BarChart3, 
  Target, 
  Trophy, 
  TrendingUp, 
  Eye, 
  X, 
  Dumbbell 
} from 'lucide-react';

// Componente Icon com Lucide
const Icon = ({ name, className = "h-4 w-4", ...props }) => {
  const icons = {
    calendar: Calendar,
    clock: Clock,
    check: CheckCircle,
    play: Play,
    pause: Pause,
    stop: Square,
    plus: Plus,
    edit: Edit,
    trash: Trash2,
    chart: BarChart3,
    target: Target,
    trophy: Trophy,
    trend: TrendingUp,
    eye: Eye,
    x: X,
    dumbbell: Dumbbell
  };
  
  const IconComponent = icons[name];
  return IconComponent ? <IconComponent className={className} {...props} /> : null;
};

const WorkoutOrganizer = () => {
  const [workouts, setWorkouts] = useState(() => {
    const saved = localStorage.getItem('workouts');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [completedWorkouts, setCompletedWorkouts] = useState(() => {
    const saved = localStorage.getItem('completedWorkouts');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [currentView, setCurrentView] = useState('workouts');
  const [newWorkoutText, setNewWorkoutText] = useState('');
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [expandedWorkout, setExpandedWorkout] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form fields
  const [selectedDays, setSelectedDays] = useState([]);
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [observations, setObservations] = useState('');

  const daysOfWeek = [
    { value: 'segunda', label: 'Segunda-feira' },
    { value: 'terca', label: 'Terça-feira' },
    { value: 'quarta', label: 'Quarta-feira' },
    { value: 'quinta', label: 'Quinta-feira' },
    { value: 'sexta', label: 'Sexta-feira' },
    { value: 'sabado', label: 'Sábado' },
    { value: 'domingo', label: 'Domingo' }
  ];

  const bodyAreas = [
    { value: 'peito', label: 'Peito' },
    { value: 'triceps', label: 'Tríceps' },
    { value: 'biceps', label: 'Bíceps' },
    { value: 'costas', label: 'Costas' },
    { value: 'quadriceps', label: 'Quadríceps' },
    { value: 'posterior', label: 'Posterior' },
    { value: 'ombro', label: 'Ombro' }
  ];

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('workouts', JSON.stringify(workouts));
  }, [workouts]);

  useEffect(() => {
    localStorage.setItem('completedWorkouts', JSON.stringify(completedWorkouts));
  }, [completedWorkouts]);

  // Timer effect
  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setTimer(timer => timer + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timer]);

  // Format time
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Parse workout text
  const parseWorkoutText = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    const exercises = [];

    lines.forEach(line => {
      line = line.trim();
      const exerciseMatch = line.match(/^(\d+)[-\.\)]\s*(.*)/);
      
      if (exerciseMatch) {
        const fullText = exerciseMatch[2];
        let exerciseName = '';
        let seriesInfo = '';
        
        const seriesPatterns = [
          /(\d+\s+séries?)/i,
          /(\d+\s+series?)/i,
          /(\d+x\d+)/i,
          /(\d+\s*x\s*\d+)/i
        ];
        
        let foundSeriesAt = -1;
        
        for (let pattern of seriesPatterns) {
          const match = fullText.match(pattern);
          if (match) {
            foundSeriesAt = fullText.indexOf(match[0]);
            break;
          }
        }
        
        if (foundSeriesAt !== -1) {
          exerciseName = fullText.substring(0, foundSeriesAt).replace(/\s*-\s*$/, '').trim();
          seriesInfo = fullText.substring(foundSeriesAt).trim();
        } else {
          exerciseName = fullText.trim();
        }
        
        const exercise = {
          id: Date.now() + Math.random(),
          name: exerciseName,
          sets: seriesInfo ? [{
            id: Date.now() + Math.random(),
            description: seriesInfo,
            completed: false
          }] : [],
          completed: false,
          notes: seriesInfo
        };
        
        exercises.push(exercise);
      }
    });

    return exercises;
  };

  // Generate workout name
  const generateWorkoutName = (areas) => {
    if (areas.length === 0) return 'Treino';
    const areaLabels = areas.map(area => 
      bodyAreas.find(ba => ba.value === area)?.label || area
    );
    return `Treino de ${areaLabels.join(', ')}`;
  };

  // Clear form
  const clearForm = () => {
    setNewWorkoutText('');
    setSelectedDays([]);
    setSelectedAreas([]);
    setObservations('');
    setEditingWorkout(null);
    setShowAddModal(false);
  };

  // Add workout
  const addWorkout = () => {
    if (!newWorkoutText.trim() || selectedAreas.length === 0) return;
    
    const exercises = parseWorkoutText(newWorkoutText);
    const workoutName = generateWorkoutName(selectedAreas);
    
    const newWorkout = {
      id: Date.now(),
      name: workoutName,
      date: new Date().toISOString().split('T')[0],
      exercises: exercises,
      rawText: newWorkoutText,
      days: selectedDays,
      areas: selectedAreas,
      observations: observations
    };
    
    setWorkouts([...workouts, newWorkout]);
    clearForm();
  };

  // Start workout
  const startWorkout = (workout) => {
    setActiveWorkout({
      ...workout,
      startTime: new Date(),
      exercises: workout.exercises.map(ex => ({
        ...ex,
        completed: false,
        sets: ex.sets.map(set => ({ ...set, completed: false }))
      }))
    });
    setTimer(0);
    setIsRunning(true);
    setCurrentView('active');
  };

  // Toggle exercise completion
  const toggleExerciseCompletion = (exerciseId) => {
    setActiveWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex => 
        ex.id === exerciseId 
          ? { ...ex, completed: !ex.completed }
          : ex
      )
    }));
  };

  // Finish workout
  const finishWorkout = () => {
    const completedWorkout = {
      ...activeWorkout,
      endTime: new Date(),
      duration: timer,
      completedAt: new Date().toISOString()
    };
    
    setCompletedWorkouts([...completedWorkouts, completedWorkout]);
    setActiveWorkout(null);
    setIsRunning(false);
    setTimer(0);
    setCurrentView('workouts');
  };

  // Delete workout
  const deleteWorkout = (workoutId) => {
    setWorkouts(workouts.filter(w => w.id !== workoutId));
  };

  // Edit workout
  const editWorkout = (workout) => {
    setEditingWorkout(workout);
    setNewWorkoutText(workout.rawText);
    setSelectedDays(workout.days || []);
    setSelectedAreas(workout.areas || []);
    setObservations(workout.observations || '');
    setShowAddModal(true);
  };

  // Save edited workout
  const saveEditedWorkout = () => {
    if (!editingWorkout || !newWorkoutText.trim() || selectedAreas.length === 0) return;
    
    const exercises = parseWorkoutText(newWorkoutText);
    const workoutName = generateWorkoutName(selectedAreas);
    
    const updatedWorkout = {
      ...editingWorkout,
      name: workoutName,
      exercises: exercises,
      rawText: newWorkoutText,
      days: selectedDays,
      areas: selectedAreas,
      observations: observations
    };
    
    setWorkouts(workouts.map(w => w.id === editingWorkout.id ? updatedWorkout : w));
    clearForm();
  };

  // Toggle selections
  const toggleDay = (day) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const toggleArea = (area) => {
    setSelectedAreas(prev => 
      prev.includes(area) 
        ? prev.filter(a => a !== area)
        : [...prev, area]
    );
  };

  // Get stats
  const getWorkoutStats = () => {
    const totalWorkouts = completedWorkouts.length;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const thisMonthWorkouts = completedWorkouts.filter(w => {
      const date = new Date(w.completedAt);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
    
    const avgDuration = totalWorkouts > 0 
      ? Math.round(completedWorkouts.reduce((sum, w) => sum + w.duration, 0) / totalWorkouts)
      : 0;
    
    const exerciseStats = {};
    completedWorkouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        if (exercise.completed) {
          exerciseStats[exercise.name] = (exerciseStats[exercise.name] || 0) + 1;
        }
      });
    });
    
    return {
      totalWorkouts,
      thisMonthWorkouts: thisMonthWorkouts.length,
      avgDuration,
      exerciseStats
    };
  };

  const stats = getWorkoutStats();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Icon name="dumbbell" className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            Meus Treinos
          </h1>
        </div>
        
        {/* Navigation */}
        <div className="flex gap-1 sm:gap-2 mb-6 sm:mb-8 border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => setCurrentView('workouts')}
            className={`px-3 sm:px-4 py-2 sm:py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
              currentView === 'workouts' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Treinos
          </button>
          <button
            onClick={() => setCurrentView('calendar')}
            className={`px-3 sm:px-4 py-2 sm:py-3 font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              currentView === 'calendar' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon name="calendar" />
            Calendário
          </button>
          <button
            onClick={() => setCurrentView('stats')}
            className={`px-3 sm:px-4 py-2 sm:py-3 font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              currentView === 'stats' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon name="chart" />
            Relatórios
          </button>
        </div>

        {/* Add/Edit Workout Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
            <div className="bg-white w-full h-full sm:h-auto sm:rounded-lg sm:max-w-2xl sm:max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  {editingWorkout ? 'Editar Treino' : 'Novo Treino'}
                </h2>
                <button
                  onClick={clearForm}
                  className="text-gray-400 hover:text-gray-600 p-2"
                >
                  <Icon name="x" />
                </button>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="space-y-6">
                  {/* Body Areas */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Áreas do Corpo *
                    </label>
                    <div className="border border-gray-300 rounded-md p-3 bg-white">
                      <div className="flex flex-wrap gap-2 mb-3">
                        {selectedAreas.map(area => (
                          <span
                            key={area}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-sm rounded-md"
                          >
                            {bodyAreas.find(ba => ba.value === area)?.label}
                            <button
                              onClick={() => toggleArea(area)}
                              className="hover:bg-blue-700 rounded-full p-0.5 ml-1"
                            >
                              <Icon name="x" className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <select
                        onChange={(e) => {
                          if (e.target.value && !selectedAreas.includes(e.target.value)) {
                            toggleArea(e.target.value);
                          }
                          e.target.value = '';
                        }}
                        className="w-full border-none outline-none bg-transparent text-gray-700"
                        value=""
                      >
                        <option value="">Selecione as áreas...</option>
                        {bodyAreas
                          .filter(area => !selectedAreas.includes(area.value))
                          .map(area => (
                            <option key={area.value} value={area.value}>
                              {area.label}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  {/* Days */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dias da Semana
                    </label>
                    <div className="border border-gray-300 rounded-md p-3 bg-white">
                      <div className="flex flex-wrap gap-2 mb-3">
                        {selectedDays.map(day => (
                          <span
                            key={day}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-sm rounded-md"
                          >
                            {daysOfWeek.find(d => d.value === day)?.label}
                            <button
                              onClick={() => toggleDay(day)}
                              className="hover:bg-green-700 rounded-full p-0.5 ml-1"
                            >
                              <Icon name="x" className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <select
                        onChange={(e) => {
                          if (e.target.value && !selectedDays.includes(e.target.value)) {
                            toggleDay(e.target.value);
                          }
                          e.target.value = '';
                        }}
                        className="w-full border-none outline-none bg-transparent text-gray-700"
                        value=""
                      >
                        <option value="">Selecione os dias...</option>
                        {daysOfWeek
                          .filter(day => !selectedDays.includes(day.value))
                          .map(day => (
                            <option key={day.value} value={day.value}>
                              {day.label}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  {/* Workout Text */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Exercícios do Treino *
                    </label>
                    <textarea
                      value={newWorkoutText}
                      onChange={(e) => setNewWorkoutText(e.target.value)}
                      placeholder="Cole aqui o texto do treino..."
                      className="w-full h-32 p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  {/* Observations */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Observações
                    </label>
                    <textarea
                      value={observations}
                      onChange={(e) => setObservations(e.target.value)}
                      placeholder="Observações sobre o treino..."
                      className="w-full h-20 p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-3 p-4 sm:p-6 border-t border-gray-200 flex-shrink-0">
                <button
                  onClick={editingWorkout ? saveEditedWorkout : addWorkout}
                  disabled={selectedAreas.length === 0 || !newWorkoutText.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-3 rounded-md font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Icon name="plus" />
                  {editingWorkout ? 'Salvar' : 'Adicionar'}
                </button>
                <button
                  onClick={clearForm}
                  className="px-4 py-3 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Active Workout */}
        {currentView === 'active' && activeWorkout && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 sm:p-6 rounded-lg">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4">{activeWorkout.name}</h2>
              <div className="flex items-center justify-between">
                <div className="text-2xl sm:text-3xl font-mono">{formatTime(timer)}</div>
                <div className="flex gap-2 sm:gap-3">
                  <button
                    onClick={() => setIsRunning(!isRunning)}
                    className="bg-white/20 hover:bg-white/30 px-3 sm:px-4 py-2 rounded-md flex items-center gap-2 text-sm sm:text-base"
                  >
                    <Icon name={isRunning ? "pause" : "play"} />
                    {isRunning ? 'Pausar' : 'Continuar'}
                  </button>
                  <button
                    onClick={finishWorkout}
                    className="bg-red-600 hover:bg-red-700 px-3 sm:px-4 py-2 rounded-md flex items-center gap-2 text-sm sm:text-base"
                  >
                    <Icon name="stop" />
                    Finalizar
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {activeWorkout.exercises.map((exercise, index) => (
                <div key={exercise.id} className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                  <div className="flex items-start justify-between mb-4 gap-3">
                    <h3 className="font-semibold text-base sm:text-lg text-gray-900 flex-1">
                      {index + 1}. {exercise.name}
                    </h3>
                    <button
                      onClick={() => toggleExerciseCompletion(exercise.id)}
                      className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md font-medium transition-colors text-sm ${
                        exercise.completed 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Icon name="check" />
                      {exercise.completed ? 'Feito' : 'Marcar'}
                    </button>
                  </div>
                  
                  {exercise.sets.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-gray-700">Informações:</span>
                      {exercise.sets.map((set) => (
                        <div key={set.id} className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                          {set.description}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Workouts View */}
        {currentView === 'workouts' && (
          <div>
            {workouts.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto h-16 w-16 sm:h-24 sm:w-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Icon name="dumbbell" className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum treino criado</h3>
                <p className="text-gray-500 mb-6">Comece adicionando seu primeiro treino.</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium transition-colors flex items-center gap-2 mx-auto"
                >
                  <Icon name="plus" />
                  Adicionar Treino
                </button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Meus Treinos</h2>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 text-sm sm:text-base"
                  >
                    <Icon name="plus" />
                    Adicionar
                  </button>
                </div>

                <div className="grid gap-4">
                  {workouts.map((workout) => (
                    <div key={workout.id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
                      <div className="p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900 flex-1 pr-2">{workout.name}</h3>
                          <div className="flex gap-1 sm:gap-2">
                            <button
                              onClick={() => setExpandedWorkout(expandedWorkout === workout.id ? null : workout.id)}
                              className="text-gray-400 hover:text-blue-600 p-2 rounded-md hover:bg-gray-50"
                              title="Ver detalhes"
                            >
                              <Icon name="eye" />
                            </button>
                            <button
                              onClick={() => editWorkout(workout)}
                              className="text-gray-400 hover:text-blue-600 p-2 rounded-md hover:bg-gray-50"
                              title="Editar"
                            >
                              <Icon name="edit" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm('Excluir este treino?')) {
                                  deleteWorkout(workout.id);
                                  if (expandedWorkout === workout.id) {
                                    setExpandedWorkout(null);
                                  }
                                }
                              }}
                              className="text-gray-400 hover:text-red-600 p-2 rounded-md hover:bg-gray-50"
                              title="Excluir"
                            >
                              <Icon name="trash" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="space-y-3 mb-4">
                          <div className="flex flex-wrap gap-2">
                            <span className="text-sm font-medium text-gray-700">Áreas:</span>
                            <div className="flex flex-wrap gap-1">
                              {workout.areas?.map(area => (
                                <span key={area} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                                  {bodyAreas.find(ba => ba.value === area)?.label}
                                </span>
                              ))}
                            </div>
                          </div>
                          
                          {workout.days && workout.days.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              <span className="text-sm font-medium text-gray-700">Dias:</span>
                              <div className="flex flex-wrap gap-1">
                                {workout.days.map(day => (
                                  <span key={day} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                                    {daysOfWeek.find(d => d.value === day)?.label}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Exercícios:</span> {workout.exercises.length}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => startWorkout(workout)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-md font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <Icon name="play" />
                          Iniciar Treino
                        </button>
                      </div>

                      {expandedWorkout === workout.id && (
                        <div className="border-t border-gray-200 bg-gray-50">
                          <div className="p-4 sm:p-6">
                            {workout.observations && (
                              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                                <h4 className="text-sm font-medium text-blue-800 mb-2">Observações:</h4>
                                <p className="text-sm text-blue-700">{workout.observations}</p>
                              </div>
                            )}

                            <div>
                              <h4 className="text-base font-semibold text-gray-900 mb-4">
                                Exercícios ({workout.exercises.length})
                              </h4>
                              <div className="space-y-4">
                                {workout.exercises.map((exercise, index) => (
                                  <div key={exercise.id} className="text-sm">
                                    <div className="font-medium text-gray-900 mb-1">
                                      {index + 1}. {exercise.name}
                                    </div>
                                    {exercise.sets.length > 0 && (
                                      <div className="text-gray-600 ml-4">
                                        {exercise.sets.map((set) => (
                                          <div key={set.id}>
                                            • {set.description}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Calendar View */}
        {currentView === 'calendar' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">Calendário de Treinos</h2>
            <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
              <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-4">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                  <div key={day} className="text-center font-medium text-gray-700 p-2 text-xs sm:text-sm">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {Array.from({ length: 35 }, (_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() - date.getDay() + i - 14);
                  const dateStr = date.toISOString().split('T')[0];
                  const hasWorkout = completedWorkouts.some(w => 
                    w.completedAt.split('T')[0] === dateStr
                  );
                  
                  return (
                    <div
                      key={i}
                      className={`aspect-square p-1 sm:p-2 rounded-md flex items-center justify-center text-xs sm:text-sm font-medium transition-colors ${
                        hasWorkout 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {date.getDate()}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Stats View */}
        {currentView === 'stats' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">Relatórios e Estatísticas</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Icon name="target" className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm sm:text-base">Total de Treinos</h3>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">{stats.totalWorkouts}</p>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Icon name="trend" className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm sm:text-base">Este Mês</h3>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.thisMonthWorkouts}</p>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Icon name="clock" className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm sm:text-base">Tempo Médio</h3>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-purple-600">{formatTime(stats.avgDuration)}</p>
              </div>
            </div>

            {/* Exercise frequency */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Exercícios Mais Realizados</h3>
              <div className="space-y-3">
                {Object.entries(stats.exerciseStats)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 10)
                  .map(([exercise, count]) => (
                    <div key={exercise} className="flex justify-between items-center py-2">
                      <span className="text-gray-700 text-sm sm:text-base pr-2">{exercise}</span>
                      <span className="font-semibold text-blue-600 bg-blue-50 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                        {count}x
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Recent workouts */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Últimos Treinos</h3>
              <div className="space-y-3">
                {completedWorkouts.slice(-5).reverse().map((workout) => (
                  <div key={workout.id} className="flex justify-between items-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1 pr-2">
                      <p className="font-medium text-gray-900 text-sm sm:text-base">{workout.name}</p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {new Date(workout.completedAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-blue-600 bg-blue-50 px-2 sm:px-3 py-1 rounded-full">
                      {formatTime(workout.duration)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkoutOrganizer;
