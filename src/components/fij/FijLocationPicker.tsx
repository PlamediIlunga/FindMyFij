'use client';

import L from 'leaflet';
import { useEffect } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import styles from './FijLocationPicker.module.scss';

interface FijLocationPickerProps { latitude: number; longitude: number; onChange: (latitude: number, longitude: number) => void; }
const pinIcon = L.divIcon({ className: styles.pin, html: '<span>✦</span>', iconSize: [34, 42], iconAnchor: [17, 42] });
function Recenter({ latitude, longitude }: Pick<FijLocationPickerProps, 'latitude' | 'longitude'>) { const map = useMap(); useEffect(() => { map.setView([latitude, longitude], map.getZoom(), { animate: true }); }, [latitude, longitude, map]); return null; }
function ClickToMove({ onChange }: Pick<FijLocationPickerProps, 'onChange'>) { useMapEvents({ click: (event) => onChange(event.latlng.lat, event.latlng.lng) }); return null; }
export function FijLocationPicker({ latitude, longitude, onChange }: FijLocationPickerProps) {
  return <div className={styles.wrapper}><MapContainer center={[latitude, longitude]} zoom={16} scrollWheelZoom={false} className={styles.map}><TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><Recenter latitude={latitude} longitude={longitude} /><ClickToMove onChange={onChange} /><Marker position={[latitude, longitude]} icon={pinIcon} draggable eventHandlers={{ dragend: (event) => { const point = (event.target as L.Marker).getLatLng(); onChange(point.lat, point.lng); } }} /></MapContainer><p className={styles.hint}>Faites glisser le pin ou touchez la carte pour ajuster la position exacte.</p></div>;
}
