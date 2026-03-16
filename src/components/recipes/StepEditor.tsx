import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, GripVertical, Clock, Trash2 } from 'lucide-react';

export interface StepInputData {
  id: string;
  order: number;
  description: string;
  timerMinutes?: number;
}

interface StepEditorProps {
  steps: StepInputData[];
  onChange: (steps: StepInputData[]) => void;
  error?: string;
}

export const StepEditor: React.FC<StepEditorProps> = ({ steps, onChange, error }) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const textareaRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  const generateId = () => `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Auto-resize textareas
  useEffect(() => {
    textareaRefs.current.forEach((textarea) => {
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    });
  }, [steps]);

  const addStep = () => {
    const newStep: StepInputData = {
      id: generateId(),
      order: steps.length + 1,
      description: '',
    };
    onChange([...steps, newStep]);
  };

  const removeStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    // Reorder remaining steps
    const reorderedSteps = newSteps.map((step, i) => ({ ...step, order: i + 1 }));
    onChange(reorderedSteps);
  };

  const updateStep = (index: number, field: keyof StepInputData, value: any) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    onChange(newSteps);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newSteps = [...steps];
    const draggedItem = newSteps[draggedIndex];
    newSteps.splice(draggedIndex, 1);
    newSteps.splice(index, 0, draggedItem);
    
    // Reorder
    const reorderedSteps = newSteps.map((step, i) => ({ ...step, order: i + 1 }));
    setDraggedIndex(index);
    onChange(reorderedSteps);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleTextareaInput = (e: React.FormEvent<HTMLTextAreaElement>, index: number) => {
    const textarea = e.currentTarget;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
    updateStep(index, 'description', textarea.value);
  };

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <label
          style={{
            fontSize: '14px',
            fontWeight: 500,
            color: '#374151',
          }}
        >
          Zubereitungsschritte
        </label>
        <span style={{ fontSize: '12px', color: '#9ca3af' }}>
          {steps.length} Schritt{steps.length !== 1 ? 'e' : ''}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {steps.map((step, index) => (
          <div
            key={step.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            style={{
              display: 'flex',
              gap: '12px',
              padding: '14px',
              backgroundColor: draggedIndex === index ? '#eff6ff' : '#f9fafb',
              borderRadius: '12px',
              border: error && !step.description.trim() 
                ? '1px solid #fecaca' 
                : '1px solid #e5e7eb',
              cursor: 'grab',
              transition: 'background-color 0.2s, box-shadow 0.2s',
            }}
          >
            {/* Drag Handle & Step Number */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#ffffff',
                }}
              >
                {index + 1}
              </div>
              <div style={{ color: '#9ca3af', cursor: 'grab' }}>
                <GripVertical size={18} />
              </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Textarea */}
              <textarea
                ref={(el) => { textareaRefs.current[index] = el; }}
                placeholder={`Schritt ${index + 1} beschreiben...`}
                value={step.description}
                onInput={(e) => handleTextareaInput(e, index)}
                style={{
                  width: '100%',
                  minHeight: '60px',
                  padding: '10px 12px',
                  border: error && !step.description.trim() 
                    ? '1px solid #ef4444' 
                    : '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  lineHeight: 1.5,
                  resize: 'none',
                  outline: 'none',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = error && !step.description.trim() 
                    ? '#ef4444' 
                    : '#d1d5db';
                }}
              />

              {/* Timer & Actions Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Timer Input */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 10px',
                    backgroundColor: step.timerMinutes ? '#fef3c7' : '#ffffff',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                  }}
                >
                  <Clock size={14} color={step.timerMinutes ? '#d97706' : '#9ca3af'} />
                  <input
                    type="number"
                    min="0"
                    placeholder="Min"
                    value={step.timerMinutes || ''}
                    onChange={(e) => {
                      const value = e.target.value ? parseInt(e.target.value, 10) : undefined;
                      updateStep(index, 'timerMinutes', value);
                    }}
                    style={{
                      width: '50px',
                      border: 'none',
                      background: 'transparent',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>Min</span>
                </div>

                {/* Clear Timer Button */}
                {step.timerMinutes && (
                  <button
                    type="button"
                    onClick={() => updateStep(index, 'timerMinutes', undefined)}
                    style={{
                      padding: '6px 10px',
                      backgroundColor: '#fee2e2',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      color: '#ef4444',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#fecaca';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#fee2e2';
                    }}
                  >
                    <X size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    Timer entfernen
                  </button>
                )}
              </div>
            </div>

            {/* Remove Button */}
            <button
              type="button"
              onClick={() => removeStep(index)}
              style={{
                padding: '8px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                color: '#9ca3af',
                alignSelf: 'flex-start',
                transition: 'color 0.2s, background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ef4444';
                e.currentTarget.style.backgroundColor = '#fee2e2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#9ca3af';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      {error && (
        <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#ef4444' }}>
          {error}
        </p>
      )}

      {/* Add Button */}
      <button
        type="button"
        onClick={addStep}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          width: '100%',
          padding: '14px',
          marginTop: '12px',
          backgroundColor: '#f3f4f6',
          border: '2px dashed #d1d5db',
          borderRadius: '10px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 500,
          color: '#6b7280',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#e5e7eb';
          e.currentTarget.style.borderColor = '#9ca3af';
          e.currentTarget.style.color = '#374151';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#f3f4f6';
          e.currentTarget.style.borderColor = '#d1d5db';
          e.currentTarget.style.color = '#6b7280';
        }}
      >
        <Plus size={18} />
        Schritt hinzufügen
      </button>

      {/* Hint */}
      <p
        style={{
          margin: '10px 0 0 0',
          fontSize: '12px',
          color: '#9ca3af',
          textAlign: 'center',
        }}
      >
        Tip: Ziehe Schritte per Drag & Drop um, um die Reihenfolge zu ändern
      </p>
    </div>
  );
};

export default StepEditor;
