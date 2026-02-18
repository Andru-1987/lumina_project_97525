import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import UsageChart from './UsageChart';
import TrendChart from './TrendChart';

interface AnalyticsData {
    amenity_name: string;
    booking_date: string;
    total_bookings: number;
    cancelled_bookings: number;
    utilization_hours: number;
}

const AnalyticsDashboard: React.FC = () => {
    const [data, setData] = useState<AnalyticsData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            // First, refresh the materialized view
            await supabase.rpc('refresh_analytics');

            // Then fetch data
            const { data: analytics, error } = await supabase.rpc('get_daily_analytics');

            if (error) throw error;
            if (analytics) setData(analytics);

        } catch (err) {
            console.error('Error fetching analytics:', err);
        } finally {
            setLoading(false);
        }
    };

    // Process data for charts

    // 1. Total bookings per amenity
    const usageData = Object.values(data.reduce((acc, curr) => {
        if (!acc[curr.amenity_name]) {
            acc[curr.amenity_name] = { amenity_name: curr.amenity_name, total_bookings: 0 };
        }
        acc[curr.amenity_name].total_bookings += curr.total_bookings;
        return acc;
    }, {} as Record<string, { amenity_name: string; total_bookings: number }>));

    // 2. Trend over time (aggregate all amenities)
    const trendData = Object.values(data.reduce((acc, curr) => {
        if (!acc[curr.booking_date]) {
            acc[curr.booking_date] = { booking_date: curr.booking_date, total_bookings: 0 };
        }
        acc[curr.booking_date].total_bookings += curr.total_bookings;
        return acc;
    }, {} as Record<string, { booking_date: string; total_bookings: number }>));


    if (loading) return <div className="text-slate-500 text-center py-12">Loading Analytics...</div>;

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Analytics Dashboard</h2>
                <button
                    onClick={fetchAnalytics}
                    className="btn btn-sm bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                >
                    Refresh Data
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Usage Chart */}
                <div className="ds-card p-6">
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">Bookings by Amenity</h3>
                    <div className="overflow-x-auto">
                        <UsageChart data={usageData} />
                    </div>
                </div>

                {/* Trend Chart */}
                <div className="ds-card p-6">
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">Booking Trends (Last 30 Days)</h3>
                    <div className="overflow-x-auto">
                        <TrendChart data={trendData} />
                    </div>
                </div>
            </div>

            {/* Helper text if no data */}
            {data.length === 0 && (
                <div className="text-center text-slate-400 py-10">
                    No analytics data available yet. Create some bookings to see charts.
                </div>
            )}

        </div>
    );
};

export default AnalyticsDashboard;
