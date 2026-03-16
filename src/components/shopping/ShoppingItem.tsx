import React, { useState, useRef, useCallback } from 'react';
import { 
  Check, 
  Trash2, 
  Edit2, 
  X,
  GripVertical,
  Package,
  Tag
} from 'lucide-react';
import { ShoppingListItem as ShoppingListItemType } from '../../types';
import { Input } from '../ui/Input';

interface ShoppingItemProps {
  item: ShoppingListItemType;
  onToggle: () => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<ShoppingListItemType>) => void;
}

// Einheiten für Dropdown
const UNITS = [
  'g', 'kg', 'ml', 'l', 'Stück', 'Packung', 'Dose', 'Glas', 
  'Bund', 'Beutel', 'Scheibe', 'Prise', 'EL', 'TL', 'Zehe', 'Schuss'
];

// Abteilungen für Dropdown
const DEPARTMENTS = [
  'Obst & Gemüse',
  'Brot & Backwaren',
  'Fleisch & Fisch',
  'Milch & Käse',
  'Tiefkühl',
  'Getränke',
  'Gewürze & Saucen',
  'Nudeln & Reis',
  'Dosen & Konserven',
  'Süßwaren & Snacks',
  'Haushalt',
  'Sonstiges'
];

export const ShoppingItem: React.FC<ShoppingItemProps> = ({
  item,
  onToggle,
  onDelete,
  onUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [editForm, setEditForm] = useState({
    name: item.name,
    amount: item.amount,
    unit: item.unit,
    department: item.department,
    note: item.note || ''
  });
  
  const touchStartX = useRef<number | null>(null);
  const currentSwipeOffset = useRef(0);

  // Touch Handlers für Swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsSwiping(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    
    const touchX = e.touches[0].clientX;
    const diff = touchStartX.current - touchX;
    
    // Nur nach links swipen (negativer Wert)
    if (diff > 0) {
      const offset = Math.min(diff, 100); // Max 100px
      currentSwipeOffset.current = offset;
      setSwipeOffset(offset);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    touchStartX.current = null;
    setIsSwiping(false);
    
    // Wenn genug geswiped, löschen
    if (currentSwipeOffset.current > 80) {
      onDelete();
    } else {
      // Zurücksetzen
      setSwipeOffset(0);
    }
    currentSwipeOffset.current = 0;
  }, [onDelete]);

  // Mouse Handlers für Desktop Swipe
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    touchStartX.current = e.clientX;
    setIsSwiping(true);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (touchStartX.current === null) return;
    
    const diff = touchStartX.current - e.clientX;
    
    if (diff > 0) {
      const offset = Math.min(diff, 100);
      currentSwipeOffset.current = offset;
      setSwipeOffset(offset);
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    touchStartX.current = null;
    setIsSwiping(false);
    
    if (currentSwipeOffset.current > 80) {
      onDelete();
    } else {
      setSwipeOffset(0);
    }
    currentSwipeOffset.current = 0;
  }, [onDelete]);

  const handleSaveEdit = () => {
    onUpdate({
      name: editForm.name,
      amount: editForm.amount,
      unit: editForm.unit,
      department: editForm.department,
      note: editForm.note
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditForm({
      name: item.name,
      amount: item.amount,
      unit: item.unit,
      department: item.department,
      note: item.note || ''
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="shopping-item shopping-item--editing">
        <div className="shopping-item__edit-form">
          <Input
            label="Name"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            autoFocus
          />
          
          <div className="shopping-item__edit-row">
            <Input
              label="Menge"
              type="number"
              value={editForm.amount}
              onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) || 0 })}
            />
            <div className="shopping-item__select-group">
              <label>Einheit</label>
              <select
                value={editForm.unit}
                onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
              >
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div className="shopping-item__select-group">
            <label>Abteilung</label>
            <select
              value={editForm.department}
              onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
            >
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <Input
            label="Notiz (optional)"
            value={editForm.note}
            onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
            placeholder="z.B. bio, bestimmte Marke..."
          />

          <div className="shopping-item__edit-actions">
            <button className="shopping-item__edit-btn cancel" onClick={handleCancelEdit}>
              <X size={16} />
              Abbrechen
            </button>
            <button className="shopping-item__edit-btn save" onClick={handleSaveEdit}>
              <Check size={16} />
              Speichern
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`shopping-item ${item.checked ? 'shopping-item--checked' : ''} ${isSwiping ? 'shopping-item--swiping' : ''}`}
      style={{ transform: `translateX(-${swipeOffset}px)` }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Swipe Delete Background */}
      <div 
        className="shopping-item__swipe-bg"
        style={{ opacity: swipeOffset / 100 }}
      >
        <Trash2 size={24} />
        <span>Löschen</span>
      </div>

      {/* Main Content */}
      <div className="shopping-item__content">
        {/* Checkbox */}
        <button 
          className={`shopping-item__checkbox ${item.checked ? 'checked' : ''}`}
          onClick={onToggle}
          aria-label={item.checked ? 'Als unerledigt markieren' : 'Als erledigt markieren'}
        >
          {item.checked ? <Check size={16} /> : null}
        </button>

        {/* Item Info */}
        <div className="shopping-item__info">
          <span className="shopping-item__name">{item.name}</span>
          <div className="shopping-item__meta">
            <span className="shopping-item__amount">
              {item.amount} {item.unit}
            </span>
            {item.note && (
              <span className="shopping-item__note">
                <Tag size={12} />
                {item.note}
              </span>
            )}
            {item.recipeName && (
              <span className="shopping-item__recipe">
                <Package size={12} />
                {item.recipeName}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="shopping-item__actions">
          <button 
            className="shopping-item__action"
            onClick={() => setIsEditing(true)}
            aria-label="Bearbeiten"
          >
            <Edit2 size={16} />
          </button>
          <button 
            className="shopping-item__action shopping-item__action--delete"
            onClick={onDelete}
            aria-label="Löschen"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* Drag Handle (für zukünftige Sortierung) */}
        <div className="shopping-item__drag-handle">
          <GripVertical size={16} />
        </div>
      </div>
    </div>
  );
};
