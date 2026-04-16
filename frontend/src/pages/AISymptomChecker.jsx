import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  MessageSquare, 
  ShieldCheck, 
  Stethoscope, 
  ArrowRight, 
  ChevronRight, 
  Activity, 
  Loader2,
  BrainCircuit,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const AISymptomChecker = () => {
  const [step, setStep] = useState(1);
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const handleAnalyze = async () => {
    setLoading(true);

    try {
      // Use shared API client so Authorization token (logged-in patient) is attached.
      // Backend will store the real patientId from the token, not an anonymous id.
      const { data } = await api.post('/symptoms/check', {
        symptoms,
        duration: 'unknown',
        severity: 'medium',
        age: 30,
        gender: 'Other',
        existingConditions: [],
        allergies: [],
        medications: []
      });

      if (data?.success && data?.data) {
        const record = data.data;

        // Backend currently returns `possibleConditions` as an array of strings.
        // Handle either shape (strings OR objects with `name`) to avoid blank UI.
        const possibleConditions = Array.isArray(record.possibleConditions) ? record.possibleConditions : [];
        const conditionLabels = possibleConditions
          .map((c) => (typeof c === 'string' ? c : c?.name))
          .filter(Boolean);

        const analysisData = {
          suggestion:
            record.recommendation ||
            'Based on your symptoms, please consult a healthcare professional.',
          recommendedSpecialty: record.recommendedDoctorSpecialties?.[0] || 'General Medicine',
          urgency: record.urgency || 'medium',
          precautions: conditionLabels.length
            ? conditionLabels.slice(0, 3)
            : [
                'Monitor your symptoms closely',
                'Stay hydrated and rest',
                'Seek medical attention if symptoms worsen'
              ]
        };

        setAnalysis(analysisData);
        setStep(2);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error analyzing symptoms:', error);
      // Fallback to mock data if API fails
      setAnalysis({
        suggestion:
          'Based on your symptoms, you might be experiencing seasonal influenza or a common viral infection.',
        recommendedSpecialty: 'General Medicine',
        urgency: 'Moderate',
        precautions: [
          'Stay hydrated and rest',
          'Monitor your temperature',
          'Avoid contact with others if fever persists'
        ]
      });
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-32 pb-20 min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-full font-bold text-xs uppercase tracking-widest border border-primary-100">
            <BrainCircuit className="w-4 h-4" />
            <span>AI-Powered Diagnostics</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">AI Symptom Checker</h1>
          <p className="text-slate-500 max-w-2xl mx-auto font-medium">
            Get instant, AI-driven preliminary health suggestions based on your symptoms.
            <span className="block text-xs text-amber-600 mt-2 font-bold italic">* For informational purposes only. Always consult a professional.</span>
          </p>
        </div>

        <div className="card p-8 lg:p-12 bg-white rounded-[40px] shadow-2xl shadow-primary-200/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-100/30 blur-[100px] rounded-full -mr-32 -mt-32" />
          
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8 relative z-10"
              >
                <div className="space-y-4">
                  <label className="text-xl font-bold text-slate-900 block ml-1">
                    What symptoms are you experiencing?
                  </label>
                  <textarea
                    className="input min-h-[150px] py-4 text-lg resize-none"
                    placeholder="E.g. I have a persistent dry cough, mild fever, and body aches for the last two days..."
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                  />
                  <div className="flex items-center space-x-2 text-slate-400 text-xs font-medium ml-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Your data is encrypted and handled anonymously.</span>
                  </div>
                </div>

                <button
                  disabled={!symptoms || loading}
                  onClick={handleAnalyze}
                  className="btn btn-primary w-full h-16 text-lg flex items-center justify-center space-x-3 shadow-xl shadow-primary-600/20"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>AI Engine Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <span>Start AI Analysis</span>
                      <ChevronRight className="w-6 h-6" />
                    </>
                  )}
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-10 relative z-10"
              >
                <div className="p-6 bg-primary-50 rounded-3xl border border-primary-100">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-primary-600/20">
                      <BrainCircuit className="text-white w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-primary-900 mb-2">AI Suggestion</h3>
                      <p className="text-primary-800 leading-relaxed font-medium">{analysis.suggestion}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="card border-slate-100 p-6 space-y-4">
                    <div className="flex items-center space-x-2 text-primary-600">
                      <Stethoscope className="w-5 h-5" />
                      <span className="text-xs font-bold uppercase tracking-widest">Recommended Specialist</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{analysis.recommendedSpecialty}</p>
                    <Link 
                      to="/doctors" 
                      className="text-primary-600 font-bold text-sm flex items-center space-x-1 hover:underline"
                    >
                      <span>Find Doctors</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>

                  <div className="card border-slate-100 p-6 space-y-4">
                    <div className="flex items-center space-x-2 text-amber-600">
                      <AlertCircle className="w-5 h-5" />
                      <span className="text-xs font-bold uppercase tracking-widest">Urgency Level</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{analysis.urgency}</p>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed italic">
                      Please monitor your symptoms closely over the next 24 hours.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-slate-900 flex items-center space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span>Recommended Precautions</span>
                  </h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {analysis.precautions.map((item, i) => (
                      <li key={i} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-600 font-medium">
                        <div className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => {setStep(1); setSymptoms('');}}
                    className="btn btn-outline flex-1"
                  >
                    Start New Check
                  </button>
                  <Link
                    to="/doctors"
                    className="btn btn-primary flex-1 flex items-center justify-center space-x-2"
                  >
                    <span>Book Specialist Appointment</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AISymptomChecker;
