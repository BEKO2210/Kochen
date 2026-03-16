import React, { useState, useMemo } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle,
  MoreVertical,
  Share2,
  Download,
  Calendar,
  ChevronDown,
  ChevronUp,
  Search
} from 'lucide-react';
import { ShoppingItem } from './ShoppingItem';
import { ListGenerator } from './ListGenerator';
import { useShoppingStore } from '../../store/shoppingStore';
import { usePlannerStore } from '../../store/plannerStore';
import { ShoppingList as ShoppingListType, ShoppingListItem } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { formatDate } from '../../utils/dateUtils';

// Abteilungs-Reihenfolge
const DEPARTMENT_ORDER = [
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

interface ShoppingListProps {
  listId?: string;
}

export const ShoppingList: React.FC<ShoppingListProps> = ({ listId: initialListId }) => {
  const [activeListId, setActiveListId] = useState<string | undefined>(initialListId);
  const [showGenerator, setShowGenerator] = useState(false);
  const [showNewListDialog, setShowNewListDialog] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set(DEPARTMENT_ORDER));
  const [showMenu, setShowMenu] = useState(false);

  const { 
    lists, 
    activeList,
    createList, 
    deleteList, 
    setActiveList,
    toggleItemChecked,
    deleteItem,
    updateItem,
    clearCheckedItems,
    shareList,
    exportList
  } = useShoppingStore();

  const { getWeekPlan } = usePlannerStore();

  const currentList = activeListId 
    ? lists.find(l => l.id === activeListId) 
    : activeList;

  // Gruppiere Items nach Abteilung
  const groupedItems = useMemo(() => {
    if (!currentList) return {};

    const groups: Record<string, ShoppingListItem[]> = {};
    
    currentList.items.forEach(item => {
      const dept = item.department || 'Sonstiges';
      if (!groups[dept]) {
        groups[dept] = [];
      }
      groups[dept].push(item);
    });

    // Sortiere Items in jeder Abteilung: unchecked zuerst, dann alphabetisch
    Object.keys(groups).forEach(dept => {
      groups[dept].sort((a, b) => {
        if (a.checked === b.checked) {
          return a.name.localeCompare(b.name);
        }
        return a.checked ? 1 : -1;
      });
    });

    return groups;
  }, [currentList]);

  // Filtere nach Suchbegriff
  const filteredGroups = useMemo(() => {
    if (!searchQuery) return groupedItems;

    const filtered: Record<string, ShoppingListItem[]> = {};
    Object.entries(groupedItems).forEach(([dept, items]) => {
      const matchingItems = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (matchingItems.length > 0) {
        filtered[dept] = matchingItems;
      }
    });
    return filtered;
  }, [groupedItems, searchQuery]);

  // Statistiken
  const stats = useMemo(() => {
    if (!currentList) return { total: 0, checked: 0, progress: 0 };
    const total = currentList.items.length;
    const checked = currentList.items.filter(i => i.checked).length;
    const progress = total > 0 ? Math.round((checked / total) * 100) : 0;
    return { total, checked, progress };
  }, [currentList]);

  const handleCreateList = () => {
    if (newListName.trim()) {
      const list = createList(newListName.trim());
      setActiveListId(list.id);
      setNewListName('');
      setShowNewListDialog(false);
    }
  };

  const handleDeleteList = () => {
    if (currentList && confirm(`Liste "${currentList.name}" wirklich löschen?`)) {
      deleteList(currentList.id);
      setActiveListId(undefined);
    }
    setShowMenu(false);
  };

  const handleShare = () => {
    if (currentList) {
      shareList(currentList.id);
    }
    setShowMenu(false);
  };

  const handleExport = () => {
    if (currentList) {
      exportList(currentList.id);
    }
    setShowMenu(false);
  };

  const toggleDepartment = (dept: string) => {
    setExpandedDepartments(prev => {
      const next = new Set(prev);
      if (next.has(dept)) {
        next.delete(dept);
      } else {
        next.add(dept);
      }
      return next;
    });
  };

  const expandAll = () => setExpandedDepartments(new Set(DEPARTMENT_ORDER));
  const collapseAll = () => setExpandedDepartments(new Set());

  if (!currentList) {
    return (
      <div className="shopping-list shopping-list--empty">
        <div className="shopping-list__empty-state">
          <ShoppingCart size={64} />
          <h2>Keine Einkaufsliste vorhanden</h2>
          <p>Erstelle eine neue Liste oder generiere eine aus deinem Wochenplan.</p>
          <div className="shopping-list__empty-actions">
            <Button variant="primary" onClick={() => setShowNewListDialog(true)}>
              <Plus size={18} />
              Neue Liste
            </Button>
            <Button variant="secondary" onClick={() => setShowGenerator(true)}>
              <Calendar size={18} />
              Aus Plan generieren
            </Button>
          </div>
        </div>

        {/* New List Dialog */}
        <Modal
          isOpen={showNewListDialog}
          onClose={() => setShowNewListDialog(false)}
          title="Neue Einkaufsliste"
          size="small"
        >
          <div className="new-list-dialog">
            <Input
              label="Name der Liste"
              placeholder="z.B. Wocheneinkauf"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              autoFocus
            />
            <div className="new-list-dialog__actions">
              <Button variant="secondary" onClick={() => setShowNewListDialog(false)}>
                Abbrechen
              </Button>
              <Button variant="primary" onClick={handleCreateList} disabled={!newListName.trim()}>
                Erstellen
              </Button>
            </div>
          </div>
        </Modal>

        {/* List Generator */}
        <Modal
          isOpen={showGenerator}
          onClose={() => setShowGenerator(false)}
          title="Einkaufsliste generieren"
          size="large"
        >
          <ListGenerator onComplete={() => setShowGenerator(false)} />
        </Modal>
      </div>
    );
  }

  return (
    <div className="shopping-list">
      {/* Header */}
      <div className="shopping-list__header">
        <div className="shopping-list__title-section">
          <h2 className="shopping-list__title">{currentList.name}</h2>
          <span className="shopping-list__date">
            Erstellt: {formatDate(new Date(currentList.createdAt), 'dd.MM.yyyy')}
          </span>
        </div>

        {/* Progress */}
        <div className="shopping-list__progress">
          <div className="shopping-list__progress-bar">
            <div 
              className="shopping-list__progress-fill"
              style={{ width: `${stats.progress}%` }}
            />
          </div>
          <span className="shopping-list__progress-text">
            {stats.checked}/{stats.total} ({stats.progress}%)
          </span>
        </div>

        {/* Actions */}
        <div className="shopping-list__actions">
          <button 
            className="shopping-list__action-btn"
            onClick={() => setShowGenerator(true)}
            title="Aus Wochenplan generieren"
          >
            <Calendar size={20} />
          </button>
          <button 
            className="shopping-list__action-btn"
            onClick={handleShare}
            title="Teilen"
          >
            <Share2 size={20} />
          </button>
          <button 
            className="shopping-list__action-btn"
            onClick={handleExport}
            title="Exportieren"
          >
            <Download size={20} />
          </button>
          <div className="shopping-list__menu">
            <button 
              className="shopping-list__action-btn"
              onClick={() => setShowMenu(!showMenu)}
              title="Mehr"
            >
              <MoreVertical size={20} />
            </button>
            {showMenu && (
              <div className="shopping-list__menu-dropdown">
                <button onClick={handleDeleteList}>
                  <Trash2 size={16} />
                  Liste löschen
                </button>
                <button onClick={clearCheckedItems}>
                  <CheckCircle2 size={16} />
                  Erledigte entfernen
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="shopping-list__toolbar">
        <div className="shopping-list__search">
          <Search size={18} />
          <Input
            type="text"
            placeholder="Artikel suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="shopping-list__expand-actions">
          <button onClick={expandAll}>Alle aufklappen</button>
          <button onClick={collapseAll}>Alle zuklappen</button>
        </div>
      </div>

      {/* List Content */}
      <div className="shopping-list__content">
        {DEPARTMENT_ORDER.map(dept => {
          const items = filteredGroups[dept];
          if (!items || items.length === 0) return null;

          const isExpanded = expandedDepartments.has(dept);
          const checkedCount = items.filter(i => i.checked).length;

          return (
            <div key={dept} className="shopping-list__department">
              <button 
                className="shopping-list__department-header"
                onClick={() => toggleDepartment(dept)}
              >
                <div className="shopping-list__department-title">
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  <h3>{dept}</h3>
                  <span className="shopping-list__department-count">
                    {checkedCount}/{items.length}
                  </span>
                </div>
                {checkedCount === items.length && items.length > 0 && (
                  <CheckCircle2 size={18} className="shopping-list__department-complete" />
                )}
              </button>

              {isExpanded && (
                <div className="shopping-list__department-items">
                  {items.map(item => (
                    <ShoppingItem
                      key={item.id}
                      item={item}
                      onToggle={() => toggleItemChecked(currentList.id, item.id)}
                      onDelete={() => deleteItem(currentList.id, item.id)}
                      onUpdate={(updates) => updateItem(currentList.id, item.id, updates)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {Object.keys(filteredGroups).length === 0 && (
          <div className="shopping-list__no-results">
            <p>Keine Artikel gefunden</p>
          </div>
        )}
      </div>

      {/* List Selector */}
      {lists.length > 1 && (
        <div className="shopping-list__selector">
          <span>Liste:</span>
          <select 
            value={currentList.id} 
            onChange={(e) => setActiveListId(e.target.value)}
          >
            {lists.map(list => (
              <option key={list.id} value={list.id}>{list.name}</option>
            ))}
          </select>
          <button onClick={() => setShowNewListDialog(true)}>
            <Plus size={16} />
          </button>
        </div>
      )}

      {/* Modals */}
      <Modal
        isOpen={showNewListDialog}
        onClose={() => setShowNewListDialog(false)}
        title="Neue Einkaufsliste"
        size="small"
      >
        <div className="new-list-dialog">
          <Input
            label="Name der Liste"
            placeholder="z.B. Wocheneinkauf"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            autoFocus
          />
          <div className="new-list-dialog__actions">
            <Button variant="secondary" onClick={() => setShowNewListDialog(false)}>
              Abbrechen
            </Button>
            <Button variant="primary" onClick={handleCreateList} disabled={!newListName.trim()}>
              Erstellen
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showGenerator}
        onClose={() => setShowGenerator(false)}
        title="Einkaufsliste generieren"
        size="large"
      >
        <ListGenerator onComplete={() => setShowGenerator(false)} />
      </Modal>
    </div>
  );
};
