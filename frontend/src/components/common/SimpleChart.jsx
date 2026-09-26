import React from 'react'

const SimpleChart = ({ data, type = 'bar', title, height = 200, color = '#007bff' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-container" style={{ height }}>
        <div className="chart-no-data">
          <p>No data available</p>
        </div>
      </div>
    )
  }

  const maxValue = Math.max(...data.map(item => item.value))
  const minValue = Math.min(...data.map(item => item.value))
  const range = maxValue - minValue || 1

  const renderBarChart = () => (
    <div className="bar-chart" style={{ height: height - 40 }}>
      {data.map((item, index) => (
        <div key={index} className="bar-item">
          <div 
            className="bar"
            style={{
              height: `${((item.value - minValue) / range) * 100}%`,
              backgroundColor: color,
              minHeight: '2px'
            }}
            title={`${item.label}: ${item.value}`}
          />
          <div className="bar-label">{item.label}</div>
        </div>
      ))}
    </div>
  )

  const renderLineChart = () => {
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * 100
      const y = 100 - (((item.value - minValue) / range) * 100)
      return `${x},${y}`
    }).join(' ')

    return (
      <div className="line-chart" style={{ height: height - 40 }}>
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="2"
            points={points}
          />
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * 100
            const y = 100 - (((item.value - minValue) / range) * 100)
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="3"
                fill={color}
                title={`${item.label}: ${item.value}`}
              />
            )
          })}
        </svg>
        <div className="line-chart-labels">
          {data.map((item, index) => (
            <div key={index} className="line-label">{item.label}</div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="chart-container">
      {title && <h4 className="chart-title">{title}</h4>}
      <div className="chart-content">
        {type === 'line' ? renderLineChart() : renderBarChart()}
      </div>
    </div>
  )
}

export default SimpleChart