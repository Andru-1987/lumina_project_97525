import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Check, AlertCircle } from 'lucide-react';
import { Amenity, Reservation, ReservationStatus, User, AppSettings, Announcement } from '../types';
import { formatDate, generateTimeSlots, getDaysInMonth, getFirstDayOfMonth, addDays, getFutureDate } from '../utils/dateUtils';
import { useToast } from '../contexts/ToastContext';

interface ResidentDashboardProps {
    page: string;
    user: User;
    amenities: Amenity[];
    reservations: Reservation[];
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

        for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="p-2"></div>);

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = new Date(year, month, d).toISOString().split('T')[0];
            const anticipationDays = Math.ceil((settings.minHoursAdvance || 0) / 24);
            const minDate = getFutureDate(anticipationDays - 1);
            const isTooSoon = dateStr <= minDate;
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === new Date().toISOString().split('T')[0];

            days.push(
                <button
                    key={d}
                    disabled={isTooSoon}
                    onClick={() => { setSelectedDate(dateStr); setSelectedSlot(null); }}
                    className={`
                    p-2 text-sm rounded-full flex items-center justify-center transition-all duration-200 relative font-medium
                    ${isSelected ? 'bg-primary-500 text-white font-bold shadow-btn-hover' : ''}
                    ${isToday && !isSelected ? 'ring-2 ring-primary-200 text-primary-600' : ''}
                    ${isTooSoon ? 'text-neutral-300 cursor-not-allowed' : 'hover:bg-primary-50 text-neutral-700 cursor-pointer'}
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
                endTime: selectedSlot.split(':')[0] + ':59',
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
                    <h2 className="text-3xl font-bold text-neutral-900 tracking-tight">Book a Space</h2>
                    <p className="text-neutral-500 text-sm mt-1">Select an amenity to reserve.</p>
                </header>

                {/* Step 1: Select Amenity */}
                {!selectedAmenity ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {amenities.map(amenity => (
                            <div
                                key={amenity.id}
                                onClick={() => setSelectedAmenity(amenity)}
                                className="bg-white rounded-card overflow-hidden shadow-card border border-neutral-200 hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                            >
                                <div className="h-48 overflow-hidden relative">
                                    <img src={amenity.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                                        <h3 className="text-white font-bold text-lg">{amenity.name}</h3>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <p className="text-neutral-500 text-sm mb-3">{amenity.description}</p>
                                    <div className="flex items-center text-xs text-neutral-400 gap-4">
                                        <span className="flex items-center gap-1"><Clock size={12} /> {amenity.openTime} - {amenity.closeTime}</span>
                                        <span className="flex items-center gap-1"><MapPin size={12} /> {amenity.capacity} Guests</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-card shadow-card border border-neutral-200 overflow-hidden flex flex-col md:flex-row">
                        {/* Left: Details & Calendar */}
                        <div className="p-6 md:w-2/3 border-r border-neutral-100">
                            <button onClick={() => { setSelectedAmenity(null); setSelectedSlot(null); }} className="text-sm text-primary-500 hover:text-primary-600 font-medium mb-4 transition-colors">← Back to Amenities</button>

                            <div className="flex items-center gap-4 mb-6">
                                <img src={selectedAmenity.imageUrl} className="w-16 h-16 rounded-btn object-cover shadow-card border border-neutral-200" />
                                <div>
                                    <h3 className="text-2xl font-bold text-neutral-900">{selectedAmenity.name}</h3>
                                    <p className="text-neutral-500 text-sm">Max {selectedAmenity.capacity} people</p>
                                </div>
                            </div>

                            <div className="mb-6">
                                <h4 className="font-semibold mb-3 text-neutral-700 text-sm">Select Date</h4>
                                <div className="border border-neutral-200 rounded-card p-4 max-w-sm mx-auto md:mx-0">
                                    <div className="text-center font-bold mb-4 text-neutral-900">{new Date(selectedDate).toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
                                    <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-neutral-400 mb-2">
                                        <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                                    </div>
                                    <div className="grid grid-cols-7 gap-1">
                                        {renderCalendar()}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-semibold mb-3 text-neutral-700 text-sm">Available Slots</h4>
                                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                                    {generateTimeSlots(selectedAmenity.openTime, selectedAmenity.closeTime).map(slot => {
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
                                            py-2.5 px-1 rounded-btn border text-sm font-medium transition-all duration-200
                                            ${selectedSlot === slot ? 'bg-primary-500 text-white border-primary-500 shadow-btn-hover' : 'bg-white text-neutral-600 border-neutral-200'}
                                            ${isTaken ? 'bg-neutral-50 text-neutral-300 line-through cursor-not-allowed border-transparent' : 'hover:border-primary-400 hover:bg-primary-50'}
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
                        <div className="bg-neutral-50 p-6 md:w-1/3 flex flex-col justify-between">
                            <div>
                                <h4 className="font-bold text-neutral-900 mb-4 text-sm">Reservation Summary</h4>
                                <div className="space-y-4 text-sm">
                                    <div className="flex justify-between border-b border-neutral-200 pb-2">
                                        <span className="text-neutral-500">Amenity</span>
                                        <span className="font-semibold text-neutral-900">{selectedAmenity.name}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-neutral-200 pb-2">
                                        <span className="text-neutral-500">Date</span>
                                        <span className="font-semibold text-neutral-900">{formatDate(selectedDate)}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-neutral-200 pb-2">
                                        <span className="text-neutral-500">Time</span>
                                        <span className="font-semibold text-neutral-900">{selectedSlot || '--:--'}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-neutral-200 pb-2">
                                        <span className="text-neutral-500">Duration</span>
                                        <span className="font-semibold text-neutral-900">1 Hour</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                disabled={!selectedSlot}
                                onClick={handleConfirmBooking}
                                className={`
                            w-full py-4 rounded-btn font-bold text-white mt-6 transition-all duration-200 text-sm
                            ${selectedSlot ? 'bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 shadow-btn hover:shadow-btn-hover' : 'bg-neutral-300 cursor-not-allowed'}
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
                <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">My Reservations</h2>
                <div className="space-y-3">
                    {myReservations.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-card border-2 border-dashed border-neutral-300 text-neutral-400">
                            <Calendar className="mx-auto mb-3 text-neutral-300" size={48} />
                            <p className="font-medium">No reservations yet.</p>
                            <p className="text-sm mt-1">Book an amenity to get started.</p>
                        </div>
                    )}
                    {myReservations.map(res => {
                        const amenity = amenities.find(a => a.id === res.amenityId);
                        const isPast = new Date(res.date) < new Date();
                        return (
                            <div key={res.id} className={`bg-white p-4 rounded-card border border-neutral-200 shadow-card flex justify-between items-center transition-all duration-200 hover:shadow-card-hover ${isPast ? 'opacity-50' : ''}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-1.5 h-12 rounded-pill ${res.status === ReservationStatus.CONFIRMED ? 'bg-emerald-500' : 'bg-red-400'}`}></div>
                                    <div>
                                        <h4 className="font-semibold text-neutral-900">{amenity?.name}</h4>
                                        <p className="text-sm text-neutral-500">{formatDate(res.date)} @ {res.startTime}</p>
                                    </div>
                                </div>
                                {res.status === ReservationStatus.CONFIRMED && !isPast && (
                                    <button
                                        onClick={() => {
                                            onCancelReservation(res.id);
                                            addToast('Reservation Cancelled', 'info');
                                        }}
                                        className="text-xs text-red-500 font-semibold border border-red-200 px-3 py-1.5 rounded-btn hover:bg-red-50 transition-colors duration-200"
                                    >
                                        Cancel
                                    </button>
                                )}
                                {res.status === ReservationStatus.CANCELLED && <span className="text-xs font-semibold text-neutral-400 bg-neutral-100 px-3 py-1 rounded-pill">CANCELLED</span>}
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
                <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">Notifications</h2>
                <div className="space-y-3">
                    {announcements.map(ann => {
                        const isUnread = !ann.readBy.includes(user.id);
                        return (
                            <div
                                key={ann.id}
                                onClick={() => isUnread && onMarkAnnouncementRead(ann.id)}
                                className={`p-5 rounded-card border transition-all duration-200 ${isUnread ? 'bg-white border-neutral-200 border-l-4 border-l-primary-500 shadow-card cursor-pointer hover:shadow-card-hover' : 'bg-neutral-50 border-neutral-200 text-neutral-500'}`}
                            >
                                <div className="flex items-start gap-3">
                                    {ann.priority === 'HIGH' && <AlertCircle className="text-orange-500 shrink-0 mt-0.5" size={20} />}
                                    <div>
                                        <h4 className={`font-semibold ${isUnread ? 'text-neutral-900' : 'text-neutral-500'}`}>{ann.title}</h4>
                                        <p className="text-sm mt-1 leading-relaxed">{ann.message}</p>
                                        <p className="text-xs text-neutral-400 mt-2">{formatDate(ann.date)}</p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                    {announcements.length === 0 && <p className="text-neutral-400 text-center py-10">No announcements.</p>}
                </div>
            </div>
        )
    }

    return <div>Page not found</div>;
};

export default ResidentDashboard;