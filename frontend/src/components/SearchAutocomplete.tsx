
import React, { useState, useEffect, useRef } from "react";
import { Search, MapPin, Building2, History, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getProperties } from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const SENEGAL_LOCATIONS = [
  "Dakar", "Almadies", "Mermoz", "Plateau", "Ngor", "Yoff", "Hann Bel-Air", 
  "Parcelles Assainies", "Pikine", "Guédiawaye", "Rufisque", "Diamniadio",
  "Thies", "Saly", "Mbour", "Saint-Louis", "Ziguinchor", "Touba", "Kaolack",
  "Somone", "Popenguine"
];

interface SearchAutocompleteProps {
  placeholder?: string;
  className?: string;
  initialValue?: string;
  onValueChange?: (val: string) => void;
}

export const SearchAutocomplete = ({ placeholder, className, initialValue = "", onValueChange }: SearchAutocompleteProps) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem("search_history");
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory).slice(0, 5));
    }
  }, []);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (value.length > 1) {
      const timer = setTimeout(() => loadSuggestions(value), 300);
      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadSuggestions = async (query: string) => {
    try {
      const data = await getProperties({ search: query, limit: 5 });
      const propertiesList = data.properties || [];
      setSuggestions(propertiesList);
    } catch (e) {
      console.error("Autocomplete fetch error", e);
    }
  };

  const handleSelect = (selectedValue: string) => {
    setValue(selectedValue);
    onValueChange?.(selectedValue);
    setOpen(false);
    addToHistory(selectedValue);
    navigate(`/search?q=${encodeURIComponent(selectedValue)}`);
  };

  const addToHistory = (query: string) => {
    if (!query.trim()) return;
    const newHistory = [query, ...history.filter(h => h !== query)].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem("search_history", JSON.stringify(newHistory));
  };

  const filteredLocations = SENEGAL_LOCATIONS.filter(loc => 
    loc.toLowerCase().includes(value.toLowerCase())
  ).slice(0, 5);

  const allSuggestions = [
    ...filteredLocations.map(l => ({ type: 'location', label: l })),
    ...suggestions.map(p => ({ type: 'property', label: p.name, sub: p.address, id: p.id }))
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      setActiveIndex(prev => (prev < allSuggestions.length ? prev + 1 : prev));
      setOpen(true);
    } else if (e.key === 'ArrowUp') {
      setActiveIndex(prev => (prev > -1 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      if (activeIndex === -1) {
        handleSelect(value);
      } else if (activeIndex < allSuggestions.length) {
        handleSelect(allSuggestions[activeIndex].label);
      } else {
        handleSelect(value);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div className="relative w-full group">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder || t('hero.search_placeholder')}
          value={value}
          onChange={(e) => {
            const newVal = e.target.value;
            setValue(newVal);
            onValueChange?.(newVal);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full h-full min-h-[3.5rem] pl-10 pr-10 bg-transparent border-0 focus:ring-0 text-lg outline-none placeholder:text-muted-foreground/60 rounded-xl"
          autoComplete="off"
        />
        {value && (
          <button 
            onClick={() => { setValue(""); onValueChange?.(""); inputRef.current?.focus(); }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-secondary rounded-full text-muted-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && (value.length > 0 || history.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 z-[999] bg-card border border-border/50 shadow-2xl rounded-2xl overflow-hidden"
          >
            <div className="max-h-[400px] overflow-y-auto py-2">
              {/* History */}
              {value.length === 0 && history.length > 0 && (
                <div className="px-2 pb-2">
                  <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Recherches récentes</p>
                  {history.map((item, i) => (
                    <button
                      key={item}
                      onClick={() => handleSelect(item)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors",
                        activeIndex === i ? "bg-primary/10 text-primary" : "hover:bg-secondary"
                      )}
                      onMouseEnter={() => setActiveIndex(i)}
                    >
                      <History className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{item}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Locations */}
              {(value.length > 0 || (value.length === 0 && history.length === 0)) && filteredLocations.length > 0 && (
                <div className="px-2 pb-2">
                  <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Localités</p>
                  {filteredLocations.map((loc, i) => {
                    const idx = value.length === 0 ? i + (history.length) : i;
                    return (
                      <button
                        key={loc}
                        onClick={() => handleSelect(loc)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors",
                          activeIndex === idx ? "bg-primary/10 text-primary" : "hover:bg-secondary"
                        )}
                        onMouseEnter={() => setActiveIndex(idx)}
                      >
                        <MapPin className="h-4 w-4 text-primary/60" />
                        <span className="font-medium text-sm">{loc}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Properties */}
              {suggestions.length > 0 && (
                <div className="px-2 pb-2">
                  <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Propriétés</p>
                  {suggestions.map((prop, i) => {
                    const idx = i + filteredLocations.length + (value.length === 0 ? history.length : 0);
                    return (
                      <button
                        key={prop.id}
                        onClick={() => handleSelect(prop.name)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors",
                          activeIndex === idx ? "bg-primary/10 text-primary" : "hover:bg-secondary"
                        )}
                        onMouseEnter={() => setActiveIndex(idx)}
                      >
                        <Building2 className="h-4 w-4 text-accent/60" />
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{prop.name}</span>
                          <span className="text-[10px] text-muted-foreground truncate">{prop.address}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Search specific term */}
              {value.length > 0 && (
                <div className="px-2 pt-1 border-t mt-1">
                  <button
                    onClick={() => handleSelect(value)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors font-semibold text-primary",
                      activeIndex === allSuggestions.length ? "bg-primary/10" : "hover:bg-primary/5"
                    )}
                    onMouseEnter={() => setActiveIndex(allSuggestions.length)}
                  >
                    <Search className="h-4 w-4" />
                    <span className="text-sm">Rechercher "{value}"</span>
                  </button>
                </div>
              )}

              {value.length > 0 && allSuggestions.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <p className="text-muted-foreground text-sm italic">Appuyez sur Entrée pour rechercher "{value}"</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
