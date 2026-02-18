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
                        w-9 h-9 text-sm rounded-full flex items-center justify-center transition-all duration-200 relative font-medium
                        ${isSelected ? 'bg-sky-500 text-white font-bold shadow-md shadow-sky-200/60' : ''}
                        ${isToday && !isSelected ? 'ring-2 ring-sky-200 text-sky-600 font-semibold' : ''}
                        ${isTooSoon ? 'text-slate-200 cursor-not-allowed' : !isSelected ? 'hover:bg-sky-50 text-slate-600 cursor-pointer' : ''}
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

    // ─── 1. Booking Flow ───
    if (page === 'resident-dashboard') {
        return (
            <div className="space-y-8 animate-fade-in pb-20">
                <header>
                    <h2 className="text-2xl font-bold text-slate-900">Book a Space</h2>
                    <p className="text-slate-400 text-sm mt-1">Select an amenity to reserve.</p>
                </header>

                {!selectedAmenity ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {amenities.map(amenity => (
                            <div
                                key={amenity.id}
                                onClick={() => setSelectedAmenity(amenity)}
                                className="ds-card overflow-hidden ds-card-interactive cursor-pointer group"
                            >
                                <div className="h-44 overflow-hidden relative">
                                    <img src={amenity.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent"></div>
                                    <h3 className="absolute bottom-3 left-4 text-white font-bold text-lg drop-shadow-sm">{amenity.name}</h3>
                                </div>
                                <div className="p-4">
                                    <p className="text-slate-500 text-sm mb-3 line-clamp-2">{amenity.description}</p>
                                    <div className="flex items-center gap-3 text-xs text-slate-400">
                                        <span className="flex items-center gap-1.5">
                                            <Clock size={13} className="text-sky-400" /> {amenity.openTime} - {amenity.closeTime}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <MapPin size={13} className="text-sky-400" /> {amenity.capacity} Guests
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="ds-card overflow-hidden flex flex-col md:flex-row shadow-elevated">
                        {/* Left: Details & Calendar */}
                        <div className="p-6 md:w-2/3 border-r border-slate-100">
                            <button onClick={() => { setSelectedAmenity(null); setSelectedSlot(null); }} className="text-sm text-sky-500 hover:text-sky-600 font-medium mb-4 transition-colors">
                                ← Back to Amenities
                            </button>

                            <div className="flex items-center gap-4 mb-6">
                                <img src={selectedAmenity.imageUrl} className="w-14 h-14 rounded-xl object-cover shadow-sm ring-1 ring-slate-100" />
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">{selectedAmenity.name}</h3>
                                    <p className="text-slate-400 text-sm">Max {selectedAmenity.capacity} people</p>
                                </div>
                            </div>

                            <div className="mb-6">
                                <h4 className="font-semibold mb-3 text-slate-700 text-sm">Select Date</h4>
                                <div className="border border-slate-100 rounded-xl p-4 max-w-sm mx-auto md:mx-0 bg-white">
                                    <div className="text-center font-bold mb-4 text-slate-800 text-sm">{new Date(selectedDate).toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
                                    <div className="grid grid-cols-7 gap-0.5 text-center text-[11px] font-semibold text-slate-400 mb-2 uppercase">
                                        <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                                    </div>
                                    <div className="grid grid-cols-7 gap-0.5 place-items-center">
                                        {renderCalendar()}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-semibold mb-3 text-slate-700 text-sm">Available Slots</h4>
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
                                                    py-2.5 px-2 rounded-lg border text-sm font-medium transition-all duration-200
                                                    ${selectedSlot === slot ? 'bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-200/40' : 'bg-white text-slate-600 border-slate-200'}
                                                    ${isTaken ? 'bg-slate-50 text-slate-300 line-through cursor-not-allowed border-slate-100' : selectedSlot !== slot ? 'hover:border-sky-300 hover:bg-sky-50/50' : ''}
                                                `}
                                            >
                                                {slot}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Right: Summary */}
                        <div className="bg-slate-50/80 p-6 md:w-1/3 flex flex-col justify-between">
                            <div>
                                <h4 className="font-bold text-slate-800 mb-5 text-sm">Reservation Summary</h4>
                                <div className="space-y-4 text-sm">
                                    {[
                                        { label: 'Amenity', value: selectedAmenity.name },
                                        { label: 'Date', value: formatDate(selectedDate) },
                                        { label: 'Time', value: selectedSlot || '--:--' },
                                        { label: 'Duration', value: '1 Hour' },
                                    ].map(row => (
                                        <div key={row.label} className="flex justify-between border-b border-slate-200/60 pb-3">
                                            <span className="text-slate-400">{row.label}</span>
                                            <span className="font-medium text-slate-700">{row.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                disabled={!selectedSlot}
                                onClick={handleConfirmBooking}
                                className={`btn btn-lg w-full font-bold mt-6 ${selectedSlot ? 'btn-primary shadow-lg shadow-sky-200/50' : 'bg-slate-200 text-slate-400 cursor-not-allowed border-0'}`}
                            >
                                <Check size={18} /> Confirm Booking
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ─── 2. My Reservations ───
    if (page === 'resident-history') {
        return (
            <div className="space-y-6 pb-20">
                <h2 className="text-2xl font-bold text-slate-900">My Reservations</h2>
                <div className="space-y-3">
                    {myReservations.length === 0 && (
                        <div className="text-center py-12 ds-card border-dashed">
                            <Calendar className="mx-auto mb-3 text-slate-300" size={44} strokeWidth={1} />
                            <p className="text-slate-400 text-sm font-medium">No reservations yet.</p>
                            <p className="text-slate-300 text-xs mt-1">Book a space to get started</p>
                        </div>
                    )}
                    {myReservations.map(res => {
                        const amenity = amenities.find(a => a.id === res.amenityId);
                        const isPast = new Date(res.date) < new Date();
                        const isConfirmed = res.status === ReservationStatus.CONFIRMED;
                        return (
                            <div key={res.id} className={`ds-card p-4 flex justify-between items-center transition-opacity ${isPast ? 'opacity-50' : ''}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-1.5 h-11 rounded-full ${isConfirmed ? 'bg-emerald-400' : 'bg-red-300'}`}></div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800">{amenity?.name}</h4>
                                        <p className="text-sm text-slate-400 mt-0.5">{formatDate(res.date)} @ {res.startTime}</p>
                                    </div>
                                </div>
                                {isConfirmed && !isPast && (
                                    <button
                                        onClick={() => {
                                            onCancelReservation(res.id);
                                            addToast('Reservation Cancelled', 'info');
                                        }}
                                        className="btn btn-danger btn-xs"
                                    >
                                        Cancel
                                    </button>
                                )}
                                {res.status === ReservationStatus.CANCELLED && (
                                    <span className="ds-tag ds-tag-red">CANCELLED</span>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    // ─── 3. Notifications ───
    if (page === 'resident-notifications') {
        return (
            <div className="space-y-6 pb-20">
                <h2 className="text-2xl font-bold text-slate-900">Notifications</h2>
                <div className="space-y-3">
                    {announcements.map(ann => {
                        const isUnread = !ann.readBy.includes(user.id);
                        return (
                            <div
                                key={ann.id}
                                onClick={() => isUnread && onMarkAnnouncementRead(ann.id)}
                                className={`ds-card p-5 transition-all duration-200 ${isUnread
                                    ? 'border-l-[3px] border-l-sky-500 shadow-card-hover cursor-pointer hover:bg-sky-50/30'
                                    : 'bg-slate-50/50 text-slate-500 border-slate-100'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    {ann.priority === 'HIGH' && (
                                        <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center shrink-0 mt-0.5">
                                            <AlertCircle className="text-orange-500" size={16} />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <h4 className={`font-semibold text-sm ${isUnread ? 'text-slate-900' : 'text-slate-500'}`}>{ann.title}</h4>
                                        <p className="text-sm mt-1 leading-relaxed">{ann.message}</p>
                                        <p className="text-xs text-slate-400 mt-2">{formatDate(ann.date)}</p>
                                    </div>
                                    {isUnread && <span className="w-2 h-2 bg-sky-500 rounded-full shrink-0 mt-2"></span>}
                                </div>
                            </div>
                        )
                    })}
                    {announcements.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-slate-400 text-sm">No announcements.</p>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return <div>Page not found</div>;
};

export default ResidentDashboard;