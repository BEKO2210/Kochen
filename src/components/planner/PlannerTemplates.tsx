import React, { useState } from 'react';
import { 
  Dumbbell, 
  Wallet, 
  Zap, 
  Leaf, 
  Heart, 
  Check,
  Info,
  ChevronRight
} from 'lucide-react';
import { WeekTemplate } from '../../types';
import { Button } from '../ui/Button';

interface PlannerTemplatesProps {
  onSelect: (templateId: string) => void;
}

interface TemplateDetails extends WeekTemplate {
  icon: React.ReactNode;
  color: string;
  description: string;
  features: string[];
  estimatedCost: string;
  estimatedTime: string;
}

const TEMPLATES: TemplateDetails[] = [
  {
    id: 'fitness',
    name: 'Fitness-Woche',
    icon: <Dumbbell size={32} />,
    color: '#3b82f6',
    description: 'High-Protein Mahlzeiten für aktive Menschen. Optimal für Muskelaufbau und Regeneration.',
    features: [
      'Mindestens 25g Protein pro Mahlzeit',
      'Komplexe Kohlenhydrate',
      'Gesunde Fette',
      'Post-Workout Snacks'
    ],
    estimatedCost: '45-55 €',
    estimatedTime: '30-45 min/Tag',
    days: {}
  },
  {
    id: 'budget',
    name: 'Budget-Woche',
    icon: <Wallet size={32} />,
    color: '#10b981',
    description: 'Kostengünstige Mahlzeiten unter 5€ pro Tag. Clevere Einkaufsplanung und Resteverwertung.',
    features: [
      'Unter 35€ für die ganze Woche',
      'Saisonale Zutaten',
      'Große Portionen zum Meal-Preppen',
      'Resteverwertung'
    ],
    estimatedCost: '30-35 €',
    estimatedTime: '20-35 min/Tag',
    days: {}
  },
  {
    id: 'quick',
    name: 'Schnell & Einfach',
    icon: <Zap size={32} />,
    color: '#f59e0b',
    description: 'Mahlzeiten in unter 20 Minuten. Perfekt für stressige Wochen ohne Kompromisse.',
    features: [
      'Max. 20 Minuten Zubereitung',
      'Max. 5 Zutaten pro Rezept',
      'One-Pot Gerichte',
      'Vorbereitung am Wochenende'
    ],
    estimatedCost: '40-50 €',
    estimatedTime: '15-20 min/Tag',
    days: {}
  },
  {
    id: 'vegetarian',
    name: 'Vegetarische Woche',
    icon: <Leaf size={32} />,
    color: '#22c55e',
    description: 'Pflanzliche Vielfalt mit viel Protein aus Hülsenfrüchten, Tofu und Eiern.',
    features: [
      '100% vegetarisch',
      'Pflanzliche Proteinquellen',
      'Vielseitige Gemüsegerichte',
      'Nährstoffreich'
    ],
    estimatedCost: '35-45 €',
    estimatedTime: '25-40 min/Tag',
    days: {}
  },
  {
    id: 'family',
    name: 'Familien-Woche',
    icon: <Heart size={32} />,
    color: '#ec4899',
    description: 'Kinderfreundliche Mahlzeiten, die allen schmecken. Ausgewogen und nahrhaft.',
    features: [
      'Kinderfreundliche Geschmäcker',
      'Verstecktes Gemüse',
      'Große Portionen',
      'Wenig Zucker'
    ],
    estimatedCost: '50-65 €',
    estimatedTime: '30-45 min/Tag',
    days: {}
  }
];

export const PlannerTemplates: React.FC<PlannerTemplatesProps> = ({ onSelect }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState<string | null>(null);

  const handleApply = (templateId: string) => {
    onSelect(templateId);
  };

  return (
    <div className="planner-templates">
      <div className="planner-templates__intro">
        <Info size={20} />
        <p>
          Wähle eine Vorlage, um deine Woche automatisch zu planen. 
          Du kannst die Mahlzeiten später individuell anpassen.
        </p>
      </div>

      <div className="planner-templates__grid">
        {TEMPLATES.map((template) => (
          <div
            key={template.id}
            className={`planner-templates__card ${selectedTemplate === template.id ? 'selected' : ''}`}
            style={{ '--template-color': template.color } as React.CSSProperties}
          >
            {/* Card Header */}
            <div 
              className="planner-templates__card-header"
              style={{ backgroundColor: `${template.color}15` }}
            >
              <div 
                className="planner-templates__icon"
                style={{ color: template.color }}
              >
                {template.icon}
              </div>
              <h3 className="planner-templates__name">{template.name}</h3>
            </div>

            {/* Card Body */}
            <div className="planner-templates__card-body">
              <p className="planner-templates__description">
                {template.description}
              </p>

              {/* Features */}
              <ul className="planner-templates__features">
                {template.features.map((feature, index) => (
                  <li key={index}>
                    <Check size={14} style={{ color: template.color }} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Estimates */}
              <div className="planner-templates__estimates">
                <div className="planner-templates__estimate">
                  <span className="planner-templates__estimate-label">Kosten:</span>
                  <span className="planner-templates__estimate-value">{template.estimatedCost}</span>
                </div>
                <div className="planner-templates__estimate">
                  <span className="planner-templates__estimate-label">Zeit:</span>
                  <span className="planner-templates__estimate-value">{template.estimatedTime}</span>
                </div>
              </div>
            </div>

            {/* Card Footer */}
            <div className="planner-templates__card-footer">
              <button
                className="planner-templates__details-btn"
                onClick={() => setShowDetails(showDetails === template.id ? null : template.id)}
              >
                Details
                <ChevronRight 
                  size={16} 
                  className={showDetails === template.id ? 'rotated' : ''}
                />
              </button>
              <Button
                variant="primary"
                size="small"
                onClick={() => handleApply(template.id)}
                style={{ backgroundColor: template.color }}
              >
                Anwenden
              </Button>
            </div>

            {/* Expanded Details */}
            {showDetails === template.id && (
              <div className="planner-templates__details">
                <h4>Was erwartet dich?</h4>
                <div className="planner-templates__sample-day">
                  <h5>Beispiel-Tag:</h5>
                  <ul>
                    <li>
                      <strong>Frühstück:</strong> 
                      {template.id === 'fitness' && ' Protein-Porridge mit Beeren'}
                      {template.id === 'budget' && ' Haferbrei mit Apfel'}
                      {template.id === 'quick' && ' Smoothie Bowl'}
                      {template.id === 'vegetarian' && ' Avocado-Toast mit Ei'}
                      {template.id === 'family' && ' Pancakes mit Obst'}
                    </li>
                    <li>
                      <strong>Mittagessen:</strong>
                      {template.id === 'fitness' && ' Hähnchenbrust mit Quinoa'}
                      {template.id === 'budget' && ' Linsensuppe mit Brot'}
                      {template.id === 'quick' && ' Wrap mit Hummus'}
                      {template.id === 'vegetarian' && ' Buddha Bowl mit Tofu'}
                      {template.id === 'family' && ' Nudeln mit Tomatensauce'}
                    </li>
                    <li>
                      <strong>Abendessen:</strong>
                      {template.id === 'fitness' && ' Lachs mit Süßkartoffel'}
                      {template.id === 'budget' && ' Gemüsepfanne mit Reis'}
                      {template.id === 'quick' && ' Omelette mit Spinat'}
                      {template.id === 'vegetarian' && ' Kürbis-Curry'}
                      {template.id === 'family' && ' Hähnchen-Geschnetzeltes'}
                    </li>
                  </ul>
                </div>
                <div className="planner-templates__tips">
                  <h5>Tipps:</h5>
                  <ul>
                    {template.id === 'fitness' && (
                      <>
                        <li>Plane deine Mahlzeiten um dein Training herum</li>
                        <li>Bereite Snacks am Wochenende vor</li>
                      </>
                    )}
                    {template.id === 'budget' && (
                      <>
                        <li>Kaufe saisonales Gemüse</li>
                        <li>Nutze Tiefkühlware für aus der Saison</li>
                      </>
                    )}
                    {template.id === 'quick' && (
                      <>
                        <li>Schneide Gemüse am Wochenende vor</li>
                        <li>Nutze Fertigprodukte clever (Saucen, Gewürzmischungen)</li>
                      </>
                    )}
                    {template.id === 'vegetarian' && (
                      <>
                        <li>Experimentiere mit verschiedenen Hülsenfrüchten</li>
                        <li>Tofu vorher pressen für bessere Konsistenz</li>
                      </>
                    )}
                    {template.id === 'family' && (
                      <>
                        <li>Lasse Kinder bei der Zubereitung helfen</li>
                        <li>Serviere Gemüse als Snack vor dem Essen</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="planner-templates__footer">
        <p>
          <Info size={16} />
          Alle Vorlagen können nach dem Anwenden individuell angepasst werden.
        </p>
      </div>
    </div>
  );
};
