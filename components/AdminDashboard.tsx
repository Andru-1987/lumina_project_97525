import React, { useState } from 'react';
import { Trash2, Edit2, Upload, Send, Calendar, Settings as SettingsIcon, Users, Plus, Loader2 } from 'lucide-react';
import { Amenity, User, Reservation, Announcement, AppSettings, ReservationStatus } from '../types';
import { parseCSV } from '../utils/dateUtils';
import { useToast } from '../contexts/ToastContext';

interface AdminDashboardProps {
    page: string;
    amenities: Amenity[];
    users: User[];
    reservations: Reservation[];
    settings: AppSettings;
    onUpdateSettings: (s: AppSettings) => void;
    onAddAmenity: (a: Amenity) => void;
    onDeleteAmenity: (id: string) => void;
    onAddUsers: (users: Partial<User>[]) => void;
    onCancelReservation: (id: string) => void;
    onMakeAnnouncement: (ann: Announcement) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
    page, amenities, users, reservations, settings, onUpdateSettings, onAddAmenity, onDeleteAmenity, onAddUsers, onCancelReservation, onMakeAnnouncement
}) => {
    const { addToast } = useToast();

    // State for forms
    const [csvContent, setCsvContent] = useState('');
    const [announcementText, setAnnouncementText] = useState({ title: '', message: '' });
    const [newAmenity, setNewAmenity] = useState<Partial<Amenity>>({ name: '', capacity: 10, openTime: '08:00', closeTime: '22:00' });
    const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
    const [isSaving, setIsSaving] = useState(false);

    React.useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    const bookingsCount = React.useMemo(() =>
        reservations.filter(r => r.date === new Date().toISOString().split('T')[0] && r.status === 'CONFIRMED').length,
        [reservations]
    );

    const totalResidents = React.useMemo(() =>
        users.filter(u => u.role === 'RESIDENT').length,
        [users]
    );

    const handleSendAnnouncement = React.useCallback(() => {
        if (!announcementText.title || !announcementText.message) return;
        onMakeAnnouncement({
            id: crypto.randomUUID(),
            title: announcementText.title,
            message: announcementText.message,
            date: new Date().toISOString(),
            priority: 'HIGH',
            readBy: []
        });
        setAnnouncementText({ title: '', message: '' });
        addToast('Announcement sent', 'success');
    }, [announcementText, onMakeAnnouncement, addToast]);

    // 1. Dashboard Overview
    if (page === 'admin-dashboard') {
        return (
            <div className="space-y-8">
                <header>
                    <h2 className="text-3xl font-bold text-neutral-900 tracking-tight">Dashboard</h2>
                    <p className="text-neutral-500 mt-1 text-sm">Welcome back, Admin.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-card border border-neutral-200 shadow-card hover:shadow-card-hover transition-shadow duration-200">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary-50 text-primary-500 rounded-btn">
                                <Calendar size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Today's Bookings</p>
                                <h3 className="text-2xl font-bold text-neutral-900 mt-0.5">
                                    {bookingsCount}
                                </h3>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-card border border-neutral-200 shadow-card hover:shadow-card-hover transition-shadow duration-200">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-50 text-emerald-500 rounded-btn">
                                <Users size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Total Residents</p>
                                <h3 className="text-2xl font-bold text-neutral-900 mt-0.5">{totalResidents}</h3>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-card border border-neutral-200 shadow-card">
                        <h4 className="font-semibold text-neutral-900 mb-4 text-sm">Quick Announcement</h4>
                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="Title"
                                className="w-full border border-neutral-200 p-2.5 rounded-btn text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-colors"
                                value={announcementText.title}
                                onChange={e => setAnnouncementText({ ...announcementText, title: e.target.value })}
                            />
                            <textarea
                                placeholder="Message"
                                className="w-full border border-neutral-200 p-2.5 rounded-btn text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-colors resize-none"
                                rows={2}
                                value={announcementText.message}
                                onChange={e => setAnnouncementText({ ...announcementText, message: e.target.value })}
                            />
                            <button
                                onClick={handleSendAnnouncement}
                                className="w-full bg-emerald-500 text-white py-2.5 rounded-btn text-sm font-semibold hover:bg-emerald-600 active:bg-emerald-700 transition-colors duration-200 flex justify-center items-center gap-2 shadow-btn hover:shadow-btn-hover"
                            >
                                <Send size={14} /> Send to All
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 2. Amenities Management
    if (page === 'admin-amenities') {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">Amenities</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {amenities.map(amenity => (
                        <div key={amenity.id} className="bg-white rounded-card overflow-hidden border border-neutral-200 shadow-card hover:shadow-card-hover transition-all duration-300 group">
                            <div className="h-40 bg-neutral-100 relative overflow-hidden">
                                <img src={amenity.imageUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105" />
                                <button
                                    onClick={() => onDeleteAmenity(amenity.id)}
                                    className="absolute top-3 right-3 bg-white/90 p-2 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-50 shadow-sm"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <div className="p-4">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-lg text-neutral-900">{amenity.name}</h3>
                                    <span className="text-xs bg-neutral-100 text-neutral-600 px-2.5 py-1 rounded-tag font-medium">{amenity.openTime} - {amenity.closeTime}</span>
                                </div>
                                <p className="text-sm text-neutral-500 mt-2 line-clamp-2">{amenity.description}</p>
                                <div className="mt-4 flex items-center gap-2 text-xs text-neutral-400">
                                    <Users size={12} /> Capacity: {amenity.capacity}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Add New Card */}
                    <div className="bg-neutral-50 border-2 border-dashed border-neutral-300 rounded-card p-6 flex flex-col justify-center items-center text-neutral-400 hover:border-primary-400 hover:text-primary-500 hover:bg-primary-50/30 transition-all duration-200 cursor-pointer" onClick={() => {
                        const name = prompt('Amenity Name');
                        if (name) onAddAmenity({
                            id: Math.random().toString(),
                            name,
                            description: 'New space',
                            capacity: 10,
                            imageUrl: `https://picsum.photos/800/600?random=${Math.random()}`,
                            iconName: 'Star',
                            openTime: '08:00',
                            closeTime: '22:00'
                        });
                    }}>
                        <Plus size={32} />
                        <span className="mt-2 text-sm font-medium">Add Amenity</span>
                    </div>
                </div>
            </div>
        );
    }

    // 3. Resident Management
    if (page === 'admin-users') {
        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">Resident Directory</h2>

                <div className="bg-white p-6 rounded-card border border-neutral-200 shadow-card">
                    <h3 className="font-semibold mb-4 flex items-center gap-2 text-neutral-900 text-sm"><Upload size={18} className="text-neutral-400" /> Bulk Import</h3>
                    <textarea
                        className="w-full h-32 p-3 border border-neutral-200 rounded-btn text-sm font-mono text-neutral-600 bg-neutral-50 mb-3 focus:ring-2 focus:ring-primary-100 focus:border-primary-400 outline-none transition-colors resize-none"
                        placeholder={`Paste CSV data here:\nName, Unit, Email\nJohn Doe, 101, john@example.com`}
                        value={csvContent}
                        onChange={(e) => setCsvContent(e.target.value)}
                    />
                    <button
                        className="bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white px-5 py-2.5 rounded-btn text-sm font-semibold transition-colors duration-200 shadow-btn hover:shadow-btn-hover"
                        onClick={() => {
                            const parsed = parseCSV(csvContent);
                            if (parsed.length > 0) {
                                onAddUsers(parsed);
                                setCsvContent('');
                                addToast(`Imported ${parsed.length} residents successfully`, 'success');
                            } else {
                                addToast('Invalid CSV format', 'error');
                            }
                        }}
                    >
                        Import Residents
                    </button>
                </div>

                <div className="bg-white rounded-card border border-neutral-200 shadow-card overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-neutral-50 text-neutral-500 font-medium border-b border-neutral-200">
                            <tr>
                                <th className="p-4 text-xs uppercase tracking-wider">Name</th>
                                <th className="p-4 text-xs uppercase tracking-wider">Unit</th>
                                <th className="p-4 text-xs uppercase tracking-wider">Email</th>
                                <th className="p-4 text-xs uppercase tracking-wider">Role</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {users.map(u => (
                                <tr key={u.id} className="hover:bg-neutral-50 transition-colors">
                                    <td className="p-4 flex items-center gap-3">
                                        <img src={u.avatarUrl || `https://ui-avatars.com/api/?name=${u.name}`} className="w-8 h-8 rounded-full border-2 border-neutral-200" />
                                        <span className="font-medium text-neutral-900">{u.name}</span>
                                    </td>
                                    <td className="p-4 text-neutral-500">{u.unit || '-'}</td>
                                    <td className="p-4 text-neutral-500">{u.email}</td>
                                    <td className="p-4"><span className={`px-2.5 py-1 rounded-pill text-xs font-semibold ${u.role === 'ADMIN' ? 'bg-primary-50 text-primary-700' : 'bg-emerald-50 text-emerald-700'}`}>{u.role}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }

    // 4. Calendar (All Reservations)
    if (page === 'admin-calendar') {
        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">Global Reservations</h2>
                <div className="bg-white rounded-card border border-neutral-200 shadow-card p-6">
                    <div className="space-y-3">
                        {reservations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(res => {
                            const user = users.find(u => u.id === res.userId);
                            const amenity = amenities.find(a => a.id === res.amenityId);
                            return (
                                <div key={res.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-neutral-200 rounded-btn hover:border-primary-300 hover:shadow-sm transition-all duration-200">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-primary-50 rounded-btn flex items-center justify-center text-primary-600 font-bold flex-col leading-tight">
                                            <span className="text-xs font-medium">{new Date(res.date).toLocaleString('default', { month: 'short' })}</span>
                                            <span className="text-lg">{new Date(res.date).getDate()}</span>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-neutral-900">{amenity?.name}</h4>
                                            <p className="text-sm text-neutral-500">{res.startTime} - {res.endTime} • {user?.name} ({user?.unit})</p>
                                        </div>
                                    </div>
                                    {res.status === ReservationStatus.CONFIRMED && (
                                        <button
                                            onClick={() => onCancelReservation(res.id)}
                                            className="mt-3 md:mt-0 text-red-500 hover:text-red-600 text-sm font-medium border border-red-200 px-4 py-1.5 rounded-btn hover:bg-red-50 transition-colors duration-200"
                                        >
                                            Cancel Booking
                                        </button>
                                    )}
                                    {res.status === ReservationStatus.CANCELLED && (
                                        <span className="text-neutral-400 text-sm font-medium mt-2 md:mt-0 bg-neutral-100 px-3 py-1 rounded-pill">Cancelled</span>
                                    )}
                                </div>
                            );
                        })}
                        {reservations.length === 0 && <p className="text-neutral-400 text-center py-10">No reservations found.</p>}
                    </div>
                </div>
            </div>
        )
    }

    // 5. Settings
    const handleSaveSettings = async () => {
        setIsSaving(true);
        await onUpdateSettings(localSettings);
        setIsSaving(false);
    };

    if (page === 'admin-settings') {
        return (
            <div className="space-y-6 pb-20">
                <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">System Configuration</h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-2xl border border-neutral-200 shadow-card space-y-8">
                        <div>
                            <h3 className="text-lg font-bold text-neutral-900 mb-1 flex items-center gap-2">
                                <SettingsIcon size={18} className="text-primary-500" />
                                Booking Constraints
                            </h3>
                            <p className="text-sm text-neutral-500">Define the global rules for amenity reservations.</p>
                        </div>

                        <div className="space-y-6">
                            {/* Min Hours Advance */}
                            <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-2">Advance Notice (Hours)</label>
                                <p className="text-xs text-neutral-400 mb-3">Minimum hours required before a booking can be made.</p>
                                <div className="grid grid-cols-4 gap-2">
                                    {[0, 12, 24, 48].map(h => (
                                        <button
                                            key={h}
                                            onClick={() => setLocalSettings({ ...localSettings, minHoursAdvance: h })}
                                            className={`py-2.5 rounded-btn border text-sm font-semibold transition-all duration-200 ${localSettings.minHoursAdvance === h
                                                ? 'bg-primary-500 text-white border-primary-500 shadow-btn-hover'
                                                : 'bg-white text-neutral-600 border-neutral-200 hover:border-primary-300 hover:bg-primary-50'
                                                }`}
                                        >
                                            {h === 0 ? 'Instant' : `${h}h`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <hr className="border-neutral-100" />

                            {/* Max Duration */}
                            <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-2">Maximum Duration (Hours)</label>
                                <p className="text-xs text-neutral-400 mb-3">Longest period a resident can book an amenity.</p>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="1"
                                        max="12"
                                        value={localSettings.maxDuration}
                                        onChange={(e) => setLocalSettings({ ...localSettings, maxDuration: parseInt(e.target.value) })}
                                        className="w-full h-2 bg-neutral-200 rounded-pill appearance-none cursor-pointer accent-primary-500"
                                    />
                                    <span className="font-bold text-neutral-700 w-12 text-center bg-neutral-50 py-1.5 rounded-btn border border-neutral-200 text-sm">
                                        {localSettings.maxDuration}h
                                    </span>
                                </div>
                            </div>

                            <hr className="border-neutral-100" />

                            {/* Max Active Bookings */}
                            <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-2">Active Bookings Limit</label>
                                <p className="text-xs text-neutral-400 mb-3">Maximum number of confirmed parallel bookings per user.</p>
                                <div className="flex items-center gap-4">
                                    <div className="flex border border-neutral-200 rounded-btn overflow-hidden">
                                        {[1, 2, 3, 5, 10].map(v => (
                                            <button
                                                key={v}
                                                onClick={() => setLocalSettings({ ...localSettings, maxActiveBookings: v })}
                                                className={`px-4 py-2 text-sm font-semibold border-r border-neutral-200 last:border-0 transition-colors duration-200 ${localSettings.maxActiveBookings === v
                                                    ? 'bg-primary-500 text-white'
                                                    : 'bg-white text-neutral-600 hover:bg-neutral-50'
                                                    }`}
                                            >
                                                {v}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={handleSaveSettings}
                                disabled={isSaving || JSON.stringify(localSettings) === JSON.stringify(settings)}
                                className={`w-full py-4 rounded-card font-bold flex items-center justify-center gap-2 transition-all duration-200 text-sm ${isSaving || JSON.stringify(localSettings) === JSON.stringify(settings)
                                    ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                                    : 'bg-emerald-500 text-white hover:bg-emerald-600 active:bg-emerald-700 shadow-btn hover:shadow-btn-hover'
                                    }`}
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Edit2 size={18} />}
                                Save System Changes
                            </button>
                        </div>
                    </div>

                    <div className="hidden lg:block">
                        <div className="bg-primary-50 p-8 rounded-2xl border border-primary-100">
                            <h4 className="font-bold text-primary-800 mb-4">Security Note</h4>
                            <p className="text-sm text-primary-700 leading-relaxed space-y-4">
                                These changes are applied via <strong>Supabase Edge Functions</strong> and <strong>Row Level Security</strong>.
                                <br /><br />
                                When you update these values, the validation logic in the backend will immediately enforce the new rules for all future booking attempts.
                                <br /><br />
                                Existing bookings will not be affected to prevent service disruption.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }


    return <div>Page not found</div>;
};

export default AdminDashboard;