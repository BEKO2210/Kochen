import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Plus,
  Trash2,
  Check,
  X,
  Share2,
  Download,
  ChevronDown,
  ChevronUp,
  Edit3,
  MoreVertical,
  Archive,
  Copy,
} from 'lucide-react';
import { useShoppingList } from '../hooks/useShoppingList';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

interface NewItemForm {
  name: string;
  amount: string;
  unit: string;
  category: string;
}

export const ShoppingPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    lists,
    currentList,
    isLoading,
    createList,
    deleteList,
    renameList,
    selectList,
    addItem,
    removeItem,
    toggleItem,
    checkAll,
    uncheckAll,
    removeChecked,
    clearList,
    getItemsByCategory,
    getProgress,
    categories,
    exportToText,
    exportToMarkdown,
  } = useShoppingList();

  const [showNewListDialog, setShowNewListDialog] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState<NewItemForm>({
    name: '',
    amount: '',
    unit: '',
    category: categories[0] || 'Sonstiges',
  });
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showListMenu, setShowListMenu] = useState(false);
  const [editingListName, setEditingListName] = useState(false);
  const [editedListName, setEditedListName] = useState('');

  // Initialize expanded categories
  useEffect(() => {
    if (currentList) {
      const grouped = getItemsByCategory();
      setExpandedCategories(new Set(Object.keys(grouped)));
    }
  }, [currentList]);

  // Create new list
  const handleCreateList = () => {
    if (newListName.trim()) {
      createList(newListName.trim());
      setNewListName('');
      setShowNewListDialog(false);
    }
  };

  // Add new item
  const handleAddItem = () => {
    if (newItem.name.trim()) {
      addItem({
        name: newItem.name.trim(),
        amount: parseFloat(newItem.amount) || 1,
        unit: newItem.unit || 'Stk',
        category: newItem.category,
      });
      setNewItem({
        name: '',
        amount: '',
        unit: '',
        category: categories[0] || 'Sonstiges',
      });
      setShowAddItem(false);
    }
  };

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // Handle share
  const handleShare = async () => {
    if (!currentList) return;

    const text = exportToText();
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: currentList.name,
          text,
        });
      } else {
        await navigator.clipboard.writeText(text);
        alert('Einkaufsliste kopiert!');
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  // Handle export
  const handleExport = () => {
    if (!currentList) return;

    const markdown = exportToMarkdown();
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentList.name}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle rename
  const handleRename = () => {
    if (currentList && editedListName.trim()) {
      renameList(currentList.id, editedListName.trim());
      setEditingListName(false);
      setEditedListName('');
    }
  };

  // Progress
  const progress = getProgress();

  // Grouped items
  const groupedItems = currentList ? getItemsByCategory() : {};

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          <p className="text-amber-700">Lade Einkaufslisten...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-amber-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-amber-950 flex items-center gap-2">
              <ShoppingCart className="w-7 h-7 text-orange-500" />
              Einkaufsliste
            </h1>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowNewListDialog(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Neue Liste
            </Button>
          </div>

          {/* List Selector */}
          {lists.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {lists.map((list) => (
                <button
                  key={list.id}
                  onClick={() => selectList(list.id)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                    currentList?.id === list.id
                      ? 'bg-orange-500 text-white'
                      : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  }`}
                >
                  {list.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {currentList ? (
          <>
            {/* List Header */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                {editingListName ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={editedListName}
                      onChange={(e) => setEditedListName(e.target.value)}
                      className="flex-1"
                      autoFocus
                    />
                    <Button variant="primary" size="sm" onClick={handleRename}>
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setEditingListName(false);
                        setEditedListName('');
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <h2
                    onClick={() => {
                      setEditedListName(currentList.name);
                      setEditingListName(true);
                    }}
                    className="text-xl font-bold text-amber-950 cursor-pointer hover:text-orange-600"
                  >
                    {currentList.name}
                  </h2>
                )}

                <div className="flex items-center gap-1">
                  <button
                    onClick={handleShare}
                    className="p-2 hover:bg-amber-100 rounded-lg transition-colors"
                    title="Teilen"
                  >
                    <Share2 className="w-5 h-5 text-amber-700" />
                  </button>
                  <button
                    onClick={handleExport}
                    className="p-2 hover:bg-amber-100 rounded-lg transition-colors"
                    title="Exportieren"
                  >
                    <Download className="w-5 h-5 text-amber-700" />
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setShowListMenu(!showListMenu)}
                      className="p-2 hover:bg-amber-100 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-5 h-5 text-amber-700" />
                    </button>
                    {showListMenu && (
                      <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-amber-100 py-1 z-20 min-w-[150px]">
                        <button
                          onClick={() => {
                            checkAll();
                            setShowListMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-amber-50 text-sm"
                        >
                          Alle abhaken
                        </button>
                        <button
                          onClick={() => {
                            uncheckAll();
                            setShowListMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-amber-50 text-sm"
                        >
                          Alle deaktivieren
                        </button>
                        <button
                          onClick={() => {
                            removeChecked();
                            setShowListMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-amber-50 text-sm"
                        >
                          Abgehakte entfernen
                        </button>
                        <hr className="my-1 border-amber-100" />
                        <button
                          onClick={() => {
                            if (confirm('Möchtest du diese Liste wirklich löschen?')) {
                              deleteList(currentList.id);
                            }
                            setShowListMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-red-50 text-red-500 text-sm"
                        >
                          Liste löschen
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-amber-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 transition-all duration-300"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
                <span className="text-sm text-amber-600 whitespace-nowrap">
                  {progress.checked}/{progress.total}
                </span>
              </div>
            </div>

            {/* Add Item Button */}
            <button
              onClick={() => setShowAddItem(true)}
              className="w-full p-4 bg-white rounded-xl shadow-sm mb-4 flex items-center justify-center gap-2 text-orange-600 hover:bg-orange-50 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Artikel hinzufügen
            </button>

            {/* Items by Category */}
            {Object.entries(groupedItems).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(groupedItems).map(([category, items]) => (
                  <div key={category} className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full px-4 py-3 bg-amber-50 flex items-center justify-between"
                    >
                      <span className="font-medium text-amber-950">{category}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-amber-600">
                          {items.filter(i => i.checked).length}/{items.length}
                        </span>
                        {expandedCategories.has(category) ? (
                          <ChevronUp className="w-4 h-4 text-amber-600" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-amber-600" />
                        )}
                      </div>
                    </button>
                    {expandedCategories.has(category) && (
                      <div className="divide-y divide-amber-100">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className={`flex items-center gap-3 p-3 hover:bg-amber-50 transition-colors ${
                              item.checked ? 'bg-green-50' : ''
                            }`}
                          >
                            <button
                              onClick={() => toggleItem(item.id)}
                              className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                                item.checked
                                  ? 'bg-green-500 border-green-500'
                                  : 'border-amber-300 hover:border-orange-500'
                              }`}
                            >
                              {item.checked && <Check className="w-4 h-4 text-white" />}
                            </button>
                            <div className="flex-1">
                              <p className={`font-medium ${item.checked ? 'text-green-700 line-through' : 'text-amber-950'}`}>
                                {item.name}
                              </p>
                              <p className={`text-sm ${item.checked ? 'text-green-600' : 'text-amber-600'}`}>
                                {item.amount} {item.unit}
                                {item.recipeSource && ` • ${item.recipeSource}`}
                              </p>
                            </div>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <ShoppingCart className="w-16 h-16 text-amber-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-amber-950 mb-2">
                  Noch keine Artikel
                </h3>
                <p className="text-amber-600 mb-4">
                  Füge Artikel hinzu oder generiere eine Liste aus deinem Wochenplan.
                </p>
                <Button variant="primary" onClick={() => navigate('/planner')}>
                  Zum Wochenplaner
                </Button>
              </div>
            )}
          </>
        ) : (
          /* No List Selected */
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 text-amber-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-amber-950 mb-2">
              Keine Liste ausgewählt
            </h3>
            <p className="text-amber-600 mb-4">
              Erstelle eine neue Einkaufsliste oder wähle eine bestehende aus.
            </p>
            <Button variant="primary" onClick={() => setShowNewListDialog(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Neue Liste erstellen
            </Button>
          </div>
        )}
      </main>

      {/* New List Dialog */}
      {showNewListDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-amber-950 mb-4">
              Neue Einkaufsliste
            </h2>
            <Input
              type="text"
              placeholder="Name der Liste"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              className="mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowNewListDialog(false);
                  setNewListName('');
                }}
                className="flex-1"
              >
                Abbrechen
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateList}
                disabled={!newListName.trim()}
                className="flex-1"
              >
                Erstellen
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Dialog */}
      {showAddItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-amber-950 mb-4">
              Artikel hinzufügen
            </h2>
            <div className="space-y-3 mb-4">
              <Input
                type="text"
                placeholder="Artikelname"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                autoFocus
              />
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Menge"
                  value={newItem.amount}
                  onChange={(e) => setNewItem({ ...newItem, amount: e.target.value })}
                  className="flex-1"
                />
                <Input
                  type="text"
                  placeholder="Einheit"
                  value={newItem.unit}
                  onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                  className="w-24"
                />
              </div>
              <select
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                className="w-full px-4 py-2 border border-amber-200 rounded-lg focus:border-orange-500 focus:outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowAddItem(false);
                  setNewItem({ name: '', amount: '', unit: '', category: categories[0] || 'Sonstiges' });
                }}
                className="flex-1"
              >
                Abbrechen
              </Button>
              <Button
                variant="primary"
                onClick={handleAddItem}
                disabled={!newItem.name.trim()}
                className="flex-1"
              >
                Hinzufügen
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingPage;
