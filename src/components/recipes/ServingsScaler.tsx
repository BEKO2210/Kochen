import React, { useState, useCallback } from 'react';
import { Minus, Plus, Users, RotateCcw } from 'lucide-react';

interface ServingsScalerProps {
  originalServings: number;
  currentServings: number;
  onChange: (servings: number) => void;
  min?: number;
  max?: number;
}

export const ServingsScaler: React.FC<ServingsScalerProps> = ({
  originalServings,
  currentServings,
  onChange,
  min = 1,
  max = 50,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const scalingFactor = currentServings / originalServings;

  const handleDecrease = useCallback(() => {
    if (currentServings > min) {
      onChange(currentServings - 1);
    }
  }, [currentServings, min, onChange]);

  const handleIncrease = useCallback(() => {
    if (currentServings < max) {
      onChange(currentServings + 1);
    }
  }, [currentServings, max, onChange]);

  const handleReset = useCallback(() => {
    onChange(originalServings);
  }, [originalServings, onChange]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseInt(e.target.value, 10));
  };

  const getScalingColor = () => {
    if (scalingFactor === 1) return '#6b7280';
    if (scalingFactor > 1) return '#22c55e';
    return '#f59e0b';
  };

  const getScalingText = () => {
    if (scalingFactor === 1) return 'Original';
    const percent = Math.round((scalingFactor - 1) * 100);
    if (scalingFactor > 1) return `+${percent}%`;
    return `${percent}%`;
  };

  return (
    <div
      style={{
        padding: '16px',
        backgroundColor: '#f9fafb',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={18} color="#6b7280" />
          <span
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: '#374151',
            }}
          >
            Portionen
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: getScalingColor(),
              padding: '4px 8px',
              backgroundColor: `${getScalingColor()}15`,
              borderRadius: '6px',
            }}
          >
            {getScalingText()}
          </span>
          {currentServings !== originalServings && (
            <button
              onClick={handleReset}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                backgroundColor: '#e5e7eb',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '11px',
                color: '#6b7280',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#d1d5db';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#e5e7eb';
              }}
            >
              <RotateCcw size={12} />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        {/* Minus Button */}
        <button
          onClick={handleDecrease}
          disabled={currentServings <= min}
          style={{
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: currentServings <= min ? '#f3f4f6' : '#ffffff',
            border: '1px solid #d1d5db',
            borderRadius: '10px',
            cursor: currentServings <= min ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (currentServings > min) {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
              e.currentTarget.style.borderColor = '#9ca3af';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor =
              currentServings <= min ? '#f3f4f6' : '#ffffff';
            e.currentTarget.style.borderColor = '#d1d5db';
          }}
        >
          <Minus
            size={18}
            color={currentServings <= min ? '#d1d5db' : '#374151'}
          />
        </button>

        {/* Number Display */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minWidth: '60px',
          }}
        >
          <span
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#1f2937',
              lineHeight: 1,
            }}
          >
            {currentServings}
          </span>
          <span
            style={{
              fontSize: '11px',
              color: '#9ca3af',
              marginTop: '2px',
            }}
          >
            {currentServings === 1 ? 'Portion' : 'Portionen'}
          </span>
        </div>

        {/* Plus Button */}
        <button
          onClick={handleIncrease}
          disabled={currentServings >= max}
          style={{
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: currentServings >= max ? '#f3f4f6' : '#ffffff',
            border: '1px solid #d1d5db',
            borderRadius: '10px',
            cursor: currentServings >= max ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (currentServings < max) {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
              e.currentTarget.style.borderColor = '#9ca3af';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor =
              currentServings >= max ? '#f3f4f6' : '#ffffff';
            e.currentTarget.style.borderColor = '#d1d5db';
          }}
        >
          <Plus
            size={18}
            color={currentServings >= max ? '#d1d5db' : '#374151'}
          />
        </button>
      </div>

      {/* Slider */}
      <div style={{ marginTop: '16px' }}>
        <input
          type="range"
          min={min}
          max={max}
          value={currentServings}
          onChange={handleSliderChange}
          style={{
            width: '100%',
            height: '6px',
            borderRadius: '3px',
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
              ((currentServings - min) / (max - min)) * 100
            }%, #e5e7eb ${((currentServings - min) / (max - min)) * 100}%, #e5e7eb 100%)`,
            outline: 'none',
            cursor: 'pointer',
            appearance: 'none',
            WebkitAppearance: 'none',
          }}
        />
        <style>{`
          input[type="range"]::-webkit-slider-thumb {
            appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #3b82f6;
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(59, 130, 246, 0.4);
            transition: transform 0.2s, box-shadow 0.2s;
          }
          input[type="range"]::-webkit-slider-thumb:hover {
            transform: scale(1.1);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
          }
          input[type="range"]::-moz-range-thumb {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #3b82f6;
            cursor: pointer;
            border: none;
            box-shadow: 0 2px 6px rgba(59, 130, 246, 0.4);
          }
        `}</style>
      </div>

      {/* Quick Presets */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginTop: '12px',
          flexWrap: 'wrap',
        }}
      >
        {[1, 2, 4, 6, 8].map((preset) => (
          <button
            key={preset}
            onClick={() => onChange(preset)}
            style={{
              padding: '6px 12px',
              backgroundColor: currentServings === preset ? '#3b82f6' : '#ffffff',
              border: '1px solid',
              borderColor: currentServings === preset ? '#3b82f6' : '#d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500,
              color: currentServings === preset ? '#ffffff' : '#6b7280',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (currentServings !== preset) {
                e.currentTarget.style.borderColor = '#9ca3af';
                e.currentTarget.style.color = '#374151';
              }
            }}
            onMouseLeave={(e) => {
              if (currentServings !== preset) {
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.color = '#6b7280';
              }
            }}
          >
            {preset}
          </button>
        ))}
      </div>

      {/* Original Info */}
      <div
        style={{
          marginTop: '12px',
          padding: '10px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#6b7280',
          textAlign: 'center',
        }}
      >
        Originalrezept: <strong>{originalServings}</strong> Portion
        {originalServings !== 1 ? 'en' : ''}
      </div>
    </div>
  );
};

export default ServingsScaler;
