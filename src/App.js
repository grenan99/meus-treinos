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
  Dumbbell,
  Share2,
  Download,
  Copy,
  Check,
  Minus
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
    dumbbell: Dumbbell,
    share: Share2,
    download: Download,
    copy: Copy,
    minus: Minus
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
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [expandedWorkout, setExpandedWorkout] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareCode, setShareCode] = useState('');
  const [importCode, setImportCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  
  // Form fields
  const [selectedDays, setSelectedDays] = useState([]);
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [observations, setObservations] = useState('');
  const [exercises, setExercises] = useState([{
    id: Date.now(),
    name: '',
    series: 0,
    repetitions: 0,
    observation: ''
  }]);
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedOver, setDraggedOver] = useState(null);

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

  // Generate workout name
  const generateWorkoutName = (areas) => {
    if (areas.length === 0) return 'Treino';
    const areaLabels = areas.map(area => 
      bodyAreas.find(ba => ba.value === area)?.label || area
    );
    return `Treino de ${areaLabels.join(', ')}`;
  };

  // Generate share code
  const generateShareCode = (workout) => {
    const workoutData = {
      name: workout.name,
      areas: workout.areas,
      days: workout.days,
      exercises: workout.exercises.map(ex => ({
        name: ex.name,
        series: ex.series || 0,
        repetitions: ex.repetitions || 0,
        observation: ex.observation || '',
        notes: ex.notes || ''
      })),
      observations: workout.observations
    };
    
    const jsonString = JSON.stringify(workoutData);
    const base64 = btoa(encodeURIComponent(jsonString));
    return base64;
  };

  // Decode share code
  const decodeShareCode = (code) => {
    try {
      const jsonString = decodeURIComponent(atob(code));
      const workoutData = JSON.parse(jsonString);
      return workoutData;
    } catch (error) {
      console.error('Error decoding share code:', error);
      return null;
    }
  };

  // Handle share workout
  const handleShareWorkout = (workout) => {
    const code = generateShareCode(workout);
    setShareCode(code);
    setShowShareModal(true);
    setCopiedCode(false);
  };

  // Handle copy code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(shareCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Handle import workout
  const handleImportWorkout = () => {
    const workoutData = decodeShareCode(importCode);
    if (workoutData) {
      const newWorkout = {
        id: Date.now(),
        ...workoutData,
        date: new Date().toISOString().split('T')[0],
        exercises: workoutData.exercises.map(ex => ({
          ...ex,
          id: Date.now() + Math.random(),
          completed: false,
          sets: ex.series > 0 ? [{
            id: Date.now() + Math.random(),
            description: `${ex.series} séries x ${ex.repetitions} repetições`,
            completed: false
          }] : []
        }))
      };
      
      setWorkouts([...workouts, newWorkout]);
      setImportCode('');
      setShowImportModal(false);
    } else {
      alert('Código inválido! Verifique e tente novamente.');
    }
  };

  // Clear form
  const clearForm = () => {
    setSelectedDays([]);
    setSelectedAreas([]);
    setObservations('');
    setExercises([{
      id: Date.now(),
      name: '',
      series: 0,
      repetitions: 0,
      observation: ''
    }]);
    setEditingWorkout(null);
    setShowAddModal(false);
  };

  // Add exercise to form
  const addExercise = () => {
    setExercises([...exercises, {
      id: Date.now(),
      name: '',
      series: 0,
      repetitions: 0,
      observation: ''
    }]);
  };

  // Remove exercise from form
  const removeExercise = (exerciseId) => {
    if (exercises.length > 1) {
      setExercises(exercises.filter(ex => ex.id !== exerciseId));
    }
  };

  // Update exercise in form
  const updateExercise = (exerciseId, field, value) => {
    setExercises(exercises.map(ex => 
      ex.id === exerciseId ? { ...ex, [field]: value } : ex
    ));
  };

  // Increment/Decrement exercise values
  const incrementValue = (exerciseId, field) => {
    setExercises(exercises.map(ex => 
      ex.id === exerciseId ? { ...ex, [field]: Math.max(0, (ex[field] || 0) + 1) } : ex
    ));
  };

  const decrementValue = (exerciseId, field) => {
    setExercises(exercises.map(ex => 
      ex.id === exerciseId ? { ...ex, [field]: Math.max(0, (ex[field] || 0) - 1) } : ex
    ));
  };

  // Add workout
  const addWorkout = () => {
    if (selectedAreas.length === 0 || !exercises.some(ex => ex.name.trim())) return;
    
    const validExercises = exercises.filter(ex => ex.name.trim());
    const workoutName = generateWorkoutName(selectedAreas);
    
    const newWorkout = {
      id: Date.now(),
      name: workoutName,
      date: new Date().toISOString().split('T')[0],
      exercises: validExercises.map(ex => ({
        ...ex,
        completed: false,
        sets: ex.series > 0 ? [{
          id: Date.now() + Math.random(),
          description: `${ex.series} séries x ${ex.repetitions} repetições`,
          completed: false
        }] : [],
        notes: ex.observation
      })),
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
    setSelectedDays(workout.days || []);
    setSelectedAreas(workout.areas || []);
    setObservations(workout.observations || '');
    setExercises(workout.exercises.map(ex => ({
      id: ex.id,
      name: ex.name,
      series: ex.series || (ex.sets && ex.sets[0] ? parseInt(ex.sets[0].description.match(/\d+/)?.[0] || 0) : 0),
      repetitions: ex.repetitions || (ex.sets && ex.sets[0] ? parseInt(ex.sets[0].description.match(/x\s*(\d+)/)?.[1] || 0) : 0),
      observation: ex.observation || ex.notes || ''
    })));
    setShowAddModal(true);
  };

  // Save edited workout
  const saveEditedWorkout = () => {
    if (!editingWorkout || selectedAreas.length === 0 || !exercises.some(ex => ex.name.trim())) return;
    
    const validExercises = exercises.filter(ex => ex.name.trim());
    const workoutName = generateWorkoutName(selectedAreas);
    
    const updatedWorkout = {
      ...editingWorkout,
      name: workoutName,
      exercises: validExercises.map(ex => ({
        ...ex,
        completed: false,
        sets: ex.series > 0 ? [{
          id: Date.now() + Math.random(),
          description: `${ex.series} séries x ${ex.repetitions} repetições`,
          completed: false
        }] : [],
        notes: ex.observation
      })),
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

  // Drag and Drop functions
  const handleDragStart = (e, workoutId) => {
    setDraggedItem(workoutId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', workoutId);
  };

  const handleDragOver = (e, workoutId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggedOver(workoutId);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDraggedOver(null);
  };

  const handleDrop = (e, targetWorkoutId) => {
    e.preventDefault();
    
    if (draggedItem && draggedItem !== targetWorkoutId) {
      const draggedIndex = workouts.findIndex(w => w.id === draggedItem);
      const targetIndex = workouts.findIndex(w => w.id === targetWorkoutId);
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const newWorkouts = [...workouts];
        const [draggedWorkout] = newWorkouts.splice(draggedIndex, 1);
        newWorkouts.splice(targetIndex, 0, draggedWorkout);
        setWorkouts(newWorkouts);
      }
    }
    
    setDraggedItem(null);
    setDraggedOver(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDraggedOver(null);
  };

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

                  {/* Exercises */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Exercícios do Treino *
                    </label>
                    <div className="space-y-4">
                      {exercises.map((exercise, index) => (
                        <div key={exercise.id} className="border border-gray-200 rounded-md p-4 bg-gray-50">
                          <div className="space-y-4">
                            {/* Exercise Name */}
                            <div>
                              <input
                                type="text"
                                value={exercise.name}
                                onChange={(e) => updateExercise(exercise.id, 'name', e.target.value)}
                                placeholder="Nome do exercício"
                                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                              />
                            </div>

                            {/* Series and Repetitions */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Quantidade de Séries</label>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => decrementValue(exercise.id, 'series')}
                                    className="p-2 border border-gray-300 rounded-md hover:bg-gray-100"
                                  >
                                    <Icon name="minus" className="h-4 w-4" />
                                  </button>
                                  <input
                                    type="number"
                                    value={exercise.series}
                                    onChange={(e) => updateExercise(exercise.id, 'series', parseInt(e.target.value) || 0)}
                                    className="w-16 text-center p-2 border border-gray-300 rounded-md"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => incrementValue(exercise.id, 'series')}
                                    className="p-2 border border-gray-300 rounded-md hover:bg-gray-100"
                                  >
                                    <Icon name="plus" className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>

                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Repetições por série</label>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => decrementValue(exercise.id, 'repetitions')}
                                    className="p-2 border border-gray-300 rounded-md hover:bg-gray-100"
                                  >
                                    <Icon name="minus" className="h-4 w-4" />
                                  </button>
                                  <input
                                    type="number"
                                    value={exercise.repetitions}
                                    onChange={(e) => updateExercise(exercise.id, 'repetitions', parseInt(e.target.value) || 0)}
                                    className="w-16 text-center p-2 border border-gray-300 rounded-md"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => incrementValue(exercise.id, 'repetitions')}
                                    className="p-2 border border-gray-300 rounded-md hover:bg-gray-100"
                                  >
                                    <Icon name="plus" className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Exercise Observation */}
                            <div>
                              <input
                                type="text"
                                value={exercise.observation}
                                onChange={(e) => updateExercise(exercise.id, 'observation', e.target.value)}
                                placeholder="Observação do exercício"
                                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                              />
                            </div>
                          </div>

                          {/* Remove Exercise Button */}
                          {exercises.length > 1 && (
                            <button
                              onClick={() => removeExercise(exercise.id)}
                              className="mt-3 text-red-600 text-sm hover:text-red-700"
                            >
                              Remover exercício
                            </button>
                          )}
                        </div>
                      ))}

                      {/* Add Exercise Button */}
                      <button
                        onClick={addExercise}
                        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-gray-400 hover:text-gray-700 flex items-center justify-center gap-2"
                      >
                        <Icon name="plus" />
                        Adicionar exercício
                      </button>
                    </div>
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
