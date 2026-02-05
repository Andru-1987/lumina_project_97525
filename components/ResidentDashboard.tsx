import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Check, AlertCircle } from 'lucide-react';
import { Amenity, Reservation, ReservationStatus, User, AppSettings, Announcement } from '../types';
import { formatDate, generateTimeSlots, getDaysInMonth, getFirstDayOfMonth, addDays, getFutureDate } from '../utils/dateUtils';
import { useToast } from '../contexts/ToastContext';

interface ResidentDashboardProps {
    page: string;
    user: User;
    amenities: Amenity[];
    reservations: Reservation[]; // All reservations to check collision
    announcements: Announcement[];
    settings: AppSettings;
    onCreateReservation: (res: Reservation) => void;
    onCancelReservation: (id: string) => void;
    onMarkAnnouncementRead: (id: string) => void;
}

const ResidentDashboard: React.FC<ResidentDashboardProps> = ({
    page, user, amenities, reservations, announcements, settings, onCreateReservation, onCancelReservation, onMarkAnnouncementRead
}) => {
    const { addToast } = useToast();
    const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null);
    const anticipationDays = Math.ceil((settings.minHoursAdvance || 0) / 24);
    const [selectedDate, setSelectedDate] = useState<string>(getFutureDate(anticipationDays));
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

    // Helper for Calendar UI
    const renderCalendar = () => {
        const year = new Date(selectedDate).getFullYear();
        const month = new Date(selectedDate).getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const days = [];

        // Empty slots for start padding
        for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="p-2"></div>);

        // Days
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = new Date(year, month, d).toISOString().split('T')[0];

            // Logic for disabled dates based on anticipation settings
            const anticipationDays = Math.ceil((settings.minHoursAdvance || 0) / 24);
            const minDate = getFutureDate(anticipationDays - 1); // -1 to handle compare logic
            const isTooSoon = dateStr <= minDate;
            const isSelected = dateStr === selectedDate;

            days.push(
                <button
                    key={d}
                    disabled={isTooSoon}
                    onClick={() => { setSelectedDate(dateStr); setSelectedSlot(null); }}
                    className={`
                    p-2 text-sm rounded-full flex items-center justify-center transition-all relative
                    ${isSelected ? 'bg-sky-500 text-white font-bold shadow-lg' : ''}
                    ${isTooSoon ? 'text-slate-300 cursor-not-allowed' : 'hover:bg-sky-50 text-slate-700 cursor-pointer'}
                `}
                >
                    {d}
                </button>
            );
        }
        return days;
    };

    const myReservations = React.useMemo(() =>
        reservations.filter(r => r.userId === user.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        [reservations, user.id]
    );

    const myAnnouncements = React.useMemo(() =>
        announcements.filter(a => !a.readBy.includes(user.id)),
        [announcements, user.id]
    );

    const handleConfirmBooking = React.useCallback(() => {
        if (selectedSlot && selectedAmenity) {
            onCreateReservation({
                id: crypto.randomUUID(),
                userId: user.id,
                amenityId: selectedAmenity.id,
                date: selectedDate,
                startTime: selectedSlot,
                endTime: selectedSlot.split(':')[0] + ':59', // Simple 1 hour logic
                status: ReservationStatus.CONFIRMED
            });
            setSelectedAmenity(null);
            addToast('Reservation Confirmed!', 'success');
        }
    }, [selectedSlot, selectedAmenity, user.id, selectedDate, onCreateReservation, addToast]);

    // 1. Booking Flow (Dashboard)
    if (page === 'resident-dashboard') {
        return (
            <div className="space-y-8 animate-fade-in pb-20">
                <header>
                    <h2 className="text-3xl font-light text-slate-900">Book a Space</h2>
                    <p className="text-slate-500">Select an amenity to reserve.</p>
                </header>

                {/* Step 1: Select Amenity */}
                {!selectedAmenity ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {amenities.map(amenity => (
                            <div
                                key={amenity.id}
                                onClick={() => setSelectedAmenity(amenity)}
                                className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                            >
                                <div className="h-48 overflow-hidden relative">
                                    <img src={amenity.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                                        <h3 className="text-white font-bold text-lg">{amenity.name}</h3>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <p className="text-slate-600 text-sm mb-3">{amenity.description}</p>
                                    <div className="flex items-center text-xs text-slate-400 gap-4">
                                        <span className="flex items-center gap-1"><Clock size={12} /> {amenity.openTime} - {amenity.closeTime}</span>
                                        <span className="flex items-center gap-1"><MapPin size={12} /> {amenity.capacity} Guests</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden flex flex-col md:flex-row">
                        {/* Left: Details & Calendar */}
                        <div className="p-6 md:w-2/3 border-r border-slate-100">
                            <button onClick={() => { setSelectedAmenity(null); setSelectedSlot(null); }} className="text-sm text-sky-500 hover:underline mb-4">← Back to Amenities</button>

                            <div className="flex items-center gap-4 mb-6">
                                <img src={selectedAmenity.imageUrl} className="w-16 h-16 rounded-lg object-cover shadow-sm" />
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-800">{selectedAmenity.name}</h3>
                                    <p className="text-slate-500 text-sm">Max {selectedAmenity.capacity} people</p>
                                </div>
                            </div>

                            <div className="mb-6">
                                <h4 className="font-medium mb-3 text-slate-700">Select Date</h4>
                                <div className="border rounded-xl p-4 max-w-sm mx-auto md:mx-0">
                                    <div className="text-center font-bold mb-4 text-slate-800">{new Date(selectedDate).toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
                                    <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-400 mb-2">
                                        <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                                    </div>
                                    <div className="grid grid-cols-7 gap-1">
                                        {renderCalendar()}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium mb-3 text-slate-700">Available Slots</h4>
                                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                                    {generateTimeSlots(selectedAmenity.openTime, selectedAmenity.closeTime).map(slot => {
                                        // Check availability
                                        const isTaken = reservations.some(r =>
                                            r.amenityId === selectedAmenity.id &&
                                            r.date === selectedDate &&
                                            r.startTime === slot &&
                                            r.status === ReservationStatus.CONFIRMED
                                        );

                                        return (
                                            <button
                                                key={slot}
                                                disabled={isTaken}
                                                onClick={() => setSelectedSlot(slot)}
                                                className={`
                                            py-2 px-1 rounded border text-sm transition-all
                                            ${selectedSlot === slot ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}
                                            ${isTaken ? 'bg-slate-50 text-slate-300 line-through cursor-not-allowed border-transparent' : 'hover:border-sky-400'}
                                        `}
                                            >
                                                {slot}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Right: Summary & Action */}
                        <div className="bg-slate-50 p-6 md:w-1/3 flex flex-col justify-between">
                            <div>
                                <h4 className="font-bold text-slate-800 mb-4">Reservation Summary</h4>
                                <div className="space-y-4 text-sm">
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-slate-500">Amenity</span>
                                        <span className="font-medium">{selectedAmenity.name}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-slate-500">Date</span>
                                        <span className="font-medium">{formatDate(selectedDate)}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-slate-500">Time</span>
                                        <span className="font-medium">{selectedSlot || '--:--'}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-slate-500">Duration</span>
                                        <span className="font-medium">1 Hour</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                disabled={!selectedSlot}
                                onClick={handleConfirmBooking}
                                className={`
                            w-full py-4 rounded-lg font-bold text-white shadow-lg mt-6 transition-all
                            ${selectedSlot ? 'bg-sky-500 hover:bg-sky-600 hover:shadow-sky-200' : 'bg-slate-300 cursor-not-allowed'}
                        `}
                            >
                                Confirm Booking
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // 2. My Reservations
    if (page === 'resident-history') {
        return (
            <div className="space-y-6 pb-20">
                <h2 className="text-2xl font-light">My Reservations</h2>
                <div className="space-y-4">
                    {myReservations.length === 0 && (
                        <div className="text-center py-10 bg-white rounded-lg border border-dashed border-slate-300 text-slate-400">
                            <Calendar className="mx-auto mb-2 opacity-50" size={48} />
                            <p>No reservations yet.</p>
                        </div>
                    )}
                    {myReservations.map(res => {
                        const amenity = amenities.find(a => a.id === res.amenityId);
                        const isPast = new Date(res.date) < new Date();
                        return (
                            <div key={res.id} className={`bg-white p-4 rounded-lg border shadow-sm flex justify-between items-center ${isPast ? 'opacity-60' : ''}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-2 h-12 rounded-full ${res.status === ReservationStatus.CONFIRMED ? 'bg-green-500' : 'bg-red-300'}`}></div>
                                    <div>
                                        <h4 className="font-bold text-slate-800">{amenity?.name}</h4>
                                        <p className="text-sm text-slate-500">{formatDate(res.date)} @ {res.startTime}</p>
                                    </div>
                                </div>
                                {res.status === ReservationStatus.CONFIRMED && !isPast && (
                                    <button
                                        onClick={() => {
                                            onCancelReservation(res.id);
                                            addToast('Reservation Cancelled', 'info');
                                        }}
                                        className="text-xs text-red-500 border border-red-200 px-3 py-1 rounded hover:bg-red-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                )}
                                {res.status === ReservationStatus.CANCELLED && <span className="text-xs font-bold text-red-400 px-3">CANCELLED</span>}
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    // 3. Notifications
    if (page === 'resident-notifications') {
        return (
            <div className="space-y-6 pb-20">
                <h2 className="text-2xl font-light">Notifications</h2>
                <div className="space-y-4">
                    {announcements.map(ann => {
                        const isUnread = !ann.readBy.includes(user.id);
                        return (
                            <div
                                key={ann.id}
                                onClick={() => isUnread && onMarkAnnouncementRead(ann.id)}
                                className={`p-5 rounded-lg border transition-all ${isUnread ? 'bg-white border-l-4 border-l-sky-500 shadow-md cursor-pointer' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
                            >
                                <div className="flex items-start gap-3">
                                    {ann.priority === 'HIGH' && <AlertCircle className="text-orange-500 shrink-0 mt-1" size={20} />}
                                    <div>
                                        <h4 className={`font-bold ${isUnread ? 'text-slate-900' : 'text-slate-600'}`}>{ann.title}</h4>
                                        <p className="text-sm mt-1 leading-relaxed">{ann.message}</p>
                                        <p className="text-xs text-slate-400 mt-2">{formatDate(ann.date)}</p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                    {announcements.length === 0 && <p className="text-slate-400 text-center">No announcements.</p>}
                </div>
            </div>
        )
    }

    return <div>Page not found</div>;
};

export default ResidentDashboard;