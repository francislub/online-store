import React from 'react'

// interface HeadingProps {
//   title: string;
// }

export default function Heading({ title }) {
  return (
    <div>
        <h2 className='text-2xl font-semibold text-slate-800 dark:text-slate-50'>{title}</h2>
     
    </div>
  )
}
