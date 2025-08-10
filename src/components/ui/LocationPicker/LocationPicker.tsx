import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';

// Liste des communes d'Abidjan
const abidjanNeighborhoods = [
  'Abobo',
  'Adjamé',
  'Anyama',
  'Attécoubé',
  'Bingerville',
  'Cocody',
  'Koumassi',
  'Marcory',
  'Le Plateau',
  'Port-Bouët',
  'Treichville',
  'Songon',
  'Yopougon',
];

interface LocationPickerProps {
  selectedValue: string;
  onChange: (event: SelectChangeEvent<string>, child: React.ReactNode) => void;
  className?: string;
  label?: string;
}

const LocationPicker: React.FC<LocationPickerProps> = ({ selectedValue, onChange, className, label = 'Choisissez votre commune' }) => {
  return (
    <FormControl fullWidth className={className}>
      <InputLabel id="location-picker-label">{label}</InputLabel>
      <Select
        labelId="location-picker-label"
        value={selectedValue}
        label={label}
        onChange={onChange}
        className="bg-neutral-100"
      >
        <MenuItem value="">
          <em>Aucune</em>
        </MenuItem>
        {abidjanNeighborhoods.map((neighborhood) => (
          <MenuItem key={neighborhood} value={neighborhood}>
            {neighborhood}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default LocationPicker;
