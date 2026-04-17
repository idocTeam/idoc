import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Stethoscope,
  ArrowRight,
  ChevronRight,
  Loader2,
  BrainCircuit,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { getStoredToken, getStoredUser } from '../utils/session';

// Create and persist an anonymous patient id for non-logged-in users
const getAnonPatientId = () => {
  const key = 'anon_patient_id';
  const existing = localStorage.getItem(key);
  if (existing) return existing;

  const id = `ANON-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  localStorage.setItem(key, id);
  return id;
};

const AISymptomChecker = () => {
  // Step 1 = input form, Step 2 = result screen
  const [step, setStep] = useState(1);

  // Form state
  const [symptoms, setSymptoms] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [uiError, setUiError] = useState('');

  // Full saved backend record
  const [lastRecord, setLastRecord] = useState(null);

  // Clean UI-ready analysis object
  const [analysis, setAnalysis] = useState(null);

  const resetChecker = () => {
    setStep(1);
    setSymptoms('');
    setLoading(false);
    setUiError('');
    setLastRecord(null);
    setAnalysis(null);
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setUiError('');

    try {
      // Logged-in patient token is automatically attached by shared api client,
      // but we still read user info here so we can send a stable patientId if available.
      const token = getStoredToken();
      const user = getStoredUser();

      const storedPatientId =
        user?.role === 'patient'
          ? (user.userId || user._id || user.id || '')
          : '';

      // Payload shape expected by backend validator/controller
      const payload = {
        patientId: storedPatientId || getAnonPatientId(),
        symptoms,
        duration: 'unknown',
        severity: 'medium',
        age: 30,
        gender: 'Other',
        existingConditions: [],
        allergies: [],
        medications: []
      };

      // Backend returns:
      // {
      //   success: true,
      //   message: 'Symptom analysis completed successfully.',
      //   data: symptomCheck
      // }
      const response = await api.post('/symptoms/check', payload);
      const data = response?.data;

      // Be defensive in case backend format changes later
      const record =
        data?.data ||
        data?.record ||
        data?.symptomCheck ||
        (data &&
        typeof data === 'object' &&
        (data.recommendation ||
          data.urgency ||
          data.possibleConditions ||
          data.recommendedDoctorSpecialties)
          ? data
          : null);

      if (!record) {
        throw new Error('Invalid response format from symptom analysis API.');
      }

      // Save the original backend record for debugging/future UI use
      setLastRecord(record);

      // Normalize condition names
      const possibleConditions = Array.isArray(record.possibleConditions)
        ? record.possibleConditions
            .map((item) => (typeof item === 'string' ? item : item?.name))
            .filter(Boolean)
        : [];

      // Normalize specialist names
      const recommendedDoctorSpecialties = Array.isArray(
        record.recommendedDoctorSpecialties
      )
        ? record.recommendedDoctorSpecialties
            .map((item) => (typeof item === 'string' ? item : item?.name))
            .filter(Boolean)
        : [];

      // Create a UI-friendly analysis model
      const analysisData = {
        suggestion:
          record.recommendation ||
          'Based on your symptoms, please consult a healthcare professional.',
        urgency: record.urgency || 'medium',
        possibleConditions,
        recommendedDoctorSpecialties:
          recommendedDoctorSpecialties.length > 0
            ? recommendedDoctorSpecialties
            : ['General Medicine'],
        disclaimer:
          record.disclaimer ||
          'This is AI-generated guidance only and not a medical diagnosis.'
      };

      setAnalysis(analysisData);
      setStep(2);
    } catch (error) {
      console.error('Error analyzing symptoms:', error);

      // Show a visible UI error on the same screen
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Could not display the AI result. Please try again.';

      setUiError(message);
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

          <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
            AI Symptom Checker
          </h1>

          <p className="text-slate-500 max-w-2xl mx-auto font-medium">
            Get instant, AI-driven preliminary health suggestions based on your symptoms.
            <span className="block text-xs text-amber-600 mt-2 font-bold italic">
              * For informational purposes only. Always consult a professional.
            </span>
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

                {uiError ? (
                  <div className="p-4 rounded-2xl border bg-red-50 border-red-100 text-red-700 font-medium">
                    {uiError}
                  </div>
                ) : null}

                <button
                  disabled={!symptoms.trim() || loading}
                  onClick={handleAnalyze}
                  className="btn btn-primary w-full h-16 text-lg flex items-center justify-center space-x-3 shadow-xl shadow-primary-600/20 disabled:opacity-60"
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
                {uiError ? (
                  <div className="p-4 rounded-2xl border bg-red-50 border-red-100 text-red-700 font-medium">
                    {uiError}
                  </div>
                ) : null}

                {!analysis ? (
                  <div className="p-10 text-center rounded-3xl bg-white border border-slate-100 text-slate-700 font-medium">
                    No formatted analysis to display yet.
                    {lastRecord?.recommendation ? (
                      <div className="mt-4 text-left p-5 rounded-2xl bg-slate-50 border border-slate-100">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                          Recommendation
                        </p>
                        <p className="text-slate-700 font-medium">
                          {lastRecord.recommendation}
                        </p>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <>
                    <div className="p-6 bg-primary-50 rounded-3xl border border-primary-100">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-primary-600/20">
                          <BrainCircuit className="text-white w-6 h-6" />
                        </div>

                        <div>
                          <h3 className="text-lg font-bold text-primary-900 mb-2">
                            AI Recommendation
                          </h3>
                          <p className="text-primary-800 leading-relaxed font-medium">
                            {analysis.suggestion}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="card border-slate-100 p-6 space-y-4">
                        <div className="flex items-center space-x-2 text-amber-600">
                          <AlertCircle className="w-5 h-5" />
                          <span className="text-xs font-bold uppercase tracking-widest">
                            Urgency Level
                          </span>
                        </div>

                        <p className="text-2xl font-bold text-slate-900 capitalize">
                          {analysis.urgency}
                        </p>

                        <p className="text-xs text-slate-500 font-medium leading-relaxed italic">
                          Please monitor your symptoms closely and consult a doctor if they worsen.
                        </p>
                      </div>

                      <div className="card border-slate-100 p-6 space-y-4">
                        <div className="flex items-center space-x-2 text-primary-600">
                          <Stethoscope className="w-5 h-5" />
                          <span className="text-xs font-bold uppercase tracking-widest">
                            Recommended Specialists
                          </span>
                        </div>

                        <div className="space-y-2">
                          {analysis.recommendedDoctorSpecialties.map((specialty, index) => (
                            <div
                              key={index}
                              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-800 font-semibold"
                            >
                              {specialty}
                            </div>
                          ))}
                        </div>

                        <Link
                          to="/doctors"
                          className="text-primary-600 font-bold text-sm flex items-center space-x-1 hover:underline"
                        >
                          <span>Find Doctors</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-bold text-slate-900 flex items-center space-x-2">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <span>Possible Conditions</span>
                      </h4>

                      {analysis.possibleConditions.length > 0 ? (
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {analysis.possibleConditions.map((item, index) => (
                            <li
                              key={index}
                              className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-700 font-medium"
                            >
                              <div className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-600 font-medium">
                          No specific possible conditions were returned for this symptom set.
                        </div>
                      )}
                    </div>

                    <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100">
                      <p className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-2">
                        Medical Disclaimer
                      </p>
                      <p className="text-amber-900 font-medium leading-relaxed">
                        {analysis.disclaimer}
                      </p>
                    </div>

                    {lastRecord?.rawAiResponse ? (
                      <details className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                        <summary className="cursor-pointer text-sm font-bold text-slate-700">
                          View Raw AI Response
                        </summary>
                        <pre className="mt-4 whitespace-pre-wrap break-words text-xs text-slate-600 overflow-auto">
                          {JSON.stringify(lastRecord.rawAiResponse, null, 2)}
                        </pre>
                      </details>
                    ) : null}

                    <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
                      <button onClick={resetChecker} className="btn btn-outline flex-1">
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
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AISymptomChecker;