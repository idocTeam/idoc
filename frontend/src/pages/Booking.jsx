import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronRight,
  AlertCircle,
  Loader2,
  Video,
  Building,
  CheckCircle2,
  Stethoscope,
  Activity
} from "lucide-react";
import { appointmentService, doctorService } from "../services";
import { getStoredUser } from "../utils/session";

const Booking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getStoredUser();

  // -----------------------------
  // Page-level loading states
  // -----------------------------
  const [loading, setLoading] = useState(false);
  const [fetchingDoctor, setFetchingDoctor] = useState(true);
  const [fetchingSlots, setFetchingSlots] = useState(false);

  // -----------------------------
  // Core data states
  // -----------------------------
  const [error, setError] = useState("");
  const [doctor, setDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");

  // IMPORTANT:
  // backend availability mode uses "online" / "physical" / "both"
  // so do not use "telemedicine" as the actual API value
  const [consultationType, setConsultationType] = useState("online");

  // Store all available slots returned from backend
  const [availableSlots, setAvailableSlots] = useState([]);

  // Store the selected slot object, not just a time string
  const [selectedSlot, setSelectedSlot] = useState(null);

  // -----------------------------
  // Initial doctor fetch
  // -----------------------------
  useEffect(() => {
    fetchDoctor();
  }, [id]);

  // -----------------------------
  // Whenever date or consultation type changes,
  // fetch real bookable slots from backend
  // -----------------------------
  useEffect(() => {
    if (!selectedDate) {
      setAvailableSlots([]);
      setSelectedSlot(null);
      return;
    }

    fetchBookableSlots();
  }, [id, selectedDate, consultationType]);

  const fetchDoctor = async () => {
    try {
      setError("");

      const { data } = await doctorService.getById(id);

      setDoctor(data?.doctor || null);
    } catch (err) {
      setError("Failed to fetch doctor details.");
    } finally {
      setFetchingDoctor(false);
    }
  };

  const fetchBookableSlots = async () => {
    try {
      setFetchingSlots(true);
      setError("");
      setSelectedSlot(null);

      // Expected backend flow:
      // GET /appointments/doctors/:doctorId/bookable-slots?date=YYYY-MM-DD&mode=online|physical
      //
      // This assumes appointmentService.getBookableSlots exists.
      const { data } = await appointmentService.getBookableSlots(
        id,
        selectedDate,
        consultationType
      );

      // Be defensive because API response shape can vary
      const rawSlots =
        data?.slots ||
        data?.bookableSlots ||
        data?.data?.slots ||
        data?.data?.bookableSlots ||
        [];

      // Normalize slot objects
      const normalizedSlots = Array.isArray(rawSlots)
        ? rawSlots
            .filter((slot) => slot?.startTime && slot?.endTime)
            .map((slot) => ({
              startTime: slot.startTime,
              endTime: slot.endTime,
              label: `${slot.startTime} - ${slot.endTime}`
            }))
        : [];

      setAvailableSlots(normalizedSlots);
    } catch (err) {
      console.error("Failed to fetch bookable slots:", err);
      setAvailableSlots([]);
      setError(
        err?.response?.data?.message ||
          "Failed to load available time slots for this doctor."
      );
    } finally {
      setFetchingSlots(false);
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();

    if (!selectedDate || !selectedSlot) {
      setError("Please select a date and an available time slot.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await appointmentService.create({
        doctorId: id,
        doctorName: doctor?.fullName,
        patientName: user?.name || user?.fullName,
        appointmentDate: selectedDate,

        // Use actual selected slot values from backend
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,

        // Keep backend value aligned with slot mode system
        consultationType,
        reason: "General checkup"
      });

      navigate("/dashboard", {
        state: {
          success: true,
          message: "Appointment requested successfully!"
        }
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (fetchingDoctor) {
    return (
      <div className="pt-32 pb-20 min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="pt-32 pb-20 min-h-screen text-center">
        <h2 className="text-2xl font-bold text-slate-900">Doctor not found</h2>
        <button
          onClick={() => navigate("/doctors")}
          className="btn btn-primary mt-4 mx-auto"
        >
          Back to Search
        </button>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[40px] p-10 shadow-2xl shadow-primary-200/50 border border-slate-100">
              <h1 className="text-3xl font-bold text-slate-900 mb-8 tracking-tight">
                Schedule Appointment
              </h1>

              <form onSubmit={handleBooking} className="space-y-8">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl flex items-center space-x-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                {/* Date */}
                <div className="space-y-4">
                  <label className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                    <CalendarIcon className="w-5 h-5 text-primary-600" />
                    <span>Select Date</span>
                  </label>

                  <input
                    type="date"
                    required
                    className="input h-14"
                    min={new Date().toISOString().split("T")[0]}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>

                {/* Consultation Type */}
                <div className="space-y-4">
                  <label className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-primary-600" />
                    <span>Consultation Type</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setConsultationType("online")}
                      className={`p-5 rounded-2xl text-left transition-all border-2 flex items-center space-x-4 ${
                        consultationType === "online"
                          ? "border-primary-600 bg-primary-50/50 ring-4 ring-primary-100"
                          : "border-slate-100 hover:border-primary-200"
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          consultationType === "online"
                            ? "bg-primary-600 text-white"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        <Video className="w-6 h-6" />
                      </div>
                      <div>
                        <p
                          className={`font-bold ${
                            consultationType === "online"
                              ? "text-primary-900"
                              : "text-slate-700"
                          }`}
                        >
                          Telemedicine
                        </p>
                        <p className="text-xs text-slate-500 font-medium">
                          Video call session
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setConsultationType("physical")}
                      className={`p-5 rounded-2xl text-left transition-all border-2 flex items-center space-x-4 ${
                        consultationType === "physical"
                          ? "border-primary-600 bg-primary-50/50 ring-4 ring-primary-100"
                          : "border-slate-100 hover:border-primary-200"
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          consultationType === "physical"
                            ? "bg-primary-600 text-white"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        <Building className="w-6 h-6" />
                      </div>
                      <div>
                        <p
                          className={`font-bold ${
                            consultationType === "physical"
                              ? "text-primary-900"
                              : "text-slate-700"
                          }`}
                        >
                          Physical Visit
                        </p>
                        <p className="text-xs text-slate-500 font-medium">
                          In-person meeting
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Time Slots */}
                <div className="space-y-4">
                  <label className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-primary-600" />
                    <span>Select Time</span>
                  </label>

                  {!selectedDate ? (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-500 text-sm">
                      Please select a date first to load this doctor's available slots.
                    </div>
                  ) : fetchingSlots ? (
                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 text-amber-700 text-sm">
                      No available slots found for this date and consultation type.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {availableSlots.map((slot) => {
                        const isSelected =
                          selectedSlot?.startTime === slot.startTime &&
                          selectedSlot?.endTime === slot.endTime;

                        return (
                          <button
                            key={`${slot.startTime}-${slot.endTime}`}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            className={`py-3 px-3 rounded-xl text-sm font-bold transition-all border-2 ${
                              isSelected
                                ? "bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-200"
                                : "bg-white border-slate-100 text-slate-600 hover:border-primary-200 hover:bg-primary-50"
                            }`}
                          >
                            {slot.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !selectedDate || !selectedSlot}
                  className="btn btn-primary w-full h-16 text-lg flex items-center justify-center space-x-3 mt-8 disabled:opacity-50 disabled:grayscale"
                >
                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <span>Confirm Appointment</span>
                      <ChevronRight className="w-6 h-6" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-8 bg-slate-900 text-white overflow-hidden relative border-none">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/20 blur-3xl rounded-full" />

              <div className="flex flex-col items-center text-center space-y-6 relative z-10">
                <img
                  src={
                    doctor.image ||
                    "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80"
                  }
                  alt={doctor.fullName}
                  className="w-24 h-24 rounded-3xl object-cover border-4 border-slate-800 shadow-2xl"
                />

                <div>
                  <div className="flex items-center justify-center space-x-2 text-primary-400 mb-1">
                    <Stethoscope className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {doctor.specialty}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold">Dr. {doctor.fullName}</h3>
                </div>

                <div className="w-full space-y-4 pt-6 border-t border-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm font-medium">
                      Consultation Fee
                    </span>
                    <span className="text-xl font-bold">
                      ${doctor.consultationFee || 50}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm font-medium">
                      Service Charge
                    </span>
                    <span className="text-xl font-bold">$5</span>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                    <span className="text-primary-400 font-bold uppercase tracking-wider text-xs">
                      Total Amount
                    </span>
                    <span className="text-3xl font-bold text-primary-500">
                      ${(doctor.consultationFee || 50) + 5}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card border-primary-100 bg-primary-50/30 p-6">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
                  <CheckCircle2 className="text-primary-600 w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Verified Expert</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    This doctor is verified and has over 10 years of experience in their field.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;