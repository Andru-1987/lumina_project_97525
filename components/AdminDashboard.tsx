import React, { useState } from 'react';
import { Trash2, Edit2, Upload, Send, Calendar, Settings as SettingsIcon, Users, Plus, Loader2 } from 'lucide-react';
import { Amenity, User, Reservation, Announcement, AppSettings, ReservationStatus } from '../types';
import { parseCSV } from '../utils/dateUtils';
import { useToast } from '../contexts/ToastContext';
import AnalyticsDashboard from './Analytics/AnalyticsDashboard';

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

    // ─── 1. Dashboard Overview ───
    if (page === 'admin-dashboard') {
        return (
            <div className="space-y-8">
                <header>
                    <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
                    <p className="text-slate-400 mt-1 text-sm">Welcome back, Admin.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Bookings stat */}
                    <div className="ds-card p-6 ds-card-interactive">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-sky-50 text-sky-500 rounded-xl flex items-center justify-center">
                                <Calendar size={22} strokeWidth={1.5} />
                            </div>
                            <div>
                                <p className="ds-overline">Today's Bookings</p>
                                <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{bookingsCount}</h3>
                            </div>
                        </div>
                    </div>

                    {/* Residents stat */}
                    <div className="ds-card p-6 ds-card-interactive">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center">
                                <Users size={22} strokeWidth={1.5} />
                            </div>
                            <div>
                                <p className="ds-overline">Total Residents</p>
                                <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{totalResidents}</h3>
                            </div>
                        </div>
                    </div>

                    {/* Quick Announcement */}
                    <div className="ds-card p-6">
                        <h4 className="font-semibold text-slate-800 mb-4 text-sm">Quick Announcement</h4>
                        <div className="space-y-2.5">
                            <input
                                type="text"
                                placeholder="Title"
                                className="w-full ds-input text-sm"
                                value={announcementText.title}
                                onChange={e => setAnnouncementText({ ...announcementText, title: e.target.value })}
                            />
                            <textarea
                                placeholder="Message"
                                className="w-full ds-input h-auto py-2 text-sm resize-none"
                                rows={2}
                                value={announcementText.message}
                                onChange={e => setAnnouncementText({ ...announcementText, message: e.target.value })}
                            />
                            <button
                                onClick={handleSendAnnouncement}
                                className="btn btn-primary btn-sm w-full"
                            >
                                <Send size={14} /> Send to All
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ─── 2. Amenities Management ───
    if (page === 'admin-amenities') {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-900">Amenities</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {amenities.map(amenity => (
                        <div key={amenity.id} className="ds-card overflow-hidden group ds-card-interactive cursor-default">
                            <div className="h-40 bg-slate-100 relative overflow-hidden">
                                <img src={amenity.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <button
                                    onClick={() => onDeleteAmenity(amenity.id)}
                                    className="absolute top-2.5 right-2.5 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-lg text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-50 shadow-sm"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                            <div className="p-4">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-slate-900">{amenity.name}</h3>
                                    <span className="ds-tag ds-tag-slate text-[11px]">{amenity.openTime} - {amenity.closeTime}</span>
                                </div>
                                <p className="text-sm text-slate-500 mt-2 line-clamp-2">{amenity.description}</p>
                                <div className="mt-3 flex items-center gap-2">
                                    <span className="ds-tag ds-tag-sky">
                                        <Users size={11} /> {amenity.capacity} guests
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Add New Card */}
                    <div
                        className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col justify-center items-center text-slate-400 hover:border-sky-400 hover:text-sky-500 hover:bg-sky-50/50 transition-all duration-300 cursor-pointer group"
                        onClick={() => {
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
                        }}
                    >
                        <div className="w-12 h-12 rounded-xl border-2 border-dashed border-current flex items-center justify-center mb-3 group-hover:border-sky-400">
                            <Plus size={24} />
                        </div>
                        <span className="text-sm font-semibold">Add Amenity</span>
                    </div>
                </div>
            </div>
        );
    }

    // ─── 3. Resident Management ───
    if (page === 'admin-users') {
        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900">Resident Directory</h2>

                <div className="ds-card p-6">
                    <h3 className="font-semibold text-sm mb-4 flex items-center gap-2 text-slate-800">
                        <Upload size={16} className="text-sky-500" /> Bulk Import
                    </h3>
                    <textarea
                        className="w-full h-28 ds-input h-auto py-3 font-mono text-[13px] text-slate-600 bg-slate-50 mb-3 resize-none"
                        placeholder={`Paste CSV data here:\nName, Unit, Email\nJohn Doe, 101, john@example.com`}
                        value={csvContent}
                        onChange={(e) => setCsvContent(e.target.value)}
                    />
                    <button
                        className="btn btn-primary btn-sm"
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

                <div className="ds-card overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="p-4 ds-overline">Name</th>
                                <th className="p-4 ds-overline">Unit</th>
                                <th className="p-4 ds-overline">Email</th>
                                <th className="p-4 ds-overline">Role</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {users.map(u => (
                                <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="p-4 flex items-center gap-3">
                                        <img src={u.avatarUrl || `https://ui-avatars.com/api/?name=${u.name}`} className="w-8 h-8 rounded-full ring-2 ring-slate-100" />
                                        <span className="font-medium text-slate-800">{u.name}</span>
                                    </td>
                                    <td className="p-4 text-slate-500">{u.unit || '-'}</td>
                                    <td className="p-4 text-slate-500">{u.email}</td>
                                    <td className="p-4">
                                        <span className={`ds-tag ${u.role === 'ADMIN' ? 'ds-tag-purple' : 'ds-tag-emerald'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }

    // ─── 3.5 Analytics ───
    if (page === 'admin-analytics') {
        return <AnalyticsDashboard />;
    }

    // ─── 4. Calendar (All Reservations) ───
    if (page === 'admin-calendar') {
        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900">Global Reservations</h2>
                <div className="ds-card p-6">
                    <div className="space-y-3">
                        {[...reservations].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(res => {
                            const user = users.find(u => u.id === res.userId);
                            const amenity = amenities.find(a => a.id === res.amenityId);
                            return (
                                <div key={res.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-slate-100 rounded-xl hover:border-sky-200 hover:bg-sky-50/30 transition-all duration-200">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500 font-bold flex-col leading-tight border border-slate-100">
                                            <span className="text-[10px] ds-overline">{new Date(res.date).toLocaleString('default', { month: 'short' })}</span>
                                            <span className="text-lg font-bold text-slate-800">{new Date(res.date).getDate()}</span>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-slate-900">{amenity?.name}</h4>
                                            <p className="text-sm text-slate-400">{res.startTime} - {res.endTime} · {user?.name} ({user?.unit})</p>
                                        </div>
                                    </div>
                                    {res.status === ReservationStatus.CONFIRMED && (
                                        <button
                                            onClick={() => onCancelReservation(res.id)}
                                            className="btn btn-danger btn-sm mt-3 md:mt-0"
                                        >
                                            Cancel Booking
                                        </button>
                                    )}
                                    {res.status === ReservationStatus.CANCELLED && (
                                        <span className="ds-tag ds-tag-red mt-2 md:mt-0">Cancelled</span>
                                    )}
                                </div>
                            );
                        })}
                        {reservations.length === 0 && (
                            <div className="text-center py-12">
                                <Calendar className="mx-auto mb-3 text-slate-300" size={40} strokeWidth={1} />
                                <p className="text-slate-400 text-sm">No reservations found.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    // ─── 5. Settings ───
    const handleSaveSettings = async () => {
        setIsSaving(true);
        await onUpdateSettings(localSettings);
        setIsSaving(false);
    };

    if (page === 'admin-settings') {
        return (
            <div className="space-y-6 pb-20">
                <h2 className="text-2xl font-bold text-slate-900">System Configuration</h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="ds-card p-8 space-y-8">
                        <div>
                            <h3 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-2">
                                <SettingsIcon size={18} className="text-sky-500" />
                                Booking Constraints
                            </h3>
                            <p className="text-sm text-slate-400">Define the global rules for amenity reservations.</p>
                        </div>

                        <div className="space-y-6">
                            {/* Min Hours Advance */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Advance Notice (Hours)</label>
                                <p className="text-xs text-slate-400 mb-3">Minimum hours required before a booking can be made.</p>
                                <div className="grid grid-cols-4 gap-2">
                                    {[0, 12, 24, 48].map(h => (
                                        <button
                                            key={h}
                                            onClick={() => setLocalSettings({ ...localSettings, minHoursAdvance: h })}
                                            className={`py-2.5 rounded-lg border text-sm font-semibold transition-all duration-200 ${localSettings.minHoursAdvance === h
                                                ? 'bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-200/50 scale-[1.02]'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300 hover:bg-sky-50'
                                                }`}
                                        >
                                            {h === 0 ? 'Instant' : `${h}h`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            {/* Max Duration */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Maximum Duration (Hours)</label>
                                <p className="text-xs text-slate-400 mb-3">Longest period a resident can book an amenity.</p>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="1"
                                        max="12"
                                        value={localSettings.maxDuration}
                                        onChange={(e) => setLocalSettings({ ...localSettings, maxDuration: parseInt(e.target.value) })}
                                        className="w-full h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-sky-500"
                                    />
                                    <span className="font-bold text-slate-700 w-12 text-center bg-slate-50 py-1.5 rounded-lg border border-slate-100 text-sm">
                                        {localSettings.maxDuration}h
                                    </span>
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            {/* Max Active Bookings */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Active Bookings Limit</label>
                                <p className="text-xs text-slate-400 mb-3">Maximum number of confirmed parallel bookings per user.</p>
                                <div className="flex items-center gap-4">
                                    <div className="flex border border-slate-200 rounded-lg overflow-hidden">
                                        {[1, 2, 3, 5, 10].map(v => (
                                            <button
                                                key={v}
                                                onClick={() => setLocalSettings({ ...localSettings, maxActiveBookings: v })}
                                                className={`px-4 py-2 text-sm font-semibold border-r border-slate-100 last:border-0 transition-all duration-200 ${localSettings.maxActiveBookings === v
                                                    ? 'bg-slate-800 text-white'
                                                    : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                                                    }`}
                                            >
                                                {v}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                onClick={handleSaveSettings}
                                disabled={isSaving || JSON.stringify(localSettings) === JSON.stringify(settings)}
                                className={`btn btn-lg w-full font-bold ${isSaving || JSON.stringify(localSettings) === JSON.stringify(settings)
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-0'
                                    : 'btn-primary shadow-lg shadow-sky-200/50'
                                    }`}
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Edit2 size={16} />}
                                Save System Changes
                            </button>
                        </div>
                    </div>

                    <div className="hidden lg:block">
                        <div className="bg-gradient-to-br from-sky-50 to-emerald-50 p-8 rounded-2xl border border-sky-100/80">
                            <h4 className="font-bold text-sky-800 mb-3 flex items-center gap-2">
                                <span className="w-6 h-6 bg-sky-100 rounded-md flex items-center justify-center text-sky-600">
                                    <SettingsIcon size={13} />
                                </span>
                                Security Note
                            </h4>
                            <p className="text-sm text-sky-700/80 leading-relaxed space-y-4">
                                These changes are applied via <strong className="text-sky-800">Supabase Edge Functions</strong> and <strong className="text-sky-800">Row Level Security</strong>.
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