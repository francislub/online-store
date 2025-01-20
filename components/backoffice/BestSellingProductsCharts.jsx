"use client"

import React from 'react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
// Register the required elements
ChartJS.register(ArcElement, Tooltip, Legend);

export default function BestSellingProductsCharts() {
 const data = {
        labels: ['Cabbage', 'Watermelon', 'Broccoli', 'Maize'],
        datasets: [
          {
            label: '# of Votes',
            data: [50, 10, 20, 19],
            backgroundColor: [
              'rgba(0, 0, 255, 0.7)',
              'rgba(255, 0, 221, 0.7)',
              'rgba(2, 139, 71, 0.7)',
              'rgba(0, 0, 0, 0.7)',
            ],
            borderColor: [
              'rgba(0, 0, 255, 0.3)',
              'rgba(255, 0, 221, 0.3)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
            ],
            borderWidth: 1,
          },
        ],
      };

  return (
    <div className='bg-slate-700 p-8 rounded-lg'>
      <h2 className='text-xl font-bold mb-4'>Best Selling Products </h2>

      <div className="p-8">
        {/* chart  */}
      <Pie data={data} />
      </div>
    </div>
  )
}
