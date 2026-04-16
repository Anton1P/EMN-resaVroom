// src/components/trips/AddressAutocomplete.tsx
import React, { useState, useRef, useEffect } from "react";
import { useAddressAutocomplete, GeoLocation } from "@/hooks/use-geo";
import { Input } from "@/components/ui/Input";
import "./trips.css";

interface AddressAutocompleteProps {
  label?: string;
  placeholder?: string;
  onSelect: (location: GeoLocation) => void;
  error?: string;
  defaultValue?: string;
}

export function AddressAutocomplete({ label, placeholder, onSelect, error, defaultValue }: AddressAutocompleteProps) {
  const { query, setQuery, results, isLoading, search } = useAddressAutocomplete();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (defaultValue) {
      setQuery(defaultValue);
    }
  }, [defaultValue, setQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    search(val);
    setIsOpen(true);
  };

  const handleSelect = (loc: GeoLocation) => {
    setQuery(loc.label);
    setIsOpen(false);
    onSelect(loc);
  };

  return (
    <div className="autocomplete-wrapper" ref={wrapperRef}>
      <Input
        label={label}
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
        onFocus={() => setIsOpen(true)}
        error={error}
        autoComplete="off"
      />
      {isOpen && (query.length >= 3 || isLoading) && (
        <ul className="autocomplete-dropdown">
          {isLoading ? (
            <li className="autocomplete-item loading">Recherche en cours...</li>
          ) : results.length > 0 ? (
            results.map((loc, i) => (
              <li
                key={i}
                className="autocomplete-item"
                onClick={() => handleSelect(loc)}
              >
                {loc.label}
              </li>
            ))
          ) : (
            <li className="autocomplete-item empty">Aucun résultat trouvé</li>
          )}
        </ul>
      )}
    </div>
  );
}
