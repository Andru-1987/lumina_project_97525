import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface TrendChartProps {
    data: { booking_date: string; total_bookings: number }[];
}

const TrendChart: React.FC<TrendChartProps> = ({ data }) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!data || data.length === 0) return;

        d3.select(svgRef.current).selectAll('*').remove();

        const width = 600;
        const height = 400;
        const margin = { top: 20, right: 30, bottom: 40, left: 40 };

        const svg = d3.select(svgRef.current)
            .attr('width', width)
            .attr('height', height)
            .style('background', '#1e293b')
            .style('border-radius', '8px')
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Group By Date and Sum (if not already aggregated)
        // Assuming data is already aggregated by date from backend or parent
        const parsedData = data.map(d => ({
            date: d3.timeParse("%Y-%m-%d")(d.booking_date) as Date,
            value: d.total_bookings
        })).sort((a, b) => a.date.getTime() - b.date.getTime());

        // X Axis
        const x = d3.scaleTime()
            .domain(d3.extent(parsedData, d => d.date) as [Date, Date])
            .range([0, width - margin.left - margin.right]);

        svg.append('g')
            .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
            .call(d3.axisBottom(x))
            .selectAll('text')
            .style('fill', '#94a3b8');

        // Y Axis
        const y = d3.scaleLinear()
            .domain([0, d3.max(parsedData, d => d.value) || 10])
            .range([height - margin.top - margin.bottom, 0]);

        svg.append('g')
            .call(d3.axisLeft(y))
            .selectAll('text')
            .style('fill', '#94a3b8');

        // Line
        svg.append("path")
            .datum(parsedData)
            .attr("fill", "none")
            .attr("stroke", "#a78bfa") // violet-400
            .attr("stroke-width", 2)
            .attr("d", d3.line<{ date: Date, value: number }>()
                .x(d => x(d.date))
                .y(d => y(d.value))
            );

    }, [data]);

    return <svg ref={svgRef}></svg>;
};

export default TrendChart;
