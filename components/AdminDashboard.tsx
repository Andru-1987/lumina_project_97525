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
                    <h2 className="text-3xl font-light text-slate-900">Dashboard</h2>
                    <p className="text-slate-500 mt-2">Welcome back, Admin.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-sky-100 text-sky-600 rounded-lg">
                                <Calendar size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 uppercase tracking-wider font-semibold">Today's Bookings</p>
                                <h3 className="text-2xl font-bold text-slate-900">
                                    {bookingsCount}
                                </h3>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                                <Users size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 uppercase tracking-wider font-semibold">Total Residents</p>
                                <h3 className="text-2xl font-bold text-slate-900">{totalResidents}</h3>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                        <h4 className="font-semibold text-slate-800 mb-4">Quick Announcement</h4>
                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="Title"
                                className="w-full border p-2 rounded text-sm"
                                value={announcementText.title}
                                onChange={e => setAnnouncementText({ ...announcementText, title: e.target.value })}
                            />
                            <textarea
                                placeholder="Message"
                                className="w-full border p-2 rounded text-sm"
                                rows={2}
                                value={announcementText.message}
                                onChange={e => setAnnouncementText({ ...announcementText, message: e.target.value })}
                            />
                            <button
                                onClick={handleSendAnnouncement}
                                className="w-full bg-slate-900 text-white py-2 rounded text-sm hover:bg-slate-800 flex justify-center items-center gap-2"
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
                    <h2 className="text-2xl font-light">Amenities</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {amenities.map(amenity => (
                        <div key={amenity.id} className="bg-white rounded-lg overflow-hidden border border-slate-200 shadow-sm group">
                            <div className="h-40 bg-slate-200 relative">
                                <img src={amenity.imageUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                                <button
                                    onClick={() => onDeleteAmenity(amenity.id)}
                                    className="absolute top-2 right-2 bg-white/90 p-2 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <div className="p-4">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-lg">{amenity.name}</h3>
                                    <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">{amenity.openTime} - {amenity.closeTime}</span>
                                </div>
                                <p className="text-sm text-slate-500 mt-2 line-clamp-2">{amenity.description}</p>
                                <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                                    <Users size={12} /> Capacity: {amenity.capacity}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Add New Card */}
                    <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col justify-center items-center text-slate-400 hover:border-sky-500 hover:text-sky-500 transition-colors cursor-pointer" onClick={() => {
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
                <h2 className="text-2xl font-light">Resident Directory</h2>

                <div className="bg-white p-6 rounded-lg border border-slate-200">
                    <h3 className="font-medium mb-4 flex items-center gap-2"><Upload size={18} /> Bulk Import</h3>
                    <textarea
                        className="w-full h-32 p-3 border rounded-lg text-sm font-mono text-slate-600 bg-slate-50 mb-3 focus:ring-2 focus:ring-sky-500 outline-none"
                        placeholder={`Paste CSV data here:\nName, Unit, Email\nJohn Doe, 101, john@example.com`}
                        value={csvContent}
                        onChange={(e) => setCsvContent(e.target.value)}
                    />
                    <button
                        className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
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

                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                            <tr>
                                <th className="p-4">Name</th>
                                <th className="p-4">Unit</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Role</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.map(u => (
                                <tr key={u.id} className="hover:bg-slate-50">
                                    <td className="p-4 flex items-center gap-3">
                                        <img src={u.avatarUrl || `https://ui-avatars.com/api/?name=${u.name}`} className="w-8 h-8 rounded-full bg-slate-200" />
                                        {u.name}
                                    </td>
                                    <td className="p-4 text-slate-500">{u.unit || '-'}</td>
                                    <td className="p-4 text-slate-500">{u.email}</td>
                                    <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-bold ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>{u.role}</span></td>
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
                <h2 className="text-2xl font-light">Global Reservations</h2>
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <div className="space-y-4">
                        {reservations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(res => {
                            const user = users.find(u => u.id === res.userId);
                            const amenity = amenities.find(a => a.id === res.amenityId);
                            return (
                                <div key={res.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:border-sky-300 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 font-bold flex-col leading-tight">
                                            <span className="text-xs">{new Date(res.date).toLocaleString('default', { month: 'short' })}</span>
                                            <span className="text-lg">{new Date(res.date).getDate()}</span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900">{amenity?.name}</h4>
                                            <p className="text-sm text-slate-500">{res.startTime} - {res.endTime} • {user?.name} ({user?.unit})</p>
                                        </div>
                                    </div>
                                    {res.status === ReservationStatus.CONFIRMED && (
                                        <button
                                            onClick={() => onCancelReservation(res.id)}
                                            className="mt-3 md:mt-0 text-red-500 hover:text-red-700 text-sm font-medium border border-red-200 px-3 py-1 rounded hover:bg-red-50"
                                        >
                                            Cancel Booking
                                        </button>
                                    )}
                                    {res.status === ReservationStatus.CANCELLED && (
                                        <span className="text-slate-400 text-sm italic mt-2 md:mt-0">Cancelled</span>
                                    )}
                                </div>
                            );
                        })}
                        {reservations.length === 0 && <p className="text-slate-400 text-center py-8">No reservations found.</p>}
                    </div>
                </div>
            </div>
        )
    }

    // 5. Settings
    const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
    const [isSaving, setIsSaving] = useState(false);

    React.useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    const handleSaveSettings = async () => {
        setIsSaving(true);
        await onUpdateSettings(localSettings);
        setIsSaving(false);
    };

    if (page === 'admin-settings') {
        return (
            <div className="space-y-6 pb-20">
                <h2 className="text-2xl font-light text-slate-900">System Configuration</h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-8">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
                                <SettingsIcon size={18} className="text-sky-500" />
                                Booking Constraints
                            </h3>
                            <p className="text-sm text-slate-500">Define the global rules for amenity reservations.</p>
                        </div>

                        <div className="space-y-6">
                            {/* Min Hours Advance */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Advance Notice (Hours)</label>
                                <p className="text-xs text-slate-400 mb-3">Minimum hours required before a booking can be made.</p>
                                <div className="grid grid-cols-4 gap-2">
                                    {[0, 12, 24, 48].map(h => (
                                        <button
                                            key={h}
                                            onClick={() => setLocalSettings({ ...localSettings, minHoursAdvance: h })}
                                            className={`py-2 rounded-lg border text-sm font-medium transition-all ${localSettings.minHoursAdvance === h
                                                ? 'bg-sky-500 text-white border-sky-500 shadow-md transform scale-105'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300'
                                                }`}
                                        >
                                            {h === 0 ? 'Instant' : `${h}h`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <hr className="border-slate-50" />

                            {/* Max Duration */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Maximum Duration (Hours)</label>
                                <p className="text-xs text-slate-400 mb-3">Longest period a resident can book an amenity.</p>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="1"
                                        max="12"
                                        value={localSettings.maxDuration}
                                        onChange={(e) => setLocalSettings({ ...localSettings, maxDuration: parseInt(e.target.value) })}
                                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-500"
                                    />
                                    <span className="font-bold text-slate-700 w-12 text-center bg-slate-50 py-1 rounded border border-slate-100">
                                        {localSettings.maxDuration}h
                                    </span>
                                </div>
                            </div>

                            <hr className="border-slate-50" />

                            {/* Max Active Bookings */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Active Bookings Limit</label>
                                <p className="text-xs text-slate-400 mb-3">Maximum number of confirmed parallel bookings per user.</p>
                                <div className="flex items-center gap-4">
                                    <div className="flex border border-slate-200 rounded-lg overflow-hidden">
                                        {[1, 2, 3, 5, 10].map(v => (
                                            <button
                                                key={v}
                                                onClick={() => setLocalSettings({ ...localSettings, maxActiveBookings: v })}
                                                className={`px-4 py-2 text-sm font-medium border-r last:border-0 ${localSettings.maxActiveBookings === v
                                                    ? 'bg-slate-900 text-white'
                                                    : 'bg-white text-slate-600 hover:bg-slate-50'
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
                                className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isSaving || JSON.stringify(localSettings) === JSON.stringify(settings)
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    : 'bg-sky-500 text-white hover:bg-sky-600 shadow-lg shadow-sky-100'
                                    }`}
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Edit2 size={18} />}
                                Save System Changes
                            </button>
                        </div>
                    </div>

                    <div className="hidden lg:block">
                        <div className="bg-sky-50 p-8 rounded-2xl border border-sky-100">
                            <h4 className="font-bold text-sky-800 mb-4">Security Note</h4>
                            <p className="text-sm text-sky-700 leading-relaxed space-y-4">
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