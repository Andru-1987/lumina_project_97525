import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface UsageChartProps {
    data: { amenity_name: string; total_bookings: number }[];
}

const UsageChart: React.FC<UsageChartProps> = ({ data }) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!data || data.length === 0) return;

        // Clear previous render
        d3.select(svgRef.current).selectAll('*').remove();

        // Dimensions
        const width = 600;
        const height = 400;
        const margin = { top: 20, right: 30, bottom: 40, left: 40 };

        const svg = d3.select(svgRef.current)
            .attr('width', width)
            .attr('height', height)
            .style('background', '#1e293b') // slate-800
            .style('border-radius', '8px')
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // X Axis
        const x = d3.scaleBand()
            .domain(data.map(d => d.amenity_name))
            .range([0, width - margin.left - margin.right])
            .padding(0.2);

        svg.append('g')
            .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
            .call(d3.axisBottom(x))
            .selectAll('text')
            .style('fill', '#94a3b8'); // slate-400

        // Y Axis
        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.total_bookings) || 10])
            .range([height - margin.top - margin.bottom, 0]);

        svg.append('g')
            .call(d3.axisLeft(y))
            .selectAll('text')
            .style('fill', '#94a3b8');

        // Bars
        svg.selectAll('mybar')
            .data(data)
            .enter()
            .append('rect')
            .attr('x', d => x(d.amenity_name) || 0)
            .attr('y', d => y(d.total_bookings))
            .attr('width', x.bandwidth())
            .attr('height', d => height - margin.top - margin.bottom - y(d.total_bookings))
            .attr('fill', '#38bdf8'); // sky-400

    }, [data]);

    return <svg ref={svgRef}></svg>;
};

export default UsageChart;
